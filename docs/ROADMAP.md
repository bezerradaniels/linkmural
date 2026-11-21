# Roadmap de implementação

Uma fase por vez. Antes de cada fase, leia as seções indicadas do `docs/HANDOFF.md`. Ao terminar, marque os itens, rode a definição de pronto (§17) e faça commit.

Datas do plano: início em 23/11, beta fechado (só Grátis) em 20/12, lançamento com planos pagos em 18/01. A ordem das fases foi revista em 20/11: o MVP de lançamento (Fase 4) vem antes da cobrança (Fase 8).

---

## Fase 0 · Fundação (§2, §3, §5, §6, §15)
- [x] Criar o app Next.js na raiz do repositório: TypeScript strict, Tailwind, `src/`, ESLint, Prettier, Vitest, Playwright, scripts `typecheck` e `test`.
- [x] `src/styles/tokens.css` com os tokens de `design/tokens.json` (claro e escuro) e `@theme` do Tailwind; fontes Unbounded e Inter.
- [x] Clientes do Supabase (`server.ts`, `client.ts`, `admin.ts` com `server-only`) e `middleware.ts` com sessão e proteção de `/app`, `/onboarding` e `/admin`. (Em `src/utils/supabase/` e `src/proxy.ts`, padrão do Next 16.)
- [x] Ligar o Supabase CLI ao projeto, aplicar `supabase/migrations` e gerar `types.ts`. (Aplicada pelo MCP do Supabase em 20/11; o CLI ainda não está instalado.)
- [x] Login: `/entrar` com link mágico e Google; `/auth/callback`; sair. (Google testado em produção em 20/11; link por e-mail depende do SMTP do Resend para chegar a quem não é da equipe, ver Fase 4 · A.)
- [x] Componentes base do MVP em `src/components/ui`: Button, Input (com prefixo `linkmural.com/`), Switch, Checkbox, Badge, Chip, Segmented, Avatar, Alert, Toast, Skeleton, Progress, EmptyState, Dialog.
- [x] Página `/dev/ui` (só em desenvolvimento) mostrando todos os componentes.
- [x] Deploy na Hostinger com uma página "olá" em linkmural.com e homologação em `beta.linkmural.com`. (20/11: `main` → linkmural.com e `develop` → beta.linkmural.com, ambos com build automático.)

**Pronto quando:** dá para entrar com Google e com e-mail em produção, e o build da Hostinger sai sozinho a cada push.

## Fase 1 · Página pública (§7, §8)
- [x] `src/lib/styles.ts` (de `design/styles.json`) e `src/lib/theme.ts` com `resolveTheme(style, theme, plan)` e testes de contraste.
- [x] `src/lib/icons.ts` (Simple Icons sob demanda + `lm-icons`) e `src/lib/link-detect.ts` com testes para cada domínio de `design/link-icons.json` e para chaves Pix.
- [x] Modelos Balcão, Mosaico e Cartão, com o LinkCard em 3 tamanhos e 4 preenchimentos e o link em destaque com alfinete.
- [x] Cabeçalho com status calculado de `hours`, barra de ações (WhatsApp, Salvar contato `.vcf`, Compartilhar, QR) e rodapé com "Feito com linkmural" e Denunciar.
- [x] `/l/[linkId]` (clique + redirecionamento), `/api/v` (visita), `/api/report`; filtro de bots e prefetch.
- [x] Metadados, imagem OG e 404 próprio. Cache por tag e `revalidateTag`.
- [x] Página de exemplo via seed (`studioforca`) para conferir os 3 modelos × 8 estilos.

**Feito em 20/11:** Lighthouse mobile no beta entre 94 e 100 em desempenho e 100 em acessibilidade, boas práticas e SEO; FCP 1,0 s. Visitas, cliques, WhatsApp, contato e QR gravados em `click_events` sem IP nem user agent; robôs e pré-carregamentos ignorados. Fora do escopo por ora: chips de horário do Balcão (Fase 6) e abas do Mosaico.

