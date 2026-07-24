/*
# Social Impact Pivot — Abraça a Causa

## Goal
Transform the platform from "teach Bitcoin" to "social transformation via Bitcoin".
Add supporter system, donations, partners, stories, community wall, transparency panel.

## New Tables
1. `supporters` — users who become supporters (name, photo, level, time supporting, children impacted, hours sponsored, total amount, medals, title)
2. `donations` — individual donation records (amount_sats, message, anonymous)
3. `partners` — verified organizations (name, type, logo_url, verified, documents)
4. `impact_stories` — real stories from beneficiaries (title, content, author, anonymized)
5. `community_wall` — messages of gratitude, achievements, events
6. `transparency_stats` — single-row panel with aggregate metrics

## Modified Tables
- `profiles` — add `supporter_title` (text, nullable), `is_supporter` (boolean, default false)

## Security
- RLS on all new tables
- supporters: SELECT public (authenticated), INSERT/UPDATE owner
- donations: SELECT public aggregate (authenticated), INSERT owner
- partners: SELECT public
- impact_stories: SELECT public
- community_wall: SELECT public, INSERT owner, DELETE owner
- transparency_stats: SELECT public

## RPCs
- `become_supporter()` — marks user as supporter, creates supporters row
- `record_donation(amount_sats, message, anonymous)` — records a donation, updates transparency stats
- `get_transparency_stats()` — returns aggregate metrics
*/

-- ============================================================
-- 1. Add supporter fields to profiles
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_supporter') THEN
    ALTER TABLE profiles ADD COLUMN is_supporter boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'supporter_title') THEN
    ALTER TABLE profiles ADD COLUMN supporter_title text;
  END IF;
END $$;

