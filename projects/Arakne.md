# Arakne

**Hack4Freedom São Paulo 2026**

> "Cada fio, uma mulher. Cada nó, uma confiança."

App de aprendizado de crochê/tecelagem que, sob a superfície, é uma rede de
microcrédito peer-to-peer via Lightning Network para mulheres sem acesso
bancário por controle financeiro coercitivo. O crochê é a superfície visível;
as funcionalidades financeiras são reveladas por gestos ocultos.

---

## Visão Geral

Arakne é um PWA mobile-first que se apresenta como uma plataforma de
aprendizado de crochê — 9 trilhas, 54 aulas e 127 materiais reais. Por baixo
desse disfarce, existe uma rede de microcrédito em Bitcoin/Lightning: a
usuária pode pedir empréstimos (em sats), receber via Pix, pagar dívidas e
trocar crédito por dinheiro em espécie com uma "Fornecedora de Linha" da
própria rede.

O disfarce não é cosmético — é requisito de segurança. O público-alvo são
mulheres sob controle financeiro coercitivo (Afeganistão, Índia, Nordeste do
Brasil, Colômbia). A tela inicial não mostra nenhum símbolo cripto ou
financeiro; a camada financeira só aparece após desenhar o "Ponto Arakne",
um padrão gestual que funciona como senha.

### Identidade de marca

- **Mito:** Aracne foi punida por Atena por tecer a verdade sobre os abusos
  dos deuses. "Aracne foi punida por tecer a verdade; a gente termina o que
  ela começou."
- **Paleta:** imperial blue, dourado, bordô, creme, dusk blue.
- **Tipografia:** Cinzel (wordmark) · Fraunces (headings) · Inter (UI).
- **Vocabulário:** nenhum termo financeiro aparece na interface — nem mesmo
  na camada financeira revelada. "Novelos" = sats, "ateliê" = carteira,
  "fios" = shares, "padrão concluído" = pagamento quitado, "aula de ponto"
  = pedido de ajuda na recuperação social.

---

## Problema

Mulheres sob controle financeiro coercitivo não têm acesso a crédito, conta
bancária própria, ou independência financeira. O agressor controla o
celular, o extrato bancário e qualquer sinal de atividade financeira
autônoma. Soluções de microcrédito tradicionais (Grameen Bank, SACCOs)
exigem presença física e identidade real — impossível para quem precisa
esconder a atividade do agressor.

---

## Solução

1. **Disfarce total:** o app é um catálogo de crochê genuíno, com conteúdo
   real. Nenhuma menção a dinheiro, cripto ou empréstimo na superfície
   visível.
2. **Acesso por aval social:** uma mulher indica outra (voucher). Sem
   identidade real — só PIN + identificador opaco + chave Nostr.
3. **Microcrédito em sats via Lightning:** empréstimo instantâneo, sem
   banco, sem KYC. A dívida é em sats; o repagamento pode ser via Pix.
4. **Camada de gasto via Pix:** a usuária converte sats em BRL e paga
   contas, ou recebe depósitos via QR Pix.
5. **Ponto de Troca presencial:** uma "Fornecedora de Linha" da rede
   converte crédito da usuária em dinheiro em espécie, fora do app — para
   quem não pode usar Pix com segurança.
6. **Recuperação social:** se a usuária perde o aparelho ou esquece o
   padrão, suas "tecelãs de confiança" a ajudam a recuperar a conta via
   Shamir's Secret Sharing + gift-wrap Nostr (NIP-59).

### Fluxo financeiro completo

1. Usuária pede empréstimo (em sats) → Lightning (Coinos) entrega.
2. Usuária usa o dinheiro no mundo real (saque via Binance para BRL, ou
   troca presencial com Fornecedora de Linha).
3. Usuária repaga via Pix Cobrança (Mercado Pago).
4. O BRL do repagamento é convertido de volta em sats (Binance) e retorna
   ao pool — o fundo não empobrece a cada empréstimo.
5. Ao quitar, a usuária sobe de tier e pode indicar outras mulheres.

---

## Stack de Tecnologia

### Arquitetura

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (React 18 + Vite + TypeScript)                  │
│  Máquina de estados (23 views, sem React Router)          │
│  PWA mobile-first · Tailwind · shadcn/ui                  │
│  Porta 5173 (dev) / Vercel (prod)                          │
├──────────────────────────────────────────────────────────┤
│  Backend (FastAPI + SQLAlchemy + SQLite)                   │
│  10 routers · 18 models · 139 testes (pytest)             │
│  Porta 8000 (dev) / Railway (prod)                         │
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
| Breez SDK | `@breeztech/breez-sdk-spark/web` (carteira não-custodial) |
| Deploy | Vercel (`vercel.json` com SPA rewrites) |

