# Instalação

## Pré-requisitos

- **Node.js** 20 ou superior
- **npm** 10 ou superior
- Um projeto **Supabase** (ou use o provisionado pelo Bolt)

## Passo a passo

### 1. Clone o repositório

```bash
git clone https://github.com/jamiellyreis/satquest.git
cd satquest
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
VITE_BREEZ_API_KEY=sua-chave-breez-opcional
```

> Em projetos Bolt, essas variáveis já vêm pré-configuradas.

### 4. Aplique as migrações do banco

As migrações em `supabase/migrations/` são aplicadas automaticamente pelo
Supabase MCP em projetos Bolt. Para aplicar manualmente:

1. Abra o SQL Editor no painel do Supabase
2. Execute cada arquivo `.sql` em ordem numérica (0001 → 0009)

### 5. Rode o projeto

```bash
npm run dev
```

O servidor de desenvolvimento estará disponível em `http://localhost:5173`.

### 6. Build para produção

```bash
npm run build
```

Gera arquivos estáticos otimizados em `dist/`.

## Breez SDK Spark (opcional)

Para habilitar a carteira Bitcoin:

1. Obtenha uma chave gratuita em
   [breez.technology/request-api-key](https://breez.technology/request-api-key/)
2. Adicione em `.env`:
   ```
   VITE_BREEZ_API_KEY=sua-chave
   ```

Sem a chave, a carteira não funciona, mas o resto do app funciona normalmente.

## Estrutura de arquivos

```
satquest/
├── src/                 # Código fonte
│   ├── components/      # Componentes
│   ├── lib/             # Lógica
│   ├── screens/         # Telas
│   ├── App.tsx          # Rotas
│   └── main.tsx         # Entry point
├── supabase/
│   └── migrations/     # Migrações SQL
├── docs/                # Documentação
├── .github/             # Templates e CI
├── .env                 # Variáveis (não commitar)
├── package.json
└── vite.config.ts
```

## Scripts disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run typecheck` | Verificação de tipos |
