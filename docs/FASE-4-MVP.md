# Fase 4 · Lançamento do MVP (captação dos primeiros negócios)

Plano de implementação · 20/11/2026 · Substitui a antiga Fase 4 (Cobrança), que vai para o fim do roteiro.
Referências: `docs/HANDOFF.md` §11 (admin), §14 (e-mails), §15 (Cloudflare), §16 (segurança e LGPD), §17 (definição de pronto).

**Meta:** abrir o linkmural para negócios reais com segurança, acompanhar o que acontece e medir a vontade de pagar, tudo no plano Grátis.

**Pronto quando:**
- um negócio de fora se cadastra pelo Google **ou por e-mail**, publica a página e recebe o e-mail “Sua página está no ar”;
- você, como admin, vê as contas e o funil, suspende uma conta e resolve uma denúncia;
- os planos pagos aparecem como “em breve”, com lista de espera;
- os 10 primeiros negócios convidados estão no ar.

---

## Por que esta ordem

Sem cobrança, o risco de abrir é baixo, mas três coisas não podem faltar antes do primeiro convite:
1. **Entrar por e-mail.** Hoje o link de acesso só chega para a equipe do projeto.
2. **Controle.** Hoje não existe admin: uma página de golpe ficaria no ar até alguém mexer no banco à mão.
3. **Direitos do titular (LGPD).** A política promete exclusão de conta, e ela ainda não existe.

O resto (aquisição, e-mails automáticos, Cloudflare) melhora o resultado, mas pode entrar enquanto os primeiros negócios já usam.

| Prioridade | Etapas |
|---|---|
| **Antes do primeiro convite** | A (e-mail), B (admin), C (segurança), G (conta e LGPD) |
| **Na primeira semana do beta** | E (aquisição e lista de espera), H (suporte e feedback) |
| **Logo depois** | D (Cloudflare), F (e-mails automáticos), I (Supabase separado) |

---

## Etapas

### A · E-mail de verdade (Resend)
- Domínio `linkmural.com` verificado no Resend (registros SPF, DKIM e DMARC no DNS da Hostinger, que consigo cadastrar pelo MCP da Hostinger).
- SMTP do Resend no Supabase Auth, remetente `oi@linkmural.com`.
- Modelos do link de acesso e de confirmação em português.
- `RESEND_API_KEY` e `EMAIL_FROM` no `.env.local` e nos dois sites; o e-mail “Sua página está no ar” passa a sair e usa `EMAIL_FROM` e o domínio do ambiente (beta ou produção).
- Teste: cadastro completo por e-mail com um endereço de fora da equipe.

### B · Admin MVP (`/admin`, só `role = admin`)
- **Sua conta como admin** (você roda o SQL ou me pede explicitamente).
- **Dashboard:**
  - contas, páginas publicadas, cadastros por dia;
  - visitas e cliques de hoje e dos últimos 7 dias;
  - **funil do onboarding** a partir de `onboarding_events`: endereço escolhido → conta → estilo → dados → links → modelo → publicada, com a taxa de cada passo;
  - últimos cadastros com link para a página.
- **Empresas:** busca por nome, e-mail ou endereço; plano, data de cadastro, página publicada ou não; ações **suspender** e **reativar**:
  - suspender preenche `profiles.suspended_at` e bloqueia as páginas (`blocked_at`);
  - a pessoa suspensa vê um aviso ao entrar no painel.
- **Moderação:**
  - fila de denúncias (`reports`) com motivo, detalhes e link para a página;
  - ações: bloquear a página, sinalizar um link (`flagged_at`), descartar a denúncia;
  - cada ação revalida o cache da página na hora.
- Todas as ações rodam no servidor com a chave de serviço, depois de conferir `is_admin`, e ficam registradas (tabela `admin_actions`: quem, o quê, quando).

### C · Segurança e confiança
- **Cabeçalhos HTTP:** `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin` e `frame-ancestors 'none'` no painel e no admin.
- **Links perigosos:** checagem com Google Safe Browsing ao salvar um link, quando houver `GOOGLE_SAFE_BROWSING_KEY`; link perigoso é recusado com mensagem clara.
- **Página bloqueada:** mostra “Esta página está indisponível” (hoje mostra o mesmo 404 de endereço inexistente).
- **Pendências da verificação:**
  - corrida na reserva do endereço;
  - troca de endereço sem checar reservas da landing;
  - aviso (Toast) por cima da barra de abas no celular.

