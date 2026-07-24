/*
# Cripto no Corre — Seed de conteúdo inicial

## Visão geral
Popula o banco com:
- 1 trilha: "Fundamentos do Bitcoin" (slug: fundamentos)
- 5 lições com story_frames e quiz completos
- 3 missões diárias
- 4 conquistas (badges)

## Lições criadas
1. "O que é esse tal de Bitcoin?" — analogia do pix digital
2. "Sats: o troco do Bitcoin" — 100M sats = 1 BTC, como centavos
3. "A carteira que mora no celular" — carteira = chave + app
4. "Por que a oferta é limitada?" — 21 milhões, escassez
5. "Primeiros passos com segurança" — backup, golpe, cuidado

## Segurança
- INSERT simples de conteúdo público (service role bypassa RLS).
- Nenhuma política alterada.
*/

-- ============================================================
-- Trilha: Fundamentos do Bitcoin
-- ============================================================
INSERT INTO trilhas (slug, title, subtitle, description, cover_emoji, color_hex, position)
VALUES (
  'fundamentos',
  'Fundamentos do Bitcoin',
  'Comece do zero, sem tecnicismo',
  'Cinco histórias curtas para entender o que é Bitcoin, como funciona a carteira e por que a oferta é limitada. Sem palavras difíceis. Sem blockchain. Só dinheiro digital fazendo sentido.',
  '🟧',
  '#F7931A',
  1
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Lição 1: O que é esse tal de Bitcoin?
-- ============================================================
INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT
  t.id,
  'o-que-e-bitcoin',
  'O que é esse tal de Bitcoin?',
  'Um pix que não passa pelo banco',
  '🪙',
  1,
  3,
  50,
  20,
  '[
    {"scene":"feira","emoji":"🧺","narrator":"Narrador","text":"Sábado de manhã. Dona Maria foi à feira comprar fruta. Na hora de pagar, o feirante falou: aceito pix ou Bitcoin."},
    {"scene":"pix","emoji":"📱","narrator":"Maria","text":"Pix eu conheço. Mas esse tal de Bitcoin… é o quê, um aplicativo?"},
    {"scene":"feirante","emoji":"🧑‍🌾","narrator":"Feirante","text":"É um dinheiro que mora no celular, igual o pix. Só que não tem banco no meio. Eu recebo direto de você."},
    {"scene":"explica","emoji":"💡","narrator":"Narrador","text":"Pense assim: o pix é dinheiro digital que o banco guarda pra você. O Bitcoin é dinheiro digital que só você guarda. Ninguém consegue congelar, nem bloquear."},
    {"scene":"maria","emoji":"🤔","narrator":"Maria","text":"Então… é tipo uma conta sem banco?"},
    {"scene":"confirma","emoji":"✅","narrator":"Narrador","text":"Exato. A conta é o seu próprio celular. Por isso muita gente chama de dinheiro do povo: ninguém manda nele além de você."}
  ]'::jsonb,
  '[
    {"id":"q1","question":"Qual a diferença principal entre pix e Bitcoin?","options":["O Bitcoin precisa de banco","O pix não precisa de banco","O Bitcoin não precisa de banco","Os dois são a mesma coisa"],"correct":2,"explanation":"No pix o banco guarda e move o dinheiro. No Bitcoin só você guarda — não tem banco no meio."},
    {"id":"q2","question":"Alguém pode congelar ou bloquear o seu Bitcoin?","options":["Sim, o banco pode","Sim, o governo pode","Não, só você manda no seu","Sim, a operadora pode"],"correct":2,"explanation":"Como não tem banco no meio, ninguém além de você consegue congelar ou bloquear. É só seu."}
  ]'::jsonb
FROM trilhas t WHERE t.slug = 'fundamentos'
ON CONFLICT (trilha_id, slug) DO NOTHING;

