/*
# Bit no Corre — Seed V2 (módulos, games, baús, colecionáveis)

## Visão geral
Popula as novas tabelas do schema V2:
- 11 módulos educacionais (Iniciante → Especialista)
- 3 jogos do Game Center
- 1 temporada ativa
- 3 baús com recompensas
- 6 colecionáveis (avatars, skins, títulos)

## Conteúdo
### Módulos
1. Iniciante — Primeiros passos
2. Curioso — O que é Bitcoin
3. Aprendiz — Sats e carteiras
4. Explorador — Lightning Network
5. Operador Lightning — Canais e nós
6. Autocustódia — Suas chaves, seu dinheiro
7. Segurança — Protegendo seu Bitcoin
8. Economia Bitcoin — Oferta, demanda, escassez
9. Planejamento Financeiro — Reserva, juros, inflação
10. Soberania — Liberdade financeira
11. Especialista — Tópicos avançados

### Games
1. Bit Spin — Gire e ganhe
2. Bit Miner — Mine blocos virtuais
3. Sweet Bit — Combine doces

### Baús
1. Baú de Cobre (nível 1)
2. Baú de Prata (nível 5)
3. Baú de Ouro (nível 10)

### Colecionáveis
6 itens: 2 avatares, 2 skins, 2 títulos
*/

