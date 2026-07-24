/*
# Cripto no Corre — Schema inicial

## Visão geral
Cria o schema completo do app Learn-to-Earn "Cripto no Corre":
trilhas, lições (story + quiz), progresso do usuário, carteira
custodial de sats, missões diárias, conquistas, convites e XP.

## Novas tabelas
1. `profiles` — perfil público do usuário (nome, avatar, streak, xp, nível)
2. `trilhas` — trilhas de aprendizado (ex: "Fundamentos do Bitcoin")
3. `lessons` — lições dentro de uma trilha, com story_frames + quiz
4. `lesson_progress` — progresso por lição por usuário
5. `xp_events` — log de XP ganho
6. `wallets` — carteira custodial (1 por usuário), saldo em sats
7. `wallet_txs` — transações da carteira (learning_reward, mission_reward, withdrawal)
8. `missions` — missões diárias (definição)
9. `mission_progress` — progresso de missão por usuário por dia
10. `badges` — conquistas (definição)
11. `user_badges` — conquista desbloqueada por usuário
12. `invites` — convites enviados pelo usuário

## Segurança (RLS)
- Todas as tabelas com RLS habilitado.
- `profiles`, `lesson_progress`, `xp_events`, `wallets`, `wallet_txs`,
  `mission_progress`, `user_badges`, `invites`: owner-scoped
  (TO authenticated, auth.uid() = user_id).
- `trilhas`, `lessons`, `missions`, `badges`: conteúdo público
  (TO authenticated) — todos os usuários autenticados leem o conteúdo
  de aprendizado.

## Notas importantes
- `user_id` sempre NOT NULL DEFAULT auth.uid() para inserts funcionarem.
- `wallets.balance_sats` começa em 0 e é atualizado via wallet_txs.
- `lessons.story_frames` e `lessons.quiz` são JSONB.
- Carteira é custodial — saldo é só um inteiro de sats, sem chaves privadas.
*/

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  avatar_emoji text NOT NULL DEFAULT '🙂',
  streak_days integer NOT NULL DEFAULT 0,
  last_active_date date,
  xp_total integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============================================================
-- trilhas
-- ============================================================
CREATE TABLE IF NOT EXISTS trilhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL,
  description text NOT NULL,
  cover_emoji text NOT NULL DEFAULT '🟧',
  color_hex text NOT NULL DEFAULT '#F7931A',
  position integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trilhas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_published_trilhas" ON trilhas;
CREATE POLICY "read_published_trilhas" ON trilhas FOR SELECT
  TO authenticated USING (is_published = true);

-- ============================================================
-- lessons
-- ============================================================
CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id uuid NOT NULL REFERENCES trilhas(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL,
  cover_emoji text NOT NULL DEFAULT '📖',
  position integer NOT NULL DEFAULT 0,
  duration_min integer NOT NULL DEFAULT 3,
  reward_sats integer NOT NULL DEFAULT 50,
  reward_xp integer NOT NULL DEFAULT 20,
  story_frames jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trilha_id, slug)
);

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_published_lessons" ON lessons;
CREATE POLICY "read_published_lessons" ON lessons FOR SELECT
  TO authenticated USING (is_published = true);

CREATE INDEX IF NOT EXISTS idx_lessons_trilha_position
  ON lessons (trilha_id, position);

-- ============================================================
-- lesson_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress','completed')),
  quiz_correct integer NOT NULL DEFAULT 0,
  quiz_total integer NOT NULL DEFAULT 0,
  sats_earned integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_progress" ON lesson_progress;
CREATE POLICY "select_own_progress" ON lesson_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_progress" ON lesson_progress;
CREATE POLICY "insert_own_progress" ON lesson_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_progress" ON lesson_progress;
CREATE POLICY "update_own_progress" ON lesson_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_progress" ON lesson_progress;
CREATE POLICY "delete_own_progress" ON lesson_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_progress_user
  ON lesson_progress (user_id);

-- ============================================================
-- xp_events
-- ============================================================
CREATE TABLE IF NOT EXISTS xp_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE xp_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_xp" ON xp_events;
CREATE POLICY "select_own_xp" ON xp_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_xp" ON xp_events;
CREATE POLICY "insert_own_xp" ON xp_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_xp_user
  ON xp_events (user_id, created_at desc);

-- ============================================================
-- wallets
-- ============================================================
CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_sats bigint NOT NULL DEFAULT 0,
  lifetime_sats bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_wallet" ON wallets;
CREATE POLICY "select_own_wallet" ON wallets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_wallet" ON wallets;
CREATE POLICY "insert_own_wallet" ON wallets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_wallet" ON wallets;
CREATE POLICY "update_own_wallet" ON wallets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- wallet_txs
-- ============================================================
CREATE TABLE IF NOT EXISTS wallet_txs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('learning_reward','mission_reward','referral_reward','withdrawal','adjustment')),
  amount_sats bigint NOT NULL,
  label text NOT NULL,
  ref_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE wallet_txs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_txs" ON wallet_txs;
CREATE POLICY "select_own_txs" ON wallet_txs FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_txs" ON wallet_txs;
CREATE POLICY "insert_own_txs" ON wallet_txs FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_txs_user_created
  ON wallet_txs (user_id, created_at desc);

-- ============================================================
-- missions (definição de conteúdo)
-- ============================================================
CREATE TABLE IF NOT EXISTS missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon_emoji text NOT NULL DEFAULT '🎯',
  target_count integer NOT NULL DEFAULT 1,
  reward_sats integer NOT NULL DEFAULT 10,
  reward_xp integer NOT NULL DEFAULT 5,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_active_missions" ON missions;
CREATE POLICY "read_active_missions" ON missions FOR SELECT
  TO authenticated USING (is_active = true);

-- ============================================================
-- mission_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS mission_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id uuid NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  period_date date NOT NULL,
  current_count integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  reward_claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, mission_id, period_date)
);

ALTER TABLE mission_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_mission_progress" ON mission_progress;
CREATE POLICY "select_own_mission_progress" ON mission_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mission_progress" ON mission_progress;
CREATE POLICY "insert_own_mission_progress" ON mission_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mission_progress" ON mission_progress;
CREATE POLICY "update_own_mission_progress" ON mission_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_mission_progress_user_date
  ON mission_progress (user_id, period_date);

-- ============================================================
-- badges (definição)
-- ============================================================
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon_emoji text NOT NULL DEFAULT '🏅',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_badges" ON badges;
CREATE POLICY "read_all_badges" ON badges FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- user_badges
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_id)
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_badges" ON user_badges;
CREATE POLICY "select_own_badges" ON user_badges FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_badges" ON user_badges;
CREATE POLICY "insert_own_badges" ON user_badges FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- invites
-- ============================================================
CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reward_sats integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_invites" ON invites;
CREATE POLICY "select_own_invites" ON invites FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_invites" ON invites;
CREATE POLICY "insert_own_invites" ON invites FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- updated_at trigger helper
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_lesson_progress_updated_at ON lesson_progress;
CREATE TRIGGER trg_lesson_progress_updated_at
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_wallets_updated_at ON wallets;
CREATE TRIGGER trg_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_mission_progress_updated_at ON mission_progress;
CREATE TRIGGER trg_mission_progress_updated_at
  BEFORE UPDATE ON mission_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- New-user profile auto-creation trigger
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();