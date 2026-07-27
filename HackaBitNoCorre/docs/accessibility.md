# Acessibilidade

SATQUEST segue as diretrizes WCAG 2.1 nível AA.

## Padrões implementados

### Navegação por teclado

- Todos os elementos interativos são acessíveis via Tab
- Foco visível com `:focus-visible`
- Ordem de tabulação lógica (segue a ordem visual)
- Sem armadilhas de teclado (keyboard traps)

### Leitor de tela

- **HTML semântico**: `<button>`, `<nav>`, `<header>`, `<main>`, `<ul>`, `<li>`
- **ARIA labels**: em elementos sem texto visível (ex: botões de ícone)
- **aria-hidden**: em emojis e elementos decorativos
- **alt text**: em todas as imagens informativas

### Contraste

- **Texto normal**: mínimo 4.5:1 (WCAG AA)
- **Texto grande**: mínimo 3:1
- **Componentes UI**: mínimo 3:1
- Cores verificadas em modo dark e light

### Cores

- Informação não depende apenas de cor (tem ícones e texto)
- Estados de erro têm ícone + cor + texto
- Links são sublinhados ou claramente distinguíveis

### Tamanho de texto

- **Body**: mínimo 16px (1rem)
- **Captions**: mínimo 12px, apenas para texto secundário
- Suporta zoom até 200% sem quebrar o layout

### Animações

- Respeita `prefers-reduced-motion`
- Animações não piscam mais de 3x por segundo (sem seizures)
- Transições têm `prefers-reduced-motion: reduce` fallback

### Formulários

- **Labels**: todos os campos têm `<label>` associado
- **Erros**: mensagens de erro descritivas, não apenas "inválido"
- **Autocomplete**: atributos corretos (`autocomplete="email"`, etc.)
- **Required**: campos obrigatórios marcados

## Melhorias futuras

- [ ] Suporte completo a `prefers-color-scheme: light`
- [ ] Skip-to-content link
- [ ] Landmark roles (`role="main"`, `role="navigation"`)
- [ ] Live regions para notificações dinâmicas
- [ ] Suporte a VoiceOver e TalkBack testado
- [ ] Audit WCAG completo
