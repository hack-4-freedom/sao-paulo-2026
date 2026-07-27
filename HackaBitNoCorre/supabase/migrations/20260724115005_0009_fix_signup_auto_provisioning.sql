/*
# Fix: Auto-provisioning completo de novos usuários

## Problema
O trigger `handle_new_user` criava apenas a linha em `profiles`.
Novos usuários ficavam sem carteira, sem configuração inicial e sem
estatísticas, causando erros em várias telas (especialmente Wallet).

## Mudanças
1. Reescreve `handle_new_user` para criar profile + wallet + friend_code
2. Adiciona colunas extras em `profiles` (username, city, country, school, links, avatar_url, banner_color, friend_code, league, weekly_xp, etc.)
3. Cria tabelas: friends, friend_requests, streak_freezes, leagues, challenge_types, user_challenges
4. Adiciona RPCs: send_friend_request, accept_friend_request, reject_friend_request, update_profile_extended
5. Atualiza policy de profiles para SELECT público (authenticated)
6. Seed: ligas, badges extras, challenge types

## Segurança
- Todas as novas tabelas com RLS habilitado
- friends/friend_requests: owner-scoped
- profiles: SELECT público para authenticated
- Funções SECURITY DEFINER com search_path = public, pg_temp
*/

-- ============================================================
-- 1. Adicionar colunas extras em profiles
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') THEN
    ALTER TABLE profiles ADD COLUMN username text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'city') THEN
    ALTER TABLE profiles ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'country') THEN
    ALTER TABLE profiles ADD COLUMN country text DEFAULT 'Brasil';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'school') THEN
    ALTER TABLE profiles ADD COLUMN school text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'github_url') THEN
    ALTER TABLE profiles ADD COLUMN github_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'linkedin_url') THEN
    ALTER TABLE profiles ADD COLUMN linkedin_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website_url') THEN
    ALTER TABLE profiles ADD COLUMN website_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'banner_color') THEN
    ALTER TABLE profiles ADD COLUMN banner_color text NOT NULL DEFAULT '#1a1a2e';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'friend_code') THEN
    ALTER TABLE profiles ADD COLUMN friend_code text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'league') THEN
    ALTER TABLE profiles ADD COLUMN league text NOT NULL DEFAULT 'bronze'
      CHECK (league IN ('bronze','prata','ouro','platina','diamante','mestre','lenda'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'weekly_xp') THEN
    ALTER TABLE profiles ADD COLUMN weekly_xp integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'total_study_minutes') THEN
    ALTER TABLE profiles ADD COLUMN total_study_minutes integer NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'challenges_completed') THEN
    ALTER TABLE profiles ADD COLUMN challenges_completed integer NOT NULL DEFAULT 0;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_unique') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_unique UNIQUE (username);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_friend_code_unique') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_friend_code_unique UNIQUE (friend_code);
  END IF;
END $$;

-- ============================================================
-- 2. Tabela: friends
-- ============================================================
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, friend_id),
  CHECK (user_id != friend_id)
);

ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_friends" ON friends;
CREATE POLICY "select_own_friends" ON friends FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

DROP POLICY IF EXISTS "insert_own_friends" ON friends;
CREATE POLICY "insert_own_friends" ON friends FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_friends" ON friends;
CREATE POLICY "delete_own_friends" ON friends FOR DELETE
  TO authenticated USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE INDEX IF NOT EXISTS idx_friends_user ON friends (user_id);
CREATE INDEX IF NOT EXISTS idx_friends_friend ON friends (friend_id);

-- ============================================================
-- 3. Tabela: friend_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sender_id, receiver_id)
);

ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_friend_requests" ON friend_requests;
CREATE POLICY "select_own_friend_requests" ON friend_requests FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "insert_own_friend_requests" ON friend_requests;
CREATE POLICY "insert_own_friend_requests" ON friend_requests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "update_own_friend_requests" ON friend_requests;
CREATE POLICY "update_own_friend_requests" ON friend_requests FOR UPDATE
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "delete_own_friend_requests" ON friend_requests;
CREATE POLICY "delete_own_friend_requests" ON friend_requests FOR DELETE
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON friend_requests (receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON friend_requests (sender_id);

DROP TRIGGER IF EXISTS trg_friend_requests_updated_at ON friend_requests;
CREATE TRIGGER trg_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. Tabela: streak_freezes
-- ============================================================
CREATE TABLE IF NOT EXISTS streak_freezes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  used_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, used_date)
);

