# Fase 3 · Painel do cliente

Plano de implementação · 20/11/2026 · Referências: `docs/HANDOFF.md` §10, Fase 3 do `docs/ROADMAP.md` e as telas `Cliente-*` (computador) e `Cliente-M-*` (celular) do canvas “Linkmural — telas e marca”.

**Meta:** o dono mantém a página inteira só pelo celular: links, visual, dados, horários e métricas.

**Pronto quando:** dá para editar tudo pelo celular em `/app`, cada alteração aparece na página pública na hora e os testes de ponta a ponta do painel passam. Depois disso abre o beta fechado (10 a 20 negócios).

---

## Decisões antes de começar

Os desenhos têm três pontos que não batem com o banco ou com o handoff. Recomendação em negrito.

| # | Ponto | Opções | Recomendação |
|---|---|---|---|
| 1 | **Rascunho x publicação.** As telas Página e Aparência têm “Desfazer” e “Publicar” (“publique quando estiver pronto”). O handoff diz que cada alteração salva e mostra o Toast “Salvo”. O banco não tem rascunho. | (a) Salvar direto na página no ar, com Toast “Salvo”. (b) Criar rascunho separado (colunas e tabelas novas, botão Publicar). | **(a) Salvar direto.** Mais simples, igual ao handoff e sem risco de a pessoa esquecer de publicar. O botão “Publicar” só aparece enquanto a página não está publicada. “Desfazer” vira desfazer da última ação (Toast com “Desfazer”). |
| 2 | **Atalhos de contato liga/desliga.** A tela Página tem chaves para WhatsApp, Salvar contato e Como chegar. Hoje eles aparecem sempre que o dado existe. | (a) Nova coluna `pages.actions` (jsonb) com as chaves. (b) Mostrar sempre que houver o dado. | **(a) Nova coluna**, migração pequena. |
| 3 | **Telefone separado do WhatsApp.** A tela Informações tem “Telefone”; o banco só tem `whatsapp` (hoje “Ligar” usa o WhatsApp). | (a) Nova coluna `pages.phone`. (b) Manter só o WhatsApp. | **(a) Nova coluna.** “Ligar” e o vCard usam o telefone e, sem ele, o WhatsApp. |

Outras escolhas (já decididas, diga se discordar):
- **Gráfico diário de cliques no Grátis:** o desenho mostra o gráfico para todos e trava só “cliques por link e origem”. Seguir o desenho: Grátis vê totais e o gráfico de 7 ou 30 dias; Pro ganha cliques por link e qualquer período (Fase 5).
- **Capa:** nenhum dos 3 modelos mostra capa hoje. Fica fora da Fase 3.
- **Tela Plano e cobrança:** entra com os 3 planos e os preços, mas os botões de assinar ficam como “Em breve” até a Fase 4 (Stripe).
- **Sem telas de admin, cobrança, domínio ou várias páginas:** Fases 4 a 7.

---

## Estrutura

```
src/app/(site)/app/
  layout.tsx            # sidebar (computador) + tab bar (celular), dados da conta e da página
  page.tsx              # Início
  pagina/page.tsx       # Links
  aparencia/page.tsx    # Modelo, estilo e personalização
  informacoes/page.tsx  # Dados, contato, horários, endereço da página
  metricas/page.tsx     # Métricas
  plano/page.tsx        # Planos (assinar em breve)
  previa/page.tsx       # Prévia em tela cheia (celular)
  mais/page.tsx         # Menu “Mais” (celular)
  actions/              # server actions por área
src/components/app/     # Sidebar, TabBar, PhonePreview, LinksEditor, IconPicker, HoursEditor, StatsCards, ClickChart…
```

- **Computador:** sidebar à esquerda (logo, seletor de página, menu, cartão “Seja Pro”, conta e Sair), conteúdo no meio e prévia de celular à direita nas telas Página, Aparência e Informações.
- **Celular:** cabeçalho com o nome do negócio, conteúdo e **tab bar fixa embaixo**: Início, Página, Aparência, Métricas, Mais (como no desenho `Cliente-M-*`). A prévia abre em tela cheia pelo botão “Ver prévia”.
- O painel exige login (já feito no `proxy.ts`). Quem ainda não terminou o cadastro vai para o passo salvo em `onboarding_step`.

---

## Etapas de implementação

### A · Layout do painel
- `app/layout.tsx` carrega a conta (`profiles`) e a página do dono uma vez e passa para as telas.
- Sidebar e tab bar com o item ativo (`aria-current="page"`), foco visível e alvos de 44 px.
- Toast global (“Salvo”, “Link copiado”) e Alert para os erros de limite do banco com o botão “Ver planos”.
- `PhonePreview`: a página pública real (`PublicPageView` em modo prévia) dentro de uma moldura de celular, atualizada a cada alteração.

