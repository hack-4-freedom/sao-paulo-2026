# UI — Interface de Usuário

## Design System

### Tokens (CSS Custom Properties)

Definidos em `src/index.css`:

#### Cores

| Token | Valor (dark) | Uso |
|-------|-------------|-----|
| `--color-bg` | `#0a0a0f` | Fundo principal |
| `--color-surface` | `#15151f` | Cards, inputs |
| `--color-surface-2` | `#1e1e2e` | Hover, elevado |
| `--color-surface-3` | `#252535` | Hover ativo |
| `--color-border` | `#2a2a3a` | Bordas |
| `--color-border-strong` | `#3a3a4a` | Bordas em foco |
| `--color-fg` | `#f5f5f5` | Texto principal |
| `--color-fg-muted` | `#a0a0b0` | Texto secundário |
| `--color-fg-subtle` | `#707080` | Texto terciário |
| `--color-primary` | `#F7931A` | Bitcoin orange |
| `--color-primary-soft` | `#F7931A22` | Fundo suave |
| `--color-secondary` | `#10B981` | Verde |
| `--color-success` | `#10B981` | Sucesso |
| `--color-warning` | `#F59E0B` | Aviso |
| `--color-error` | `#EF4444` | Erro |
| `--color-info` | `#3B82F6` | Info |

#### Raios

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | 8px | Pequenos |
| `--radius-md` | 12px | Médio (cards, inputs) |
| `--radius-lg` | 16px | Grande (banners) |
| `--radius-full` | 9999px | Pílulas, avatares |

#### Sombras

| Token | Uso |
|-------|-----|
| `--shadow-sm` | Sutil |
| `--shadow-md` | Botões, cards elevados |
| `--shadow-lg` | Modais, toasts |

#### Animação

| Token | Valor | Uso |
|-------|-------|-----|
| `--duration-fast` | 150ms | Hover, tap |
| `--duration-normal` | 300ms | Transições |
| `--ease-out-soft` | cubic-bezier | Suavização |

### Espaçamento

Grid de 8px via Tailwind:

| Classe | Valor |
|--------|-------|
| `gap-1` | 4px |
| `gap-2` | 8px |
| `gap-3` | 12px |
| `gap-4` | 16px |
| `gap-6` | 24px |
| `gap-8` | 32px |

### Tipografia

- **Body**: 16px, line-height 150%
- **Headings**: line-height 120%
- **Weights**: 400 (normal), 500 (medium), 700 (bold)

## Componentes

### Button

```tsx
<Button variant="primary" size="lg" fullWidth loading={saving}>
  Salvar
</Button>
```

Variantes: `primary`, `secondary`, `ghost`, `danger`
Tamanhos: `sm`, `md`, `lg`

### Card

```tsx
<Card className="p-4">
  Conteúdo
</Card>
```

### Input

```tsx
<Input label="Nome" hint="Seu nome completo" error={error} />
```

### Progress

```tsx
<Progress value={75} max={100} color="#F7931A" />
```

### Skeleton

```tsx
<Skeleton className="h-40" />
```

### Toast

```tsx
const { push } = useToast();
push("success", "Perfil atualizado!");
```

## Layout

### AppShell

Layout principal com bottom navigation:

```
┌─────────────────────┐
│                     │
│    Conteúdo         │
│    (scrollable)     │
│                     │
├─────────────────────┤
│ 🏠 🎯 💰 👤         │  ← BottomNav
└─────────────────────┘
```

### Safe areas

Usa `env(safe-area-inset-*)` para respeitar notch e home indicator:

```css
padding-top: calc(env(safe-area-inset-top) + 20px);
```

## Responsividade

- **Mobile** (< 640px): layout padrão, 1 coluna
- **Tablet** (≥ 768px): 2 colunas onde aplicável
- **Desktop** (≥ 1024px): max-width centralizado