**Pronto quando:** `/studioforca` abre em menos de 1s no 4G simulado, com Lighthouse mobile ≥ 90, e os cliques aparecem em `click_events` sem IP.

## Fase 2 · Onboarding (§9)
- [x] Landing com o campo de endereço, `/api/slug/check` (disponível, sugestões, reserva de 30 min).
- [x] 7 passos com progresso, rascunho salvo a cada passo e retomada.
- [x] Tela de sucesso: link, copiar, QR para baixar e guia "colocar na bio".
- [x] Eventos de analytics dos passos.
- [x] Teste Playwright: da landing à página publicada.

**Pronto quando:** uma pessoa nova publica a página no celular em menos de 3 minutos.

## Fase 3 · Painel do cliente (§10)
- [x] Layout: sidebar no desktop e tab bar no celular.
- [x] Início (checklist e números de 7 dias).
- [x] Página: editor de links com IconPicker, reconhecimento automático, ordenar arrastando, ativar e destacar. Aviso de limite traduzido de `plan_limit_links`.
- [x] Aparência com prévia ao vivo e controles Pro+ com cadeado.
- [x] Informações (dados, horários, upload de avatar e capa com redimensionamento, troca de endereço).
- [x] Métricas (total no Grátis; gráfico diário já preparado para o Pro).
- [x] E-mail "Sua página está no ar".

**Pronto quando:** dá para manter a página só pelo celular. → **Abrir o beta fechado (10 a 20 negócios).**

## Fase 4 · Lançamento do MVP (plano em `docs/FASE-4-MVP.md`)
Substitui a antiga Fase 4 (Cobrança), que passou para a Fase 8. Tudo no plano Grátis; os planos pagos aparecem como "em breve", com lista de espera.

**Antes do primeiro convite**
- [ ] **A · E-mail de verdade:** domínio `linkmural.com` verificado no Resend (SPF, DKIM, DMARC), SMTP do Resend no Supabase Auth, modelos em português e `RESEND_API_KEY` / `EMAIL_FROM` nos dois sites. Falta conferir o cadastro por e-mail com um endereço de fora da equipe. (O envio de "Sua página está no ar" já está no código.)
- [x] **B · Admin MVP:** Dashboard (contas, páginas, funil do onboarding), Empresas (busca, suspender e reativar) e Moderação (bloquear página, sinalizar link, descartar denúncia), com registro em `admin_actions` e cache revalidado.
- [ ] Marcar a conta admin (`profiles.role = 'admin'`) em produção.
- [x] **C · Segurança:** cabeçalhos HTTP (CSP, `X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors` no painel e no admin), Google Safe Browsing ao salvar link (com `GOOGLE_SAFE_BROWSING_KEY`), aviso "Esta página está indisponível" para página bloqueada, reserva de endereço sem corrida, troca de endereço respeitando reservas e Toast acima da barra de abas.
- [x] **G · Conta e LGPD:** tela Minha conta e exclusão de conta (confirmando o endereço; apaga arquivos do `media` e o usuário).
- [ ] Revisão jurídica dos Termos e da Política de Privacidade (as páginas já existem).

**Primeira semana do beta**
- [x] **E · Aquisição:** landing completa, página `/planos` com "Quero ser avisado", tabela `waitlist`, origem de indicação (`?ref=`) gravada no onboarding, `sitemap.xml`, `robots.txt` e imagem de compartilhamento.
- [x] **H · Suporte:** tela Ajuda no painel e "Enviar sugestão" (tabela `feedback`, visível no admin).
- [x] Analytics: contêiner do GTM e eventos do GA4 (`docs/gtm/`).

