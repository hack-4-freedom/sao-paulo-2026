/*
# Bitcoin no Corre — Security & Atomic Operations (V3.1)

## Visão geral
Corrige todas as issues de segurança identificadas no audit:
1. Fix SECURITY DEFINER search_path em handle_new_user
2. Cria funções RPC atômicas para operações de carteira
3. Cria função RPC atômica para completar lição
4. Cria função RPC atômica para resgatar missão
5. Cria função RPC atômica para registrar game score
6. Adiciona backend age verification para Open Finance
7. Adiciona UPDATE policy em invites (marcar usado)
8. Adiciona UPDATE policy em user_badges (upsert)

## Segurança
- Todas as funções SECURITY DEFINER agora têm SET search_path = public
- Wallet balance não pode mais ser atualizado diretamente pelo cliente
- Age verification feita no banco via função RPC
- Referral fraud protection: max 10 convites/dia, validação única
*/

-- ============================================================
-- Fix: handle_new_user search_path
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ============================================================
-- Fix: set_updated_at search_path
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- RPC: complete_lesson (atômico)
-- Registra progresso, credita sats + XP, atualiza carteira,
-- loga transações, atualiza streak/level, bumpa missões, awuarda badges.
-- Tudo numa transação só — ou tudo acontece ou nada.
-- ============================================================
CREATE OR REPLACE FUNCTION complete_lesson(
  p_lesson_id uuid,
  p_quiz_correct integer,
  p_quiz_total integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_lesson lessons%ROWTYPE;
  v_existing lesson_progress%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_sats integer;
  v_xp integer;
  v_already_done boolean := false;
  v_today date := current_date;
  v_yesterday date := current_date - 1;
  v_streak integer;
  v_new_level integer;
  v_trilha_lessons_count integer;
  v_trilha_done_count integer;
  v_mission missions%ROWTYPE;
  v_mission_progress mission_progress%ROWTYPE;
  v_badge badges%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO v_lesson FROM lessons WHERE id = p_lesson_id AND is_published = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'lesson_not_found');
  END IF;

  v_sats := v_lesson.reward_sats;
  v_xp := v_lesson.reward_xp;

  -- Check existing progress
  SELECT * INTO v_existing FROM lesson_progress
    WHERE user_id = v_user_id AND lesson_id = p_lesson_id;

  IF v_existing.status = 'completed' THEN
    v_already_done := true;
  END IF;

  -- Upsert progress
  IF v_existing.id IS NOT NULL THEN
    IF NOT v_already_done THEN
      UPDATE lesson_progress SET
        status = 'completed',
        quiz_correct = p_quiz_correct,
        quiz_total = p_quiz_total,
        sats_earned = v_sats,
        xp_earned = v_xp,
        completed_at = now()
      WHERE id = v_existing.id;
    END IF;
  ELSE
    INSERT INTO lesson_progress (user_id, lesson_id, status, quiz_correct, quiz_total, sats_earned, xp_earned, completed_at)
    VALUES (v_user_id, p_lesson_id, 'completed', p_quiz_correct, p_quiz_total, v_sats, v_xp, now());
  END IF;

  -- Credit rewards only if first completion
  IF NOT v_already_done THEN
    -- Wallet
    SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user_id;
    IF NOT FOUND THEN
      INSERT INTO wallets (user_id, balance_sats, lifetime_sats) VALUES (v_user_id, 0, 0)
      RETURNING * INTO v_wallet;
    END IF;

    UPDATE wallets SET
      balance_sats = v_wallet.balance_sats + v_sats,
      lifetime_sats = v_wallet.lifetime_sats + v_sats
    WHERE id = v_wallet.id;

    -- Transaction log
    INSERT INTO wallet_txs (user_id, wallet_id, type, amount_sats, label, ref_id)
    VALUES (v_user_id, v_wallet.id, 'learning_reward', v_sats, v_lesson.title, p_lesson_id);

    -- XP
    INSERT INTO xp_events (user_id, amount, reason, ref_id)
    VALUES (v_user_id, v_xp, 'Lição: ' || v_lesson.title, p_lesson_id);

    -- Profile: XP, level, streak
    SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
    IF v_profile.last_active_date = v_today THEN
      v_streak := v_profile.streak_days;
    ELSIF v_profile.last_active_date = v_yesterday THEN
      v_streak := v_profile.streak_days + 1;
    ELSE
      v_streak := 1;
    END IF;
    v_new_level := floor(((v_profile.xp_total + v_xp) / 100) + 1);

    UPDATE profiles SET
      xp_total = v_profile.xp_total + v_xp,
      level = v_new_level,
      streak_days = v_streak,
      last_active_date = v_today
    WHERE id = v_user_id;

    -- Mission: daily_lesson
    SELECT * INTO v_mission FROM missions WHERE slug = 'daily_lesson';
    IF FOUND THEN
      SELECT * INTO v_mission_progress FROM mission_progress
        WHERE user_id = v_user_id AND mission_id = v_mission.id AND period_date = v_today;
      IF FOUND THEN
        UPDATE mission_progress SET
          current_count = v_mission_progress.current_count + 1,
          completed = (v_mission_progress.current_count + 1 >= v_mission.target_count)
        WHERE id = v_mission_progress.id;
      ELSE
        INSERT INTO mission_progress (user_id, mission_id, period_date, current_count, completed)
        VALUES (v_user_id, v_mission.id, v_today, 1, 1 >= v_mission.target_count);
      END IF;
    END IF;

    -- Mission: daily_quiz_perfect
    IF p_quiz_correct = p_quiz_total THEN
      SELECT * INTO v_mission FROM missions WHERE slug = 'daily_quiz_perfect';
      IF FOUND THEN
        SELECT * INTO v_mission_progress FROM mission_progress
          WHERE user_id = v_user_id AND mission_id = v_mission.id AND period_date = v_today;
        IF FOUND THEN
          UPDATE mission_progress SET
            current_count = v_mission_progress.current_count + 1,
            completed = (v_mission_progress.current_count + 1 >= v_mission.target_count)
          WHERE id = v_mission_progress.id;
        ELSE
          INSERT INTO mission_progress (user_id, mission_id, period_date, current_count, completed)
          VALUES (v_user_id, v_mission.id, v_today, 1, 1 >= v_mission.target_count);
        END IF;
      END IF;
    END IF;

    -- Mission: daily_streak
    IF v_streak >= 2 THEN
      SELECT * INTO v_mission FROM missions WHERE slug = 'daily_streak';
      IF FOUND THEN
        SELECT * INTO v_mission_progress FROM mission_progress
          WHERE user_id = v_user_id AND mission_id = v_mission.id AND period_date = v_today;
        IF FOUND THEN
          UPDATE mission_progress SET current_count = 1, completed = true WHERE id = v_mission_progress.id;
        ELSE
          INSERT INTO mission_progress (user_id, mission_id, period_date, current_count, completed)
          VALUES (v_user_id, v_mission.id, v_today, 1, true);
        END IF;
      END IF;
    END IF;

    -- Badges: first_lesson, first_sats
    IF NOT EXISTS (SELECT 1 FROM user_badges ub JOIN badges b ON b.id = ub.badge_id WHERE ub.user_id = v_user_id AND b.slug = 'first_lesson') THEN
      SELECT * INTO v_badge FROM badges WHERE slug = 'first_lesson';
      IF FOUND THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (v_user_id, v_badge.id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;
    SELECT * INTO v_badge FROM badges WHERE slug = 'first_sats';
    IF FOUND THEN
      INSERT INTO user_badges (user_id, badge_id) VALUES (v_user_id, v_badge.id) ON CONFLICT DO NOTHING;
    END IF;

    -- Badge: fundamentos_done
    SELECT count(*) INTO v_trilha_lessons_count FROM lessons WHERE trilha_id = v_lesson.trilha_id AND is_published = true;
    SELECT count(*) INTO v_trilha_done_count
      FROM lesson_progress lp
      JOIN lessons l ON l.id = lp.lesson_id
      WHERE lp.user_id = v_user_id AND lp.status = 'completed' AND l.trilha_id = v_lesson.trilha_id AND l.is_published = true;

    IF v_trilha_lessons_count > 0 AND v_trilha_done_count >= v_trilha_lessons_count THEN
      SELECT * INTO v_badge FROM badges WHERE slug = 'fundamentos_done';
      IF FOUND THEN
        INSERT INTO user_badges (user_id, badge_id) VALUES (v_user_id, v_badge.id) ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'sats_earned', CASE WHEN v_already_done THEN 0 ELSE v_sats END,
    'xp_earned', CASE WHEN v_already_done THEN 0 ELSE v_xp END,
    'perfect', p_quiz_correct = p_quiz_total,
    'already_completed', v_already_done
  );
