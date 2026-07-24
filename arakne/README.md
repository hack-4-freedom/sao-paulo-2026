# Arakne

> "Cada fio, uma mulher. Cada nó, uma confiança."

App de aprendizado de crochê/tecelagem que, sob a superfície, é uma rede de
microcrédito peer-to-peer via Lightning Network para mulheres sem acesso
bancário por controle financeiro coercitivo. O crochê é a superfície visível;
as funcionalidades financeiras são reveladas por gestos ocultos.

Projeto do hackathon **Hack4Freedom São Paulo 2026** (só mulheres).

---

## Visão Geral

Arakne é um app mobile-first que se apresenta como uma plataforma de
aprendizado de crochê — com 9 trilhas, 54 aulas e 127 materiais reais. Por
baixo desse disfarce, existe uma rede de microcrédito em Bitcoin/Lightning:
a usuária pode pedir empréstimos (em sats), receber via Pix, pagar dívidas,
e trocar crédito por dinheiro presencial com uma "Fornecedora de Linha"
da própria rede.

O disfarce não é cosmético — é requisito de segurança. O público-alvo são
mulheres sob controle financeiro coercitivo (Afeganistão, Índia, Nordeste
do Brasil, Colômbia). A tela inicial não mostra nenhum símbolo cripto ou
financeiro; a camada financeira só aparece após desenhar o "Ponto Arakne",
um padrão gestual que funciona como senha.

---

## Problema

Mulheres sob controle financeiro coercitivo não têm acesso a crédito,
conta bancária própria, ou independência financeira. O agressor controla
o celular, o extrato bancário, e qualquer sinal de atividade financeira
autônoma. Soluções de microcrédito tradicionais (Grameen Bank, SACCOs)
exigem presença física e identidade real — impossível para quem precisa
esconder a atividade do agressor.

---

## Solução

1. **Disfarce total:** o app é um catálogo de crochê genuíno. Nenhuma
   menção a dinheiro, cripto, ou empréstimo na superfície visível.
2. **Acesso por aval social:** uma mulher indica outra (voucher). Sem
   identidade real — só PIN + identificador opaco + chave Nostr.
3. **Microcrédito em sats via Lightning:** empréstimo instantâneo, sem
   banco, sem KYC. A dívida é em sats; o repagamento pode ser via Pix.
4. **Camada de gasto via Pix:** a usuária converte sats em BRL e paga
   contas, ou recebe depósitos via QR Pix.
5. **Ponto de Troca presencial:** uma "Fornecedora de Linha" da rede
   converte crédito da usuária em dinheiro em espécie, fora do app —
   para quem não pode usar Pix com segurança.
6. **Recuperação social:** se a usuária perde o aparelho ou esquece o
   padrão, suas "tecelãs de confiança" a ajudam a recuperar a conta via
   Shamir's Secret Sharing + gift-wrap Nostr (NIP-59).

---

## Stack de Tecnologia

