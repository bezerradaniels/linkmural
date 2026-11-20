# Roadmap de implementação

Uma fase por vez. Antes de cada fase, leia as seções indicadas do `docs/HANDOFF.md`. Ao terminar, marque os itens, rode a definição de pronto (§17) e faça commit.

Datas do plano: início em 23/11, beta fechado (só Grátis) em 20/12, lançamento com planos pagos em 18/01.

---

## Fase 0 · Fundação (§2, §3, §5, §6, §15)
- [ ] Criar o app Next.js na raiz do repositório: TypeScript strict, Tailwind, `src/`, ESLint, Prettier, Vitest, Playwright, scripts `typecheck` e `test`.
- [ ] `src/styles/tokens.css` com os tokens de `design/tokens.json` (claro e escuro) e `@theme` do Tailwind; fontes Unbounded e Inter.
- [ ] Clientes do Supabase (`server.ts`, `client.ts`, `admin.ts` com `server-only`) e `middleware.ts` com sessão e proteção de `/app`, `/onboarding` e `/admin`.
- [ ] Ligar o Supabase CLI ao projeto, aplicar `supabase/migrations` e gerar `types.ts`.
- [ ] Login: `/entrar` com link mágico e Google; `/auth/callback`; sair.
- [ ] Componentes base do MVP em `src/components/ui`: Button, Input (com prefixo `linkmural.com/`), Switch, Checkbox, Badge, Chip, Segmented, Avatar, Alert, Toast, Skeleton, Progress, EmptyState, Dialog.
- [ ] Página `/dev/ui` (só em desenvolvimento) mostrando todos os componentes.
- [ ] Deploy na Hostinger com uma página "olá" em linkmural.com e homologação em `beta.linkmural.com`.

**Pronto quando:** dá para entrar com Google e com e-mail em produção, e o build da Hostinger sai sozinho a cada push.

## Fase 1 · Página pública (§7, §8)
- [ ] `src/lib/styles.ts` (de `design/styles.json`) e `src/lib/theme.ts` com `resolveTheme(style, theme, plan)` e testes de contraste.
- [ ] `src/lib/icons.ts` (Simple Icons sob demanda + `lm-icons`) e `src/lib/link-detect.ts` com testes para cada domínio de `design/link-icons.json` e para chaves Pix.
- [ ] Modelos Balcão, Mosaico e Cartão, com o LinkCard em 3 tamanhos e 4 preenchimentos e o link em destaque com alfinete.
- [ ] Cabeçalho com status calculado de `hours`, barra de ações (WhatsApp, Salvar contato `.vcf`, Compartilhar, QR) e rodapé com "Feito com linkmural" e Denunciar.
- [ ] `/l/[linkId]` (clique + redirecionamento), `/api/v` (visita), `/api/report`; filtro de bots e prefetch.
- [ ] Metadados, imagem OG e 404 próprio. Cache por tag e `revalidateTag`.
- [ ] Página de exemplo via seed (`studioforca`) para conferir os 3 modelos × 8 estilos.

**Pronto quando:** `/studioforca` abre em menos de 1s no 4G simulado, com Lighthouse mobile ≥ 90, e os cliques aparecem em `click_events` sem IP.

## Fase 2 · Onboarding (§9)
- [ ] Landing com o campo de endereço, `/api/slug/check` (disponível, sugestões, reserva de 30 min).
- [ ] 7 passos com progresso, rascunho salvo a cada passo e retomada.
- [ ] Tela de sucesso: link, copiar, QR para baixar e guia "colocar na bio".
- [ ] Eventos de analytics dos passos.
- [ ] Teste Playwright: da landing à página publicada.

**Pronto quando:** uma pessoa nova publica a página no celular em menos de 3 minutos.

## Fase 3 · Painel do cliente (§10)
- [ ] Layout: sidebar no desktop e tab bar no celular.
- [ ] Início (checklist e números de 7 dias).
- [ ] Página: editor de links com IconPicker, reconhecimento automático, ordenar arrastando, ativar e destacar. Aviso de limite traduzido de `plan_limit_links`.
- [ ] Aparência com prévia ao vivo e controles Pro+ com cadeado.
- [ ] Informações (dados, horários, upload de avatar e capa com redimensionamento, troca de endereço).
- [ ] Métricas (total no Grátis; gráfico diário já preparado para o Pro).
- [ ] E-mail "Sua página está no ar".

**Pronto quando:** dá para manter a página só pelo celular. → **Abrir o beta fechado (10 a 20 negócios).**

## Fase 4 · Cobrança (§12)
- [ ] Produtos e preços no Stripe (modo de teste) com `lookup_key`.
- [ ] Checkout, Portal e webhook idempotente → `subscriptions` → `profiles.plan`.
- [ ] Tela Plano e convites ao upgrade (limite de links, aparência, remover marca).
- [ ] Regras de downgrade (links extras desativados, páginas e domínio despublicados).
- [ ] Testes: assinar, trocar de mensal para anual, cancelar, falha de pagamento.

## Fase 5 · Pro (§7.3, §10)
- [ ] Personalização completa liberada (fonte, paleta personalizada, tamanho, preenchimento, cantos), além de remover a marca.
- [ ] Métricas por link e por período (DatePicker, ClickChart, DataTable).

## Fase 6 · Negócios (§13)
- [ ] Até 3 páginas e seletor de página no painel.
- [ ] Domínio próprio via Cloudflare for SaaS.
- [ ] Métricas por origem e exportação CSV.
- [ ] Horários para agendar, catálogo e pixel de anúncios (Meta e Google), na ordem que fizer sentido. Se o prazo apertar, ficam para depois.

## Fase 7 · Lançamento (§11, §14, §16)
- [ ] Admin MVP: Dashboard, Empresas, Moderação.
- [ ] E-mails agendados (pg_cron + Edge Function + Resend).
- [ ] Termos de uso e Política de Privacidade, página de planos e headers de segurança.
- [ ] Fluxo completo em modo de teste, troca para chaves de produção do Stripe e checklist de lançamento.

---

### Como pedir cada fase ao Claude Code
> Leia `CLAUDE.md`, `docs/HANDOFF.md` (seções X, Y) e a Fase N do `docs/ROADMAP.md`. Faça um plano curto, confirme comigo e implemente item por item, rodando lint, typecheck e testes ao final de cada um. Marque os itens concluídos no ROADMAP.
