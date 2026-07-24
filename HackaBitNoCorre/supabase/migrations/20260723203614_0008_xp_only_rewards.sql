/*
# XP-only rewards for lessons, quizzes, and games

## Visão geral
O app agora recompensa apenas XP (pontos de experiência) ao concluir lições,
responder quizzes e jogar jogos. Bitcoin (sats) não é mais creditado por essas
atividades. A carteira real continua funcionando para envio/recebimento manual.

## Mudanças
1. `complete_lesson` RPC: não credita mais sats na carteira nem registra
   transação `learning_reward` em `wallet_txs`. Continua creditando XP em
   `xp_events`, atualizando level/streak, missões e badges.
   Retorna `sats_earned = 0`.
2. `record_game_score` RPC: não credita mais sats na carteira nem registra
   transação `game_reward` em `wallet_txs`. Continua creditando XP em
   `xp_events` e atualizando ranking da temporada.
   Retorna `sats_earned = 0`.
3. `claim_mission` RPC: não credita mais sats na carteira nem registra
   transação `mission_reward` em `wallet_txs`. Continua creditando XP.
   Retorna `sats_earned = 0`.

## Notas de segurança
- Nenhuma mudança em RLS ou políticas.
- Funções permanecem SECURITY DEFINER com search_path = public.
- Permissões GRANT/REVOKE mantidas.
*/

-- ============================================================
-- RPC: complete_lesson (XP only, no sats)
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
  v_profile profiles%ROWTYPE;
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
        sats_earned = 0,
        xp_earned = v_xp,
        completed_at = now()
      WHERE id = v_existing.id;
    END IF;
  ELSE
    INSERT INTO lesson_progress (user_id, lesson_id, status, quiz_correct, quiz_total, sats_earned, xp_earned, completed_at)
    VALUES (v_user_id, p_lesson_id, 'completed', p_quiz_correct, p_quiz_total, 0, v_xp, now());
  END IF;

  -- Credit XP only if first completion
  IF NOT v_already_done THEN
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
    'sats_earned', 0,
    'xp_earned', CASE WHEN v_already_done THEN 0 ELSE v_xp END,
    'perfect', p_quiz_correct = p_quiz_total,
    'already_completed', v_already_done
  );
END;
$$;

-- ============================================================
-- RPC: claim_mission (XP only, no sats)
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

  INSERT INTO xp_events (user_id, amount, reason, ref_id)
  VALUES (v_user_id, v_mission.reward_xp, 'Missão: ' || v_mission.title, v_mission.id);

  UPDATE mission_progress SET reward_claimed = true WHERE id = v_progress.id;

  RETURN jsonb_build_object('sats_earned', 0, 'xp_earned', v_mission.reward_xp);
END;
$$;

-- ============================================================
-- RPC: record_game_score (XP only, no sats)
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
  VALUES (v_user_id, p_game_id, p_score, 0, v_game.reward_xp);

  INSERT INTO xp_events (user_id, amount, reason, ref_id)
  VALUES (v_user_id, v_game.reward_xp, 'Game: ' || v_game.title, p_game_id);

  -- Update season ranking (score only, no sats)
  SELECT * INTO v_season FROM game_seasons WHERE is_active = true ORDER BY starts_at DESC LIMIT 1;
  IF FOUND THEN
    SELECT * INTO v_ranking FROM game_season_rankings
      WHERE user_id = v_user_id AND season_id = v_season.id;
    IF FOUND THEN
      UPDATE game_season_rankings SET
        total_score = v_ranking.total_score + p_score,
        total_sats = v_ranking.total_sats
      WHERE id = v_ranking.id;
    ELSE
      INSERT INTO game_season_rankings (user_id, season_id, total_score, total_sats)
      VALUES (v_user_id, v_season.id, p_score, 0);
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'sats_earned', 0,
    'xp_earned', v_game.reward_xp,
    'score', p_score
  );
END;
$$;
