# Linkmural · Handoff de implementação

Versão 1 · 20/11/2026 · Dono: Daniel

Referências visuais (abrir no navegador, logado no Claude):
- Telas e marca (página pública, modelos, painel do cliente, admin, mobile): https://claude.ai/artifact/BxRZ73xfia9T8qpuKDAuNy
- Manual de identidade visual e componentes: https://claude.ai/artifact/UwFX23fx3grPfC8fEP3C1c
- Plano de implementação e onboarding: https://claude.ai/artifact/PHxc8qKRUWE94Vq3jR85as

O que já existe: domínio linkmural.com apontado para a Hostinger, conta no Supabase, repositório no GitHub.

---

## 1. Produto em uma página

Um negócio cria a página `linkmural.com/studioforca` em menos de 3 minutos. A página tem nome, logo, bio, status ("Aberto agora · até 22h"), botão de WhatsApp, botão Salvar contato, QR code e cards de links. Os links são de redes, agenda, loja, cardápio, Pix e outros. O visual combina **3 modelos** com **8 estilos**. O dono edita tudo num painel web pensado para o celular.

| | Grátis | Pro | Negócios |
|---|---|---|---|
| Preço | R$ 0 | R$ 4,99/mês ou R$ 30,00/ano (lançamento, 50% off por 12 meses; regular R$ 9,98/mês ou R$ 60,00/ano) | fora de venda por ora (Fase 6) |
| Páginas | 1 | 1 | 3 |
| Links | até 5 | ilimitados | ilimitados |
| WhatsApp, Salvar contato, QR | sim | sim | sim |
| Modelos e 8 estilos | todos | todos | todos |
| Personalizar fonte, cores, cards, cantos | — | sim | sim |
| "Feito com linkmural" no rodapé | aparece | removível | removível |
| Domínio próprio | — | — | sim |
| Métricas | total de cliques | por link e período | + origem e exportação CSV |
| Recursos de negócio (horários para agendar, catálogo, pixel) | — | — | sim |

Constante única no código: `src/lib/plans.ts` (limites, preços, recursos). O banco também confere páginas, links, marca e domínio (§5).

## 2. Stack e pacotes

- Node 22 LTS, npm.
- Next.js estável mais recente, App Router, TypeScript `strict`, `src/` dir, alias `@/`.
- Tailwind CSS (v4, tokens via `@theme` em `src/styles/tokens.css`).
- `@supabase/supabase-js` + `@supabase/ssr`.
- `stripe`.
- `resend` + `react-email`.
- `zod` (validação de formulários e APIs).
- `simple-icons` (logos de redes, CC0).
- `qrcode`.
- `@dnd-kit/core` + `@dnd-kit/sortable` (ordenar links).
- `ua-parser-js` (só para classificar aparelho; não guardar o UA).
- Testes: Vitest (unidade) e Playwright (fluxos: onboarding, publicar, limite de links, checkout em modo de teste).
- Lint e formatação: ESLint + Prettier. Script `typecheck` = `tsc --noEmit`.

Fontes via `next/font/google`:
- Painel: Unbounded 600 (títulos) e Inter (texto).
- Página pública: carregar **só** a fonte do estilo ou tema escolhido (Inter, DM Sans, Plus Jakarta Sans, Space Grotesk, Sora, Fraunces).

## 3. Estrutura de pastas

