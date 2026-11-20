# Linkmural

Página de links para negócios e profissionais (linkmural.com/<endereco>). Mobile first, 3 modelos × 8 estilos, planos Grátis / Pro / Negócios.

Leia antes de começar qualquer tarefa:
- `docs/HANDOFF.md`: especificação completa (rotas, dados, planos, telas, cobrança, deploy).
- `docs/ROADMAP.md`: fases em ordem, com critérios de pronto. Trabalhe **uma fase por vez** e marque os itens concluídos.
- `design/`: manual da marca em código. Tokens, classes `lm-*`, estilos, ícones e prévias dos componentes.

## Stack
- Next.js (App Router, TypeScript strict, Server Components por padrão) + Tailwind CSS
- Supabase: Auth (link mágico + Google), Postgres com RLS, Storage (`media`); cliente via `@supabase/ssr`
- Stripe Checkout + Portal do Cliente + webhook
- Resend para e-mails; `simple-icons` para logos de redes; `qrcode` para QR
- Hospedagem: Hostinger (app Node.js ligado ao GitHub, deploy da branch `main`), Cloudflare na frente

## Comandos
```bash
npm run dev          # localhost:3000
npm run lint && npm run typecheck && npm test   # rodar antes de todo commit
npm run build        # o mesmo build da Hostinger
supabase db push     # aplica supabase/migrations no projeto ligado
supabase gen types typescript --linked > src/lib/supabase/types.ts
```

## Regras do projeto
- **Interface em português do Brasil.** Código, nomes de arquivos e commits em inglês.
- **Segurança no banco:** toda tabela com RLS. Limites de plano já são conferidos por gatilhos (`plan_limit_links`, `plan_limit_pages`, `plan_required_business`). Trate esses erros na tela com mensagens amigáveis. Nunca confie só na interface.
- `SUPABASE_SERVICE_ROLE_KEY` só em código de servidor (`server-only`): webhooks, registro de cliques, reserva de endereço, admin.
- Nunca gravar IP nem user agent completo de visitantes (LGPD). Cliques guardam só origem, país, tipo de aparelho.
- Mudança de banco = nova migração em `supabase/migrations/` (nunca editar uma já aplicada). Depois, regenerar os tipos.
- **Design:** usar os tokens de `design/tokens.json` (variáveis CSS + Tailwind) e o comportamento das classes de `design/bundle.css`. Nada de cores soltas no painel. Na página pública, as cores vêm do estilo (`design/styles.json`).
- Lime (`#CDF54A`) é fundo de botão primário, nunca cor de texto em fundo claro. Botão primário: fundo lime, texto ink.
- Área de toque mínima de 44px, foco visível, `prefers-reduced-motion` respeitado.
- Ícones: `si:<slug>` = logo oficial (Simple Icons), `lm:<nome>` = traço da marca (`design/lm-icons.json`). Não redesenhar logos de outras marcas.
- A página pública precisa ser rápida: Server Component, sem JS desnecessário, cache por tag e revalidação ao salvar. Meta: Lighthouse mobile ≥ 90.
- Commits pequenos, um assunto por commit. Não fazer push direto em `main` sem o build passar.
- Nunca commitar `.env*` (só `.env.example`).

## Ajustes ao handoff (o código vence o documento)
- Next.js 16: o antigo `middleware.ts` se chama `src/proxy.ts` (função `proxy`). Onde o HANDOFF diz `middleware.ts`, use `src/proxy.ts`.
- Clientes do Supabase ficam em `src/utils/supabase/{client,server,proxy}.ts` (não em `src/lib/supabase/`). O `admin.ts` (service role, `server-only`) e o `types.ts` entram na mesma pasta.
- A chave pública do Supabase é `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (não `ANON_KEY`).
- Build usa `next build --webpack` e `next.config.mjs` por compatibilidade com a glibc da Hostinger.