**Logo depois**
- [ ] **I · Supabase separado para o beta e os testes e2e** (hoje o beta e a produção usam o mesmo projeto). Recomendado antes dos primeiros clientes reais.
- [ ] **Limite de requisições** em `/api/v`, `/l/*`, `/api/slug/check`, `/api/report` e `/api/waitlist` (hoje só o login tem). Pode vir da Cloudflare ou de um limitador no app.
- [ ] **D · Cloudflare na frente:** proxy, cache do HTML das páginas públicas, bypass em `/app`, `/admin`, `/api`, `/auth`, `/onboarding` e país do visitante nas métricas.
- [ ] **F · E-mails automáticos essenciais:** "Sua página está quase pronta" (1 h e 24 h) e "Coloque seu link na bio" (dia seguinte), via `pg_cron` + Edge Function + Resend.

**Pronto quando:** um negócio de fora se cadastra pelo Google ou por e-mail, publica a página e recebe o e-mail; o admin vê as contas e o funil, suspende uma conta e resolve uma denúncia; os planos pagos aparecem como "em breve"; e os 10 primeiros negócios convidados estão no ar.

## Fase 5 · Pro (§7.3, §10)
Liberado primeiro para quem estiver na lista de espera.
- [ ] Personalização completa liberada (fonte, paleta personalizada, tamanho, preenchimento, cantos), além de remover a marca.
- [ ] Métricas por link e por período (DatePicker, ClickChart, DataTable).

## Fase 6 · Negócios (§13)
- [ ] Até 3 páginas e seletor de página no painel.
- [ ] Domínio próprio via Cloudflare for SaaS.
- [ ] Métricas por origem e exportação CSV.
- [ ] Horários para agendar, catálogo e pixel de anúncios (Meta e Google), na ordem que fizer sentido. Se o prazo apertar, ficam para depois.

## Fase 7 · E-mails restantes e admin completo (§11, §14)
- [ ] Demais e-mails do §14 (além dos dois da Fase 4 · F).
- [ ] Admin completo: o que faltar do §11 além de Dashboard, Empresas e Moderação.
- [ ] Cabeçalhos de segurança revisados (CSP com nonce, se viável) e checklist de lançamento.

## Fase 8 · Cobrança (Stripe, §12)
Decisão de 21/11: por enquanto só **Grátis** e **Pro** (R$ 4,99/mês ou R$ 30,00/ano, que é 50% off do preço regular de R$ 9,98/mês e R$ 60,00/ano, por 12 meses; depois o preço dobra). O Negócios fica para a Fase 6.
- [x] Produto Pro, preços regulares (`pro_monthly`, `pro_yearly`) e cupom `lancamento_50_12m` criados na conta de teste do Stripe em 21/11.
- [ ] Validar o preço regular com a lista de espera e definir o fim do lançamento (`redeem_by`, `max_redemptions`).
- [ ] Preços por região (EUA, Europa, México e América Latina) via `currency_options` e/ou Adaptive Pricing; decidir valores, imposto (Stripe Tax) e idiomas.
- [ ] Checkout, Portal e webhook idempotente → `subscriptions` → `profiles.plan`.
- [ ] Tela Plano e convites ao upgrade (limite de links, aparência, remover marca); "Entrar na lista de espera" vira "Assinar".
- [ ] Regras de downgrade (links extras desativados, páginas e domínio despublicados).
- [ ] Testes: assinar, trocar de mensal para anual, cancelar, falha de pagamento.
- [ ] Cancelar a assinatura e apagar o customer na Stripe ao excluir a conta (`deleteAccountAction`).
- [ ] Fluxo completo em modo de teste, troca para as chaves de produção do Stripe e checklist final.

---

### Como pedir cada fase ao Claude Code
> Leia `CLAUDE.md`, `docs/HANDOFF.md` (seções X, Y) e a Fase N do `docs/ROADMAP.md`. Faça um plano curto, confirme comigo e implemente item por item, rodando lint, typecheck e testes ao final de cada um. Marque os itens concluídos no ROADMAP.