### Arquitetura

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (React 18 + Vite + TypeScript)                  │
│  Máquina de estados (23 views, sem React Router)          │
│  PWA mobile-first · Tailwind · shadcn/ui                  │
│  Porta 5173 (dev) / Vercel (prod)                         │
├──────────────────────────────────────────────────────────┤
│  Backend (FastAPI + SQLAlchemy + SQLite)                   │
│  10 routers · 18 models · 139 testes (pytest)             │
│  Porta 8000 (dev) / Railway (prod)                        │
├──────────────────────────────────────────────────────────┤
│  Serviços externos (todos com fallback mock)              │
│  Coinos (Lightning) · Mercado Pago (Pix) · Binance (BRL)  │
│  embit (multisig offline) · Breez SDK (carteira mobile)   │
└──────────────────────────────────────────────────────────┘
```

### Backend — `backend/` (FastAPI + Python 3.12+)

| Camada | Tecnologia | Estado |
|---|---|---|
| API REST | FastAPI + Pydantic | ✅ 10 routers operacionais |
| Banco | SQLite via SQLAlchemy | ✅ `Base.metadata.create_all()` (sem Alembic) |
| Lightning (pool) | Coinos API (coinos.io) | ✅ integrado, fallback mock |
| Lightning (empréstimo) | Coinos API | ✅ integrado, fallback mock |
| Pix (repagamento) | Mercado Pago Checkout Transparente | ✅ real + mock |
| Pix (depósito carteira) | Mercado Pago + polling ativo | ✅ real + mock |
| Conversão BRL→sats | Binance API | ✅ código completo, fallback mock |
| Custódia fria | embit (multisig 2-de-3) | ✅ script offline funcional |
| Motor de risco | `services/risco.py` (4 tiers) | ✅ implementado e testado |
| Recuperação social | SSSS T=2 N=2 + NIP-59 | ✅ implementado |

### Frontend — `frontend/` (React 18 + Vite + TypeScript)

| Camada | Tecnologia |
|---|---|
| Framework | React 18 (sem React Router — máquina de estados manual) |
| Build | Vite 8 + TypeScript |
| Estilo | CSS custom + Cinzel/Fraunces/Inter (Google Fonts via @fontsource) |
| QR Code | `qrcode` (geração) + `jsqr` (leitura via câmera) |
| Cripto Nostr | `nostr-tools` (nsec/npub, gift-wrap NIP-59, NIP-44) |
| SSSS | `shamir-secret-sharing` (auditada por Cure53 e Zellic) |
| Cripto do padrão | WebCrypto nativo (AES-GCM-256 + PBKDF2 600k iterações) |
| Breez SDK | `@breeztech/breez-sdk-spark/web` (carteira não-custoidal) |
| Deploy | Vercel (`vercel.json` com SPA rewrites) |

### Docker (opcional, stack completa)

`docker-compose.yml` sobe Bitcoin Core (regtest) + LND + LNbits + backend
+ frontend. Para a demo, o modo mock dispensa Docker — basta o script
`dev-up.sh --mock`.

---

## Fluxos de Tela (Frontend)

### Onboarding (aparelho novo)

```
Splash → CreateAccount (PIN + apelido opcional)
       → RecoverySetup (distribuir shares SSSS)
       → Catalog (trilhas de crochê)
```

### Login (aparelho com conta)

```
PatternLogin (desenhar Ponto Arakne) → Catalog
```

### Portal disfarçado

```
Trilha 9 → Nível 1 → Aula 1 ("Ponto Renascido")
         → HexPatternCanvas (desenhar padrão correto)
         → FinancialPage revelada
```

### FinancialPage ("Seu ateliê")

- Card de nível (tier) e saldo devedor ("padrão em andamento")
- Cesta de novelos (carteira): saldo em sats + conversão BRL
- Botões: "Puxar novelos" (empréstimo), "Receber novelos" (depósito),
  "Entregar novelos" (pagamento Pix), "Devolver novelos" (repagamento)
- Fornecedoras de Linha (pontos de troca)
- Tecelã de confiança (avalista de recuperação)
- Sino 🎀 (notificações de pedidos de recuperação social)

### Recuperação de conta

```
Splash → "Recuperar acesso"
       → "Tenho meu PIN" (identificador + PIN)
       → Fallback: gera nova identidade Nostr, vincula ao backend
       → Novo Ponto Arakne → Catalog
```

### Convite (link de indicação)

```
/convite/FUNDADORA_INVITE → InviteDecision
                          → Aceitar → CreateAccount (nasce tier 1)
```

---

## Segredos e Variáveis de Ambiente

O projeto tem **3 modos de operação**:

### Modo Mock (demo, zero credenciais)

```bash
bash scripts/dev-up.sh --mock
```

O script troca `.env` por `.env.mock` (todos os campos vazios), roda o
seed, sobe tudo. Ao encerrar (Ctrl+C), restaura o `.env` real. Nenhuma
chamada externa é feita — Coinos, Pix e Binance caem em mock automaticamente.

### Variáveis do backend (`.env`)

| Variável | Descrição | Vazio = |
|---|---|---|
| `COINOS_URL` | URL da API Coinos | default `https://coinos.io/api` |
| `COINOS_POOL_TOKEN` | JWT da conta-pool no Coinos | mock (sem Lightning real) |
| `MP_ACCESS_TOKEN` | Token Mercado Pago (Pix) | mock (sem PSP real) |
| `MP_WEBHOOK_URL` | URL pública para webhook do MP | polling manual |
| `PIX_NOME_RECEBEDOR` | Nome comercial no Pix | default cosmetic |
| `BINANCE_API_KEY` | API key Binance | mock (sem compra/saque) |
| `BINANCE_API_SECRET` | Secret Binance | mock |
| `MULTISIG_DESCRIPTOR` | Descriptor multisig 2-de-3 | endpoint informa "não configurado" |
| `MULTISIG_ENDERECO` | Endereço da reserva fria | idem |
| `MULTISIG_QUORUM` | Quórum (ex: `2-de-3`) | `2-de-3` |
| `MULTISIG_NETWORK` | Rede Bitcoin (`mainnet`/`regtest`) | `regtest` |