### D · Cloudflare na frente do site (decisão abaixo)
- Proxy ligado, cache do HTML das páginas públicas, bypass em `/app`, `/admin`, `/api`, `/auth`, `/onboarding`.
- Limite de requisições em `/api/v`, `/l/*`, `/api/slug/check` e `/api/report`.
- País do visitante nas métricas (`cf-ipcountry`).

### E · Aquisição
- **Landing mais completa:**
  - exemplos reais dos 3 modelos;
  - “como funciona” em 3 passos;
  - perguntas frequentes;
  - chamada para ação repetida no fim.
- **Página `/planos`:** Grátis disponível hoje; Pro e Negócios marcados “em breve”, com o botão **“Quero ser avisado”**.
- **Lista de espera** (tabela `waitlist`: e-mail, plano de interesse, origem). No painel, “Assinar o Pro” vira “Entrar na lista de espera”. Mede a vontade de pagar antes de ligar o Stripe.
- **Indicação:** o “Feito com linkmural” já leva `?ref=<endereço>`; gravar essa origem no cadastro (`onboarding_events`) para saber quantos clientes vêm de páginas de outros clientes.
- **SEO básico:**
  - `sitemap.xml` com a landing, as páginas legais e as páginas publicadas;
  - `robots.txt`;
  - título, descrição e imagem de compartilhamento da landing.

### F · E-mails automáticos essenciais (§14, parte)
- “Sua página está quase pronta”: 1 hora e 24 horas depois de um cadastro parado.
- “Coloque seu link na bio”: no dia seguinte à publicação.
- Disparo por `pg_cron` no Supabase chamando uma Edge Function que envia pelo Resend (a Hostinger não roda tarefas em segundo plano).
- Os outros e-mails do §14 ficam para depois.

### G · Conta e LGPD
- Tela **Minha conta** no painel: nome, e-mail de acesso, sair.
- **Excluir conta:** confirmação digitando o endereço da página; apaga os arquivos do bucket `media`, depois o usuário (o cascade apaga perfil, páginas, links e métricas).
- **Revisão da Política e dos Termos** (com você ou um advogado); razão social e CNPJ, se houver empresa.

### H · Suporte e feedback
- “Ajuda” no painel e na landing: o canal de suporte que você escolher (WhatsApp ou e-mail).
- “Enviar sugestão” no painel, gravado numa tabela `feedback` e visível no admin.

### I · Ambiente de testes separado (recomendado)
- Um segundo projeto no Supabase só para o beta e para os testes de ponta a ponta, com as mesmas migrações.
- Assim os testes e os experimentos do beta param de passar pelo banco dos clientes reais.

---

## Decisões

| # | Tema | Opções | Recomendação |
|---|---|---|---|
| 1 | **Lista de espera dos planos pagos** | (a) “Quero ser avisado” com e-mail. (b) Esconder os planos pagos até o Stripe. | **(a)** Mede a demanda e não promete data. |
| 2 | **Cloudflare** | (a) Agora: exige mudar os nameservers do domínio da Hostinger para a Cloudflare. (b) Depois dos primeiros negócios. | **(b)** Para 10 a 20 negócios o tráfego é baixo; o risco de mexer no DNS agora é maior que o ganho. |
| 3 | **Supabase separado para o beta** | (a) Agora. (b) Depois. | **(a) junto com a etapa B**, antes de os primeiros clientes reais entrarem. |
| 4 | **Canal de suporte** | WhatsApp, e-mail ou os dois | Você decide; precisa ser um canal que você responda. |

## Depende de você
- **Conta no Resend** e a chave `RESEND_API_KEY` (os registros de DNS eu consigo cadastrar pela Hostinger).
- **Conta admin:** rodar o SQL no Supabase ou me pedir explicitamente.
- **Decisões 1 a 4.**
- **Lista dos primeiros 10 a 20 negócios** para convidar.
- **Revisão jurídica** dos termos e da política.
- Opcional: chave do Google Safe Browsing.

## Roteiro atualizado
1. Fase 0 · Fundação ✔
2. Fase 1 · Página pública ✔
3. Fase 2 · Onboarding ✔
4. Fase 3 · Painel do cliente ✔
5. **Fase 4 · Lançamento do MVP** (este plano)
6. Fase 5 · Pro (personalização completa e métricas por link), liberado para quem estiver na lista de espera
7. Fase 6 · Negócios (até 3 páginas, domínio próprio, métricas por origem)
8. Fase 7 · E-mails restantes e admin completo
9. **Fase 8 · Cobrança (Stripe)**
