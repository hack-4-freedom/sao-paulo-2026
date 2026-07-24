# Stark

**Hack4Freedom São Paulo 2026**

---

## Visão Geral

Stark é uma plataforma que conecta microcapacitação, trabalho digital, identidade
portátil e pagamento rápido para mulheres em vulnerabilidade econômica.

Na mesma jornada, a participante aprende uma competência, aplica o conhecimento
em uma tarefa financiada, recebe avaliação humana e, após a aprovação, é paga
pela Lightning Network. O Nostr oferece autenticação segura e reputação
verificável sem exigir que a chave privada seja compartilhada com a plataforma.

O objetivo é encurtar o caminho entre aprender, demonstrar competência e receber,
criando uma experiência mobile-first que oculta a complexidade de Bitcoin,
Lightning e Nostr.

---

## Problema

Mulheres em vulnerabilidade econômica podem enfrentar simultaneamente baixa
renda, informalidade, dependência financeira, sobrecarga de cuidado, violência,
dificuldade de reinserção profissional e acesso digital limitado.

As soluções existentes costumam tratar apenas uma parte da jornada:

- cursos isolados não garantem experiência nem oportunidades de trabalho;
- tarefas sem recursos previamente reservados não garantem pagamento;
- processos de contratação tradicionais excluem quem ainda não possui histórico
  profissional;
- pagamentos lentos, caros ou dependentes de intermediários dificultam o acesso
  à renda;
- certificados e reputação presos a uma plataforma não pertencem de fato à
  participante.

A lacuna central está entre aprender e receber por uma entrega real.

---

## Solução

A Stark reúne em um único fluxo:

1. autenticação com identidade Nostr, sem compartilhamento da chave privada;
2. trilhas curtas ligadas a habilidades específicas;
3. tarefas digitais financiadas, com escopo, prazo, valor e critérios claros;
4. entrega e revisão humana, com justificativa e possibilidade de correção;
5. pagamento em satoshis pela Lightning Network após a aprovação;
6. emissão consentida de badge verificável para construir reputação portátil;
7. ledger segregado para rastrear remuneração, impacto, capital e custos.

Empresas e organizações podem financiar trabalho verificável, enquanto as
participantes desenvolvem habilidades, produzem entregas reais, recebem com
rapidez e constroem um histórico profissional portátil.

---

## Stack de Tecnologia

| Camada | Tecnologias | Uso |
|:---|:---|:---|
| Frontend | React, TypeScript e Vite | Aplicação web responsiva e mobile-first |
| Backend | Python e Flask | API e regras de negócio |
| Dados | SQLite/PostgreSQL, SQLAlchemy e Alembic | Persistência, ledger, idempotência e outbox |
| Identidade | Nostr e NIP-07 | Login por assinatura |
| Reputação | Nostr e NIP-58 | Badges verificáveis emitidos com consentimento |
| Pagamentos | Bitcoin e Lightning Network | Pagamentos em satoshis |
| Documentação | Docusaurus | Documentação técnica, de produto e negócio |
| Conversão opcional | Hodle/Pix | Possível saída para reais em uma etapa futura |

---

## Membros da Equipe

- **Maria Arielly** — Business e UX/UI; estudante de Engenharia da Computação
  no Inteli
  ([LinkedIn](https://www.linkedin.com/in/maria-arielly))
- **Ana Célia** — UX/UI e Frontend; estudante de Engenharia de Software no
  Inteli
  ([LinkedIn](https://www.linkedin.com/in/ana-c%C3%A9lia-amaral/))
- **Lorena Garcia** — Blockchain e IA; estudante de Engenharia da Computação no
  Inteli
  ([LinkedIn](https://www.linkedin.com/in/llorengarcia/?locale=pt))

---

## Links

- **Repositório no GitHub:** [AnaCelia1827/Hack4freedom](https://github.com/AnaCelia1827/Hack4freedom)
- **Demo e documentação:** [anacelia1827.github.io/Hack4freedom](https://anacelia1827.github.io/Hack4freedom/)
- **Apresentação:** [Ver apresentação no Canva](https://canva.link/9rtdyj1rzhui8v2)

---

## Status Atual

O projeto está em estágio de **MVP integrado e preparação para piloto
controlado**. A autenticação Nostr segura de ponta a ponta e o pagamento
Lightning real já foram implementados.

O MVP demonstra a jornada principal: autenticação, microcapacitação, reserva e
execução de uma tarefa, revisão humana, pagamento e registro de reputação.

---

## Próximos Passos

- validar a solução com participantes, organizações e empresas;
- executar um piloto controlado com uma tarefa real e recursos reservados;
- concluir a persistência durável de toda a jornada;
- ampliar a autorização por papel e propriedade;
- implementar armazenamento privado das entregas;
- reforçar limites, reconciliação e observabilidade da tesouraria;
- ampliar testes ponta a ponta e realizar revisão de segurança;
- evoluir a infraestrutura para operação em produção.

---

## Licença e Código Aberto

O projeto é desenvolvido de forma open-source. O código-fonte e a documentação
estão disponíveis no repositório público indicado acima.