### Variáveis do frontend (`frontend/.env`)

| Variável | Descrição |
|---|---|
| `VITE_BREEZ_API_KEY` | Chave do Breez SDK (carteira não-custodial) |
| `VITE_API_URL` | URL do backend em prod (ex: Railway). Sem ela, usa `/api` (proxy vite) |

---

## Público-Alvo

Mulheres sem acesso bancário por controle financeiro coercitivo:

- **Afeganistão** — mulheres proibidas de ter conta bancária
- **Índia** — dote/controle familiar sobre finanças da mulher
- **Nordeste do Brasil** — dependência financeira em relações abusivas
- **Colômbia** — deslocadas internas sem documentação bancária

O disfarce de crochê é a proteção: o agressor que olha o celular vê um
app de artesanato. A camada financeira só aparece com o gesto secreto.

---

## Identidade de Marca

- **Mitof:** Aracne foi punida por Atena por tecer a verdade sobre os
  abusos dos deuses. "Aracne foi punida por tecer a verdade; a gente
  termina o que ela começou."
- **Paleta:** imperial blue, dourado, bordô, creme, dusk blue
- **Tipografia:** Cinzel (wordmark) · Fraunces (headings) · Inter (UI)
- **Vocabulário:** nenhum termo financeiro na UI. "Novelos" = sats,
  "ateliê" = carteira, "fios" = shares, "padrão concluído" = pagamento
  quitado, "aula de ponto" = pedido de ajuda na recuperação social.

---

## Motor de Crédito

| Tier | Requisito | Limite (sats) |
|---|---|---|
| 0 | Sem crédito | 0 |
| 1 | 1 aval (indicação) | 5.000 |
| 2 | Tier 1 quitado | 15.000 |
| 3 | Tier 2 quitado + indicação | 40.000 |

- Atraso > 14 dias → `tier_congelado` (especificado, scheduler pendente)
- Completar padrões de crochê não libera crédito
- Nunca reduz tier retroativamente

---

## Equipe

Projeto do hackathon Hack4Freedom São Paulo 2026 (equipe só de mulheres).

---

## Repositório e Links

- **Repo principal:** github.com/jhuliaah/Arakne
- **Deploy frontend:** Vercel (`vercel.json` incluído)
- **Deploy backend:** Railway (configurar env vars no painel)

---

## Como Rodar

### Demo em modo mock (recomendado para avaliadores)

```bash
bash scripts/dev-up.sh --mock
```

Isso sobe backend (:8000) + frontend (:5173) com zero credenciais reais.
Ao encerrar (Ctrl+C), o `.env` original é restaurado.

### Desenvolvimento local (com credenciais reais)

```bash
bash scripts/dev-up.sh --all   # seed + multisig + tunnel + sobe tudo
```

Ou manualmente:

```bash
# Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python seed_demo.py
uvicorn app.main:app --port 8000 --reload --reload-exclude "*.db"

# Frontend
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### Credenciais demo

| Usuária | Identificador | PIN | Tier |
|---|---|---|---|
| Fundadora | `FUNDADORA` | `1234` | 3 |
| Fornecedora | `FORNECEDORA` | `1234` | 3 |
| Convidada | (criada na demo) | — | 1 |

Acesse `http://localhost:5173/demo-setup` para conectar o navegador à
conta Fundadora. Use `http://localhost:5173/convite/FUNDADORA_INVITE`
para criar uma convidada.

### Verificação rápida

| Verificação | Como |
|---|---|
| Backend no ar | `curl http://localhost:8000/health` |
| Frontend carregando | Abrir `http://localhost:5173` |
| Seed criou mestras | `python seed_demo.py` lista FUNDADORA + FORNECEDORA |
| Demo automatizada | `cd backend && python run_demo.py` (< 10s, mock) |
| Testes backend | `cd backend && pytest` (139 testes) |