-- ============================================================
-- Lição 2: Sats — o troco do Bitcoin
-- ============================================================
INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT
  t.id,
  'sats-troco',
  'Sats: o troco do Bitcoin',
  'Você não precisa de um Bitcoin inteiro',
  '🧮',
  2,
  3,
  50,
  20,
  '[
    {"scene":"padaria","emoji":"🥖","narrator":"Narrador","text":"Maria foi na padaria. O pão custou 3 reais. Ela pensou: mas eu não tenho um Bitcoin inteiro, que custa milhares de reais."},
    {"scene":"duvida","emoji":"😕","narrator":"Maria","text":"Então nem dá pra usar no dia a dia?"},
    {"scene":"centavos","emoji":"💡","narrator":"Narrador","text":"Dá sim. Igual o real tem centavo, o Bitcoin tem satoshi — ou sat, pra íntimo. Um Bitcoin tem 100 milhões de sats."},
    {"scene":"compara","emoji":"🔢","narrator":"Narrador","text":"É como se 1 real virasse 100 centavos. Só que 1 Bitcoin vira 100 milhões de sats. Por isso dá pra pagar desde um pão até uma casa."},
    {"scene":"paguei","emoji":"🥐","narrator":"Maria","text":"Então paguei o pão com alguns sats?"},
    {"scene":"confirma","emoji":"✅","narrator":"Narrador","text":"Isso. Você usa só o tanto que precisa. Ninguém precisa comprar um Bitcoin inteiro. Pense em sats, não em Bitcoin."}
  ]'::jsonb,
  '[
    {"id":"q1","question":"Quantos sats tem em 1 Bitcoin?","options":["100","1.000","1 milhão","100 milhões"],"correct":3,"explanation":"1 Bitcoin é dividido em 100 milhões de satoshis. Igual 1 real dividido em 100 centavos — só que em escala maior."},
    {"id":"q2","question":"Para pagar um pão, você precisa de um Bitcoin inteiro?","options":["Sim, sempre","Não, dá pra usar poucos sats","Só se for cara","Só em dólar"],"correct":1,"explanation":"Você usa só os sats que precisa. Por isso dá pra gastar Bitcoin em coisas pequenas, como um pão."}
  ]'::jsonb
FROM trilhas t WHERE t.slug = 'fundamentos'
ON CONFLICT (trilha_id, slug) DO NOTHING;

-- ============================================================
-- Lição 3: A carteira que mora no celular
-- ============================================================
INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT
  t.id,
  'carteira-celular',
  'A carteira que mora no celular',
  'Não é de couro, é de aplicativo',
  '👛',
  3,
  4,
  60,
  25,
  '[
    {"scene":"cem","emoji":"🏪","narrator":"Narrador","text":"Maria ganhou uns sats na feira e pensou: onde eu guardo isso? A resposta veio do filho, o João."},
    {"scene":"joao","emoji":"🧑","narrator":"João","text":"Mãe, carteira de Bitcoin não é de couro. É um aplicativo que guarda suas chaves. A chave é tipo a senha que abre seu dinheiro."},
    {"scene":"analogia","emoji":"🔑","narrator":"Narrador","text":"Pense na chave como a chave do cofre. O aplicativo é o cofre. Junto, eles são a sua carteira. Só quem tem a chave abre o cofre."},
    {"scene":"pergunta","emoji":"🤔","narrator":"Maria","text":"E se eu perder o celular?"},
    {"scene":"backup","emoji":"📝","narrator":"João","text":"Por isso existe o backup: umas 12 palavras que você anota no papel e guarda. Perdeu o celular? É só digitar as palavras num aparelho novo e seu dinheiro volta."},
    {"scene":"regra","emoji":"⚠️","narrator":"Narrador","text":"Regra de ouro: essas palavras são a sua chave. Nunca mande pra ninguém. Nem pro suporte. Nem pra polícia. Ninguém legítimo pede isso."}
  ]'::jsonb,
  '[
    {"id":"q1","question":"O que é uma carteira de Bitcoin?","options":["Uma carteira de couro","Um app que guarda suas chaves","Um banco","Um cartão"],"correct":1,"explanation":"A carteira é um aplicativo que guarda suas chaves — a senha que abre seu dinheiro. Não tem nada de couro."},
    {"id":"q2","question":"Para que servem as 12 palavras do backup?","options":["Pra senha do banco","Pra recuperar o dinheiro num celular novo","Pra dar pro suporte","Pra postar no Instagram"],"correct":1,"explanation":"As palavras são sua chave de backup. Perdeu o celular? Digite elas num aparelho novo e o dinheiro volta."},
    {"id":"q3","question":"Alguém legítimo pede suas 12 palavras?","options":["Sim, o suporte pede","Sim, a polícia pede","Sim, o banco pede","Nunca. Ninguém legítimo pede"],"correct":3,"explanation":"Ninguém legítimo pede suas 12 palavras. Quem pede é golpe. É a regra de ouro da segurança."}
  ]'::jsonb
