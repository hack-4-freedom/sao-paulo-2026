**Arakne**  
Modelo de Projeto — Hack4Freedom São Paulo 2026.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsSfYxZo/kSGMYQLPJrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4qrBdGuSdJuAAAAAElFTkSuQmCC)  
**Visão Geral**  
Arakne é um app de aprendizado de crochê e tecelagem que, sob a superfície, é uma rede de microcrédito peer-to-peer via Lightning Network para mulheres sem acesso bancário por controle financeiro coercitivo. O catálogo de padrões de crochê não é uma fachada — é conteúdo real e funcional (9 trilhas, 54 aulas, 127 materiais). Dentro dele, um gesto específico (desenhar o "Ponto Arakne" na aula-portal da trilha 9) revela uma camada financeira inteira: pedido de crédito por aval social, repagamento via Pix, e recuperação de conta social e criptograficamente segura — tudo em vocabulário têxtil, do início ao fim, mesmo depois de revelado.  
O nome vem do mito de Aracne: a tecelã mortal punida por Atena por expor, numa tapeçaria, os abusos de poder dos deuses contra mulheres. É uma história de punição por dizer a verdade. O Arakne reclama essa narrativa de propósito — termina o que ela começou.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OUQmAABBAsSdYxKYXx1gmEBOIFfwTYUuwZWa2ag8AgL841uquzq8nAAC8dj05WgYLQTzjnAAAAABJRU5ErkJggg==)  
**Problema**  
Mulheres sob controle financeiro coercitivo (cônjuge, família ou Estado) frequentemente não têm acesso próprio a conta bancária, crédito, ou qualquer instrumento financeiro que não passe pelo controle de outra pessoa — casos como Afeganistão, Índia, Nordeste do Brasil e Colômbia. Isso cria duas barreiras simultâneas:  
1. **Acesso a crédito** — sem histórico bancário, sem colateral, sem como provar renda.  
2. **Segurança do próprio acesso** — ter um app financeiro visível no telefone pode, por si só, ser perigoso.  
Soluções de microcrédito social (Grameen Bank, Zidisha) resolvem a primeira barreira. Nenhuma delas resolve a segunda.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OQQmAABRAsSd4EKxgBjP+Asa0hxW8ibAl2DIzR3UFAMBf3Gu1VefXEwAAXtsfSqwDVbgKngwAAAAASUVORK5CYII=)  
**Solução**  
- **Disfarce como segurança, não como estética.** A camada financeira só existe atrás de um gesto que a própria usuária define — e, mesmo revelada, nunca usa um termo financeiro real ("saldo" é "material disponível"; "empréstimo" é "novo kit"; "aval" é "fio puxado").  
- **Crédito por aval social, sem KYC.** Acesso desbloqueado por indicação de outra mulher da rede (tier 1 a 3, de 5.000 a 40.000 sats) — quem avaliza assume risco real.  
- **Bitcoin/Lightning como trilho, Pix como interface.** No Brasil, a usuária deposita e repaga em Pix, com atribuição automática por QR de cobrança dinâmica.  
- **Recuperação de conta sem ponto único de controle.** A chave de identidade é protegida por um gesto de desenho único; destravar exige reconstruir a chave via Shamir's Secret Sharing (2 de 2) — uma parte com uma tecelã de confiança, outra no backend protegida pelo PIN da usuária. Nem a Arakne sozinha consegue destravar uma conta.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OQQmAABRAsSfYxZo/jVEMYQLPJrCCNxG2BFtmZquOAAD4i3Ot7mr/egIAwGvXA4rLBc059ysnAAAAAElFTkSuQmCC)  
**Stack de Tecnologia**  
| | |  
|-|-|  
| **Camada** | **Tecnologia** |   
| Backend | Python, FastAPI, SQLAlchemy, SQLite |   
| Frontend | React, Vite, TypeScript |   
| Pagamentos (repagamento) | Pix via Mercado Pago (Checkout Transparente) |   
| Pagamentos (crédito/pool) | Lightning Network via Coinos |   
| Identidade | Nostr (chaves geradas localmente) |   
| Recuperação de conta | Shamir's Secret Sharing (2-de-2) + NIP-59 (gift wrap) |   
| Custódia da reserva | Multisig Bitcoin gerada offline (embit) |   
| Deploy | Frontend na Vercel, Backend no Railway |   
   
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANUlEQVR4nO3OQQmAABRAsSfYxKK/kJXEkyE8WcGbCFuCLTOzVXsAAPzFsVZ3dX4cAQDgvesB/vEF9H9odtUAAAAASUVORK5CYII=)  
**Equipe**  
- **Jhulia Carvalhp – Arquitetura; business model; rail de pagamento pix; fluxo financeiro; integraç** **ão fiat/bitcoin.**  
- Dilaine Oliveira – Frontend; identificação NOSTR; Recuperação; UX: trilhas; implementação de mecanismos de segurança  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAAM0lEQVR4nO3KsQ0AIRAEsUW6Qij1KvnevhMSYmKQ7GiCGd09k3wBAOAVf+2o4wYAwE1qAdYuAy151mgcAAAAAElFTkSuQmCC)  
**Repositório e Links**  
- **Código-fonte:**github.com/jhuliaah/Arakne (branch main)  
- **App (produção):**[https://arakne-coral.vercel.app](https://arakne-coral.vercel.app "https://arakne-coral.vercel.app")  
- **API (produção):**[https://arakne-production.up.railway.app](https://arakne-production.up.railway.app "https://arakne-production.up.railway.app")  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANElEQVR4nO3OQQmAUBBAwSfIb+HdmNvAkgaxgjcRZhLMNjNHdQUAwF/ce7Wq8+sJAACvrQctewNKtdojwQAAAABJRU5ErkJggg==)  
**Status**  
**MVP no ar, em produção**, frontend na Vercel e backend no Railway. Motor de crédito, catálogo de crochê, revelação por gesto, repagamento via Pix (Mercado Pago) e recuperação de conta via Shamir's Secret Sharing + Nostr funcionando de ponta a ponta.  
**Limitações conhecidas no ambiente de produção agora:**  
- Banco de dados sem volume persistente no Railway — precisa rodar o seed manualmente após cada redeploy.  
- Carteira interna do dia a dia (depósito/saldo/gasto) não fecha o loop completo ainda.  
- Custódia multisig da reserva fria gerada apenas em modo demo, não com stewards reais.  
**Fora do escopo do hackathon:** proteção cambial do empréstimo (denominação em moeda local), camada de investimento/staking (pendente de validação jurídica), multi-moeda além do BRL.  
![](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAnEAAAACCAYAAAA3pIp+AAAABmJLR0QA/wD/AP+gvaeTAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAANklEQVR4nO3OYQ1AABSAwc8mi5wvkwZyCKCAACr4Z7a7BLfMzFYdAQDwF+da3dX+9QQAgNeuB6feBdUJcyS2AAAAAElFTkSuQmCC)  
**Próximos Passos**  
1. Configurar volume persistente no Railway para o banco de dados.  
2. Fechar o loop da carteira interna (depósito → confirmação → saldo disponível).  
3. Rodar a geração de multisig com os stewards reais do time.  
4. Implementar a denominação do empréstimo em moeda local.  
5. Validação jurídica do modelo de crédito e da camada de investimento.  