### Nostr — identidade, criptografia e recuperação social

O Arakne usa o protocolo **Nostr** como camada de identidade e comunicação
criptografada para a recuperação social de conta. Não usamos Nostr como rede
social — só as primitivas criptográficas e de transporte.

- **Chaves em vez de contas:** a identidade da usuária é um par de chaves
  secp256k1 (nsec/npub), gerado localmente, sem registro em servidor.
- **Relays descentralizados:** mensagens gift-wrapped persistem em relays
  públicos; não há servidor da Arakne no caminho da recuperação.
- **Criptografia ponta-a-ponta:** NIP-44 (chave de sessão efêmera +
  AES-GCM) garante que só o destinatário lê o conteúdo.
- O nsec **nunca sai do dispositivo em plaintext** — fica criptografado em
  `localStorage` com AES-GCM-256, chave derivada do Ponto Arakne via PBKDF2
  (600k iterações).

**Gift-wrap NIP-59:** cria camada tripla de privacidade — Rumor (kind 1,
não assinado) → Seal (kind 13, NIP-44, assinado pelo remetente) → Wrap
(kind 1059, chave efêmera aleatória). O relay só vê o wrap com pubkey
efêmera — não sabe quem enviou, nem quem recebeu, nem o conteúdo.

### Breez SDK — carteira Lightning não-custodial

A carteira individual da usuária é **não-custodial de verdade** (Breez SDK
Spark, rodando no navegador via WASM). A chave/seed nunca sai do
dispositório. Isso é estrutural, não convenção: diferencia a camada
individual do pool, que **é** custodial de propósito (cooperativa de
crédito via Coinos no backend). A seed Breez deriva dos mesmos 32 bytes do
nsec (reinterpretados como entropia BIP-39 via `entropyToMnemonic()`) —
não usa NIP-06 (marcado `unrecommended`).

### Custódia — reserva fria multisig

Gerador offline (`scripts/gerar_multisig.py`, via `embit`), 2-de-3, sem
precisar de nó Bitcoin rodando. Referência pública: `GET /custodia/reserva-fria`
(nunca expõe chave privada).

---

## Equipe

Projeto do hackathon Hack4Freedom São Paulo 2026 (equipe só de mulheres).

- **Jhulia Carvalho** — Arquitetura; business model; rail de pagamento Pix;
  fluxo financeiro; integração fiat/bitcoin.
- **Dilaine Oliveira** — Frontend; identificações Nostr; Recuperação; UX
  design; trilhas de aprendizado; implementação dos mecanismos de segurança
  e Ponto Arakne.

---

## Repositório e Links

- **Repositório (código):** https://github.com/jhuliaah/Arakne.git
- **Repositório de apresentação (código limpo):** https://github.com/jhuliaah/Arakne_apresentacao
- **Demo ao vivo (deploy):** https://arakne-coral.vercel.app/
- **Deploy frontend:** Vercel (`vercel.json` incluído)
- **Deploy backend:** Railway (configurar env vars no painel)

> O repositório principal (`Arakne`) é a fonte de desenvolvimento e o que a
> Vercel deploya na URL de demo. O repositório de apresentação
> (`Arakne_apresentacao`) é a cópia limpa (sem patches, logs e artefatos de
> dev) usada para apresentação.

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
| Breez SDK (carteira não-custodial) | ✅ (tipagem corrigida) |
| Demo automatizada (run_demo.py) | ✅ |
| Modo mock completo (--mock no dev-up.sh) | ✅ |
| Deploy Vercel (vercel.json + VITE_API_URL) | ✅ |
| 139 testes pytest (backend) | ✅ |

### Como rodar (modo mock — zero credenciais)

```bash
git clone git@github.com:jhuliaah/Arakne_apresentacao.git
cd Arakne_apresentacao
bash scripts/dev-up.sh --mock
```

O script cria venv, instala deps, troca `.env` por `.env.mock`, roda o seed
(cria FUNDADORA + FORNECEDORA + 9 trilhas/54 aulas/127 materiais) e sobe
backend (:8000) + frontend (:5173). Em **Ctrl+C**, encerra tudo e restaura
o `.env` original. Nenhuma chamada externa é feita.

| Verificação | Como |
|---|---|
| Backend no ar | `curl http://localhost:8000/health` → `{"status":"ok"}` |
| Frontend carregando | Abrir `http://localhost:5173` |
| Seed correu | `cd backend && python seed_demo.py` lista FUNDADORA + FORNECEDORA |
| Demo automatizada | `cd backend && python run_demo.py` (< 10s, mock) |
| Testes backend | `cd backend && pytest` (139 testes) |

