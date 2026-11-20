# Fase 2 · Onboarding

Plano de implementação · 20/11/2026 · Referências: `docs/HANDOFF.md` §9, documento “Plano de implementação — app de página de links” (aba Onboarding) e Fase 2 do `docs/ROADMAP.md`.

**Meta:** uma pessoa nova publica a página pelo celular em menos de 3 minutos, sem cartão e sem ver planos pagos.

**Pronto quando:** o teste de ponta a ponta (landing → página publicada) passa no celular e uma pessoa real conclui o cadastro no beta em menos de 3 minutos.

---

## Fluxo

| # | Tela | Pede | Obrigatório | Rota |
|---|---|---|---|---|
| 1 | Endereço | `linkmural.com/___` na landing, com aviso na hora | Sim | `/` |
| 2 | Conta | Google (1 toque) ou e-mail com link de acesso | Sim | `/onboarding/2` |
| 3 | Estilo | 8 cards com as cores e a fonte de cada estilo | Sim (pular = Classic) | `/onboarding/3` |
| 4 | Dados | Nome, WhatsApp e cidade; logo opcional | Só o nome | `/onboarding/4` |
| 5 | Primeiros links | Chips + campo de endereço para cada um | Não | `/onboarding/5` |
| 6 | Modelo | Balcão, Mosaico e Cartão com os dados da pessoa | Não (Balcão marcado) | `/onboarding/6` |
| 7 | Publicar | “Publicar minha página” | — | `/onboarding/7` |
| — | Sucesso | Link, Copiar, QR e guia da bio do Instagram | — | `/onboarding/pronto` |

Os planos pagos não aparecem em nenhuma dessas telas.

---

## Etapas de implementação

### A · Landing e endereço
- A página inicial (`/`) vira a landing: título, campo `linkmural.com/___`, botão “Criar minha página” e um exemplo ao vivo em `/studioforca`.
- Verificação com debounce de 300 ms em `GET /api/slug/check?slug=`.
  - Respostas: `livre`, `invalido`, `reservado`, `ocupado`.
  - Quando não está livre, devolve 3 sugestões livres (por exemplo `studioforca-oficial`, `studioforcabr`, `meustudioforca`).
  - Regras: 3 a 30 caracteres, letras minúsculas, números e hífen, sem hífen duplo, sem começar ou terminar com hífen.
- Ao continuar: `POST /api/slug/check` reserva o endereço por 30 minutos em `slug_holds` (service role) e grava um cookie `httpOnly` com o endereço e o token da reserva.
- O campo normaliza o que a pessoa digita: minúsculas, sem acento, espaço vira hífen.

### B · Conta (passo 2)
- Tela de login dentro do onboarding, com barra de progresso, usando o mesmo fluxo do `/entrar` (Google e link por e-mail).
- Na volta do login, `/onboarding/iniciar`:
  1. Lê o cookie da reserva e confere o token em `slug_holds`.
  2. Cria a página com o endereço reservado (`onboarding_step = 3`) e apaga a reserva.
  3. Segue para o passo 3.
- Casos:
  - Já tem página: continua no passo salvo em `onboarding_step` (ou vai para `/app` se já publicou).
  - Reserva vencida ou endereço tomado: volta ao passo 1 com aviso e sugestões.
  - Limite do plano (`plan_limit_pages`): aviso amigável e link para o painel.

### C · Passos 3 a 6
- **Estilo (3):** 8 cards mostrando fundo, acento e fonte de cada estilo. “Pular” grava Classic.
- **Dados (4):**
  - Nome do negócio (obrigatório, até 60 caracteres), WhatsApp (`inputmode="tel"`, com DDD), cidade.
  - Logo opcional, reduzido no navegador para 512 px antes de enviar ao bucket `media/<user_id>/`.
  - Com WhatsApp, cria o link `kind=whatsapp` e preenche `pages.whatsapp`.
