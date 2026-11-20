# Componentes e interação

A biblioteca digital do Linkmural: 26 peças com prévia ao vivo, todas montadas com os tokens deste manual e as classes `lm-*` da folha `components/bundle.css`. Esta seção é o plano: o que existe, para que serve e em que ordem entra no código.

## Inventário

| Grupo | Componente | Para que serve | Fase |
| --- | --- | --- | --- |
| Ações | Button | Ação da tela: primário lime, secundário, outline, ghost, destrutivo | MVP |
| Ações | TextLink | Link dentro de texto, com marca-texto lime no hover | MVP |
| Formulários | Input | Campos com rótulo, ajuda e erro; endereço com prefixo linkmural.com/ | MVP |
| Formulários | Controls | Switch, checkbox e radio | MVP |
| Formulários | IconPicker | Logos oficiais das redes e serviços (Simple Icons) + ícones de traço para contato e negócio, reconhecidos pelo endereço | MVP |
| Formulários | Select | Menu suspenso de escolha e menu de "mais ações" | Fase 2 |
| Formulários | DatePicker | Período de métricas e relatórios, com atalhos | Fase 2 |
| Conteúdo | LinkCard | O card de link da página pública, com versão em destaque e alfinete | MVP |
| Conteúdo | Badge | Plano (Grátis, Pro, Negócios) e status com ponto colorido | MVP |
| Conteúdo | Chip | Filtros e escolha de links no onboarding | MVP |
| Conteúdo | Segmented | Escolha única entre 2 a 4 opções | MVP |
| Conteúdo | Avatar | Logo ou iniciais do negócio e da pessoa | MVP |
| Conteúdo | Tooltip | Rótulo de botões só com ícone | Fase 2 |
| Conteúdo | DataTable | Tabelas do painel e do admin | Fase 2 |
| Conteúdo | ClickChart | Gráfico de cliques com o ponto em destaque | Fase 2 |
| Feedback | Alert | Avisos fixos: limite, cobrança, erro | MVP |
| Feedback | Toast | Confirmação rápida: link copiado, salvo | MVP |
| Feedback | Skeleton | Carregamento com a forma do conteúdo | MVP |
| Feedback | Progress | Passos do onboarding e uso do plano | MVP |
| Feedback | EmptyState | Telas vazias que ensinam o próximo passo | MVP |
| Feedback | Dialog | Confirmações destrutivas | MVP |
| Feedback | Sheet | Folha que sobe de baixo: o Dialog e o Select do celular | Fase 2 |
| Fundamentos | Typography | Unbounded e Inter juntas | — |
| Fundamentos | Icons | 20 ícones de traço 1,8px | — |
| Fundamentos | Motion | Hover, toque, alfinete, entrada, pulso | — |
| Fundamentos | Graphics | Quadro com barras, alfinete, mural, pontos | — |
| Fundamentos | Backgrounds | Paper, pontos, lime, ink, mural | — |

A fase 2 já está desenhada (Select, Sheet, DataTable, ClickChart, DatePicker): entra no código depois do lançamento, junto com as métricas detalhadas do plano Pro.

## Regras de interação

Todo elemento clicável tem os quatro estados desenhados:

| Estado | Como aparece |
| --- | --- |
| Hover | Sobe 1–2px; cards ganham `shadow-md`; botão primário vira `lime-strong` |
| Pressionado | Encolhe para 0,98 (botões) ou 0,99 (cards) em `duration-fast` |
| Foco do teclado | Anel `focus` de 2px com 2px de folga (ink no claro, lime no escuro) |
| Desativado | Opacidade 45% e o motivo escrito por perto |

- Área de toque mínima de 44px no celular.
- Contraste mínimo de 4,5:1 para texto; o lime nunca é cor de texto sobre fundo claro.
- No celular não existe hover: nada importante pode depender dele.

## Movimento

Três tempos e três curvas, todos em tokens (`duration-*`, `ease-*`). A assinatura é o **alfinete que cai e fixa** (`duration-pin` com `ease-pin`), usado no link em destaque, ao publicar a página e ao salvar. O resto é discreto: subir no hover, encolher no toque, entrar subindo 12px. Quem pede menos movimento no sistema (`prefers-reduced-motion`) não vê animações.

## Do manual para o código (Next.js + Tailwind)

1. Copie as cores, raios, espaçamentos, sombras, durações e curvas de `tokens.json` para variáveis CSS (`:root` e `[data-theme="dark"]`), como já estão em `tokens.css`.
2. No `tailwind.config`, aponte as cores e raios para essas variáveis (`lime: "var(--lime)"`, `rounded-lg: "var(--radius-lg)"`), para o tema escuro funcionar sem classes extras.
3. Use `components/bundle.css` como referência de cada estado; as classes `lm-*` podem virar componentes React (`<Button variant="primary">`) mantendo os mesmos nomes de variantes.
4. Fontes pelo `next/font/google`: Unbounded (500, 600) e Inter (400, 500, 600, 700).
5. Ícones: os caminhos SVG das prévias viram um componente `<Icon name="link" />` com `stroke="currentColor"`.

## Páginas dos clientes

Os componentes da página pública (LinkCard, Badge de status, Avatar, botões) seguem a mesma estrutura, mas trocam as cores pelo **estilo** que o cliente escolheu: Sport, Calm, Classic, Pop, Bold, Fresh, Zen ou Dark. A marca Linkmural aparece nelas só no selo "Feito com linkmural" do plano Grátis.