-- ============================================================
-- Módulos educacionais
-- ============================================================
INSERT INTO modules (slug, title, subtitle, description, icon_emoji, color_hex, difficulty, position, trilha_id) VALUES
('iniciante', 'Iniciante', 'Primeiros passos', 'Comece do absoluto zero. Aprenda o que é Bitcoin, por que existe e como funciona no dia a dia.', '🌱', '#10B981', 'iniciante', 1, (SELECT id FROM trilhas WHERE slug = 'fundamentos')),
('curioso', 'Curioso', 'O que é Bitcoin de verdade', 'Entenda a diferença entre dinheiro de banco e dinheiro seu. O que muda quando ninguém está no meio.', '🤔', '#3B82F6', 'curioso', 2, NULL),
('aprendiz', 'Aprendiz', 'Sats e carteiras', 'Aprenda a usar sats no dia a dia, como funciona uma carteira e o que é autocustódia.', '👛', '#F7931A', 'aprendiz', 3, NULL),
('explorador', 'Explorador', 'Lightning Network', 'Descubra como o Bitcoin pode ser instantâneo e barato. Pagamentos em segundos, não em horas.', '⚡', '#F59E0B', 'explorador', 4, NULL),
('operador_lightning', 'Operador Lightning', 'Canais e nós', 'Abra canais, entenda liquidez e torne-se um operador da rede Lightning.', '🔌', '#8B5CF6', 'operador_lightning', 5, NULL),
('autocustodia', 'Autocustódia', 'Suas chaves, seu dinheiro', 'A diferença entre ter Bitcoin e ter a chave. Por que autocustódia importa.', '🔑', '#EF4444', 'autocustodia', 6, NULL),
('seguranca', 'Segurança', 'Protegendo seu Bitcoin', 'Backups, golpes, phishing e as regras de ouro para não perder seu Bitcoin.', '🛡️', '#6366F1', 'seguranca', 7, NULL),
('economia_bitcoin', 'Economia Bitcoin', 'Oferta, demanda e escassez', 'Por que 21 milhões importa. Inflação, deflação e o que torna o Bitcoin diferente.', '📈', '#14B8A6', 'economia', 8, NULL),
('planejamento', 'Planejamento Financeiro', 'Reserva, juros e inflação', 'Aprenda conceitos de educação financeira aplicados ao Bitcoin. Sem aconselhamento, só conhecimento.', '💰', '#22C55E', 'planejamento', 9, NULL),
('soberania', 'Soberania', 'Liberdade financeira', 'O que significa ser soberano financeiramente. Bitcoin como ferramenta de autonomia.', '🗽', '#F7931A', 'soberania', 10, NULL),
('especialista', 'Especialista', 'Tópicos avançados', 'Mergulhe em mineração, dificuldade ajustada, halving e o futuro do protocolo.', '🎓', '#A855F7', 'especialista', 11, NULL)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Games
-- ============================================================
INSERT INTO games (slug, title, description, icon_emoji, color_hex, reward_sats, reward_xp) VALUES
('bitcoin-spin', 'Bit Spin', 'Gire a roleta e ganhe XPs.', '🎯', '#F7931A', 3, 2),
('bitcoin-miner', 'Bit Miner', 'Mine blocos virtuais e ganhe recompensas. Quanto mais rápido, mais ganha.', '⛏️', '#10B981', 5, 3),
('sweet-bitcoin', 'Sweet Bit', 'Combine doces e ganhe Bitcoin. Combinações maiores valem mais.', '🍬', '#EF4444', 4, 2)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Temporada ativa
-- ============================================================
INSERT INTO game_seasons (name, starts_at, ends_at, is_active)
VALUES ('Temporada 1: Genesis', now(), now() + interval '90 days', true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- Baús
-- ============================================================
INSERT INTO chests (slug, name, description, icon_emoji, min_level, min_sats, max_sats) VALUES
('chest_copper', 'Baú de Cobre', 'Recompensa básica para iniciantes', '🟫', 1, 5, 20),
('chest_silver', 'Baú de Prata', 'Recompensa para quem está pegando o ritmo', '⬜', 5, 20, 50),
('chest_gold', 'Baú de Ouro', 'Recompensa premium para veteranos', '🟨', 10, 50, 200)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Colecionáveis
-- ============================================================
INSERT INTO collectibles (slug, name, type, icon_emoji, rarity, description) VALUES
('avatar_corre', 'Avatar: Corre', 'avatar', '🦊', 'common', 'O mascote Corre como avatar'),
('avatar_satoshi', 'Avatar: Satoshi', 'avatar', '👨‍💻', 'rare', 'Avatar inspirado no criador do Bitcoin'),
('skin_orange', 'Skin: Laranja Bitcoin', 'skin', '🟧', 'common', 'Tema laranja clássico do Bitcoin'),
('skin_lightning', 'Skin: Lightning', 'skin', '⚡', 'epic', 'Tema com efeitos elétricos da Lightning Network'),
('title_pioneer', 'Título: Pioneer', 'title', '🎖️', 'rare', 'Título para quem completou os Fundamentos'),
('title_sovereign', 'Título: Soberano', 'title', '👑', 'legendary', 'Título para quem alcançou soberania financeira')
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Novas trilhas para módulos
-- ============================================================
INSERT INTO trilhas (slug, title, subtitle, description, cover_emoji, color_hex, position) VALUES
('lightning', 'Lightning Network', 'Bitcoin na velocidade da luz', 'Aprenda como o Bitcoin pode ser instantâneo e barato. Pagamentos em segundos usando a Lightning Network.', '⚡', '#F59E0B', 2),
('economia', 'Economia Bitcoin', 'Por que 21 milhões importa', 'Entenda inflação, escassez e por que o Bitcoin é diferente de qualquer outro dinheiro.', '📈', '#14B8A6', 3),
('seguranca', 'Segurança Total', 'Não caia em golpe', 'As regras de ouro para proteger seu Bitcoin. Backups, golpes e como ficar seguro.', '🛡️', '#6366F1', 4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Lições da trilha Lightning (3 lições)
-- ============================================================
INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT t.id, 'lightning-instantaneo', 'Pagamento instantâneo', 'Segundos, não horas', '⚡', 1, 3, 60, 25,
'[
  {"scene":"mercado","emoji":"🛒","narrator":"Narrador","text":"Maria foi pagar a conta do mercado. O caixa disse: aceito Bitcoin na Lightning. Em segundos, pronto."},
  {"scene":"duvida","emoji":"🤔","narrator":"Maria","text":"Mas Bitcoin não demora pra confirmar?"},
  {"scene":"explica","emoji":"💡","narrator":"Narrador","text":"Na rede principal, sim. Mas a Lightning Network é uma segunda camada. Ela funciona como atalhos rápidos entre quem paga e quem recebe."},
  {"scene":"analogia","emoji":"🛣️","narrator":"Narrador","text":"Pense na rede Bitcoin como uma rodovia. A Lightning é o pedágio expresso: você paga rápido e segue. Sem precisar esperar o trânsito todo."},
  {"scene":"confirma","emoji":"✅","narrator":"Narrador","text":"Por isso dá pra pagar um café, uma conta ou dividir o almoço com Bitcoin. Instantâneo e com taxa quase zero."}
]'::jsonb,
'[
  {"id":"q1","question":"O que a Lightning Network permite?","options":["Pagamentos lentos","Pagamentos instantâneos e baratos","Só transferências grandes","Só entre bancos"],"correct":1,"explanation":"A Lightning é uma segunda camada que permite pagamentos instantâneos e com taxas quase zero."},
  {"id":"q2","question":"Como comparar a Lightning com a rede Bitcoin?","options":["É a mesma coisa","É um pedágio expresso","É mais lenta","É mais cara"],"correct":1,"explanation":"A Lightning funciona como um atalho rápido, enquanto a rede principal processa tudo na rodovia principal."}
]'::jsonb
FROM trilhas t WHERE t.slug = 'lightning'
ON CONFLICT (trilha_id, slug) DO NOTHING;

INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT t.id, 'lightning-carteira', 'Carteira Lightning', 'Seu dinheiro na velocidade da luz', '📱', 2, 3, 60, 25,
'[
  {"scene":"joao","emoji":"🧑","narrator":"João","text":"Mãe, pra usar Lightning você precisa de uma carteira compatível. Igual a que eu te mostrei, mas com um extra."},
  {"scene":"explica","emoji":"💡","narrator":"Narrador","text":"A carteira Lightning faz duas coisas: guarda suas chaves e abre canais de pagamento. O canal é como um tubo direto entre você e quem recebe."},
  {"scene":"analogia","emoji":"🚰","narrator":"Narrador","text":"Pense num cano de água entre duas casas. Você abre o cano uma vez, e depois pode mandar e receber água quantas vezes quiser, sem pagar pedágio a cada vez."},
  {"scene":"maria","emoji":"🤔","narrator":"Maria","text":"E como eu abro esse canal?"},
  {"scene":"confirma","emoji":"✅","narrator":"Narrador","text":"A carteira faz isso automaticamente. Você só paga. Ela cuida do resto. É por isso que a experiência parece tão simples."}
]'::jsonb,
'[
  {"id":"q1","question":"O que uma carteira Lightning faz além de guardar chaves?","options":["Abre canais de pagamento","Minera Bitcoin","Cria altcoins","Funciona como banco"],"correct":0,"explanation":"A carteira Lightning guarda chaves e abre canais de pagamento, que são como tubos diretos entre pagador e recebedor."},
  {"id":"q2","question":"O que é um canal Lightning?","options":["Um banco","Um cano direto entre duas pessoas","Uma moeda","Um tipo de golpe"],"correct":1,"explanation":"O canal é como um cano entre duas casas. Abre uma vez e depois pode mandar e receber quantas vezes quiser."}
]'::jsonb
FROM trilhas t WHERE t.slug = 'lightning'
ON CONFLICT (trilha_id, slug) DO NOTHING;

INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT t.id, 'lightning-qr', 'Pagar com QR Code', 'Escaneia e paga', '📷', 3, 3, 60, 25,
'[
  {"scene":"restaurante","emoji":"🍽️","narrator":"Narrador","text":"Maria foi almoçar com a amiga. O restaurante aceitava Bitcoin. Na mesa, um QR code."},
  {"scene":"amiga","emoji":"👩","narrator":"Amiga","text":"É só escanear o código e confirmar?"},
  {"scene":"explica","emoji":"💡","narrator":"Narrador","text":"Isso. O QR code carrega o endereço e o valor. A carteira lê, mostra quanto vai pagar, e você confirma. Em segundos, pronto."},
  {"scene":"analogia","emoji":"🎫","narrator":"Narrador","text":"É como escanear o QR code do pix. Só que em vez de ir pelo banco, vai direto pela Lightning. Sem intermediário."},
  {"scene":"confirma","emoji":"✅","narrator":"Narrador","text":"Por isso a Lightning é a forma mais simples de usar Bitcoin no dia a dia. Escaneia, confirma, pronto."}
]'::jsonb,
'[
  {"id":"q1","question":"Como funciona o pagamento por QR Code na Lightning?","options":["Você digita o endereço manualmente","A carteira lê o código e você confirma","Você liga pro restaurante","Você manda um e-mail"],"correct":1,"explanation":"O QR code carrega o endereço e o valor. A carteira lê, mostra quanto vai pagar, e você confirma em segundos."},
  {"id":"q2","question":"Qual a vantagem do QR Code na Lightning vs pix?","options":["É mais lento","Não tem intermediário","Só funciona de noite","É mais caro"],"correct":1,"explanation":"O QR Code na Lightning funciona como o do pix, mas sem intermediário. O pagamento vai direto."}
]'::jsonb
FROM trilhas t WHERE t.slug = 'lightning'
ON CONFLICT (trilha_id, slug) DO NOTHING;