### Credenciais demo

| Usuária | Identificador | PIN | Tier | Descrição |
|---|---|---|---|---|
| Fundadora | `FUNDADORA` | `1234` | 3 | Mestra, pode convidar |
| Fornecedora | `FORNECEDORA` | `1234` | 3 | Mestra, ponto de troca |
| Convidada | (criada na demo) | — | 1 | Nasce pelo link de convite |

Acesse `http://localhost:5173/demo-setup` para conectar o navegador à conta
Fundadora. Use `http://localhost:5173/convite/FUNDADORA_INVITE` para criar
uma convidada.

### Glossário — equivalência dos termos financeiros ↔ termos de tecelagem

O app usa vocabulário têxtil em toda a UI. **Nenhum termo financeiro
aparece para a usuária.**

| Conceito real (backend/API) | Termo na interface (crochê) |
|---|---|
| Saldo (sats) | Material disponível / cesta de novelos |
| Depósito | Repor material / receber novelos |
| Saque / pagamento | Usar material / entregar novelos |
| Empréstimo (pedido) | Novo kit / puxar novelos |
| Extrato | Registro |
| Dívida em aberto | Kit em aberto / padrão em andamento |
| Pagamento quitado | Padrão concluído |
| Pedido de vouch (aval) | Fio puxado |
| Avalista | Tecelã de confiança |
| Notificação de ajuda | "Aula de ponto" / sino 🎀 |
| Ponto de troca (câmbio) | Fornecedora de Linha |
| Tier (nível de crédito) | Nível da bancada |
| Saldo devedor | Padrão em andamento |
| Carteira | Cesta de novelos |
| Identificador | Código do ateliê |
| PIN | Código de reserva |
| Shares SSSS | Fios de sustentação |
| Recuperação social | Reatar fios |
| Travamento (lockout) | "A aranha está tecendo..." |
| Conversão BRL→sats | (invisível — acontece no backend) |
| Pool (fundo) | Ateliê central |
| Repagamento | Devolver novelos |

### Fluxo de telas e navegação

**Onboarding (aparelho novo):**
```
Splash → CreateAccount (PIN + apelido opcional)
       → RecoverySetup (distribuir shares SSSS)
       → Catalog (trilhas de crochê)
```

**Login (aparelho com conta):**
```
PatternLogin (desenhar Ponto Arakne) → Catalog
```

**Portal disfarçado:**
```
Trilha 9 → Nível 1 → Aula 1 ("Ponto Renascido")
        → HexPatternCanvas (desenhar padrão correto)
        → FinancialPage revelada ("Seu ateliê")
```

**FinancialPage ("Seu ateliê"):** card de nível (tier) e saldo devedor
("padrão em andamento"); cesta de novelos (carteira) com saldo em sats +
conversão BRL; botões "Puxar novelos" (empréstimo), "Receber novelos"
(depósito), "Entregar novelos" (pagamento Pix), "Devolver novelos"
(repagamento); Fornecedoras de Linha (pontos de troca); Tecelã de
confiança (avalista de recuperação); sino 🎀 (notificações de recuperação
social).

**Recuperação de conta:**
```
Splash → "Recuperar acesso" → "Tenho meu PIN" (identificador + PIN)
       → Fallback: gera nova identidade Nostr, vincula ao backend
       → Novo Ponto Arakne → Catalog
```

**Convite (link de indicação):**
```
/convite/FUNDADORA_INVITE → InviteDecision
                          → Aceitar → CreateAccount (nasce tier 1)
```

### Roteiro da demo (passo a passo, ~10 min)

1. **O disfarce** (2 min): abrir `http://localhost:5173`, navegar pelas 9
   trilhas. Nenhuma menção a dinheiro.
2. **Conectar a conta**: abrir `/demo-setup` (campos preenchidos com
   `FUNDADORA`/`1234`) → "Conectar a esta conta" → "Ir para o app".
3. **O portal** (2 min): trilha 9 → nível 1 → aula 1 → desenhar o Ponto
   Arakne (`0 → 1 → 2 → 3 → 4 → 5`, horário do topo) → FinancialPage
   revelada.
4. **FinancialPage** (2 min): ver card de nível, cesta de novelos, botões.
5. **Microcrédito** (1 min): "Puxar novelos" → valor em sats → empréstimo
   criado (mock).
