# Backend

## Visão geral

O backend do SATQUEST é inteiramente gerenciado pelo **Supabase** — uma
plataforma open source de backend baseada em PostgreSQL. Não há servidor
tradicional (Node.js/Express); toda a lógica roda no PostgreSQL via funções
RPC (PL/pgSQL), triggers e Row Level Security.

## Componentes

### PostgreSQL

- 20+ tabelas com RLS habilitado
- Relacionamentos via foreign keys
- Constraints (CHECK, UNIQUE, NOT NULL)
- Índices para performance

### Auth (GoTrue)

- Email/senha
- Session management via JWT
- Trigger `on_auth_user_created` para auto-provisioning
- Email confirmation desativado (modo hackathon)

### RPC Functions

Funções PL/pgSQL `SECURITY DEFINER` para operações atômicas:

| Função | Tipo | Descrição |
|--------|------|-----------|
| `complete_lesson` | DEFINER | Completa lição, credita XP, atualiza streak/level/missões/badges |
| `claim_mission` | DEFINER | Resgata recompensa de missão |
| `record_game_score` | DEFINER | Registra score, atualiza ranking (com rate limit + cooldown) |
| `verify_age_and_enable_open_finance` | DEFINER | Verifica idade ≥ 16, habilita Open Finance |
| `create_virtual_card` | DEFINER | Cria cartão virtual (age-gated) |
| `generate_referral_code` | DEFINER | Gera código de convite (rate limited) |
| `get_referral_stats` | INVOKER | Estatísticas de convites |
| `update_profile` | INVOKER | Atualiza perfil (campos básicos) |
| `update_profile_extended` | INVOKER | Atualiza perfil (todos os campos) |
| `send_friend_request` | DEFINER | Envia solicitação de amizade |
| `accept_friend_request` | DEFINER | Aceita solicitação (cria amizade bidirecional) |
| `reject_friend_request` | DEFINER | Rejeita solicitação |
| `delete_account` | DEFINER | Exclui conta e todos os dados em cascata |

### Triggers

| Trigger | Descrição |
|---------|-----------|
| `on_auth_user_created` | Cria profile + wallet + friend_code ao registrar |
| `set_updated_at` | Atualiza `updated_at` em UPDATE (6 tabelas) |

### Audit Logs

Tabela `audit_logs` registra todas as operações sensíveis:

- `lesson_completed`, `mission_claimed`, `game_score_recorded`
- `open_finance_enabled`, `virtual_card_created`
- `referral_code_generated`, `profile_updated`
- `account_deleted`, `account_deletion_with_balance`

## Padrões

### SECURITY DEFINER + search_path

```sql
CREATE OR REPLACE FUNCTION X(...)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$ ... $$;
```

- `SECURITY DEFINER`: executa como postgres (bypassa RLS)
- `SET search_path = public, pg_temp`: previne search path injection

### EXECUTE permissions

```sql
REVOKE EXECUTE ON FUNCTION X FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION X TO authenticated;
```

### Validação de entrada

Todas as funções validam parâmetros antes de executar:

```sql
IF v_user_id IS NULL THEN
  RETURN jsonb_build_object('error', 'not_authenticated');
END IF;

IF p_quiz_correct < 0 OR p_quiz_total <= 0 OR p_quiz_correct > p_quiz_total THEN
  RETURN jsonb_build_object('error', 'invalid_quiz_data');
END IF;
```

### Idempotência

`complete_lesson` verifica se a lição já foi completada antes de creditar XP,
evitando duplicação de recompensas.