```
src/
  app/
    (marketing)/page.tsx            # landing com o campo linkmural.com/___
    (marketing)/planos/page.tsx
    (marketing)/termos, privacidade
    entrar/page.tsx                 # login (link mágico + Google)
    auth/callback/route.ts
    onboarding/[step]/page.tsx      # 7 passos (§9)
    app/                            # painel do cliente (§10), protegido
      layout.tsx                    # sidebar desktop / tab bar mobile
      page.tsx                      # Início
      pagina/ aparencia/ informacoes/ metricas/ plano/
    admin/                          # painel admin (§11), só role=admin
    [slug]/
      page.tsx                      # página pública (§7)
      opengraph-image.tsx
      contato.vcf/route.ts          # Salvar contato
      qr/route.ts                   # QR em PNG/SVG
    l/[linkId]/route.ts             # registra clique e redireciona
    api/
      slug/check/route.ts           # disponibilidade + reserva de 30 min
      v/route.ts                    # registra visita (beacon)
      report/route.ts               # denúncia
      stripe/checkout/route.ts
      stripe/portal/route.ts
      stripe/webhook/route.ts
      revalidate/route.ts
  components/
    ui/                             # Button, Input, Switch, Badge, Chip, Segmented, Avatar, Alert, Toast, Skeleton, Progress, EmptyState, Dialog, IconPicker
    public-page/                    # Balcao, Mosaico, Cartao, LinkCard, Header, ActionBar, Footer
    app/                            # LinksEditor, AppearanceForm, PhonePreview, StatsCards...
  lib/
    plans.ts  styles.ts  theme.ts  icons.ts  link-detect.ts  whatsapp.ts  vcard.ts  slug.ts  analytics.ts
    supabase/{server.ts, client.ts, admin.ts, types.ts}
    stripe.ts  email/
  middleware.ts
  styles/{tokens.css, globals.css}
supabase/migrations/                # já tem a migração inicial
design/                             # material do manual (somente referência)
```

## 4. Rotas e middleware

`middleware.ts`:
1. Atualiza a sessão do Supabase (padrão `@supabase/ssr`).
2. `/app/*` e `/onboarding/*` exigem login; sem sessão → `/entrar?next=...`.
3. `/admin/*` exige `profiles.role = 'admin'` (conferir no layout do admin, no servidor).
4. **Domínio próprio:** se o host não estiver em `NEXT_PUBLIC_ROOT_HOSTS`, chamar o RPC `page_slug_for_host(host)` (cache em memória por 5 min) e fazer `rewrite` para `/<slug>`. Sem resultado → 404 com a marca Linkmural.
5. Página pública sem sessão: o middleware não deve fazer nada além do item 4. Use `matcher` para pular estáticos.

Endereços reservados ficam na tabela `reserved_slugs`. Toda rota de primeiro nível do app precisa estar nela. A migração já inclui: `admin`, `app`, `entrar`, `api`, `l`, `onboarding`, `planos` e outros.

## 5. Banco de dados

A migração está em `supabase/migrations/20261120140044_init.sql`. Ela já foi testada num Postgres local com a simulação do `auth`/`storage`.

| Tabela | Para quê |
|---|---|
| `profiles` | Dono da conta (1:1 com `auth.users`, criado por gatilho). Tem `role` (`user`/`admin`), `plan` e `stripe_customer_id`. O usuário só pode alterar `full_name`. |
| `pages` | A página pública: `slug`, `template`, `style`, `theme` (jsonb), dados do negócio, `hours`, `show_branding`, `published`, `onboarding_step`, `blocked_at`. |
| `links` | Cards: `kind` (link, whatsapp, contact, pix, email, phone, map), `title`, `subtitle`, `url`, `icon` (`si:`/`lm:`), `featured`, `position`, `active`. |
| `subscriptions` | Espelho do Stripe. Gravado só pelo webhook. Um gatilho recalcula `profiles.plan`. |
| `click_events` | Visitas e cliques (`event`: view, click, whatsapp, contact, qr), com `referrer_host`, `utm_source`, `country` e `device`. Não guarda IP. |
| `domains` | Domínio próprio (plano Negócios). Status `pending`/`active`/`failed`. |
| `reports` | Denúncias da página pública. |
| `reserved_slugs`, `slug_holds` | Endereços bloqueados e reserva de 30 min feita na landing. |

Gatilhos e regras já prontos:
- **Grátis:** limite de 1 página e 5 links; `show_branding` é forçado para `true`.
- **Pro:** 1 página. **Negócios:** 3 páginas e domínio próprio.
- `published_at` é preenchido automaticamente.
- Erros com mensagem `plan_limit_links`, `plan_limit_pages`, `plan_required_business` e `slug_reserved`. O app traduz cada um num aviso amigável com convite ao plano certo.
- **RLS:**
  - O dono faz tudo nas próprias páginas e links.
  - Página publicada e não bloqueada é de leitura pública. Links públicos são os ativos e não sinalizados.
  - Cliques só podem ser lidos pelo dono. Quem grava é o servidor.
  - Admin vê tudo.