-- ============================================================
-- Lições da trilha Economia (2 lições)
-- ============================================================
INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT t.id, 'inflacao-oculta', 'A inflação que você não vê', 'Por que o dinheiro perde valor', '📉', 1, 4, 60, 25,
'[
  {"scene":"mercado","emoji":"🛒","narrator":"Narrador","text":"Maria foi comprar a cesta básica. Há um ano custava 200 reais. Agora custa 240. Ela pensou: por que tudo ficou mais caro?"},
  {"scene":"explica","emoji":"💡","narrator":"Narrador","text":"Isso é inflação. Quando o Banco Central imprime mais dinheiro, cada real vale menos. O preço não subiu — o dinheiro perdeu valor."},
  {"scene":"compara","emoji":"⚖️","narrator":"Narrador","text":"O Bitcoin é diferente. Não tem quem imprima mais. 21 milhões e acabou. Por isso, ao longo do tempo, cada Bitcoin tende a valer mais, não menos."},
  {"scene":"analogia","emoji":"🍰","narrator":"Narrador","text":"Imagine uma pizza cortada em 8 fatias. Se alguém corta cada fatia ao meio, você tem mais fatias, mas cada uma é menor. É isso que a inflação faz com seu dinheiro."},
  {"scene":"confirma","emoji":"✅","narrator":"Narrador","text":"Bitcoin não pode ser cortado em mais fatias. A oferta é fixa. Isso muda tudo."}
]'::jsonb,
'[
  {"id":"q1","question":"O que é inflação?","options":["Quando os preços sobem porque o dinheiro perde valor","Quando os preços descem","Quando o governo dá dinheiro","Quando o dólar sobe"],"correct":0,"explanation":"Inflação é quando o dinheiro perde valor porque mais dinheiro foi impresso. Os preços não sobem — o dinheiro vale menos."},
  {"id":"q2","question":"Por que o Bitcoin é diferente do real em relação à inflação?","options":["Porque pode ser impresso","Porque a oferta é fixa em 21 milhões","Porque o governo controla","Porque não tem valor"],"correct":1,"explanation":"O Bitcoin tem oferta fixa de 21 milhões. Ninguém pode imprimir mais. Por isso não sofre inflação da mesma forma."}
]'::jsonb
FROM trilhas t WHERE t.slug = 'economia'
ON CONFLICT (trilha_id, slug) DO NOTHING;

INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT t.id, 'reserva-emergencia', 'Reserva de emergência', 'Por que você precisa de uma', '🪺', 2, 4, 60, 25,
'[
  {"scene":"surpresa","emoji":"😱","narrator":"Narrador","text":"O carro de Maria quebrou. O conserto custou 1.500 reais. Ela teve que pegar dinheiro do cheque especial, com juros altos."},
  {"scene":"filho","emoji":"🧑","narrator":"João","text":"Mãe, se você tivesse uma reserva de emergência, não precisaria do cheque especial."},
  {"scene":"explica","emoji":"💡","narrator":"Narrador","text":"Reserva de emergência é um dinheiro guardado para imprevistos. O recomendado é ter de 3 a 6 meses de gastos guardados."},
  {"scene":"bitcoin","emoji":"🟧","narrator":"Narrador","text":"Algumas pessoas guardam a reserva em Bitcoin, outras em poupança, outras nos dois. O importante é ter algo fora do cheque especial."},
  {"scene":"confirma","emoji":"✅","narrator":"Narrador","text":"Não importa onde você guarda. O que importa é ter. A reserva é o colchão que amortece as surpresas da vida."}
]'::jsonb,
'[
  {"id":"q1","question":"O que é uma reserva de emergência?","options":["Um empréstimo","Dinheiro guardado para imprevistos","Um tipo de investimento","Um seguro"],"correct":1,"explanation":"Reserva de emergência é dinheiro guardado para situações inesperadas. O recomendado é 3 a 6 meses de gastos."},
  {"id":"q2","question":"Qual a recomendação para o tamanho da reserva?","options":["1 mês de gastos","3 a 6 meses de gastos","1 ano de gastos","Não precisa"],"correct":1,"explanation":"O recomendado é ter de 3 a 6 meses de gastos guardados. Isso cobre a maioria dos imprevistos."}
]'::jsonb
FROM trilhas t WHERE t.slug = 'economia'
ON CONFLICT (trilha_id, slug) DO NOTHING;