---

## Status

### Arquitetura implementada e funcional

| Componente | Estado |
|---|---|
| Catálogo de crochê (9 trilhas, 54 aulas, 127 materiais) | ✅ |
| Portal disfarçado (trilha 9 → Ponto Arakne) | ✅ |
| FinancialPage (saldo, empréstimo, carteira, trocas) | ✅ |
| Motor de crédito (4 tiers, aval social) | ✅ |
| Empréstimo Lightning (Coinos) | ✅ |
| Repagamento via Pix (Mercado Pago) | ✅ |
| Depósito via Pix + polling ativo (sem webhook) | ✅ |
| Carteira interna (ledger TransacaoCarteira) | ✅ |
| Ponto de Troca (aprovação/recusa, reputação) | ✅ |
| Identidade Nostr (nsec direto, AES-GCM + PBKDF2) | ✅ |
| Recuperação social (SSSS T=2 N=2 + NIP-59 gift-wrap) | ✅ |
| Recuperação por PIN (fallback sem SSSS) | ✅ |
| Travamento após 8 tentativas (backoff exponencial) | ✅ |
| Custódia multisig 2-de-3 (script offline embit) | ✅ |
| Conversão BRL→sats (Binance API) | ✅ (código completo) |
| Breez SDK (carteira não-custoidal) | ✅ (tipagem corrigida) |
| Demo automatizada (run_demo.py) | ✅ |
| Modo mock completo (--mock no dev-up.sh) | ✅ |
| Deploy Vercel (vercel.json + VITE_API_URL) | ✅ |
| 139 testes pytest (backend) | ✅ |

---

## Próximos Passos (Roadmap)

### Pendências funcionais

| Item | Prioridade | Descrição |
|---|---|---|
| Scheduler de atraso | Alta | `ao_atrasar()` existe mas não é chamada — sem cron/job no repo |
| Webhook de depósito de carteira | Alta | Depósito confirma via polling, mas webhook próprio ainda falta |
| Proteção cambial do empréstimo | Alta | `valor_sats` e `valor_brl` são independentes — sem trava automática |
| Voucher com trava em sats | Média | Especificado (500 sats fixos, devolvidos na quitação), zero código |
| Boleto como canal alternativo | Média | Especificado, sem parser/gerador no repo |
| Liquidação Lightning do Ponto de Troca | Média | Confirmar/recusar funciona; mover sats entre carteiras não |
| QR único para Ponto de Troca | Média | Hoje usa identificador em texto |
| `vender_btc_mercado()` desconectado | Alta | Função pronta mas não chamada por `/carteira/pagar` |

### Arquitetura-alvo (pós-hackathon)

| Mecanismo | MVP hoje | Alvo |
|---|---|---|
| Custódia Lightning | Coinos (hospedado) | Nó próprio, mainnet |
| Custódia fria | Script demo | Stewards reais, rotação de chaves |
| Carteira da usuária | Breez SDK (avaliado) | Non-custodial de verdade |
| Repagamento | Pix (Mercado Pago) | + PJ com nome comercial dedicado |
| Proteção cambial | Não implementada | Denominação em moeda local + buffer 30-50% |
| Juros | Não implementado | Juros flutuantes com base na Selic, spread pra baixo |
| Multi-moeda | Campo `pais` faz gate | Rails por país (M-Pesa, UPI, etc.) |
| Camada de investimento | Wireframes | Staking do pool (pendente validação jurídica) |
| Governança do fundo | Não implementada | Multisig com stewards reais |

### Inconsistências conhecidas

1. `ao_atrasar()` existe e está correta, mas não é chamada — atraso sem
   efeito automático.
2. Ledger de carteira (`TransacaoCarteira`) e saldo de gasto são duas
   fontes não reconciliadas (parcialmente mitigado pelo polling ativo).
3. `vender_btc_mercado()` pronta mas não chamada por `/carteira/pagar`.
4. Modelos órfãos (`Padrao`, `ProgressoPadrao`) — design de disfarce
   anterior, superado por `Trilha`/`Aula`/`Material`.

---

## Licença

Projeto de hackathon. Todos os direitos reservados às autoras.