- **RPCs:**
  - `is_slug_available(slug)`, liberado para `anon`.
  - `page_slug_for_host(host)`, liberado para `anon`.
  - `page_stats_daily(page, from, to)`, que respeita o RLS de quem chama.
- **Storage:**
  - Bucket público `media`: PNG, JPG ou WEBP, até 2 MB, pasta `<user_id>/`.
  - Redimensionar no cliente antes de enviar: avatar 512px, capa 1600px.

Depois de aplicar:
1. Ativar os provedores Email e Google em Auth.
2. Definir a Site URL e as Redirect URLs: `http://localhost:3000/auth/callback` e `https://linkmural.com/auth/callback`.
3. Configurar o SMTP do Resend em Auth, com remetente `oi@linkmural.com`.
4. Personalizar o e-mail do link mágico em português.

## 6. Design no código

Fonte da verdade: a pasta `design/`.

| Arquivo | O que tem |
|---|---|
| `tokens.json` | Cores do painel com valor claro e escuro: paper `#F4F4EF`, surface `#FFFFFF`, ink `#0E0E0E`, ink-muted `#6B6B66`, line `#E2E2DC`, lime `#CDF54A`, lime-strong `#BCE635`, lime-soft `#EEF9C6`, positive/warning/negative e outras. Também raios (8/12/20/28/pill), sombras, durações (120/200/320/480ms) e curvas (`ease-out`, `ease-in-out`, `ease-pin`). |
| `bundle.css` | Todas as classes `lm-*` com estados (hover, pressionado, foco, desativado). Use como **referência de comportamento** para recriar em componentes React + Tailwind. Não importe o arquivo inteiro. |
| `components/<Nome>/preview.html` + `README.md` | Prévia e regras de cada componente (26 no total). O inventário está em `componentes.md`, com a fase de cada um (MVP ou Fase 2). |
| `brand-book.md` | Voz, logo e uso de cores. |
| `assets/logos/*.svg` | Logo, símbolo, ícone do app e versões negativa e limão. |
| `assets/icons/*.svg` | Ícones da marca em SVG. |
| `styles.json` | Os 8 estilos da página pública, com fonte e paleta, tamanhos de card, preenchimentos e raio. |
| `theme-reference.js` | Gerador usado nos protótipos. A função `buildTheme(props)` mostra como estilo + ajustes viram variáveis CSS (paleta personalizada, contraste, tamanhos, preenchimento do card). Porte a lógica para `src/lib/theme.ts`. |
| `link-icons.json` / `lm-icons.json` | Mapa de reconhecimento por domínio, grupos do seletor, sinônimos da busca e os caminhos SVG dos ícones de traço. |

Implementação:
- `src/styles/tokens.css`: os tokens viram `:root { --paper: ... }` e `[data-theme="dark"] {...}`. No Tailwind, `@theme` aponta para essas variáveis (`bg-paper`, `text-ink`, `bg-lime`, `rounded-lg` = 20px...).
- Painel: fundo `paper`, cards `surface`, texto pequeno (13–14px), ícones de traço 1,8px, visual limpo estilo Apple. Sidebar no desktop; tab bar embaixo no celular.
- Movimento: alfinete que cai (`duration-pin` + `ease-pin`) ao publicar, salvar e no link em destaque. O resto é discreto. Desligar tudo com `prefers-reduced-motion`.

## 7. Página pública `/[slug]`

### 7.1 Renderização e desempenho
- Server Component. Busca página + links publicados com o cliente anônimo, através do RLS.
- Cache por tag `page:<slug>`: o painel chama `revalidateTag` ao salvar ou publicar. Na Hostinger, o app dorme sem visitas, então o Cloudflare na frente guarda o HTML: `Cache-Control: s-maxage=60, stale-while-revalidate=86400`.
- JS no cliente só para: beacon de visita, copiar Pix, compartilhar e abrir o QR. Nada de bibliotecas de UI na página pública.
- `generateMetadata`: título "Nome · linkmural", descrição = bio. `opengraph-image` com nome, avatar e cores do estilo.
- Página não publicada ou bloqueada → 404 próprio. Página bloqueada mostra "Esta página está indisponível".