FROM trilhas t WHERE t.slug = 'fundamentos'
ON CONFLICT (trilha_id, slug) DO NOTHING;

-- ============================================================
-- Lição 4: Por que a oferta é limitada?
-- ============================================================
INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT
  t.id,
  'oferta-limitada',
  'Por que a oferta é limitada?',
  'Só vai existir 21 milhões',
  '📏',
  4,
  3,
  50,
  20,
  '[
    {"scene":"mercado","emoji":"📈","narrator":"Narrador","text":"Maria ouviu na TV: Bitcoin é limitado, só vai ter 21 milhões. Mas o que isso quer dizer?"},
    {"scene":"compara","emoji":"🖨️","narrator":"Narrador","text":"O real é diferente. O Banco Central pode imprimir mais reais quando quiser. Mais dinheiro na rua, mas cada um vale menos."},
    {"scene":"bitcoin","emoji":"🟧","narrator":"Narrador","text":"O Bitcoin não tem Banco Central. O tanto que existe é decidido por um combinado entre todos — e esse combinado diz: 21 milhões, nem um a mais."},
    {"scene":"efeito","emoji":"⚖️","narrator":"Narrador","text":"É como uma terra com 21 milhões de lotes. Ninguém cria lote novo. Por isso, se mais gente quer entrar, o valor de cada lote tende a subir."},
    {"scene":"maria","emoji":"🤔","narrator":"Maria","text":"Então é escasso de verdade?"},
    {"scene":"confirma","emoji":"✅","narrator":"Narrador","text":"É. Escasso de nascença. Você não precisa confiar em ninguém pra saber que ninguém vai imprimir mais. Está no combinado."}
  ]'::jsonb,
  '[
    {"id":"q1","question":"Quantos Bitcoins vão existir no total?","options":["1 milhão","21 milhões","100 milhões","Não tem limite"],"correct":1,"explanation":"O combinado do Bitcoin é de 21 milhões no total. Nem um a mais. Isso é escassez de verdade."},
    {"id":"q2","question":"Quem decide imprimir mais Bitcoin?","options":["O Banco Central","O governo","O presidente","Ninguém — é decidido pelo combinado"],"correct":3,"explanation":"Ninguém manda. O limite de 21 milhões é parte do combinado do Bitcoin. Não tem Banco Central que imprima."}
  ]'::jsonb
FROM trilhas t WHERE t.slug = 'fundamentos'
ON CONFLICT (trilha_id, slug) DO NOTHING;

