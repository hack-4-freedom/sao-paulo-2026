# Frontend

## Estrutura

```
src/
├── components/
│   ├── ui/              # Componentes de design system
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Progress.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Toast.tsx
│   │   ├── EmptyState.tsx
│   │   ├── SatsBadge.tsx
│   │   ├── BitcoinConverter.tsx
│   │   ├── PriceChart.tsx
│   │   └── BottomNav.tsx
│   └── Mascot.tsx        # Mascote animado
├── lib/
│   ├── auth.tsx          # AuthProvider + useAuth
│   ├── supabase.ts       # Cliente Supabase
│   ├── spark.ts          # Breez SDK Spark
│   ├── spark-hooks.ts    # Hooks da carteira
│   ├── rewards.ts        # Funções de recompensa
│   ├── hooks.ts          # Hooks gerais
│   ├── market.ts         # Preço do Bitcoin
│   ├── lightning.ts      # Utilidades Lightning
│   ├── tokens.ts         # Tokens de design
│   ├── format.ts         # Formatação
│   └── types.ts          # Tipos TypeScript
├── screens/
│   ├── Splash.tsx
│   ├── Onboarding.tsx
│   ├── SignIn.tsx
│   ├── SignUp.tsx
│   ├── AppShell.tsx       # Layout com bottom nav
│   ├── Home.tsx
│   ├── TrilhaDetail.tsx
│   ├── LessonPlayer.tsx
│   ├── Wallet.tsx
│   ├── Missions.tsx
│   ├── GameCenter.tsx
│   ├── OpenFinance.tsx
│   ├── Profile.tsx
│   ├── ProfileEdit.tsx
│   └── Referrals.tsx
├── App.tsx               # Rotas
├── main.tsx              # Entry point
└── index.css             # Estilos globais + design tokens
```

## Design System

### Cores (CSS Custom Properties)

```css
/* Tema dark (padrão) */
--color-bg: #0a0a0f;
--color-surface: #15151f;
--color-surface-2: #1e1e2e;
--color-border: #2a2a3a;
--color-fg: #f5f5f5;
--color-fg-muted: #a0a0b0;
--color-primary: #F7931A;       /* Bitcoin orange */
--color-secondary: #10B981;     /* Verde */
--color-success: #10B981;
--color-warning: #F59E0B;
--color-error: #EF4444;
--color-info: #3B82F6;
```

### Espaçamento (grid 8px)

Todas as medidas de espaçamento usam múltiplos de 8px, via classes do
Tailwind (`gap-2` = 8px, `gap-4` = 16px, etc.).

### Tipografia

- **Body**: 150% line-height
- **Headings**: 120% line-height
- **Máximo 3 font-weights**: normal (400), medium (500), bold (700)

### Componentes

| Componente | Props principais | Uso |
|------------|------------------|-----|
| `Button` | `variant`, `size`, `fullWidth`, `loading` | Ações |
| `Card` | `className` | Containers |
| `Input` | `label`, `error`, `hint`, `leftSlot` | Formulários |
| `Progress` | `value`, `max`, `color` | Barras de progresso |
| `Skeleton` | `className` | Loading states |
| `Toast` | `push(kind, message)` | Notificações |

## Hooks

### `useAuth()`

Acesso ao estado de autenticação e perfil.

```typescript
const { session, user, profile, loading, signUp, signIn, signOut, refreshProfile } = useAuth();
```

### `useTrilhas()`

Lista de trilhas publicadas.

```typescript
const { trilhas, loading, error } = useTrilhas();
```

### `useTrilhaLessons(trilhaId)`

Lições de uma trilha com progresso do usuário.

```typescript
const { lessons, loading } = useTrilhaLessons(trilhaId);
```

### `useSparkWallet()`

Estado da carteira Bitcoin (saldo, transações).

```typescript
const { balanceSats, transactions, sendPayment, receivePayment } = useSparkWallet();
```

### `useBitcoinPrice()`

Preço atual do Bitcoin em BRL.

```typescript
const { price, loading } = useBitcoinPrice();
```

## Navegação

Usa `react-router-dom` v6:

```typescript
<Routes>
  <Route path="/" element={<PublicOnly><Onboarding /></PublicOnly>} />
  <Route path="/cadastro" element={<PublicOnly><SignUp /></PublicOnly>} />
  <Route path="/entrar" element={<PublicOnly><SignIn /></PublicOnly>} />

  <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
    <Route index element={<Home />} />
    <Route path="trilha/:trilhaId" element={<TrilhaDetail />} />
    <Route path="licao/:lessonId" element={<LessonPlayer />} />
    <Route path="missoes" element={<Missions />} />
    <Route path="carteira" element={<WalletScreen />} />
    <Route path="games" element={<GameCenter />} />
    <Route path="open-finance" element={<OpenFinance />} />
    <Route path="perfil" element={<Profile />} />
    <Route path="perfil/editar" element={<ProfileEdit />} />
    <Route path="indicar" element={<Referrals />} />
  </Route>
</Routes>
```

## Animações

Usa Framer Motion para:

- **Transições de tela**: `initial`, `animate`, `exit`
- **Microinterações**: `whileTap={{ scale: 0.97 }}`
- **Listas**: staggered entrance
- **Feedback**: XP ganho, confetti, toast

## Responsividade

- **Mobile-first**: design otimizado para celular
- **Tablet**: layout adapta com mais colunas
- **Desktop**: max-width centralizado, mais espaço
- **Breakpoints**: via Tailwind (`sm:`, `md:`, `lg:`)