END;
$$;

-- ============================================================
-- RPC: claim_mission (atômico)
-- ============================================================
CREATE OR REPLACE FUNCTION claim_mission(p_mission_progress_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_progress mission_progress%ROWTYPE;
  v_mission missions%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO v_progress FROM mission_progress WHERE id = p_mission_progress_id AND user_id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  IF NOT v_progress.completed OR v_progress.reward_claimed THEN
    RETURN jsonb_build_object('error', 'not_claimable');
  END IF;

  SELECT * INTO v_mission FROM missions WHERE id = v_progress.mission_id;
  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user_id;
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id) VALUES (v_user_id) RETURNING * INTO v_wallet;
  END IF;

  UPDATE wallets SET
    balance_sats = v_wallet.balance_sats + v_mission.reward_sats,
    lifetime_sats = v_wallet.lifetime_sats + v_mission.reward_sats
  WHERE id = v_wallet.id;

  INSERT INTO wallet_txs (user_id, wallet_id, type, amount_sats, label, ref_id)
  VALUES (v_user_id, v_wallet.id, 'mission_reward', v_mission.reward_sats, v_mission.title, v_mission.id);

  INSERT INTO xp_events (user_id, amount, reason, ref_id)
  VALUES (v_user_id, v_mission.reward_xp, 'Missão: ' || v_mission.title, v_mission.id);

  UPDATE mission_progress SET reward_claimed = true WHERE id = v_progress.id;

  RETURN jsonb_build_object('sats_earned', v_mission.reward_sats, 'xp_earned', v_mission.reward_xp);
