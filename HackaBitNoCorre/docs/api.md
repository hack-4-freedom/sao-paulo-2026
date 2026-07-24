# API

## Visão geral

SATQUEST não tem uma API REST tradicional. Toda a comunicação com o backend
é feita via **Supabase JS Client** (PostgreSQL + Auth + RPC) e **Breez SDK
Spark** (Lightning Network).

## Supabase Client

```typescript
import { supabase } from "@/lib/supabase";

// Query com RLS automático
const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", userId);
```

## Funções RPC

### `complete_lesson`

Completa uma lição, credita XP, atualiza streak/level/missões/badges.

```typescript
const { data, error } = await supabase.rpc("complete_lesson", {
  p_lesson_id: lessonId,
  p_quiz_correct: 4,
  p_quiz_total: 5,
});
// Retorna: { sats_earned: 0, xp_earned: 20, perfect: false, already_completed: false }
// Erros: { error: "not_authenticated" } | { error: "lesson_not_found" } | { error: "invalid_quiz_data" }
```

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `p_lesson_id` | `uuid` | ID da lição |
| `p_quiz_correct` | `integer` | Respostas corretas |
| `p_quiz_total` | `integer` | Total de perguntas |

### `claim_mission`

Resgata a recompensa de uma missão completada.

```typescript
const { data, error } = await supabase.rpc("claim_mission", {
  p_mission_progress_id: progressId,
});
// Retorna: { sats_earned: 0, xp_earned: 5 }
// Erros: { error: "not_found" } | { error: "not_claimable" }
```

### `record_game_score`

Registra o score de um jogo e atualiza o ranking da temporada.

```typescript
const { data, error } = await supabase.rpc("record_game_score", {
  p_game_id: gameId,
  p_score: 1500,
});
// Retorna: { sats_earned: 0, xp_earned: 3, score: 1500 }
// Erros: { error: "game_not_found" } | { error: "daily_limit_exceeded" } | { error: "cooldown_active" }
```

**Rate limits**: máximo 20 scores/dia, 60s de cooldown entre scores.

### `update_profile_extended`

Atualiza todos os campos do perfil.

```typescript
const { data, error } = await supabase.rpc("update_profile_extended", {
  p_name: "João",
  p_username: "joao42",
  p_avatar_emoji: "🦊",
  p_banner_color: "#F7931A",
  p_bio: "Aprendendo Bitcoin",
  p_birthdate: "2008-05-15",
  p_city: "São Paulo",
  p_country: "Brasil",
  p_school: "Escola 42 SP",
  p_github_url: "https://github.com/joao",
  p_linkedin_url: "https://linkedin.com/in/joao",
  p_website_url: "https://joao.dev",
});
// Retorna: { success: true }
// Erros: { error: "username_taken" } | { error: "not_authenticated" }
```

### `send_friend_request`

Envia uma solicitação de amizade via código de amigo.

```typescript
const { data, error } = await supabase.rpc("send_friend_request", {
  p_friend_code: "SAT-AB12CD",
});
// Retorna: { success: true }
// Erros: { error: "friend_code_not_found" } | { error: "cannot_add_self" } |
//        { error: "already_friends" } | { error: "request_already_pending" }
```

### `accept_friend_request`

```typescript
const { data, error } = await supabase.rpc("accept_friend_request", {
  p_request_id: requestId,
});
// Retorna: { success: true }
// Erros: { error: "not_found" }
```

### `reject_friend_request`

```typescript
const { data, error } = await supabase.rpc("reject_friend_request", {
  p_request_id: requestId,
});
// Retorna: { success: true }
// Erros: { error: "not_found" }
```

### `verify_age_and_enable_open_finance`

Verifica a idade do usuário (mínimo 16) e habilita Open Finance.

```typescript
const { data, error } = await supabase.rpc("verify_age_and_enable_open_finance");
// Retorna: { success: true, age: 17 }
// Erros: { error: "birthdate_required" } | { error: "underage", age: 14 }
```

### `create_virtual_card`

Cria um cartão virtual (requer Open Finance habilitado e idade ≥ 16).

```typescript
const { data, error } = await supabase.rpc("create_virtual_card");
// Retorna: { success: true, last4: "4829", card_id: "uuid" }
// Erros: { error: "birthdate_required" } | { error: "underage" } |
//        { error: "open_finance_not_enabled" } | { error: "already_has_card" }
```

### `generate_referral_code`

Gera ou retorna o código de convite do usuário.

```typescript
const { data, error } = await supabase.rpc("generate_referral_code");
// Retorna: { code: "ABC123", created: true }
// Rate limit: máximo 10 códigos/dia
```

### `delete_account`

Exclui a conta e todos os dados associados.

```typescript
const { data, error } = await supabase.rpc("delete_account");
// Retorna: { success: true }
```

## Auth

### `signUp`

```typescript
const { data, error } = await supabase.auth.signUp({
  email: "aluno@escola.gov.br",
  password: "senhaSegura123",
  options: { data: { name: "João" } },
});
```

O trigger `handle_new_user` cria automaticamente:
- `profiles` (com nome e friend_code)
- `wallets` (saldo 0)

### `signIn`

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: "aluno@escola.gov.br",
  password: "senhaSegura123",
});
```

### `signOut`

```typescript
await supabase.auth.signOut();
```

## Breez SDK Spark

A carteira Bitcoin usa o Breez SDK Spark, que roda como WASM no browser.

### Inicialização

```typescript
import { initSparkSDK } from "@/lib/spark";
await initSparkSDK(apiKey);
```

### Operações

| Método | Descrição |
|--------|-----------|
| `getWallet()` | Retorna saldo e endereço Lightning |
| `sendPayment(invoice)` | Envia pagamento via Lightning |
| `receivePayment(amount)` | Gera invoice para receber |
| `getTransactions()` | Lista transações |

> Requer chave de API do Breez. Obtenha gratuitamente em
> [breez.technology](https://breez.technology/request-api-key/).