### 7.2 Estrutura (comum aos 3 modelos)
1. **Cabeçalho:** avatar ou iniciais, nome, `kind`, bio, status ("Aberto agora · até 22h", calculado de `hours` no fuso America/Sao_Paulo), cidade.
2. **Barra de ações:** WhatsApp (`kind=whatsapp`, abre `https://wa.me/<digits>?text=<msg opcional>`), Salvar contato (`/<slug>/contato.vcf`, vCard 3.0 com nome, telefone, e-mail, site, endereço e foto em URL), Compartilhar (Web Share API, com fallback de copiar) e QR.
3. **Link em destaque** (`featured`), com alfinete lime.
4. **Lista ou grade de links**, em `position` crescente. `href="/l/<linkId>"`, com `rel="nofollow noopener"`.
5. **Rodapé:** "Feito com linkmural" (link para a landing com `?ref=<slug>`), se `show_branding`, e o botão "Denunciar" discreto.

Modelos (desenhados no artefato de telas):
- **Balcão:** lista vertical com CTA principal e horários rápidos ("Hoje 18h").
- **Mosaico:** grade bento de blocos de 2 tamanhos.
- **Cartão:** cartão de visita com ações grandes e links compactos.

### 7.3 Tema (`pages.theme`)
```ts
type Theme = {
  font?: 'Inter'|'DM Sans'|'Plus Jakarta Sans'|'Space Grotesk'|'Sora'|'Fraunces'   // Pro+
  palette?: 'style' | 'custom'                                                    // Pro+
  accent?: string; background?: string                                           // hex, quando custom
  cardSize?: 'compact'|'regular'|'large'                                         // Pro+
  cardFill?: 'solid'|'outline'|'tint'|'accent'                                   // Pro+
  radius?: number                                                                // 0–32, Pro+
  iconColor?: 'brand'|'style'                                                    // todos
}
```
- `resolveTheme(style, theme, plan)` em `src/lib/theme.ts` devolve as variáveis CSS (`--bg`, `--surface`, `--ink`, `--muted`, `--accent`, `--on-accent`, `--line`, `--soft`, `--radius`, tamanhos).
- **No Grátis, ignora os campos marcados como Pro+**: a regra vale na renderização e não depende da interface.
- Paleta personalizada: calcular `onAccent`, `surface`, `line` e `muted` a partir do fundo e do acento, com contraste mínimo de 4,5:1 (ver `buildTheme` em `design/theme-reference.js`).

### 7.4 Ícones dos links
- `icon = 'si:<slug>'` → `simple-icons` (`import { siInstagram } from 'simple-icons'`). Usa `path` em `viewBox 0 0 24 24` com `fill=currentColor`.
  - Cor: `#hex` da marca quando `theme.iconColor = 'brand'` (padrão), ou `var(--ink)` quando `'style'`.
  - Marcas pretas (TikTok, X, Threads, GitHub) sempre usam `var(--ink)`, para funcionar no estilo Dark.
- `icon = 'lm:<nome>'` → caminhos de `design/lm-icons.json` (traço 1,8px).
- Montar um mapa só com os ícones usados (`src/lib/icons.ts`) para o pacote não ficar grande. Não importar o `simple-icons` inteiro no cliente.
- LinkedIn e Kwai não estão no Simple Icons e por ora usam traço. Logos oficiais deles só a partir dos kits de marca das empresas.
- Logos são marcas de terceiros: usar só para apontar ao perfil do cliente, sem distorcer.

### 7.5 Métricas sem dados pessoais
- **Visita:** um componente client chama `navigator.sendBeacon('/api/v', {pageId, ref: document.referrer, utm})` uma vez por sessão (sessionStorage).
- **Clique:** `/l/[linkId]` busca o link (cache), grava `click_events` com a service role e responde 302 para a URL. Para `kind=whatsapp`, grava `event='whatsapp'`. Os cliques em Salvar contato e QR também viram eventos.
- Gravar só:
  - `referrer_host` (hostname do Referer);
  - `utm_source`;
  - `country` (header `cf-ipcountry`);
  - `device` (mobile, desktop ou tablet, pelo UA, que é descartado em seguida).