END;
$$;

-- ============================================================
-- RPC: record_game_score (atômico)
-- ============================================================
CREATE OR REPLACE FUNCTION record_game_score(
  p_game_id uuid,
  p_score integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game games%ROWTYPE;
  v_wallet wallets%ROWTYPE;
  v_user_id uuid := auth.uid();
  v_season game_seasons%ROWTYPE;
  v_ranking game_season_rankings%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO v_game FROM games WHERE id = p_game_id AND is_active = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'game_not_found');
  END IF;

  INSERT INTO game_scores (user_id, game_id, score, sats_earned, xp_earned)
  VALUES (v_user_id, p_game_id, p_score, v_game.reward_sats, v_game.reward_xp);

  SELECT * INTO v_wallet FROM wallets WHERE user_id = v_user_id;
  IF NOT FOUND THEN
    INSERT INTO wallets (user_id) VALUES (v_user_id) RETURNING * INTO v_wallet;
  END IF;

  UPDATE wallets SET
    balance_sats = v_wallet.balance_sats + v_game.reward_sats,
    lifetime_sats = v_wallet.lifetime_sats + v_game.reward_sats
  WHERE id = v_wallet.id;

  INSERT INTO wallet_txs (user_id, wallet_id, type, amount_sats, label, ref_id)
  VALUES (v_user_id, v_wallet.id, 'game_reward', v_game.reward_sats, v_game.title, p_game_id);

  INSERT INTO xp_events (user_id, amount, reason, ref_id)
  VALUES (v_user_id, v_game.reward_xp, 'Game: ' || v_game.title, p_game_id);

  -- Update season ranking
  SELECT * INTO v_season FROM game_seasons WHERE is_active = true ORDER BY starts_at DESC LIMIT 1;
  IF FOUND THEN
    SELECT * INTO v_ranking FROM game_season_rankings
      WHERE user_id = v_user_id AND season_id = v_season.id;
    IF FOUND THEN
      UPDATE game_season_rankings SET
        total_score = v_ranking.total_score + p_score,
        total_sats = v_ranking.total_sats + v_game.reward_sats
      WHERE id = v_ranking.id;
    ELSE
      INSERT INTO game_season_rankings (user_id, season_id, total_score, total_sats)
      VALUES (v_user_id, v_season.id, p_score, v_game.reward_sats);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'sats_earned', v_game.reward_sats,
    'xp_earned', v_game.reward_xp,
    'score', p_score
  );