ALTER TABLE streak_freezes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_streak_freezes" ON streak_freezes;
CREATE POLICY "select_own_streak_freezes" ON streak_freezes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_streak_freezes" ON streak_freezes;
CREATE POLICY "insert_own_streak_freezes" ON streak_freezes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_streak_freezes_user ON streak_freezes (user_id, used_date);

-- ============================================================
-- 5. Tabela: leagues
-- ============================================================
CREATE TABLE IF NOT EXISTS leagues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  icon_emoji text NOT NULL DEFAULT '🥉',
  color_hex text NOT NULL DEFAULT '#CD7F32',
  min_weekly_xp integer NOT NULL DEFAULT 0,
  max_weekly_xp integer,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_leagues" ON leagues;
CREATE POLICY "read_all_leagues" ON leagues FOR SELECT
  TO authenticated USING (true);

INSERT INTO leagues (slug, name, icon_emoji, color_hex, min_weekly_xp, max_weekly_xp, position) VALUES
  ('bronze', 'Bronze', '🥉', '#CD7F32', 0, 499, 1),
  ('prata', 'Prata', '🥈', '#C0C0C0', 500, 999, 2),
  ('ouro', 'Ouro', '🥇', '#FFD700', 1000, 1999, 3),
  ('platina', 'Platina', '💠', '#E8E8E8', 2000, 3499, 4),
  ('diamante', 'Diamante', '💎', '#B9F2FF', 3500, 5999, 5),
  ('mestre', 'Mestre', '🏆', '#FF6B35', 6000, 9999, 6),
  ('lenda', 'Lenda', '👑', '#FFD700', 10000, NULL, 7)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 6. Tabela: challenge_types
-- ============================================================
CREATE TABLE IF NOT EXISTS challenge_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon_emoji text NOT NULL DEFAULT '🎯',
  category text NOT NULL DEFAULT 'bitcoin' CHECK (category IN ('bitcoin','blockchain','lightning','programming','security','economy','mining','cryptography','wallet','mempool','consensus','networks','internet')),
  difficulty integer NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE challenge_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_active_challenge_types" ON challenge_types;
CREATE POLICY "read_active_challenge_types" ON challenge_types FOR SELECT
  TO authenticated USING (is_active = true);

