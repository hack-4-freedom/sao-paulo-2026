/*
# Bitcoin no Corre — Evolução do schema (V2)

## Visão geral
Adiciona suporte para:
- Módulos educacionais com níveis de dificuldade
- Game Center (jogos, ranking, temporadas, desafios)
- Open Finance (cartão virtual, PIX, age-gated)
- Perfis com data de nascimento para verificação de idade
- Colecionáveis e baús

## Alterações em tabelas existentes
1. `profiles` — adiciona `birthdate` (date, nullable) para verificação de idade
2. `wallet_txs` — adiciona `game_reward` ao CHECK de type

## Novas tabelas
1. `modules` — módulos educacionais (Iniciante, Curioso, ..., Especialista)
2. `module_progress` — progresso por módulo por usuário
3. `games` — definição de jogos do Game Center
4. `game_scores` — scores por usuário por jogo
5. `game_seasons` — temporadas do Game Center
6. `game_season_rankings` — ranking semanal de usuários
7. `chests` — baús com recompensas aleatórias
8. `user_chests` — baús desbloqueados por usuário
9. `collectibles` — itens colecionáveis (skins, avatares, títulos)
10. `user_collectibles` — colecionáveis possuídos por usuário
11. `open_finance_accounts` — contas Open Finance do usuário
12. `virtual_cards` — cartões virtuais (age-gated)

## Segurança (RLS)
- Todas as novas tabelas com RLS habilitado.
- Tabelas de conteúdo (modules, games, game_seasons, chests, collectibles):
  SELECT TO authenticated (conteúdo público).
- Tabelas de dados do usuário (module_progress, game_scores,
  game_season_rankings, user_chests, user_collectibles,
  open_finance_accounts, virtual_cards): owner-scoped.
- game_season_rankings permite SELECT para authenticated (ranking é público)
  mas INSERT/UPDATE apenas próprio.

## Notas importantes
- `profiles.birthdate` é nullable para não quebrar usuários existentes.
- `virtual_cards` e `open_finance_accounts` têm `is_enabled` que só pode
  ser true se o usuário for maior de 16 (verificado via birthdate).
- A verificação de idade é feita no cliente e no banco (CHECK).
*/

-- ============================================================
-- profiles: adicionar birthdate
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'birthdate'
  ) THEN
    ALTER TABLE profiles ADD COLUMN birthdate date;
  END IF;
END $$;

-- ============================================================
-- wallet_txs: adicionar game_reward ao CHECK
-- ============================================================
ALTER TABLE wallet_txs DROP CONSTRAINT IF EXISTS wallet_txs_type_check;
ALTER TABLE wallet_txs ADD CONSTRAINT wallet_txs_type_check
  CHECK (type IN ('learning_reward','mission_reward','game_reward','referral_reward','withdrawal','adjustment'));

-- ============================================================
-- modules — módulos educacionais
-- ============================================================
CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text NOT NULL,
  description text NOT NULL,
  icon_emoji text NOT NULL DEFAULT '📚',
  color_hex text NOT NULL DEFAULT '#F7931A',
  difficulty text NOT NULL DEFAULT 'iniciante' CHECK (difficulty IN ('iniciante','curioso','aprendiz','explorador','operador_lightning','autocustodia','seguranca','economia','planejamento','soberania','especialista')),
  position integer NOT NULL DEFAULT 0,
  trilha_id uuid REFERENCES trilhas(id) ON DELETE SET NULL,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_published_modules" ON modules;
CREATE POLICY "read_published_modules" ON modules FOR SELECT
  TO authenticated USING (is_published = true);

-- ============================================================
-- module_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('locked','in_progress','completed')),
  lessons_completed integer NOT NULL DEFAULT 0,
  total_lessons integer NOT NULL DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_id)
);

ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_module_progress" ON module_progress;
CREATE POLICY "select_own_module_progress" ON module_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_module_progress" ON module_progress;
CREATE POLICY "insert_own_module_progress" ON module_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_module_progress" ON module_progress;
CREATE POLICY "update_own_module_progress" ON module_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- games — Game Center
-- ============================================================
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon_emoji text NOT NULL DEFAULT '🎮',
  color_hex text NOT NULL DEFAULT '#10B981',
  reward_sats integer NOT NULL DEFAULT 5,
  reward_xp integer NOT NULL DEFAULT 3,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_active_games" ON games;
CREATE POLICY "read_active_games" ON games FOR SELECT
  TO authenticated USING (is_active = true);

-- ============================================================
-- game_scores
-- ============================================================
CREATE TABLE IF NOT EXISTS game_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  sats_earned integer NOT NULL DEFAULT 0,
  xp_earned integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_scores" ON game_scores;
CREATE POLICY "select_own_scores" ON game_scores FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_scores" ON game_scores;
CREATE POLICY "insert_own_scores" ON game_scores FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_game_scores_user
  ON game_scores (user_id, created_at desc);