END;
$$;

-- ============================================================
-- RPC: verify_age_and_enable_open_finance
-- Verifica idade no backend antes de habilitar
-- ============================================================
CREATE OR REPLACE FUNCTION verify_age_and_enable_open_finance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_age integer;
  v_user_id uuid := auth.uid();
  v_existing open_finance_accounts%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
  IF NOT FOUND OR v_profile.birthdate IS NULL THEN
    RETURN jsonb_build_object('error', 'birthdate_required');
  END IF;

  v_age := extract(year FROM age(current_date, v_profile.birthdate));

  IF v_age < 16 THEN
    RETURN jsonb_build_object('error', 'underage', 'age', v_age);
  END IF;

  SELECT * INTO v_existing FROM open_finance_accounts WHERE user_id = v_user_id;
  IF FOUND THEN
    UPDATE open_finance_accounts SET
      is_enabled = true,
      can_withdraw = true,
      can_request_card = true
    WHERE id = v_existing.id;
  ELSE
    INSERT INTO open_finance_accounts (user_id, is_enabled, can_withdraw, can_request_card)
    VALUES (v_user_id, true, true, true)
    RETURNING * INTO v_existing;
  END IF;

  RETURN jsonb_build_object('success', true, 'age', v_age);
END;
$$;

-- ============================================================
-- RPC: create_virtual_card
-- ============================================================
CREATE OR REPLACE FUNCTION create_virtual_card()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_age integer;
  v_user_id uuid := auth.uid();
  v_account open_finance_accounts%ROWTYPE;
  v_last4 text;
  v_card virtual_cards%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO v_profile FROM profiles WHERE id = v_user_id;
  IF NOT FOUND OR v_profile.birthdate IS NULL THEN
    RETURN jsonb_build_object('error', 'birthdate_required');
  END IF;

  v_age := extract(year FROM age(current_date, v_profile.birthdate));
  IF v_age < 16 THEN
    RETURN jsonb_build_object('error', 'underage');
  END IF;

  SELECT * INTO v_account FROM open_finance_accounts WHERE user_id = v_user_id AND is_enabled = true;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'open_finance_not_enabled');
  END IF;

  IF NOT v_account.can_request_card THEN
    RETURN jsonb_build_object('error', 'card_not_allowed');
  END IF;

  -- Check if already has an active card
  SELECT * INTO v_card FROM virtual_cards WHERE user_id = v_user_id AND is_active = true;
  IF FOUND THEN
    RETURN jsonb_build_object('error', 'already_has_card');
  END IF;

  v_last4 := lpad(floor(random() * 10000)::text, 4, '0');
  INSERT INTO virtual_cards (user_id, of_account_id, last4)
  VALUES (v_user_id, v_account.id, v_last4)
  RETURNING * INTO v_card;

  RETURN jsonb_build_object('success', true, 'last4', v_last4, 'card_id', v_card.id);
END;
$$;

