## Visão Geral
__Iris__ é uma plataforma inspirada em _FediMint_ e sistemas de _SACCOs_ comuns na África. É totalmente focada na população trans brasileira e tem como objetivo principal democratizar o acesso a saúde através da união da própria comunidade.
## Problema
Comunidade trans tem acesso negado a maioria dos direitos que o resto da população toma como básico. A expectativa de vida de uma mulher trans no Brasil é de 35 anos. 
Todas as medicações usadas para hormônio-terapia de mulheres trans são medicações que servem para outros propósitos e foram reaproveitadas, causando os colaterais.
Literalmente não existem medicações feitas para nós no Brasil. A única opção nesse sentido são medicações importadas, não regulamentadas, que são caras e só aceitam crypto como pagamento
## Solução
A plataforma __Iris__ surge como uma possível solução para o problema da falta de acesso para medicações boas. Apesar de também oferecermos soluções para outros problemas, como a dificuldade de encontrar médicos que não tentem nos matar, o problema principal que queremos resolver é a falta de acesso a medicações de qualidade. O método pensado para solucionar isso é o sistema de __União__.
#### Sistema de __União__
Oferecem as _Fontes_, formadas por grupos fechados de 5 pessoas, que operam em _ciclos_. Um ciclo começa quando todos concordam em começar e pagam sua parcela referente a primeira _rodada_. 
Ao final de uma rodada, após todos pagarem ou chegar a um tempo limite pré definido, uma pessoa é escolhida para ser _contemplada_, que significa receber o dinheiro arrecado naquela rodada. 
Essa seleção pode ser feita tanto por votação como por sorteio auditável na block-chain. Isso é o que marca o fim de uma rodada e o começo da próximo, onde tudo se repete.
O ciclo termina quando todos os participantes foram contemplados.

__Soft Default__: É quando um _não-contemplado_ abandona uma fonte ativa/em andamento, ou não paga sua parcela da rodada até o prazo definido. 
A plataforma cobre o pagamento da rodada que o usuário abandonou, mas, caso não haja substituição, não paga pelas próximas.
Usuário sofre penalidades de reputação, é impedido de participar de Fontes por 7 dias, e em caso de Fontes de alto risco não tem seu dinheiro previamente investido ressarcido.

__Hard Default__: É quando um _contemplado_ abandona uma fonte ativa/em andamento, ou não paga sua parcela da rodada até o prazo definido.
A plataforma cobre o valor roubado para não prejudicar o andamento da fonte, e consequentemente os usuários honestos.
Usuário é permanentemente banido e usuário que o convidou para a plataforma tem reputação severamente penalizada.

#### __Sistema de Reputação__
Contamos com um complexo sistema de reputação que pune usuários por práticas ruins, ou por convidar pessoas não-confiáveis, mas beneficia aqueles que cumprem com seus compromissos e convidam pessoas honestas.
Além disso, o mais importante é que as Fontes são divididas em categorias, de valores mais baixos até mais altos, que estão atreladas a reputação.
Leva alguns meses de uso para alcançar reputação o bastante para liberar o acesso a Fontes com valores altos. Esse é um dos mecanismos implementados que faz com que aplicar golpes na plataforma de maneira premeditada e ordenada se torne extremamente ineficiente.

#### __Sistema de convites (Invite-only)__
Para criar uma conta na plataforma é preciso uma chave Nostr, que pode ser gerada na hora, e um convite enviado.
#### Tecnologia
Usamos chaves públicas __Nostr__ como identificadores dos usuários e __Bitcoin__ para todas as transações com o intuito de manter a privacidade e pseudo anonimidade de um grupo já muito vulnerável.
A última coisa que alguém numa plataforma como essa precisa é de doxxing, e não ter uma maneira fácil de rastrear as transações é um grande ponto positivo, principalmente no caso de compras internacionais.
__Breez SDK - Spark__ em server-mode foi usado para gerenciar a carteira da plataforma, que serve como intermediário em transações até R$ 200. 
Geramos invoices BOLT11 que tornam os pagamentos das micro parcelas nessas categorias de Fontes muito mais viáveis graças a __Lightning Network__.

## Equipe
- __Lunna Boo__ - LunnaBoo
- __Kássia Kellem__ - kassiakellem
- __Lidya Amorim__ - Lidyaamorim
## Repositório e Links
Github repository:
https://github.com/LunnaBoo/Iris
## Status
No momento o projeto é um MVP funcional, todas as features funcionam e as transações parecem acontecer sem problemas. 
## Próximos Passos
#### 1. Relays da comunidade
Estruturar um protocolo com base no relay Iris que outros relays auto-custodiados pelos usuários pudessem usar. Isso definiria uma mesma politica de escrita/writing, como permitir apenas chaves públicas Iris ativas a postarem.
O plano a longo termo é deixar de depender do banco de dados da Iris para validar usuários válidos, pra passar a depender do relay aceitar apenas usuários com chaves públicas Iris verificadas.
Uma maneira de fazer isso seria publicar um evento toda vez que um usuário novo é registrado na plataforma, e quando é banido também, além de todos os eventos ligados a reputação e os chats.
#### 2. NIP-42 read-auth
Atualmente o relay da Iris é público, qualquer um que descobrir a URL pode ler todos os eventos já publicados. Mesmo o chat sendo limpo a cada 24 horas, segue sendo um baita problema de privacidade.
NIP-42 (AUTH) permite que o relay exija uma autenticação antes de permitir que alguém tenha acesso de leitura a ele, o que permitira que apenas usuários da Iris tivessem acesso.
Como a ideia é que a URL do relay seja acessível aos usuários futuramente, faz ainda mais sentido que isso seja implementado.
#### 3. PSBT 4-of-5 multi-sig a partir de R$300
PSBT 4-of-5 ou 3-5 multi-sig é a melhor opção para valores mais altos, tendo em consideração que um dos possíveis problemas da plataforma é que ela age como intermediário nas transações até R$ 200.
Isso faria com que o dinheiro sequer passasse pela Iris, o que traz maior segurança aos usuários.
####  4. Ter um tesouro
É necessário cobrar taxas que são divididas entre Fontes de alto ou baixo risco. Levando em consideração que a plataforma arca com gastos de _soft defaults_ e _hard defaults_, se faz necessário um tesouro para manter a operação acontecendo.
#### 5. Moderação para comunidade
Para uma plataforma completamente focada em promover o coletivo e a unir a comunidade, é importante que hajam ferramentes de moderação.
Sem o mínimo de moderação para garantir o nível básico de decência humana, pode se tornar bem difícil unir pessoas numa comunidade em prol de ajuda mútua.
#### Verificação NIP-05
Seria interessante que usuários pudessem ser verificados dessa forma, e talvez até ganhassem pontos de reputação com isso.
#### Push notifications
Especialmente úteis para notificações avisando sobre a aproximação da data limite para se pagar uma parcela no ciclo de uma Fonte e também quando usuários perder esse prazo.