- Ignorar bots (regex de UA: bot, crawler, spider, preview, facebookexternalhit, WhatsApp link preview) e prefetch (`Purpose: prefetch`, `Sec-Purpose`).
- **Limite de requisições:** regra no Cloudflare (por exemplo, 60 por minuto por IP em `/api/v` e `/l/*`). Não guardar IP no app.

## 8. Seletor de ícones e reconhecimento de links

Especificação em `design/components/IconPicker/README.md`; dados em `design/link-icons.json`.
- Ao colar o endereço:
  1. Normalizar a URL: adicionar `https://` se faltar e tirar o `www.`.
  2. Comparar o host com `domains` (vale também para subdomínios).
  3. Comparar com `schemes` (`tel:`, `mailto:` e `.pdf`).
  4. Verificar se é chave Pix (CPF, CNPJ, e-mail, `+55…` ou UUID). Se for, o link vira `kind=pix` com botão de copiar na página pública.
- O reconhecimento preenche `icon` e `title`, sem sobrescrever o que a pessoa já digitou.
- Seletor:
  - Busca com sinônimos ("zap", "insta", "pix", "cardápio").
  - Grupos: Redes sociais, Pagamentos e compras, Serviços, Contato e negócio.
  - Grade de 6 colunas. O item escolhido ganha contorno ink de 2px.
  - No celular, abre como Sheet.
- Validar URL ao salvar com `zod`: só `https:`, `http:`, `tel:`, `mailto:` ou chave Pix. Se houver `GOOGLE_SAFE_BROWSING_KEY`, conferir a URL; se for perigosa, recusar com uma mensagem clara.

## 9. Onboarding (7 passos, menos de 3 minutos, sem cartão)

| # | Tela | Pede | Obrigatório | Notas |
|---|---|---|---|---|
| 1 | Endereço | `linkmural.com/___` já na landing, com aviso na hora (debounce de 300ms em `/api/slug/check`) | sim | Ocupado → 3 sugestões livres (`nome-cidade`, `nomefit`, `nome-oficial`). 3–30 caracteres: letras minúsculas, números e hífen. Reserva de 30 min em `slug_holds`, guardada em cookie com o token. |
| 2 | Conta | Google (1 toque) ou e-mail com link mágico | sim | Na volta do login, cria a `page` com o slug reservado (`onboarding_step=3`) e apaga a reserva. |
| 3 | Estilo | Cards com os 8 estilos nas próprias cores | sim | Pulou → Classic |
| 4 | Dados | Nome, WhatsApp e cidade; logo opcional | só o nome | Com WhatsApp, cria o link `kind=whatsapp` |
| 5 | Primeiros links | Chips (Agenda, WhatsApp, Instagram, Loja, Cardápio, Portfólio, Site) e um campo de endereço para cada um | não | Mostra o aviso "até 5 no Grátis" sem bloquear |
| 6 | Modelo | Balcão, Mosaico e Cartão já com os dados da pessoa | não | Balcão vem marcado |
| 7 | Publicar | "Publicar minha página" → tela de sucesso com link, Copiar, QR e "Como colocar na bio do Instagram" | — | Animação do alfinete |

- Cada passo salva no banco (`onboarding_step`); quem voltar continua de onde parou.
- Barra de progresso no topo e botão principal fixo embaixo.
- Teclado certo para cada campo (`inputmode="tel"`, `type="url"`).
- Os planos pagos **não aparecem** em nenhuma tela do onboarding.

Eventos (`src/lib/analytics.ts`; começar com uma tabela simples ou PostHog):
`slug_escolhido`, `conta_criada`, `estilo_escolhido`, `dados_salvos`, `links_adicionados`, `modelo_escolhido`, `pagina_publicada`, `link_copiado`, `qr_baixado`, `primeiro_clique`.

## 10. Painel do cliente `/app`

Telas desenhadas no artefato (versões desktop `Cliente-*` e mobile `Cliente-M-*`):
- **Início:**
  - Checklist "Deixe sua página completa" (logo e descrição, WhatsApp e horários, primeiro link, modelo, link na bio, QR no balcão).
  - Visitas e cliques dos últimos 7 dias.
  - Link da página com Copiar e QR.