- **Primeiros links (5):**
  - Chips: Agenda, WhatsApp, Instagram, Loja, Cardápio, Portfólio, Site.
  - Cada chip marcado abre um campo de endereço (`type="url"`), com reconhecimento automático de ícone e título (`detectLink`) e validação (`linkUrlSchema`).
  - Contador “3 de 5 no Grátis”, sem bloquear; o erro `plan_limit_links` do banco vira aviso amigável.
- **Modelo (6):** os 3 modelos desenhados com os dados reais da pessoa (prévia reduzida da página pública). Balcão vem marcado.

### D · Publicar e sucesso
- “Publicar minha página” grava `published = true` e `onboarding_step = 8`, e chama `revalidateTag` da página para ela aparecer na hora.
- Animação do alfinete ao publicar (respeitando `prefers-reduced-motion`).
- Tela de sucesso:
  - link da página com botão Copiar;
  - QR code para baixar (PNG e SVG);
  - guia curto “Como colocar na bio do Instagram”;
  - botão para ir ao painel.

### E · Regras de tela (todos os passos)
- Cada passo salva no banco; quem sair e voltar continua de onde parou.
- Barra de progresso discreta no topo (`Steps`) e botão principal fixo embaixo.
- Teclado certo para cada campo (`inputmode="tel"`, `type="url"`, `type="email"`).
- Área de toque mínima de 44 px, foco visível, textos em pt-BR.
- Estados de carregamento, erro e vazio tratados.

### F · Eventos
Gravados no servidor numa tabela própria, `onboarding_events` (nova migração, RLS: só admin lê).

| Evento | Quando dispara |
|---|---|
| `slug_escolhido` | Endereço livre confirmado na landing |
| `conta_criada` | Login concluído no passo 2 |
| `estilo_escolhido` | Saída do passo 3, com o estilo |
| `dados_salvos` | Saída do passo 4 (nome, e se tem WhatsApp e logo) |
| `links_adicionados` | Saída do passo 5, com a quantidade de links |
| `modelo_escolhido` | Saída do passo 6, com o modelo |
| `pagina_publicada` | Clique em Publicar |
| `link_copiado` / `qr_baixado` | Ações na tela de sucesso |
| `primeiro_clique` | Calculado a partir de `click_events`: primeira visita de outra pessoa |

Números principais: quantos publicam, tempo até publicar e quantas páginas recebem o primeiro clique em 7 dias.

### G · Teste de ponta a ponta
- Playwright no tamanho de celular: landing → endereço → login → passos 3 a 7 → página publicada e visível em `/<endereco>`.
- O login usa um usuário temporário criado pela API do Supabase com um link gerado na hora. Ao final, o teste apaga o usuário e a página dele.
- Atenção: beta e produção dividem o mesmo banco, então o teste roda no banco real (sem deixar dados para trás).

---

## Decisões

| Tema | Decisão | Motivo |
|---|---|---|
| Onde guardar os eventos | Tabela `onboarding_events` no Supabase | Mais simples e sem enviar dados a terceiros (PostHog exigiria outra conta e menção na política de privacidade) |
| `primeiro_clique` | Calculado a partir de `click_events` | Não pesa o caminho rápido da página pública |
| Horários de funcionamento | Ficam para o painel (Fase 3) | O onboarding pede só o essencial |
| Teste de ponta a ponta | Usuário temporário criado e apagado pelo próprio teste | O teste não consegue entrar com Google nem abrir e-mail |

## Fora da Fase 2
- E-mail “Sua página está no ar” (Fase 3).
- E-mails de cadastro parado, 1 h e 24 h depois (Fase 7).
- Checagem de links perigosos com Google Safe Browsing (quando houver `GOOGLE_SAFE_BROWSING_KEY`).

## Depende de você
- **SMTP do Resend no Supabase Auth**, remetente `oi@linkmural.com`. Sem isso, o link de acesso por e-mail só chega a quem é da equipe do projeto, e no beta gente de fora só consegue se cadastrar pelo Google. Precisa estar pronto antes do beta fechado. Os registros de DNS ficam na Hostinger.
- **`SUPABASE_SERVICE_ROLE_KEY` no site `beta.linkmural.com`**: a reserva do endereço e os eventos usam essa chave.