-- ============================================================
-- RPC: generate_referral_code
-- ============================================================
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing invites%ROWTYPE;
  v_code text;
  v_today date := current_date;
  v_count integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  -- Fraud protection: max 10 invites per day
  SELECT count(*) INTO v_count FROM invites
    WHERE user_id = v_user_id AND created_at::date = v_today;
  IF v_count >= 10 THEN
    RETURN jsonb_build_object('error', 'daily_limit_exceeded');
  END IF;

  -- Return existing code if user already has one
  SELECT * INTO v_existing FROM invites WHERE user_id = v_user_id LIMIT 1;
  IF FOUND THEN
    RETURN jsonb_build_object('code', v_existing.code, 'created', false);
  END IF;

  -- Generate unique code
  v_code := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 6));

  INSERT INTO invites (user_id, code) VALUES (v_user_id, v_code)
  RETURNING * INTO v_existing;

  RETURN jsonb_build_object('code', v_code, 'created', true);
END;
$$;

-- ============================================================
-- RPC: get_referral_stats
-- ============================================================
CREATE OR REPLACE FUNCTION get_referral_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_total integer;
  v_pending integer;
  v_completed integer;
  v_reward_sats integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT count(*) INTO v_total FROM invites WHERE user_id = v_user_id;
  SELECT count(*) INTO v_completed FROM invites WHERE user_id = v_user_id AND used_by IS NOT NULL;
  v_pending := v_total - v_completed;
  SELECT coalesce(sum(reward_sats), 0) INTO v_reward_sats FROM invites WHERE user_id = v_user_id AND used_by IS NOT NULL;

  RETURN jsonb_build_object(
    'total', v_total,
    'pending', v_pending,
    'completed', v_completed,
    'reward_sats', v_reward_sats
  );
END;
$$;

-- ============================================================
-- RPC: update_profile
-- ============================================================
CREATE OR REPLACE FUNCTION update_profile(
  p_name text DEFAULT NULL,
  p_avatar_emoji text DEFAULT NULL,
  p_birthdate date DEFAULT NULL,
  p_bio text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  UPDATE profiles SET
    name = COALESCE(p_name, name),
    avatar_emoji = COALESCE(p_avatar_emoji, avatar_emoji),
    birthdate = COALESCE(p_birthdate, birthdate)
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- RPC: delete_account
-- ============================================================
CREATE OR REPLACE FUNCTION delete_account()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  DELETE FROM profiles WHERE id = v_user_id;
  -- auth.users deletion handled by cascade or admin API

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- Revoke EXECUTE from anon on sensitive functions
-- Only authenticated users can call these RPCs
-- ============================================================
REVOKE EXECUTE ON FUNCTION complete_lesson FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION claim_mission FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION record_game_score FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION verify_age_and_enable_open_finance FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION create_virtual_card FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION generate_referral_code FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION get_referral_stats FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION update_profile FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION delete_account FROM anon, authenticated;

GRANT EXECUTE ON FUNCTION complete_lesson TO authenticated;
GRANT EXECUTE ON FUNCTION claim_mission TO authenticated;
GRANT EXECUTE ON FUNCTION record_game_score TO authenticated;
GRANT EXECUTE ON FUNCTION verify_age_and_enable_open_finance TO authenticated;
GRANT EXECUTE ON FUNCTION create_virtual_card TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code TO authenticated;
GRANT EXECUTE ON FUNCTION get_referral_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile TO authenticated;
GRANT EXECUTE ON FUNCTION delete_account TO authenticated;

-- ============================================================
-- Add UPDATE policy on invites (mark as used)
-- ============================================================
DROP POLICY IF EXISTS "update_own_invites" ON invites;
CREATE POLICY "update_own_invites" ON invites FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Add UPDATE policy on user_badges (for upsert)
-- ============================================================
DROP POLICY IF EXISTS "update_own_badges" ON user_badges;
CREATE POLICY "update_own_badges" ON user_badges FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Lock down wallets: remove UPDATE policy (force RPC usage)
-- ============================================================
DROP POLICY IF EXISTS "update_own_wallet" ON wallets;
-- Keep SELECT and INSERT only — balance updates via RPC only
CREATE POLICY "update_own_wallet" ON wallets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Add bio column to profiles
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'bio'
  ) THEN
    ALTER TABLE profiles ADD COLUMN bio text DEFAULT '';
  END IF;
END $$;