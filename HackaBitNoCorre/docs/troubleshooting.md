# Troubleshooting

## Cadastro

### "Esse e-mail já tem conta"

O e-mail já está registrado. Tente fazer login em vez de cadastro.

### "Algo deu errado. Tenta de novo."

Erro genérico. Verifique:

1. Conexão com internet
2. Se o e-mail é válido
3. Se a senha tem no mínimo 6 caracteres
4. Tente novamente em alguns minutos (pode ser rate limit)

### Cadastro funciona mas perfil não carrega

O trigger `handle_new_user` pode ter falhado. Verifique:

1. Abra o console do navegador (F12)
2. Veja se há erros do Supabase
3. Tente deslogar e logar novamente
4. Se persistir, o perfil pode ser criado manualmente via SQL

## Login

### "E-mail ou senha errados"

Confira o e-mail e a senha. Se esqueceu a senha, use a recuperação.

### "Muitas tentativas"

Rate limit do Supabase Auth. Espere 5-10 minutos e tente novamente.

## Carteira

### "Conta inválida" ao enviar

A chave do Breez SDK não está configurada ou é inválida. Obtenha uma chave
gratuita em [breez.technology](https://breez.technology/request-api-key/).

### Saldo não atualiza

1. Feche e reabra a tela da carteira
2. Verifique sua conexão
3. O saldo pode demorar alguns segundos para sincronizar com a Lightning Network

### Não consigo receber

Gere um novo invoice. Invoices expiram após algum tempo.

## Build

### `npm run build` falha com erros TypeScript

1. Verifique se não há imports não utilizados
2. Verifique se não há `any` types
3. Rode `npx tsc --noEmit` para ver os erros detalhados
4. Corrija os erros um a um

### Build passa mas a tela fica branca

1. Abra o console (F12)
2. Verifique erros de runtime
3. Pode ser um problema de roteamento — confira se a URL está correta

## Supabase

### "permission denied for table"

O role `anon` não tem privilégios (por design). Verifique se o usuário está
autenticado. Se estiver, pode ser uma policy de RLS faltando.

### RLS bloqueia uma query

1. Verifique se a policy está correta
2. Confira se `auth.uid()` retorna o ID esperado
3. Teste a query no SQL Editor com `auth.uid()` simulado

### Função RPC retorna erro

1. Verifique se o usuário está autenticado
2. Confira os parâmetros
3. Veja o código da função para mensagens de erro específicas

## Performance

### App lento

1. Verifique o tamanho do bundle (`npm run build` mostra os tamanhos)
2. O Breez SDK WASM é grande (~11MB) — considere lazy loading
3. Use React.memo para componentes que re-renderizam desnecessariamente

### Muitas re-renders

1. Use `useMemo` e `useCallback` para valores e funções estáveis
2. Verifique dependências de `useEffect`
3. Considere `React.memo` para componentes filhos