- **Página:**
  - Editor de links: adicionar com o IconPicker, editar, ativar ou desativar, marcar destaque, arrastar para ordenar (dnd-kit; salvar `position` em lote).
  - Contador "3 de 5 links" no Grátis.
  - Prévia ao lado no desktop.
- **Aparência:**
  - Modelo, estilo, fonte, paleta, tamanho, preenchimento e cantos dos cards, e cor dos ícones.
  - Prévia ao vivo num celular.
  - Os controles Pro+ aparecem com cadeado e levam para Plano.
- **Informações:** nome, tipo, bio, avatar, capa, WhatsApp, e-mail, endereço, horários por dia da semana e endereço da página (trocar o slug avisa que o link antigo para de funcionar).
- **Métricas:**
  - Grátis: total de cliques.
  - Pro: por link e por período, com gráfico diário (`page_stats_daily`).
  - Negócios: também por origem e exportação CSV.
- **Plano:** plano atual, uso, botões Assinar (Checkout) e Gerenciar (Portal).
- **Celular:** tab bar com Início, Página, Prévia, Métricas e Mais (Aparência, Informações, Plano, Sair).
- **Erros de limite do banco** viram Alert com CTA "Ver planos". Salvamentos mostram um Toast ("Salvo").

## 11. Admin `/admin`

Telas desenhadas: Dashboard, Empresas (contas e plano), Usuários, Links, Informações, Planos, Temas, Faturamento, Domínios, Moderação, Atividades e Configurações.
- **MVP:**
  - Dashboard: contas, páginas publicadas, assinaturas ativas, MRR (vindo de `subscriptions`) e cliques do dia.
  - Empresas: busca, plano e ações suspender/reativar.
  - Moderação: fila de `reports`, bloquear página, sinalizar link.
- O resto entra depois do lançamento.
- Todas as ações do admin usam o cliente service role, no servidor, depois de conferir `is_admin`.

## 12. Cobrança (Stripe)

- Por enquanto só o produto **Linkmural Pro** (o Negócios volta na Fase 6, sem preço definido). Preços regulares em BRL, com `lookup_key`:
  - `pro_monthly` = 998 (R$ 9,98);
  - `pro_yearly` = 6000 (R$ 60,00).
- **Desconto de lançamento:** cupom `lancamento_50_12m` de 50% (`percent_off`), `duration=repeating` por 12 meses, aplicado pelo servidor no Checkout. O cliente paga R$ 4,99/mês ou R$ 30,00/ano e, depois dos 12 meses, o preço regular (no máximo o dobro: o salto é de propósito pequeno, para não gerar cancelamento na renovação). Usar `redeem_by` e `max_redemptions` para encerrar o lançamento. Conferir no sandbox que a renovação anual (mês 12) já cobra o preço regular e avisar o cliente antes (e-mail e tela Plano).
- Decisão de 21/11: foi descartado o desconto de 80% sobre R$ 24,95 (salto de 5× na renovação). Em seguida, o preço de R$ 14,90 e R$ 119,90 também foi descartado por não ser vendável; valem R$ 4,99 e R$ 30,00 no lançamento. O preço regular de R$ 9,98 e R$ 60,00 (usado no "de/por") deve ser validado com a lista de espera. Evitar R$ 9,99: 50% daria R$ 4,995, e o arredondamento da Stripe é incerto.
- **Outras regiões (EUA, Europa, México, América Latina):** preços por moeda em `currency_options` dos mesmos dois preços (padrão BRL); valores e Adaptive Pricing a decidir. Implica imposto (IVA, sales tax) e tradução da interface.
- `POST /api/stripe/checkout`:
  1. Cria ou reaproveita o `customer` (salvar `profiles.stripe_customer_id`).
  2. Abre uma sessão `mode=subscription` com `client_reference_id=user.id`, `locale=pt-BR`, `allow_promotion_codes=true`.
  3. Retorno para `/app/plano?ok=1`.
- `POST /api/stripe/portal`: sessão do Portal do Cliente (trocar plano, cartão, cancelar).
- `POST /api/stripe/webhook`:
  - Verifica a assinatura com `STRIPE_WEBHOOK_SECRET` (body bruto).
  - Trata `checkout.session.completed`, `customer.subscription.created|updated|deleted` e `invoice.payment_failed`.
  - Faz upsert em `subscriptions` com a service role. O gatilho atualiza `profiles.plan`.
  - Precisa ser idempotente.