-- ============================================================
-- Lição 5: Primeiros passos com segurança
-- ============================================================
INSERT INTO lessons (trilha_id, slug, title, subtitle, cover_emoji, position, duration_min, reward_sats, reward_xp, story_frames, quiz)
SELECT
  t.id,
  'primeiros-passos-seguranca',
  'Primeiros passos com segurança',
  'Como não cair no golpe',
  '🛡️',
  5,
  4,
  60,
  25,
  '[
    {"scene":"zap","emoji":"💬","narrator":"Narrador","text":"Maria recebeu uma mensagem no WhatsApp: Parabéns! Você ganhou 0.5 Bitcoin. Clique pra resgatar."},
    {"scene":"filho","emoji":"🧑","narrator":"João","text":"Mãe, para tudo. Isso é golpe. Bitcoin não chega por WhatsApp. E ninguém te dá Bitcoin do nada."},
    {"scene":"regra1","emoji":"✋","narrator":"Narrador","text":"Primeira regra: ninguém regala Bitcoin. Se prometeram te dar, é golpe. Ponto."},
    {"scene":"regra2","emoji":"🔒","narrator":"Narrador","text":"Segunda regra: sua chave (as 12 palavras) é sua. Quem pedir é golpe. Suporte de verdade nunca pede."},
    {"scene":"regra3","emoji":"🧐","narrator":"Narrador","text":"Terceira regra: antes de enviar, confira o endereço duas vezes. Bitcoin enviado pro lugar errado não volta."},
    {"scene":"maria","emoji":"😅","narrator":"Maria","text":"Quase caí. Agora eu sei: presente de Bitcoin é golpe, chave não se divide, e confere antes de mandar."},
    {"scene":"confirma","emoji":"✅","narrator":"Narrador","text":"Isso. Segurança é hábito. Quem sabe dessas três regras já está à frente da maioria."}
  ]'::jsonb,
  '[
    {"id":"q1","question":"Você recebeu uma mensagem dizendo que ganhou Bitcoin. O que fazer?","options":["Clicar e resgatar","Mandar suas 12 palavras","Ignorar — é golpe","Repassar pra amigos"],"correct":2,"explanation":"Ninguém regala Bitcoin. Mensagem prometendo Bitcoin é golpe. Ignore e não clique."},
    {"id":"q2","question":"O suporte de uma carteira pediu suas 12 palavras. O que fazer?","options":["Enviar, é o suporte","Não enviar — é golpe","Enviar só metade","Pedir pra ligar depois"],"correct":1,"explanation":"Suporte de verdade nunca pede suas 12 palavras. Quem pede é golpe, mesmo parecendo oficial."},
    {"id":"q3","question":"Antes de enviar Bitcoin pra alguém, o que você faz?","options":["Manda rápido pra não errar","Confere o endereço duas vezes","Pede pra um amigo mandar","Não precisa conferir"],"correct":1,"explanation":"Bitcoin enviado pro endereço errado não volta. Sempre confira o endereço duas vezes antes de mandar."}
  ]'::jsonb
FROM trilhas t WHERE t.slug = 'fundamentos'
ON CONFLICT (trilha_id, slug) DO NOTHING;

-- ============================================================
-- Missões diárias
-- ============================================================
INSERT INTO missions (slug, title, description, icon_emoji, target_count, reward_sats, reward_xp) VALUES
  ('daily_lesson', 'Complete 1 lição', 'Aprenda um pouquinho hoje', '📖', 1, 15, 10),
  ('daily_quiz_perfect', 'Acerte tudo no quiz', 'Responda certo todas as perguntas de uma lição', '🎯', 1, 20, 15),
  ('daily_streak', 'Mantenha o ritmo', 'Estude pelo segundo dia seguido', '🔥', 1, 25, 15)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- Conquistas (badges)
-- ============================================================
INSERT INTO badges (slug, title, description, icon_emoji) VALUES
  ('first_lesson', 'Primeiro passo', 'Complete sua primeira lição', '👣'),
  ('first_sats', 'Primeiros sats', 'Ganhe seus primeiros sats', '🪙'),
  ('streak_3', 'Pegando o ritmo', 'Mantenha 3 dias de streak', '🔥'),
  ('fundamentos_done', 'Fundamentos completo', 'Termine a trilha Fundamentos', '🎓')
ON CONFLICT (slug) DO NOTHING;