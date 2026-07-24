# Segurança

## Visão geral

SATQUEST implementa **defense-in-depth**: múltiplas camadas de segurança que
se complementam. Mesmo que uma camada falhe, as outras protegem os dados.

## Row Level Security (RLS)

### Princípio fundamental

**Toda tabela tem RLS habilitado.** Sem policies, a tabela é inacessível
(locked). As policies definem quem pode ler/escrever o quê.

### Padrões

#### Owner-scoped (maioria)

```sql
CREATE POLICY "select_own_X" ON X FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_X" ON X FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_X" ON X FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_X" ON X FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
```

#### Conteúdo público (SELECT only)

```sql
CREATE POLICY "read_published_X" ON X FOR SELECT
  TO authenticated USING (is_published = true);
```

#### Perfil (SELECT público, UPDATE owner)

```sql
CREATE POLICY "select_all_profiles" ON profiles FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

### Role `anon`

O role `anon` tem **zero privilégios** em todas as tabelas (revogado na
migração 0007). Apenas `authenticated` pode acessar dados.

```sql
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE ALL PRIVILEGES ON TABLE public.%I FROM anon', r.tablename);
  END LOOP;
END $$;
```

## Funções RPC

### SECURITY DEFINER

Funções que manipulam dados financeiros usam `SECURITY DEFINER` — executam
com os privilégios do dono (postgres), não do usuário. Isso permite que a
função faça operações que o usuário não poderia fazer diretamente (como
atualizar o saldo da carteira).

```sql
CREATE OR REPLACE FUNCTION complete_lesson(...)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ ... $$;
```

### search_path

Todas as funções `SECURITY DEFINER` têm `SET search_path = public, pg_temp`
para prevenir ataques de search path injection.

### Permissões EXECUTE

```sql
REVOKE EXECUTE ON FUNCTION complete_lesson FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION complete_lesson TO authenticated;
```

## Proteções financeiras

### Saldo da carteira

- **Sem UPDATE policy**: `wallets` não tem policy de UPDATE para authenticated
- **Apenas via RPC**: o saldo só é alterado por funções `SECURITY DEFINER`
- **O cliente não pode** modificar o saldo diretamente

### Tabelas imutáveis

`wallet_txs`, `xp_events`, `game_scores` **não têm** policies de UPDATE ou
DELETE. Uma vez registrada, uma transação não pode ser alterada.

## Rate limiting

| Operação | Limite |
|----------|--------|
| Códigos de convite | 10 por dia |
| Scores de jogo | 20 por dia |
| Cooldown de score | 60 segundos |

## Audit logs

Todas as operações sensíveis registram em `audit_logs`:

- `lesson_completed` — lição completada
- `mission_claimed` — missão resgatada
- `game_score_recorded` — score registrado
- `open_finance_enabled` — Open Finance habilitado
- `virtual_card_created` — cartão criado
- `referral_code_generated` — código gerado
- `profile_updated` — perfil atualizado
- `account_deleted` — conta excluída
- `account_deletion_with_balance` — exclusão com saldo

## Verificação de idade

Open Finance e cartões virtuais requerem idade ≥ 16, verificada no backend:

```sql
v_age := extract(year FROM age(current_date, v_profile.birthdate));
IF v_age < 16 THEN
  RETURN jsonb_build_object('error', 'underage', 'age', v_age);
END IF;
```

## OWASP Top 10 — Mitigações

| Vulnerabilidade | Mitigação |
|----------------|-----------|
| **Injection (SQL)** | Supabase client usa parameterized queries; RPC usa PL/pgSQL |
| **Broken Auth** | Supabase Auth (GoTrue), rate limiting, session management |
| **Sensitive Data Exposure** | RLS, anon revogado, SECURITY DEFINER |
| **XXE** | Não usado (sem XML parsing) |
| **Broken Access Control** | RLS em todas as tabelas, auth.uid() checks |
| **Security Misconfiguration** | search_path definido, EXECUTE revogado de anon |
| **XSS** | React escapa HTML automaticamente, sem dangerouslySetInnerHTML |
| **Insecure Deserialization** | Não usado (sem deserialização de objetos) |
| **Known Vulnerabilities** | Dependabot monitora dependências |
| **Insufficient Logging** | audit_logs em todas as operações sensíveis |