-- ============================================================
-- 2. Table: supporters
-- ============================================================
CREATE TABLE IF NOT EXISTS supporters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_emoji text NOT NULL DEFAULT '🌟',
  level integer NOT NULL DEFAULT 1,
  started_at timestamptz NOT NULL DEFAULT now(),
  children_impacted integer NOT NULL DEFAULT 0,
  hours_sponsored integer NOT NULL DEFAULT 0,
  total_sats integer NOT NULL DEFAULT 0,
  medals jsonb NOT NULL DEFAULT '[]'::jsonb,
  title text NOT NULL DEFAULT 'Anjo',
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE supporters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_supporters" ON supporters;
CREATE POLICY "select_all_supporters" ON supporters FOR SELECT
  TO authenticated USING (is_public = true OR auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_supporter" ON supporters;
CREATE POLICY "insert_own_supporter" ON supporters FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_supporter" ON supporters;
CREATE POLICY "update_own_supporter" ON supporters FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_supporters_user ON supporters (user_id);
CREATE INDEX IF NOT EXISTS idx_supporters_total_sats ON supporters (total_sats DESC);

DROP TRIGGER IF EXISTS trg_supporters_updated_at ON supporters;
CREATE TRIGGER trg_supporters_updated_at
  BEFORE UPDATE ON supporters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 3. Table: donations
-- ============================================================
CREATE TABLE IF NOT EXISTS donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_sats integer NOT NULL DEFAULT 0,
  message text,
  anonymous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_donations" ON donations;
CREATE POLICY "select_all_donations" ON donations FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_donation" ON donations;
CREATE POLICY "insert_own_donation" ON donations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_donations_user ON donations (user_id);
CREATE INDEX IF NOT EXISTS idx_donations_created ON donations (created_at DESC);

-- ============================================================
-- 4. Table: partners
-- ============================================================
CREATE TABLE IF NOT EXISTS partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'ong' CHECK (type IN ('ong','instituicao','escola','abrigo','empresa','universidade')),
  logo_url text,
  description text,
  website_url text,
  is_verified boolean NOT NULL DEFAULT false,
  documents jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_partners" ON partners;
CREATE POLICY "select_all_partners" ON partners FOR SELECT
  TO authenticated USING (true);

-- ============================================================
-- 5. Table: impact_stories
-- ============================================================
CREATE TABLE IF NOT EXISTS impact_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  author_name text,
  author_age integer,
  author_city text,
  is_anonymized boolean NOT NULL DEFAULT true,
  image_url text,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE impact_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_published_stories" ON impact_stories;
CREATE POLICY "select_published_stories" ON impact_stories FOR SELECT
  TO authenticated USING (is_published = true);

-- ============================================================
-- 6. Table: community_wall
-- ============================================================
CREATE TABLE IF NOT EXISTS community_wall (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'message' CHECK (type IN ('message','gratitude','achievement','event')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE community_wall ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_all_wall" ON community_wall;
CREATE POLICY "select_all_wall" ON community_wall FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_wall" ON community_wall;
CREATE POLICY "insert_own_wall" ON community_wall FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_wall" ON community_wall;
CREATE POLICY "delete_own_wall" ON community_wall FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wall_created ON community_wall (created_at DESC);

-- ============================================================
-- 7. Table: transparency_stats (single-row)
-- ============================================================
CREATE TABLE IF NOT EXISTS transparency_stats (
  id integer PRIMARY KEY DEFAULT 1,
  total_sats_raised integer NOT NULL DEFAULT 0,
  total_supporters integer NOT NULL DEFAULT 0,
  total_youth_impacted integer NOT NULL DEFAULT 0,
  total_hours_sponsored integer NOT NULL DEFAULT 0,
  total_projects_funded integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

ALTER TABLE transparency_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_transparency" ON transparency_stats;
CREATE POLICY "select_transparency" ON transparency_stats FOR SELECT
  TO authenticated USING (true);

INSERT INTO transparency_stats (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. Seed partners (placeholders)
-- ============================================================
INSERT INTO partners (name, type, description, is_verified) VALUES
  ('Abrigo Esperança', 'abrigo', 'Acolhimento institucional para crianças e adolescentes em situação de vulnerabilidade.', true),
  ('Escola Municipal Monte Azul', 'escola', 'Escola pública de ensino fundamental e médio na periferia de São Paulo.', true),
  ('Instituto Transforma', 'ong', 'Organização não-governamental focada em educação tecnológica para jovens.', true),
  ('Universidade Cidadã', 'universidade', 'Universidade com programa de bolsas para estudantes de baixa renda.', true),
  ('Empresa Tech do Bem', 'empresa', 'Empresa de tecnologia que apoia educação com recursos e mentoria.', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 9. Seed impact stories (placeholders, anonymized)
-- ============================================================
INSERT INTO impact_stories (title, content, author_name, author_age, author_city, is_anonymized) VALUES
  ('De abrigo a programador', 'M. chegou ao abrigo aos 12 anos. Hoje, aos 17, aprendeu programação através da plataforma e já faz freelances para ajudar a família.', 'M.', 17, 'São Paulo', true),
  ('A primeira linha de código', 'A. nunca tinha visto um computador de perto. Em 3 meses, escreveu seu primeiro programa e descobriu uma paixão que não sabia que existia.', 'A.', 15, 'Recife', true),
  ('Bitcoin como esperança', 'J. entendia nada de dinheiro. Agora ensina os colegas sobre economia e planeja abrir o próprio negócio.', 'J.', 16, 'Salvador', true),
  ('A menina que minerava ideias', 'R. encontrou na plataforma um mundo novo. Hoje sonha em ser engenheira de software.', 'R.', 14, 'Fortaleza', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. RPC: become_supporter
-- ============================================================
CREATE OR REPLACE FUNCTION become_supporter(p_display_name text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT name INTO v_name FROM profiles WHERE id = v_user_id;
  IF v_name IS NULL THEN
    v_name := 'Apoiador';
  END IF;

  INSERT INTO supporters (user_id, display_name, title)
  VALUES (v_user_id, COALESCE(p_display_name, v_name), 'Anjo')
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE profiles SET is_supporter = true WHERE id = v_user_id;

  UPDATE transparency_stats
    SET total_supporters = total_supporters + 1,
        updated_at = now()
    WHERE id = 1;

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION become_supporter(text) TO authenticated;

-- ============================================================
-- 11. RPC: record_donation
-- ============================================================
CREATE OR REPLACE FUNCTION record_donation(p_amount_sats integer, p_message text DEFAULT NULL, p_anonymous boolean DEFAULT false)
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

  IF p_amount_sats <= 0 THEN
    RETURN jsonb_build_object('error', 'invalid_amount');
  END IF;

  INSERT INTO donations (user_id, amount_sats, message, anonymous)
  VALUES (v_user_id, p_amount_sats, p_message, p_anonymous);

  UPDATE supporters
    SET total_sats = total_sats + p_amount_sats,
        level = LEAST(level + 1, 10),
        updated_at = now()
    WHERE user_id = v_user_id;

  UPDATE transparency_stats
    SET total_sats_raised = total_sats_raised + p_amount_sats,
        updated_at = now()
    WHERE id = 1;

  RETURN jsonb_build_object('success', true, 'amount_sats', p_amount_sats);
END;
$$;

GRANT EXECUTE ON FUNCTION record_donation(integer, text, boolean) TO authenticated;

-- ============================================================
-- 12. RPC: get_transparency_stats
-- ============================================================
CREATE OR REPLACE FUNCTION get_transparency_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_stats transparency_stats%ROWTYPE;
BEGIN
  SELECT * INTO v_stats FROM transparency_stats WHERE id = 1;
  RETURN jsonb_build_object(
    'total_sats_raised', v_stats.total_sats_raised,
    'total_supporters', v_stats.total_supporters,
    'total_youth_impacted', v_stats.total_youth_impacted,
    'total_hours_sponsored', v_stats.total_hours_sponsored,
    'total_projects_funded', v_stats.total_projects_funded
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_transparency_stats() TO authenticated;

-- ============================================================
-- 13. Seed badges for social impact
-- ============================================================
INSERT INTO badges (slug, title, description, icon_emoji) VALUES
  ('first_donor', 'Primeira Doação', 'Fez sua primeira doação para a causa', '❤️'),
  ('supporter_anjo', 'Anjo', 'Tornou-se apoiador da causa', '😇'),
  ('supporter_guardiao', 'Guardião', 'Apoiou por 3 meses consecutivos', '🛡️'),
  ('supporter_transformador', 'Transformador', 'Impactou a vida de 5 jovens', '✨'),
  ('supporter_mentor', 'Mentor', 'Patrocinou 100 horas de estudo', '🎓'),
  ('supporter_lenda', 'Lenda', 'Apoiou por 12 meses consecutivos', '👑'),
  ('community_helper', 'Ajudante da Comunidade', 'Postou no mural da comunidade', '🤲'),
  ('story_sharer', 'Compartilhou uma História', 'Compartilhou uma história de impacto', '📖')
ON CONFLICT (slug) DO NOTHING;
