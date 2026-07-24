# Elas Recebem Hoje

**Hack4Freedom São Paulo 2026**

---

## Visão Geral

Elas Recebem Hoje é uma plataforma de antecipação de recebíveis para mulheres freelancers e prestadoras de serviço.

A solução permite que uma profissional transforme um pagamento futuro confirmado por seu cliente em uma pool de financiamento em Bitcoin. Pessoas interessadas podem aportar nessa pool e ajudar a prestadora a receber antes do vencimento.

O projeto também funciona como a primeira implementação de referência do **Lightning Receivables Protocol — LRP**, um protocolo experimental para representar recebíveis, validações, autorizações de pagamento e pools por meio de eventos assinados no Nostr.

---

## Problema

Mulheres freelancers e prestadoras de serviço frequentemente precisam esperar semanas ou meses para receber por trabalhos já realizados.

Essa espera pode causar:

- Falta de capital para despesas imediatas;
- Dificuldade para iniciar novos projetos;
- Dependência de bancos e empresas de antecipação;
- Taxas elevadas;
- Processos burocráticos;
- Falta de acesso a crédito;
- Dificuldade para receber pagamentos internacionais.

Ao mesmo tempo, pessoas que desejam financiar profissionais ou apoiar negócios reais não possuem uma forma aberta, verificável e global de participar dessas operações.

---

## Solução

A prestadora cadastra um recebível e assina sua criação utilizando sua identidade Nostr.

A plataforma gera um link privado para o pagador confirmar:

- Que o serviço ou pagamento existe;
- O valor do recebível;
- A data de vencimento;
- O aceite do pagamento em Bitcoin.

O pagador conecta uma carteira compatível com **Nostr Wallet Connect — NWC**, autorizando previamente o pagamento no vencimento.

Depois disso, a plataforma valida o recebível e publica eventos assinados que comprovam:

- A confirmação do pagador;
- A decisão de aprovação;
- A existência de uma autorização NWC ativa.

Com o recebível aprovado, a prestadora revisa os termos e assina a criação da pool.

A pool pode então ser compartilhada com pessoas interessadas em aportar Bitcoin e antecipar o pagamento da profissional.

---

## Como Funciona

1. A prestadora entra utilizando sua identidade Nostr.
2. Cadastra e assina um recebível.
3. A plataforma gera um link de confirmação.
4. O pagador acessa o link e confirma as informações.
5. O pagador conecta sua carteira via NWC.
6. A plataforma valida o recebível.
7. A prestadora revisa e assina os termos da pool.
8. A pool é publicada e pode ser compartilhada.
9. Aportadores poderão financiar a pool utilizando Bitcoin.
10. No vencimento, o pagamento deverá ser liquidado e distribuído entre os participantes.

---

## Protocolo LRP

O projeto utiliza o **Lightning Receivables Protocol — LRP**, criado durante o hackathon.

O LRP organiza o fluxo utilizando eventos públicos assinados:

- `ReceivableCreated` — criação do recebível;
- `PayerCommitmentProof` — confirmação do pagador;
- `ClientValidationDecision` — decisão da plataforma;
- `NwcAuthorizationAttestation` — comprovação da autorização NWC;
- `PoolCreated` — criação da pool;
- `PoolTransition` — mudanças de estado da pool.

Documentos, contratos, dados pessoais, conexões NWC e informações privadas não são publicados no Nostr. Somente informações públicas mínimas e hashes das evidências são utilizados.

---

## Stack de Tecnologia

### Aplicação

- Next.js;
- TypeScript;
- React;
- Vercel;
- PostgreSQL;
- Supabase;
- Drizzle ORM.

### Bitcoin e Lightning

- Bitcoin;
- Lightning Network;
- Nostr Wallet Connect — NIP-47;
- Coinos como carteira NWC utilizada nos testes;
- DLC planejado para aportes sem custódia.

### Nostr

- NIP-01 para eventos, assinaturas e publicação em relays;
- NIP-07 para login e assinatura pelo navegador;
- Evento inspirado no NIP-98 para desafios de autenticação;
- Relays Nostr configuráveis;
- Kinds experimentais do protocolo LRP.

### Segurança e privacidade