- **Downgrade:** links acima de 5 ficam `active=false` (não apagar); domínio e páginas extras são despublicados. O painel avisa o que mudou.
- Em aberto: Pix (decidir se entra no lançamento). Começar só com cartão.
- Testar tudo em modo de teste com `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## 13. Domínio próprio (plano Negócios)

- Cloudflare for SaaS (Custom Hostnames) na zona linkmural.com, com origem de fallback na Hostinger.
- Fluxo:
  1. O cliente digita `links.suaempresa.com.br`.
  2. O app cria o custom hostname pela API do Cloudflare e grava `domains` (`pending`, `cf_hostname_id`).
  3. A tela mostra o CNAME para `cname.linkmural.com`.
  4. Uma verificação periódica (botão "Verificar agora" e cron no Supabase) passa o status para `active`.
- O middleware resolve o host (§4).
- Se travar, lançar o plano Negócios sem domínio e adicionar depois.

## 14. E-mails (Resend, remetente do domínio linkmural.com)

| Quando | E-mail |
|---|---|
| Na hora de publicar | "Sua página está no ar", com link e QR |
| Dia 1 | "Coloque seu link na bio" (Instagram e WhatsApp Business) |
| Dia 3 | "Seus primeiros cliques" (só se houver cliques) |
| Dia 7 | Dica ligada aos links escolhidos |
| Ao bater 5 links | "Você chegou ao limite do Grátis" |
| Cadastro parado | "Sua página está quase pronta", 1h e 24h depois |
| Cobrança | Recibo e falha de pagamento (pode usar os e-mails do próprio Stripe) |

A Hostinger não roda tarefas em segundo plano. Por isso os e-mails agendados ficam no Supabase: `pg_cron` chama uma Edge Function que consulta quem deve receber e envia pelo Resend.

## 15. Deploy na Hostinger

1. No hPanel: Websites → adicionar site → **App Node.js** → conectar o GitHub e escolher o repositório, branch `main`, framework Next.js, Node 22.
2. Build: `npm ci && npm run build`. Start: `npm start` (porta fornecida pela Hostinger via `PORT`).
3. Cadastrar as variáveis de `.env.example` no painel do app.
4. Domínio linkmural.com e `www` no app. SSL ativo.
5. Criar um segundo app para **homologação**, ligado à branch `develop` e a um subdomínio (ex.: `beta.linkmural.com`), com chaves de teste do Stripe. O plano Unlimited permite até 5 apps.
6. Cloudflare na frente:
   - Proxy ligado.
   - Regra de cache para o HTML de `/[slug]`.
   - Bypass para `/app`, `/admin`, `/api`, `/auth`, `/onboarding`.
   - Limite de requisições em `/api/v` e `/l/*`.
7. Limites da Hostinger: o app dorme sem tráfego e cada requisição tem até 120 segundos. Nada de processos longos no app.

## 16. Segurança e LGPD

- RLS em tudo (já na migração). Service role só no servidor.
- Validar toda entrada com `zod`. Sanitizar textos e nunca renderizar HTML vindo do usuário.
- Headers de segurança: CSP, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'` no painel.
- Endereços reservados e de marcas (`reserved_slugs`), botão Denunciar e checagem de links perigosos.
- Termos de uso e Política de Privacidade publicados antes do beta.
- Métricas sem IP. Cookie só de sessão e de reserva do endereço (não precisa de banner de cookies, mas descrever na política).
- Excluir conta: apagar `auth.users`; o cascade apaga o resto. Também cancelar a assinatura no Stripe.

## 17. Definição de pronto (vale para cada tarefa)

- `lint`, `typecheck`, testes e `build` passando.
- Funciona em 375px de largura e no desktop. Textos em pt-BR. Estados de carregamento (Skeleton), vazio (EmptyState) e erro tratados.
- Acessível: foco visível, rótulos, contraste e alvo de 44px.
- Página pública com Lighthouse mobile ≥ 90 em desempenho e acessibilidade.
- Nenhum segredo no client bundle (`server-only` nos módulos com chaves).