-- ============================================================
-- Lições da trilha Segurança (2 lições)
-- ============================================================
INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT t.id, 'phishing-zap', 'Golpe do WhatsApp', 'O golpe mais comum no Brasil', '💬', 1, 3, 60, 25,
'[
  {"scene":"msg","emoji":"📱","narrator":"Narrador","text":"Maria recebeu uma mensagem: Seu filho está preso. Precisa de 500 reais para a fiança. Mande via pix agora."},
  {"scene":"panico","emoji":"😰","narrator":"Maria","text":"Meu Deus! Vou mandar agora!"},
  {"scene":"filho","emoji":"🧑","narrator":"João","text":"Mãe, para. Liga pra mim antes de mandar qualquer coisa."},
  {"scene":"explica","emoji":"💡","narrator":"Narrador","text":"Era golpe. O golpe do WhatsApp funciona com urgência e emoção. Eles querem que você aja antes de pensar."},
  {"scene":"regra","emoji":"🛡️","narrator":"Narrador","text":"Regra: qualquer pedido de dinheiro por mensagem, ligue antes. Mesmo que seja familiar. Especialmente se for familiar."},
  {"scene":"confirma","emoji":"✅","narrator":"Narrador","text":"O mesmo vale para Bitcoin. Se pedirem suas 12 palavras ou uma transferência urgente, desconfie. Sempre."}
]'::jsonb,
'[
  {"id":"q1","question":"Como funciona o golpe do WhatsApp?","options":["Pedem dinheiro com urgência e emoção","Mandam um vírus","Roubam o celular","Hackeiam o banco"],"correct":0,"explanation":"O golpe usa urgência e emoção para fazer você agir antes de pensar. Sempre confirme por outra via antes de mandar dinheiro."},
  {"id":"q2","question":"O que fazer ao receber um pedido de dinheiro por mensagem?","options":["Mandar imediatamente","Ligar para confirmar antes","Ignorar todas as mensagens","Bloquear quem enviou"],"correct":1,"explanation":"Sempre ligue para confirmar antes de mandar dinheiro. Mesmo que pareça ser de um familiar."}
]'::jsonb
FROM trilhas t WHERE t.slug = 'seguranca'
ON CONFLICT (trilha_id, slug) DO NOTHING;

INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT t.id, 'backup-12-palavras', 'Backup: as 12 palavras', 'Sua chave para recuperar tudo', '📝', 2, 4, 60, 25,
'[
  {"scene":"preocupada","emoji":"😟","narrator":"Maria","text":"João, e se eu perder o celular? Perco todo meu Bitcoin?"},
  {"scene":"filho","emoji":"🧑","narrator":"João","text":"Não, mãe. Lembra do backup? As 12 palavras que eu te pedi pra anotar?"},
  {"scene":"explica","emoji":"💡","narrator":"Narrador","text":"As 12 palavras são a representação humana da sua chave. Com elas, você recupera seu Bitcoin em qualquer aparelho, a qualquer hora."},
  {"scene":"regra1","emoji":"✍️","narrator":"Narrador","text":"Primeiro: anote no papel. Não no celular, não na nuvem, não em foto. Papel, caneta, gaveta."},
  {"scene":"regra2","emoji":"🔒","narrator":"Narrador","text":"Segundo: guarde em lugar seguro. Ninguém além de você precisa saber onde está."},
  {"scene":"regra3","emoji":"🚫","narrator":"Narrador","text":"Terceiro: nunca digite essas palavras em nenhum site, app ou formulário. Quem pede é golpe."},
  {"scene":"confirma","emoji":"✅","narrator":"Narrador","text":"Com essas três regras, seu Bitcoin é seu para sempre. Sem backup, um acidente e tudo pode se perder."}
]'::jsonb,
'[
  {"id":"q1","question":"Onde você deve anotar as 12 palavras do backup?","options":["No celular","Na nuvem","No papel, à mão","Em uma foto"],"correct":2,"explanation":"Anote no papel, à mão. Não no celular, não na nuvem, não em foto. Papel e caneta, guardado em lugar seguro."},
  {"id":"q2","question":"O que fazer se alguém pedir suas 12 palavras?","options":["Enviar, é o suporte","Não enviar — é golpe","Enviar só metade","Perguntar de novo"],"correct":1,"explanation":"Nunca digite suas 12 palavras em nenhum site, app ou formulário. Quem pede é golpe, mesmo parecendo oficial."},
  {"id":"q3","question":"O que acontece se você perder o celular mas tiver o backup?","options":["Perde tudo","Recupera em outro aparelho","Tem que criar conta nova","Perde só metade"],"correct":1,"explanation":"Com as 12 palavras, você recupera seu Bitcoin em qualquer aparelho. É por isso que o backup é essencial."}
]'::jsonb
FROM trilhas t WHERE t.slug = 'seguranca'
ON CONFLICT (trilha_id, slug) DO NOTHING;