- Assinaturas criptográficas Nostr;
- Hash SHA-256 das evidências privadas;
- Conexões NWC cifradas com AES-256-GCM;
- Tokens privados para confirmação do pagador;
- Separação entre dados públicos no Nostr e dados privados no PostgreSQL;
- Idempotência e registro de tentativas de publicação.

---

## Arquitetura

A arquitetura separa dois tipos de informação:

### Estado público

Publicado e verificável em relays Nostr:

- Recebível;
- Confirmação;
- Decisão;
- Autorização NWC;
- Pool;
- Transições da operação.

### Estado privado

Armazenado no PostgreSQL/Supabase:

- Documentos;
- Identidade e consentimentos;
- Dados do pagador;
- Limite de crédito;
- Relatórios de validação;
- URI e secret NWC cifrados;
- Estados operacionais;
- Auditoria.

---

## Diferenciais

- Identidade e eventos portáveis por meio do Nostr;
- A prestadora mantém controle sobre suas assinaturas;
- A plataforma nunca solicita a chave privada `nsec`;
- Confirmação direta do pagador;
- Autorização de pagamento via NWC;
- Dados privados não são publicados nos relays;
- Pools compartilháveis;
- Possibilidade futura de aportes sem custódia com DLC;
- Estrutura aberta para diferentes plataformas utilizarem o LRP.

---

## Membros da Equipe

### Larissa Barros

- Idealização do projeto;
- Produto;
- Pesquisa;
- Growth;
- UX;
- Desenvolvimento;
- Arquitetura do protocolo LRP.

## Membros da Equipe

- Larissa Barros
- Zambia Firmo
- Adrielly

---

## Links

### Repositório no GitHub

https://github.com/0xlari/hackthon4freedom

### Demo 

https://hackthon4freedom.vercel.app/

### Apresentação

https://docs.google.com/presentation/d/1zNSa0EbVbzs2JxTX4fVNyew-t-a_g2ry/edit

## Status Atual

O MVP possui um fluxo funcional de ponta a ponta para:

- Login com Nostr;
- Criação do recebível;
- Assinatura do recebível pela prestadora;
- Publicação em relays Nostr;
- Geração do link de confirmação;
- Confirmação pelo pagador;
- Conexão de carteira via NWC;
- Validação do recebível;
- Publicação dos eventos do originador;
- Revisão dos termos da pool;
- Assinatura e publicação da pool.

A autorização NWC é validada e armazenada de forma cifrada. No modo atual de demonstração, a execução real do pagamento permanece desativada.

Os eventos principais do LRP implementados no MVP utilizam os kinds experimentais `8101` a `8105`. 

---

## Limitações Atuais

- O aporte real em Bitcoin ainda não está implementado;
- O DLC utilizado no projeto ainda é uma simulação;
- Não existe movimentação de fundos reais;
- O pagamento automático no vencimento ainda não possui scheduler ativo;
- A validação de documentos utiliza uma etapa controlada de demonstração;
- O modo NWC live permanece desativado;
- Reputação portável e eventos de histórico ainda fazem parte do roadmap.

O repositório deixa explícito que a implementação atual de DLC utiliza apenas uma simulação e não cria transação de funding ou settlement on-chain. 

---

## Próximos Passos

- Implementar aportes reais em Bitcoin;
- Publicar `ContributionIntent` e `ContributionFunded`;
- Implementar o fluxo de DLC;
- Integrar Bitcoin Core em ambiente de testes;
- Criar scheduler para pagamentos no vencimento;
- Executar `pay_invoice` via NWC;
- Implementar reconciliação de pagamentos;
- Distribuir os pagamentos entre os aportadores;
- Criar sistema de reputação portável;
- Melhorar a validação de identidade e documentos;
- Implementar cancelamentos, reembolsos e disputas;
- Realizar auditoria de segurança e revisão criptográfica;
- Documentar o LRP para adoção por outras plataformas.

---

## Visão de Futuro

A visão do Elas Recebem Hoje é permitir que profissionais transformem recebíveis legítimos em oportunidades de financiamento abertas e globais.

O LRP poderá permitir que diferentes plataformas criem experiências especializadas para freelancers, empresas ou comunidades, mantendo um conjunto comum de eventos, assinaturas e regras verificáveis.

A proposta não é substituir toda a análise privada por dados públicos, mas permitir que os fatos essenciais de uma operação sejam assinados, portáveis e auditáveis sem expor informações sensíveis.