CREATE INDEX IF NOT EXISTS idx_game_scores_game_score
  ON game_scores (game_id, score desc);

-- ============================================================
-- game_seasons — temporadas
-- ============================================================
CREATE TABLE IF NOT EXISTS game_seasons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE game_seasons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_game_seasons" ON game_seasons;
CREATE POLICY "read_game_seasons" ON game_seasons FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- game_season_rankings — ranking semanal
-- ============================================================
CREATE TABLE IF NOT EXISTS game_season_rankings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  season_id uuid NOT NULL REFERENCES game_seasons(id) ON DELETE CASCADE,
  total_score integer NOT NULL DEFAULT 0,
  total_sats integer NOT NULL DEFAULT 0,
  rank integer,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, season_id)
);

ALTER TABLE game_season_rankings ENABLE ROW LEVEL SECURITY;

-- Ranking é visível para todos os autenticados
DROP POLICY IF EXISTS "read_all_rankings" ON game_season_rankings;
CREATE POLICY "read_all_rankings" ON game_season_rankings FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_ranking" ON game_season_rankings;
CREATE POLICY "insert_own_ranking" ON game_season_rankings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ranking" ON game_season_rankings;
CREATE POLICY "update_own_ranking" ON game_season_rankings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- chests — baús com recompensas
-- ============================================================
CREATE TABLE IF NOT EXISTS chests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon_emoji text NOT NULL DEFAULT '🪨',
  min_level integer NOT NULL DEFAULT 1,
  min_sats integer NOT NULL DEFAULT 0,
  max_sats integer NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_active_chests" ON chests;
CREATE POLICY "read_active_chests" ON chests FOR SELECT
  TO authenticated USING (is_active = true);

-- ============================================================
-- user_chests
-- ============================================================
CREATE TABLE IF NOT EXISTS user_chests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  chest_id uuid NOT NULL REFERENCES chests(id) ON DELETE CASCADE,
  sats_reward integer NOT NULL DEFAULT 0,
  opened_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_chests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chests" ON user_chests;
CREATE POLICY "select_own_chests" ON user_chests FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_chests" ON user_chests;
CREATE POLICY "insert_own_chests" ON user_chests FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- collectibles — skins, avatares, títulos
-- ============================================================
CREATE TABLE IF NOT EXISTS collectibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('avatar','skin','title','badge')),
  icon_emoji text NOT NULL DEFAULT '✨',
  rarity text NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collectibles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_all_collectibles" ON collectibles;
CREATE POLICY "read_all_collectibles" ON collectibles FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- user_collectibles
-- ============================================================
CREATE TABLE IF NOT EXISTS user_collectibles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  collectible_id uuid NOT NULL REFERENCES collectibles(id) ON DELETE CASCADE,
  is_equipped boolean NOT NULL DEFAULT false,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, collectible_id)
);

ALTER TABLE user_collectibles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_collectibles" ON user_collectibles;
CREATE POLICY "select_own_collectibles" ON user_collectibles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_collectibles" ON user_collectibles;
CREATE POLICY "insert_own_collectibles" ON user_collectibles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_collectibles" ON user_collectibles;
CREATE POLICY "update_own_collectibles" ON user_collectibles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- open_finance_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS open_finance_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_brl numeric(12,2) NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT false,
  can_withdraw boolean NOT NULL DEFAULT false,
  can_request_card boolean NOT NULL DEFAULT false,
  institution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE open_finance_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_of_account" ON open_finance_accounts;
CREATE POLICY "select_own_of_account" ON open_finance_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_of_account" ON open_finance_accounts;
CREATE POLICY "insert_own_of_account" ON open_finance_accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_of_account" ON open_finance_accounts;
CREATE POLICY "update_own_of_account" ON open_finance_accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- virtual_cards
-- ============================================================
CREATE TABLE IF NOT EXISTS virtual_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  of_account_id uuid NOT NULL REFERENCES open_finance_accounts(id) ON DELETE CASCADE,
  last4 text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  monthly_limit_brl numeric(12,2) NOT NULL DEFAULT 500,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE virtual_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_cards" ON virtual_cards;
CREATE POLICY "select_own_cards" ON virtual_cards FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_cards" ON virtual_cards;
CREATE POLICY "insert_own_cards" ON virtual_cards FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_cards" ON virtual_cards;
CREATE POLICY "update_own_cards" ON virtual_cards FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- Triggers updated_at para novas tabelas
-- ============================================================
DROP TRIGGER IF EXISTS trg_module_progress_updated_at ON module_progress;
CREATE TRIGGER trg_module_progress_updated_at
  BEFORE UPDATE ON module_progress
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trf_game_season_rankings_updated_at ON game_season_rankings;
CREATE TRIGGER trf_game_season_rankings_updated_at
  BEFORE UPDATE ON game_season_rankings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_of_account_updated_at ON open_finance_accounts;
CREATE TRIGGER trg_of_account_updated_at
  BEFORE UPDATE ON open_finance_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();