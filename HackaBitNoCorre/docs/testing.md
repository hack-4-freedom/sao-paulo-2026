# Testing

## Estado atual

SATQUEST não possui testes automatizados ainda. O plano é:

## Plano de testes

### Unit tests (Vitest)

- **lib/rewards.ts**: testar funções de recompensa
- **lib/format.ts**: testar formatação de números
- **lib/market.ts**: testar conversão de preços
- **lib/auth.tsx**: testar AuthProvider (mock Supabase)

### Integration tests

- **Fluxo de cadastro**: criar conta → profile criado → wallet criada
- **Fluxo de lição**: completar lição → XP creditado → badge concedido
- **Fluxo de missão**: completar missão → resgatar → XP creditado
- **Fluxo de amigos**: enviar → aceitar → amizade criada

### E2E tests (Playwright)

1. **Cadastro completo**: landing → form → home
2. **Primeira lição**: home → trilha → lição → quiz → recompensa
3. **Editar perfil**: perfil → editar → salvar → voltar
4. **Carteira**: abrir → ver saldo → gerar invoice
5. **Missões**: ver missões → completar → resgatar

### Banco de dados

- Testar RLS: usuário A não lê dados de usuário B
- Testar RPC: `complete_lesson` credita XP corretamente
- Testar trigger: novo usuário recebe profile + wallet
- Testar rate limits: 11º convite do dia é bloqueado

### Configuração futura

```bash
npm install -D vitest @testing-library/react @playwright/test
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
  },
});
```

## Cobertura alvo

| Área | Cobertura |
|------|-----------|
| lib/ | 80%+ |
| components/ui/ | 70%+ |
| screens/ | 50%+ (E2E complementa) |
| Banco (RLS/RPC) | 90%+ |