### B · Início
- Saudação, link da página com “Publicada” ou “Rascunho”, botões Copiar link, QR code e Ver página.
- Cartões: cliques e visitas em 30 dias (com variação sobre o período anterior), “X de 5 links” no Grátis com barra, link mais clicado (travado no Grátis, como no desenho).
- Checklist “Deixe sua página completa” (6 itens), marcado com o que já existe: logo e descrição, WhatsApp e horários, primeiro link, modelo escolhido, link na bio do Instagram e QR no balcão. Os dois últimos ficam marcados quando a pessoa usa “Copiar link” e “Baixar QR” (guardado em `onboarding_events`).
- Convite ao Pro só quando estiver perto do limite de links.

### C · Página (links)
- **Botão principal:** o link em destaque (`featured`), com troca rápida.
- **Atalhos de contato:** chaves para WhatsApp, Salvar contato e Como chegar (decisão 2).
- **Lista de links:** adicionar com o **IconPicker**, editar, ativar ou desativar, marcar destaque, excluir com confirmação (Dialog) e **arrastar para ordenar** com `@dnd-kit` (no celular, segurar e arrastar). As posições são salvas em lote.
- **IconPicker** (`design/components/IconPicker/README.md`): busca com sinônimos (“zap”, “insta”, “cardápio”), 4 grupos, grade de 6 colunas, item escolhido com contorno de 2 px, navegação por setas. No celular abre como folha de baixo (Sheet).
- Reconhecimento automático ao colar o endereço (`detectLink`), sem sobrescrever o título digitado. Validação com `linkUrlSchema`.
- Contador “3 de 5 links” no Grátis; o erro `plan_limit_links` vira Alert com “Ver planos”.

### D · Aparência
- **Modelo:** Balcão, Mosaico, Cartão.
- **Estilo:** os 8, em cards com as cores de cada um.
- **Personalização (Pro+):** fonte, cores próprias (fundo e acento), tamanho dos cards, fundo dos cards, cantos e remover “Feito com linkmural”. No Grátis aparecem com cadeado e levam para Plano. Validação no servidor com `themeSchema`; o banco já força a marca no Grátis.
- **Cor dos ícones** (todos os planos): oficial ou do estilo.
- Prévia ao vivo antes de salvar; salvar grava e mostra “Salvo”.

### E · Informações
- **Identidade:** logo (envio com redução para 512 px, como no onboarding, e “Remover”), nome do negócio, categoria (`kind`), descrição (até 160 caracteres, com contador).
- **Contato:** WhatsApp, telefone (decisão 3), e-mail, endereço e cidade.
- **Horário de funcionamento:** cada dia da semana com liga/desliga e até 2 faixas (para almoço), gravado em `pages.hours` no formato já usado por `src/lib/hours.ts`.
- **Endereço da página:** trocar o endereço com verificação ao vivo (`/api/slug/check`) e aviso claro: “o link antigo para de funcionar”. Atualiza o cache do endereço antigo e do novo.

### F · Métricas
- Cartões: visitas, cliques no total, toques no WhatsApp (período escolhido), com variação sobre o período anterior.
- Gráfico de cliques por dia (7 ou 30 dias) com `page_stats_daily`.
- Bloco “Cliques por link e origem dos visitantes” travado no Grátis (Pro e Negócios nas Fases 5 e 6).
- Nova migração: `page_stats_daily` passa a contar os dias no fuso **America/Sao_Paulo** (hoje conta em UTC, e um clique às 22h cai no dia seguinte).

### G · Plano, Mais e Sair
- **Plano e cobrança:** plano atual, uso (páginas e links) e os 3 planos com preços de `src/lib/plans.ts`. Assinar fica “Em breve” até a Fase 4.
- **Mais (celular):** Informações do negócio, Plano e cobrança, Sair.

### H · Atualização da página pública
- Toda ação que muda a página chama `updateTag` (leitura imediata do que foi salvo) na tag da página e, nos links, na tag do link.
- Ações do servidor sempre conferem o dono pela sessão (RLS) e validam a entrada com `zod`.

### I · E-mail “Sua página está no ar”
- `resend` + `react-email`, remetente `oi@linkmural.com`, enviado ao publicar (no onboarding e no painel), com o link e o QR.
- Sem `RESEND_API_KEY` o envio é pulado sem quebrar nada.

### J · Testes
- Unidade: horários (editor ↔ formato do banco), ordenação, IconPicker (busca e sinônimos), formatação dos números.
- Playwright no celular, com usuário temporário (como no onboarding): adicionar, editar, reordenar e excluir link; trocar estilo e modelo; editar dados e horários; conferir na página pública.

---

## Migração da Fase 3

```sql
alter table public.pages
  add column phone text check (phone ~ '^\+?[0-9]{10,15}$'),
  add column actions jsonb not null default '{}'::jsonb; -- {"whatsapp":true,"contact":true,"directions":true}
-- liberar as novas colunas para o dono editar
grant update (phone, actions) on public.pages to authenticated;
-- page_stats_daily no fuso America/Sao_Paulo
```

## Depende de você
- **Conta no Resend** e o domínio `linkmural.com` verificado lá (registros de DNS na Hostinger), para o e-mail “Sua página está no ar” e para o SMTP do login por e-mail. Depois, `RESEND_API_KEY` no `.env.local` e nos dois sites da Hostinger.
- **Decisões 1, 2 e 3** acima.
