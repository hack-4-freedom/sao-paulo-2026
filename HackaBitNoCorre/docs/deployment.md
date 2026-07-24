# Deploy

## Bolt.new

SATQUEST é projetado para deploy no Bolt.new:

1. O build é executado automaticamente: `npm run build`
2. Os arquivos estáticos são gerados em `dist/`
3. O deploy é automático ao salvar

## Deploy manual

### Build

```bash
npm run build
```

Gera `dist/` com arquivos estáticos otimizados.

### Preview local

```bash
npm run preview
```

### Hospedagem estática

O `dist/` pode ser hospedado em qualquer serviço estático:

- **Vercel**: `vercel --prod`
- **Netlify**: arraste a pasta `dist/`
- **GitHub Pages**: `gh-pages` branch
- **Cloudflare Pages**: conecte o repo

## Variáveis de ambiente

Configure no painel de hospedagem:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave anônima do Supabase |
| `VITE_BREEZ_API_KEY` | Não | Chave do Breez SDK (para carteira) |

## Supabase

### Migrações

As migrações em `supabase/migrations/` são aplicadas automaticamente pelo
Supabase MCP. Para aplicar manualmente:

1. Abra o SQL Editor no painel do Supabase
2. Execute cada migração em ordem (0001 → 0009)

### Auth

No painel do Supabase → Authentication → Providers:

- **Email**: habilitado
- **Confirm email**: desabilitado (modo hackathon)
- **Google/GitHub**: desabilitado (futuro)

## Breez SDK

A carteira Bitcoin requer uma chave de API do Breez:

1. Acesse [breez.technology/request-api-key](https://breez.technology/request-api-key/)
2. Preencha o formulário (gratuito para desenvolvedores)
3. Adicione a chave em `VITE_BREEZ_API_KEY`

Sem a chave, a carteira não funciona, mas o resto do app funciona normalmente.
