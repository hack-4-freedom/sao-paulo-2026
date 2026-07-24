# 🌸 Mitsu BTC

**Hack4Freedom São Paulo 2026**

---

## 📖 Visão Geral
Mitsu BTC é uma carteira Bitcoin Lightning focada em garotas gamers. Unimos a cultura estética das skins e jogos à soberania financeira, transformando o lazer em uma ferramenta de impacto social. O projeto permite que jogadoras gerenciem seus fundos de forma soberana e apoiem causas femininas automaticamente através de suas transações.

## ⚡ Problema
Mulheres em situação de vulnerabilidade ou fuga precisam de ferramentas financeiras discretas, simples e rápidas. No entanto, o ecossistema cripto atual sofre com:
- **Complexidade excessiva:** Barreiras técnicas que afastam quem precisa de urgência.
- **Falta de propósito social direto:** Difícil conexão entre o uso cotidiano e o apoio a causas críticas.
- **Rastreabilidade Bancária:** Sistemas tradicionais que podem ser usados por agressores para monitorar vítimas.

## ✨ Solução
A Mitsu BTC aplica o princípio **KIS (Keep It Simple)**: uma interface intuitiva integrada a marketplaces de skins (Steam, Riot, Epic). 
O grande diferencial é o **Mecanismo de Fundo Solidário**: 
- Cada transação de skin gera uma microtaxa automática (1% a 2%).
- Este valor alimenta um **Fundo Social Transparente** auditável via blockchain.
- Os recursos são convertidos para custear necessidades básicas de mulheres em fuga (transporte, alimentação e aluguel social) através de parcerias com ONGs e casas de acolhimento.
- **Engajamento:** A gamer deixa de ser passiva para se tornar uma apoiadora ativa da rede de proteção feminina enquanto consome seus jogos favoritos.

## 🛠️ Stack de Tecnologia
- **Frontend:** React + Vite + TypeScript (Interface Kawaii).
- **Core Lightning:** Breez SDK (Spark) rodando inteiramente via **WASM (WebAssembly)** no browser.
- **Segurança:** Modelo **non-custodial**; a mnemonic nunca sai do navegador do usuário.
- **Persistência:** IndexedDB para salvar o estado do nó localmente.
- **Impacto:** Lógica de microtaxas para fundo social integrada ao fluxo de pagamento.

## 👥 Equipe
- **Ana Beatriz** (@Beaschul)
- **Fernanda** (@fer-oshiro)
- **Thais** (@thaisfuzita)

## 🔗 Repositório e Links
- **GitHub:** [Hack4Freedom-TFA](https://github.com/Beaschul/Hack4Freedom-TFA)
- **Demo:** [Wallet](https://d1zdnn7ai2470c.cloudfront.net/)
- **Apresentação:** [Mitsu-BTC](https://canva.link/ygzypf3plqe5ff2)

## 🚀 Status Atual
- MVP funcional de carteira Lightning non-custodial rodando no browser.
- Interface de setup (geração de mnemonic de 12 palavras).
- Sincronização com a rede Spark (Mainnet).
- Sistema de recebimento de Invoices com feedback visual (confetti/corações).

## 🔮 Próximos Passos
- **Integração Marketplace:** Conectar APIs de inventário de skins para facilitar o checkout com BTC.
- **Dashboard do Fundo:** Criar uma página de transparência que mostra em tempo real quanto o Fundo Solidário já arrecadou e para quais causas foi destinado.
- **Stablecoin Auto-Swap:** Implementar o swap automático da taxa de 1% para Stablecoins, garantindo que o fundo não sofra com a volatilidade para o pagamento de auxílios emergenciais.
