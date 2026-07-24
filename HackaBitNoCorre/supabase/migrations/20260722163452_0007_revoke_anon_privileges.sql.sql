/*
# Bitcoin no Corre — Security Hardening V4 Part 2: Revoke anon table privileges

## Visão geral
Revoga todos os privilégios de tabela do role `anon`.
Esta aplicação requer autenticação — anon não deve ter nenhum acesso
direto às tabelas, mesmo com RLS ativo (defense-in-depth).

## Mudanças
- REVOKE ALL PRIVILEGES ON ALL TABLES FROM anon
- GRANT USAGE ON SCHEMA public TO authenticated (mantido)
*/

-- Revoke all privileges from anon on all public tables
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon', r.tablename);
  END LOOP;
END $$;

-- Also revoke sequence privileges from anon
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public' LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON SEQUENCE public.%I FROM anon', r.sequence_name);
  END LOOP;
END $$;