6. **Repagamento** (2 min): "Devolver novelos" → QR Pix (mock, confirmação
   automática) → saldo devedor zera + tier sobe.
7. **Cesta de novelos** (1 min): "Receber novelos" → QR Pix para depósito;
   "Entregar novelos" → chave Pix + valor.
8. **Ponto de Troca** (1 min): ver "Fornecedoras de Linha" (FORNECEDORA
   aparece como ponto disponível).
9. **Recuperação** (2 min): sair (sem apagar identidade) → "Recuperar
   acesso" → "Tenho meu PIN" → `FUNDADORA`/`1234` → novo Ponto Arakne →
   conta recuperada.
10. **Convite**: abrir `/convite/FUNDADORA_INVITE` (outra aba) → criar
    convidada (nasce tier 1).

### Ponto Arakne (padrão da demo)

6 vértices do primeiro hexágono, no sentido horário, começando do topo:
`0 → 1 → 2 → 3 → 4 → 5`. Necessário para entrar no app após recarregar a
página (quando a sessão expira). Em registro (novo padrão), mínimo de 8
pontos.

### Motor de crédito

| Tier | Requisito | Limite (sats) |
|---|---|---|
| 0 | Sem crédito | 0 |
| 1 | 1 aval (indicação) | 5.000 |
| 2 | Tier 1 quitado | 15.000 |
| 3 | Tier 2 quitado + indicação | 40.000 |

- Atraso > 14 dias → `tier_congelado` (especificado, scheduler pendente).
- Completar padrões de crochê não libera crédito.
- Nunca reduz tier retroativamente.

---

## Próximos Passos

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
| Carteira da usuária | Breez SDK (avaliado) | Não-custodial de verdade |
| Repagamento | Pix (Mercado Pago) | + PJ com nome comercial dedicado |
| Proteção cambial | Não implementada | Denominação em moeda local + buffer 30-50% |
| Juros | Não implementado | Juros flutuantes com base na Selic, spread pra baixo |
| Multi-moeda | Campo `pais` faz gate | Rails por país (M-Pesa, UPI, etc.) |
| Camada de investimento | Wireframes | Staking do pool (pendente validação jurídica) |
| Governança do fundo | Não implementada | Multisig com stewards reais |

### Roadmap financeiro — gestão de risco e fundo de investimento

**Gestão de risco:**

- **Atraso automatizado:** job periódico que verifica empréstimos vencidos
  há mais de 14 dias e congela o tier da mutuária e da avalista.
- **Voucher com trava em sats:** avalista em tier ≥ 2 paga 500 sats fixos
  para liberar o link de indicação. A trava só é devolvida quando a
  avalizada quita o primeiro empréstimo — não quando o pega. Alinha
  incentivos: a avalista só indica quem confia de verdade.
- **Proteção cambial do empréstimo:** denominar a dívida em moeda local
  (ex: BRL) com cotação travada no momento do empréstimo. O fundo absorve
  a diferença cambial — se o BTC subiu, a mutuária paga o mesmo valor em
  BRL; se caiu, o fundo absorve o prejuízo. Requer buffer de 30-50% do
  fundo total como reserva cambial.
- **Juros flutuantes com base na Selic:** spread pra baixo (a mutuária
  paga menos que a taxa de mercado). O juro flutua com a taxa básica do
  país, para que o fundo se mantenha sustentável em diferentes ciclos
  econômicos.

**Fundo de investimento (capitalização do pool):**

- Cotistas investem capital no pool via posições de staking (linguagem
  DeFi — "posição", não "cota" — mas a substância regulatória é próxima de
  um FIDC brasileiro, pendência jurídica real).
- O principal investido nunca é sacado — fica travado no pool como capital
  de base. O cotista só recebe o lucro, se houver, distribuído por ciclo
  mensal (estilo Curve/GMX).
- O cotista não tem acesso ao app de crochê — público diferente
  (investidoras, não mutuárias), com interface própria, sem disfarce
  têxtil, e PJ separada.
- Arquitetura prevê tabela `posicao_staking` no mesmo backend, não um
  token — o sistema roda em Bitcoin/Lightning, não numa chain com contrato
  inteligente.

**Segundo app (capitalização aberta):** para escalar a capitalização do
pool sem expor as mutuárias, o roadmap prevê um segundo app, mais aberto,
que puxa do mesmo fundo — aberto (sem disfarce), voltado para
investidoras, conectado ao mesmo backend e ao mesmo pool Lightning, mas
com interface própria de investimento/staking. A separação de apps protege
o disfarce: o agressor que encontra o app de investimento não consegue
rastrear a mutuária, e vice-versa.

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
