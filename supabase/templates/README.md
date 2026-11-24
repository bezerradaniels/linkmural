# E-mails do login (Supabase Auth)

O Supabase Auth é quem envia o e-mail do login por link mágico (via SMTP do Resend, remetente `oi@linkmural.com`). Os modelos ficam aqui no repositório, mas **só valem depois de colados no painel**: Supabase → Authentication → Emails → Templates.

| Arquivo | Aba no Supabase | Assunto | Quando é enviado |
|---|---|---|---|
| `magic-link.html` | **Magic Link** | `Seu link de acesso ao Linkmural` | Quem já tem conta pede para entrar. |
| `confirmation.html` | **Confirm signup** | `Bem-vindo ao Linkmural: confirme seu e-mail` | Primeiro acesso por e-mail. O `/entrar` usa `shouldCreateUser: true`, então quem ainda não tem conta recebe **este** modelo, não o de link mágico. |

## Como aplicar

1. Abra cada aba acima, cole o HTML do arquivo no campo de conteúdo (modo código) e preencha o assunto da tabela.
2. Salve e peça um link em `/entrar` com um e-mail seu para conferir (conta nova e conta existente).

Como o beta e a produção usam o mesmo projeto do Supabase, a mudança vale para os dois sites.

## Variáveis usadas

- `{{ .ConfirmationURL }}`: o link de acesso (já aponta para `/auth/callback?next=...`).
- `{{ .Token }}`: o código numérico para o usuário digitar na tela de `/entrar`, `/cadastro` ou `/comecar`.
- `{{ .Email }}`: o e-mail de quem pediu.

## Regras ao editar

- HTML de e-mail: tabelas, estilos inline, sem imagens externas nem fontes web (o `Inter` cai para a fonte do sistema).
- Mesmas cores dos e-mails em `src/lib/email/` e da Edge Function `send-lifecycle-emails`: paper `#F4F4EF`, ink `#0E0E0E`, muted `#6B6B66`, line `#E2E2DC`. Botão: fundo lime `#CDF54A`, texto ink.
- Texto em português do Brasil, sem prometer prazo exato de expiração (ele depende da configuração de Auth).