-- ============================================================
-- 7. Tabela: user_challenges
-- ============================================================
CREATE TABLE IF NOT EXISTS user_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_type_id uuid NOT NULL REFERENCES challenge_types(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed','failed')),
  score integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  answer_data jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_challenges" ON user_challenges;
CREATE POLICY "select_own_challenges" ON user_challenges FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_challenges" ON user_challenges;
CREATE POLICY "insert_own_challenges" ON user_challenges FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_challenges" ON user_challenges;
CREATE POLICY "update_own_challenges" ON user_challenges FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_challenges_user ON user_challenges (user_id, created_at desc);

DROP TRIGGER IF EXISTS trg_user_challenges_updated_at ON user_challenges;
CREATE TRIGGER trg_user_challenges_updated_at
  BEFORE UPDATE ON user_challenges
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 8. Atualizar policy de profiles: SELECT público para authenticated
-- ============================================================
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
DROP POLICY IF EXISTS "select_all_profiles" ON profiles;
CREATE POLICY "select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- ============================================================
-- 9. Reescrever handle_new_user: criar profile + wallet + friend_code
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_code text;
BEGIN
  v_code := 'SAT-' || upper(substr(encode(gen_random_bytes(3), 'hex'), 1, 6));

  INSERT INTO public.profiles (id, name, friend_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    v_code
  )
  ON CONFLICT (id) DO UPDATE SET
    name = COALESCE(public.profiles.name, EXCLUDED.name),
    friend_code = COALESCE(public.profiles.friend_code, EXCLUDED.friend_code);

  INSERT INTO public.wallets (user_id, balance_sats, lifetime_sats)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================
-- 10. RPC: send_friend_request
-- ============================================================
CREATE OR REPLACE FUNCTION send_friend_request(p_friend_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_receiver profiles%ROWTYPE;
  v_existing_fr friend_requests%ROWTYPE;
  v_existing_friend friends%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO v_receiver FROM profiles WHERE friend_code = p_friend_code;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'friend_code_not_found');
  END IF;

  IF v_receiver.id = v_user_id THEN
    RETURN jsonb_build_object('error', 'cannot_add_self');
  END IF;

  SELECT * INTO v_existing_friend FROM friends
    WHERE (user_id = v_user_id AND friend_id = v_receiver.id)
       OR (user_id = v_receiver.id AND friend_id = v_user_id);
  IF FOUND THEN
    RETURN jsonb_build_object('error', 'already_friends');
  END IF;

  SELECT * INTO v_existing_fr FROM friend_requests
    WHERE (sender_id = v_user_id AND receiver_id = v_receiver.id)
       OR (sender_id = v_receiver.id AND receiver_id = v_user_id);
  IF FOUND THEN
    IF v_existing_fr.status = 'pending' THEN
      RETURN jsonb_build_object('error', 'request_already_pending');
    ELSIF v_existing_fr.status = 'accepted' THEN
      RETURN jsonb_build_object('error', 'already_friends');
    END IF;
  END IF;

  INSERT INTO friend_requests (sender_id, receiver_id, status)
  VALUES (v_user_id, v_receiver.id, 'pending')
  ON CONFLICT (sender_id, receiver_id) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- 11. RPC: accept_friend_request
-- ============================================================
CREATE OR REPLACE FUNCTION accept_friend_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_request friend_requests%ROWTYPE;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT * INTO v_request FROM friend_requests WHERE id = p_request_id AND receiver_id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  UPDATE friend_requests SET status = 'accepted' WHERE id = p_request_id;

  INSERT INTO friends (user_id, friend_id) VALUES (v_request.sender_id, v_request.receiver_id)
  ON CONFLICT DO NOTHING;
  INSERT INTO friends (user_id, friend_id) VALUES (v_request.receiver_id, v_request.sender_id)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- 12. RPC: reject_friend_request
-- ============================================================
CREATE OR REPLACE FUNCTION reject_friend_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  UPDATE friend_requests SET status = 'rejected'
    WHERE id = p_request_id AND receiver_id = v_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- 13. RPC: update_profile_extended
-- ============================================================
CREATE OR REPLACE FUNCTION update_profile_extended(
  p_name text DEFAULT NULL,
  p_username text DEFAULT NULL,
  p_avatar_emoji text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_banner_color text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_birthdate date DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_school text DEFAULT NULL,
  p_github_url text DEFAULT NULL,
  p_linkedin_url text DEFAULT NULL,
  p_website_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF p_username IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM profiles WHERE username = p_username AND id != v_user_id) THEN
      RETURN jsonb_build_object('error', 'username_taken');
    END IF;
  END IF;

  UPDATE profiles SET
    name = COALESCE(p_name, name),
    username = COALESCE(p_username, username),
    avatar_emoji = COALESCE(p_avatar_emoji, avatar_emoji),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    banner_color = COALESCE(p_banner_color, banner_color),
    bio = COALESCE(p_bio, bio),
    birthdate = COALESCE(p_birthdate, birthdate),
    city = COALESCE(p_city, city),
    country = COALESCE(p_country, country),
    school = COALESCE(p_school, school),
    github_url = COALESCE(p_github_url, github_url),
    linkedin_url = COALESCE(p_linkedin_url, linkedin_url),
    website_url = COALESCE(p_website_url, website_url)
  WHERE id = v_user_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- 14. Grants
-- ============================================================
GRANT EXECUTE ON FUNCTION send_friend_request(text) TO authenticated;
GRANT EXECUTE ON FUNCTION accept_friend_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION reject_friend_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_profile_extended(
  text, text, text, text, text, text, date, text, text, text, text, text, text
) TO authenticated;

-- ============================================================
-- 15. Seed badges extras
-- ============================================================
INSERT INTO badges (slug, title, description, icon_emoji) VALUES
  ('first_login', 'Primeiro Login', 'Entrou no SATQUEST pela primeira vez', '👋'),
  ('first_hash', 'Primeiro Hash', 'Calculou seu primeiro hash SHA-256', '🔐'),
  ('first_wallet', 'Primeira Carteira', 'Criou sua primeira carteira', '👛'),
  ('first_commit', 'Primeiro Commit', 'Completou seu primeiro desafio de código', '💻'),
  ('first_code', 'Primeiro Código', 'Escreveu sua primeira linha de código', '⌨️'),
  ('100_xp', '100 XP', 'Acumulou 100 pontos de experiência', '⭐'),
  ('500_xp', '500 XP', 'Acumulou 500 pontos de experiência', '🌟'),
  ('1000_xp', '1000 XP', 'Acumulou 1000 pontos de experiência', '💫'),
  ('5000_xp', '5000 XP', 'Acumulou 5000 pontos de experiência', '✨'),
  ('30_days', '30 Dias', 'Manteve sequência por 30 dias', '🔥'),
  ('100_days', '100 Dias', 'Manteve sequência por 100 dias', '🔥🔥'),
  ('league_silver', 'Liga Prata', 'Subiu para a Liga Prata', '🥈'),
  ('league_gold', 'Liga Ouro', 'Subiu para a Liga Ouro', '🥇'),
  ('league_platinum', 'Liga Platina', 'Subiu para a Liga Platina', '💠'),
  ('league_diamond', 'Liga Diamante', 'Subiu para a Liga Diamante', '💎'),
  ('league_master', 'Liga Mestre', 'Subiu para a Liga Mestre', '🏆'),
  ('league_legend', 'Lenda', 'Alcançou a Liga Lenda', '👑'),
  ('miner_bronze', 'Mineiro Bronze', 'Minerou seu primeiro bloco', '⛏️'),
  ('miner_silver', 'Mineiro Prata', 'Minerou 10 blocos', '🪨'),
  ('miner_gold', 'Mineiro Ouro', 'Minerou 50 blocos', '💎'),
  ('security_expert', 'Especialista em Segurança', 'Detectou 10 tentativas de golpe', '🛡️'),
  ('lightning_router', 'Roteador Lightning', 'Conectou 5 nós Lightning', '⚡'),
  ('blockchain_builder', 'Construtor de Blockchain', 'Montou uma blockchain completa', '🔗'),
  ('seed_master', 'Mestre das Seeds', 'Montou uma seed phrase corretamente', '🌱'),
  ('phishing_hunter', 'Caçador de Phishing', 'Detectou 5 ataques de phishing', '🎣'),
  ('first_friend', 'Primeiro Amigo', 'Adicionou seu primeiro amigo', '🤝'),
  ('social_10', 'Sociável', 'Tem 10 amigos', '👥'),
  ('social_50', 'Popular', 'Tem 50 amigos', '🌟'),
  ('perfect_week', 'Semana Perfeita', '7 dias de sequência sem errar', '📅'),
  ('speed_demon', 'Velocista', 'Completou um desafio em menos de 30 segundos', '⚡'),
  ('explorer', 'Explorador', 'Completou missões em 3 mundos diferentes', '🗺️'),
  ('boss_slayer', 'Caçador de Chefes', 'Derrotou o primeiro chefe', '⚔️'),
  ('first_sats', 'Primeiros Satoshis', 'Ganhou seus primeiros satoshis', '🪙'),
  ('first_lesson', 'Primeira Lição', 'Completou sua primeira lição', '📖'),
  ('fundamentos_done', 'Fundamentos Completos', 'Completou a trilha de Fundamentos', '🎓')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 16. Seed challenge types
-- ============================================================
INSERT INTO challenge_types (slug, name, description, icon_emoji, category, difficulty, config) VALUES
  ('hash_puzzle', 'Quebra-cabeça de Hash', 'Descubra o input que gera o hash correto', '🔐', 'cryptography', 1, '{"type":"hash_puzzle"}'),
  ('block_builder', 'Construtor de Blocos', 'Ligue os blocos da blockchain na ordem certa', '🔗', 'blockchain', 2, '{"type":"block_builder"}'),
  ('tx_order', 'Ordenar Transações', 'Organize transacoes do mempool por taxa', '📋', 'mempool', 1, '{"type":"tx_order"}'),
  ('phishing_detect', 'Detectar Phishing', 'Identifique tentativas de phishing', '🎣', 'security', 2, '{"type":"phishing_detect"}'),
  ('seed_assembly', 'Montar Seed Phrase', 'Monte uma seed phrase valida', '🌱', 'wallet', 3, '{"type":"seed_assembly"}'),
  ('lightning_connect', 'Conectar Nos Lightning', 'Conecte nos Lightning para abrir canais', '⚡', 'lightning', 3, '{"type":"lightning_connect"}'),
  ('block_validate', 'Validar Bloco', 'Encontre o bloco invalido na cadeia', '✅', 'consensus', 2, '{"type":"block_validate"}'),
  ('invalid_block', 'Bloco Invalido', 'Identifique qual bloco e invalido', '❌', 'blockchain', 3, '{"type":"invalid_block"}'),
  ('mining_sim', 'Simulador de Mineracao', 'Ajuste hashrate, energia e pool para maximizar lucro', '⛏️', 'mining', 2, '{"type":"mining_sim"}'),
  ('code_complete', 'Completar Codigo', 'Preencha o codigo que falta', '💻', 'programming', 3, '{"type":"code_complete"}'),
  ('code_logic', 'Logica de Programacao', 'Resolva o desafio de logica', '🧩', 'programming', 2, '{"type":"code_logic"}'),
  ('scam_detect', 'Detectar Golpe', 'Encontre a tentativa de golpe', '🚨', 'security', 1, '{"type":"scam_detect"}'),
  ('pow_puzzle', 'Proof of Work', 'Encontre o nonce que resolve o PoW', '🔨', 'consensus', 4, '{"type":"pow_puzzle"}'),
  ('economy_sim', 'Simulador de Economia', 'Gerencie oferta, demanda e inflacao', '📊', 'economy', 3, '{"type":"economy_sim"}'),
  ('wallet_setup', 'Configurar Carteira', 'Configure uma carteira do zero', '👛', 'wallet', 1, '{"type":"wallet_setup"}'),
  ('network_routing', 'Roteamento de Rede', 'Encontre o caminho mais curto na rede', '🌐', 'networks', 2, '{"type":"network_routing"}'),
  ('internet_basics', 'Fundamentos de Internet', 'Como a internet funciona', '📡', 'internet', 1, '{"type":"internet_basics"}'),
  ('halving_predict', 'Prever Halving', 'Calcule quando acontecera o proximo halving', '📉', 'economy', 4, '{"type":"halving_predict"}'),
  ('fee_calc', 'Calcular Taxas', 'Calcule taxas de transacao corretamente', '💰', 'mempool', 2, '{"type":"fee_calc"}'),
  ('multi_sig', 'Multi-Assinatura', 'Configure uma carteira multi-sig', '🔑', 'security', 5, '{"type":"multi_sig"}')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 17. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles (username);
CREATE INDEX IF NOT EXISTS idx_profiles_friend_code ON profiles (friend_code);
CREATE INDEX IF NOT EXISTS idx_profiles_league ON profiles (league);
CREATE INDEX IF NOT EXISTS idx_profiles_weekly_xp ON profiles (weekly_xp desc);
