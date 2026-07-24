# Arquitetura

## Visão geral

SATQUEST é uma aplicação **single-page** (SPA) construída com React + Vite,
usando Supabase como backend (PostgreSQL + Auth + RPC) e Breez SDK Spark para
integração com a Lightning Network.

```mermaid
graph TB
    subgraph Client["Cliente (Browser)"]
        UI[React SPA]
        AuthCtx[Auth Context]
        Spark[Breez SDK WASM]
        SB[Supabase JS Client]
    end

    subgraph Supabase["Supabase Cloud"]
        PG[(PostgreSQL)]
        Auth[GoTrue Auth]
        RLS[Row Level Security]
        RPC[PL/pgSQL Functions]
    end

    subgraph LN["Lightning Network"]
        Breez[Breez Server]
        Nodes[Lightning Nodes]
    end

    UI --> AuthCtx
    AuthCtx --> SB
    UI --> Spark
    SB --> Auth
    SB --> PG
    PG --> RLS
    PG --> RPC
    Spark --> Breez
    Breez --> Nodes
```

## Camadas

### 1. Frontend (React 19 + Vite 6)

- **Screens**: páginas da aplicação (`Home`, `Wallet`, `Profile`, etc.)
- **Components/UI**: componentes reutilizáveis (`Button`, `Card`, `Input`)
- **Lib**: lógica de negócio, hooks, clientes de API
- **Auth Context**: gerencia sessão e perfil do usuário

### 2. Backend (Supabase)

- **PostgreSQL**: banco de dados relacional com RLS
- **Auth**: autenticação email/senha via GoTrue
- **RPC**: funções PL/pgSQL `SECURITY DEFINER` para operações atômicas
- **Triggers**: auto-provisioning de novos usuários

### 3. Bitcoin (Breez SDK Spark)

- **WASM**: SDK compilado para WebAssembly, roda no browser
- **Non-custodial**: as chaves privadas ficam no dispositivo do usuário
- **Lightning**: pagamentos instantâneos via rede Lightning

## Fluxos principais

### Fluxo de XP

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant R as RPC complete_lesson
    participant DB as PostgreSQL

    U->>F: Completa lição com quiz
    F->>R: rpc.complete_lesson(lesson_id, correct, total)
    R->>DB: INSERT lesson_progress (status=completed)
    R->>DB: INSERT xp_events (amount=reward_xp)
    R->>DB: UPDATE profiles (xp_total, level, streak)
    R->>DB: UPDATE mission_progress (daily_lesson)
    R->>DB: INSERT user_badges (first_lesson, first_sats)
    R-->>F: { sats_earned: 0, xp_earned: 20, perfect: true }
    F-->>U: Mostra animação de XP ganho
```

### Fluxo de carteira

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant S as Spark SDK
    participant LN as Lightning Network

    U->>F: Abre carteira
    F->>S: spark.getWallet()
    S-->>F: Saldo, endereço Lightning
    U->>F: Envia pagamento (invoice/ Lightning address)
    F->>S: spark.sendPayment(invoice)
    S->>LN: Roteia pagamento
    LN-->>S: Pagamento confirmado
    S-->>F: Sucesso
    F-->>U: Atualiza saldo
```

### Fluxo de amigos

```mermaid
sequenceDiagram
    participant A as Usuário A
    participant B as Usuário B
    participant DB as PostgreSQL

    A->>DB: send_friend_request("SAT-XXXXXX")
    DB->>DB: INSERT friend_requests (status=pending)
    B->>DB: Vê solicitação pendente
    B->>DB: accept_friend_request(request_id)
    DB->>DB: UPDATE friend_requests (status=accepted)
    DB->>DB: INSERT friends (A→B, B→A)
    A->>DB: Vê lista de amigos
```

## Decisões arquiteturais

### Por que RPC em vez de CRUD direto?

Operações financeiras (creditar XP, completar lição, resgatar missão) precisam
ser **atômicas** — ou tudo acontece, ou nada. Usar funções `SECURITY DEFINER`
garante que:

1. A operação é transacional
2. O cliente não pode manipular o saldo diretamente
3. Audit logs são registrados automaticamente
4. Rate limits e cooldowns são aplicados no servidor

### Por que RLS em todas as tabelas?

Mesmo com RPC para operações sensíveis, o RLS garante que:

- Um usuário nunca lê dados de outro (exceto perfis, que são públicos)
- Mesmo que um bug no frontend envie uma query errada, o banco bloqueia
- Defense-in-depth: múltiplas camadas de segurança

### Por que Breez SDK Spark?

- **Non-custodial**: o aluno tem controle das chaves
- **WASM**: roda no browser sem backend adicional
- **Lightning**: pagamentos instantâneos e baratos
- **Open source**: mantido pela Breez Technology

## Padrões de código

- **TypeScript strict**: sem `any`, tipos explícitos em todas as funções
- **CSS variables**: theming via custom properties, sem cores hardcoded
- **8px spacing**: grid de espaçamento consistente
- **Functional components**: sem classes, apenas hooks
- **Import discipline**: todo símbolo usado deve ter import correspondente
