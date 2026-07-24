# FAQ

## Geral

### O que é o SATQUEST?

SATQUEST é uma plataforma gamificada que ensina Bitcoin, Lightning Network,
programação, criptografia e segurança digital para estudantes do ensino médio
através de missões, jogos e desafios práticos.

### Preciso de Bitcoin para usar?

Não. O aprendizado é gratuito e recompensa apenas XP. A carteira Bitcoin é
opcional e separada do sistema de aprendizado.

### Para qual público é destinado?

Estudantes do ensino médio (15-18 anos), especialmente em escolas públicas
brasileiras. O conteúdo está em português.

### É gratuito?

Sim, totalmente gratuito. O código é open source (licença MIT).

## Cadastro e Login

### Não consigo criar conta

O bug de cadastro foi corrigido na versão 0.3. Se ainda houver problemas:

1. Confira se o e-mail está correto
2. A senha deve ter no mínimo 6 caracteres
3. Tente com outro e-mail (pode já estar cadastrado)
4. Verifique sua conexão com a internet

### Esqueci minha senha

Use a função "Esqueci a senha" na tela de login. Um e-mail de recuperação
será enviado (requer configuração de SMTP no Supabase).

### Posso entrar com Google ou GitHub?

Ainda não. OAuth social está planejado para a versão 1.1.

## Carteira

### A carteira não funciona

A carteira requer uma chave de API do Breez SDK. Obtenha gratuitamente em
[breez.technology](https://breez.technology/request-api-key/).

### Meus satoshis sumiram

A carteira é non-custodial — as chaves ficam no seu dispositivo. Se você
limpou o cache do navegador, a carteira foi perdida. Sempre faça backup da
sua seed phrase.

### Posso enviar Bitcoin de verdade?

Sim, a carteira usa a Lightning Network real via Breez SDK Spark. Os
pagamentos são reais.

## Aprendizado

### Como ganho XP?

- Completando lições: +20 XP
- Resgatando missões: +5 XP
- Jogando no Game Center: +3 XP

### O que são ligas?

Ligas são grupos de competição semanal baseados em XP. Você começa no Bronze
e pode subir até Lenda, dependendo do seu XP semanal.

### O que é streak?

Streak é a sequência de dias consecuidos em que você completa pelo menos
uma atividade. Quanto maior a sequência, mais badges você desbloqueia.

### Os desafios se repetem?

Não. Cada desafio ensina algo novo. A dificuldade aumenta progressivamente.

## Dados

### Como exporto meus dados?

Vá em Perfil → Editar → Exportar meus dados. Um arquivo JSON com todos os
seus dados será baixado.

### Como excluo minha conta?

Vá em Perfil → Editar → Excluir conta. Esta ação é irreversível e remove
todos os seus dados.
