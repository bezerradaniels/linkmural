# Fase 8 · Cobrança (Stripe): plano atualizado

Atualização de 21/11/2026 · Substitui a antiga Fase 4 (Cobrança) do roteiro e os preços do `docs/HANDOFF.md` §1 e §12 da primeira versão.
Referências: `docs/HANDOFF.md` §12 (cobrança), `docs/ROADMAP.md` (Fase 8), `docs/FASE-4-MVP.md` (lista de espera e lançamento).

**Meta:** cobrar o plano Pro com segurança, sem surpresa para o cliente na renovação, começando só com cartão e só em reais.

**Situação em 21/11:** o fluxo completo funciona em modo de teste (assinar, renovar, cancelar, refletir no painel). Falta separar o banco do beta, configurar a Stripe de produção, os avisos ao cliente e as outras regiões.

---

## 1. O que mudou no plano

| Tema | Antes | Agora |
|---|---|---|
| Planos à venda | Grátis, Pro e Negócios | **Grátis e Pro**. O Negócios fica fora de venda até a Fase 6 (`onSale: false` em `src/lib/plans.ts`). |
| Preço do Pro | R$ 19/mês ou R$ 190/ano | **R$ 4,99/mês ou R$ 30,00/ano** no lançamento |
| Desconto | nenhum | **50% por 12 meses**, aplicado por cupom |
| Preço regular (depois do lançamento) | R$ 19 e R$ 190 | **R$ 9,98/mês ou R$ 60,00/ano** |
| Página de preços | três cartões | dois cartões, com **seletor Anual/Mensal** (Anual por padrão) |
| Ordem das fases | Cobrança na Fase 4 | **Fase 8**, depois do MVP de lançamento |

### Como se chegou aos valores

Três versões foram avaliadas. O critério decisivo foi o tamanho do salto de preço na renovação.

| Versão | Lançamento | Depois | Salto | Resultado |
|---|---|---|---|---|
| 80% de desconto sobre R$ 24,95 | R$ 4,99 / R$ 34,99 | R$ 24,95 / R$ 174,95 | 5× | Descartada: risco de cancelamento em massa na renovação e de reclamação de consumidor. |
| 50% de desconto sobre R$ 14,90 | R$ 7,45 / R$ 59,95 | R$ 14,90 / R$ 119,90 | 2× | Descartada: "não está vendável". |
| **50% de desconto sobre R$ 9,98** | **R$ 4,99 / R$ 30,00** | **R$ 9,98 / R$ 60,00** | **2×** | **Adotada.** |

Conta da versão adotada: 998 × 0,5 = **499** centavos e 6000 × 0,5 = **3000** centavos, exatos. Foi escolhido R$ 9,98 e não R$ 9,99 porque 50% de R$ 9,99 daria R$ 4,995, e o arredondamento da Stripe é incerto.

### O que o cliente vê

- **Anual (padrão):** "de ~~R$ 5,00~~ por **R$ 2,50/mês**", com o aviso "Pagamento único de **R$ 30,00** por ano, não é cobrado todo mês" e a nota de que depois dos 12 meses o valor é R$ 60,00 por ano, renovado todo ano.
- **Mensal:** "de ~~R$ 9,98~~ por **R$ 4,99/mês**", "Cobrado todo mês", e depois dos 12 meses R$ 9,98 por mês.
- O rótulo do seletor mostra a economia calculada ("Anual · economize 50%"): R$ 30,00 contra 12 × R$ 4,99.
- O aviso de renovação com aumento é intencional: protege o cliente e a empresa (Código de Defesa do Consumidor).

---

## 2. Decisões e o motivo

| # | Decisão | Motivo |
|---|---|---|
| 1 | Só dois planos agora | Menos superfície para testar e explicar. O Negócios depende de múltiplas páginas e domínio próprio (Fase 6). |
| 2 | Desconto como **cupom** (`percent_off`, 12 meses), não como preço menor | A fatura mostra o desconto real; o fim do lançamento é só desativar o cupom; os preços cadastrados são os regulares. |
| 3 | Salto de no máximo 2× na renovação | Evita o choque do mês 13; foi a razão de descartar o desconto de 80%. |
| 4 | Checkout hospedado pela Stripe | Menos código, menos risco de segurança; é o caminho padrão indicado pelo planejador da Stripe. |
| 5 | Portal do Cliente sem troca de plano | Só há um plano pago; trocar mensal por anual com cupom gera cobranças proporcionais difíceis de explicar. |
| 6 | Sem campo de código promocional | A Stripe não aceita cupom automático e código promocional na mesma sessão. |
| 7 | Sem Stripe Tax por enquanto | Venda só no Brasil, em reais. Reavaliar com as outras regiões e com o contador. |
| 8 | Só cartão | Pix fica em aberto (HANDOFF §12). |
| 9 | A cobrança só liga onde `STRIPE_SECRET_KEY` existe | O beta e a produção usam o mesmo Supabase; sem a chave, nada muda para os usuários. |

---

## 3. Configuração na Stripe (conta de teste)

Conta: "Área restrita de Link Mural" (sandbox, `acct_1UdvDGQ6BL3v4hg9`). **Nada disso existe ainda na conta de produção.**

| Objeto | ID | Detalhe |
|---|---|---|
| Produto | `prod_VfYFx6jXMRJBif` | Linkmural Pro |
| Preço mensal | `price_1UeDJAQ6BL3v4hg9xyX0RMiN` | R$ 9,98, `lookup_key` = `pro_monthly` |
| Preço anual | `price_1UeDJBQ6BL3v4hg9H6ssIvxk` | R$ 60,00, `lookup_key` = `pro_yearly` |
| Cupom | `lancamento_50_12m` | 50%, `duration=repeating`, 12 meses, só para o produto Pro |
| Portal do Cliente | `bpc_1UeDWKQ6BL3v4hg9LAXgB3PL` | padrão da conta |

- Os preços de rodadas anteriores foram **desativados**, e o cupom de 80% foi apagado.
- O código busca o preço pela `lookup_key`, nunca pelo ID. Para mudar o valor no futuro, crie um preço novo e transfira a `lookup_key` (`transfer_lookup_key`).
- **Portal:** atualizar cartão, nome e e-mail, histórico de faturas e cancelar **ao fim do período** com pergunta do motivo. Troca de plano desligada. Retorno para `/app/plano`.
- **Webhook local:** `stripe listen` (Stripe CLI) com os eventos `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid` e `invoice.payment_failed`.

---

## 4. O que foi implementado

### Servidor

| Arquivo | Função |
|---|---|
| `src/lib/stripe.ts` | Cliente da Stripe, `isBillingEnabled()` e o cupom de lançamento. |
| `src/lib/billing-core.ts` | Regras puras e testadas: mapear assinatura para a linha do banco, regra de rebaixamento, resumo da assinatura, checagem de origem. |
| `src/lib/billing.ts` | Sincronização com o banco, rebaixamento, tratamento dos eventos e exclusão do cliente na Stripe. |
| `src/app/api/stripe/checkout/route.ts` | Abre o Checkout hospedado (mensal ou anual, cupom aplicado). |
| `src/app/api/stripe/portal/route.ts` | Abre o Portal do Cliente. |
| `src/app/api/stripe/webhook/route.ts` | Recebe os eventos, confere a assinatura e atualiza `subscriptions` e `profiles.plan`. |
| `next.config.mjs` | CSP com `form-action` liberando `checkout.stripe.com` e `billing.stripe.com`. |

### Regras que valem a pena conhecer

- **Webhook idempotente e sem depender da ordem:** a cada evento, relê a assinatura na Stripe e grava o estado atual. Repetir ou trocar a ordem dos eventos não causa dano. Falha devolve 500 para a Stripe tentar de novo. Evento de usuário já excluído é ignorado.
- **Cancelamento agendado:** o Portal usa `cancel_at` (data), e não `cancel_at_period_end`. O código aceita os dois. Esse bug foi encontrado no teste manual e corrigido (ver seção 6).
- **Rebaixamento** (quando o plano volta a Grátis): links acima de 5 ficam desativados, nunca apagados (o destacado e os primeiros na ordem ficam); a marca "Feito com linkmural" volta; o cache da página é renovado.
- **Excluir a conta** apaga o cliente na Stripe, o que cancela as assinaturas. Se a Stripe falhar, a exclusão para, para ninguém ser cobrado depois de sair.
- **Segurança das rotas de formulário:** conferem a origem do envio (CSRF) e respondem com redirecionamento 303. Sem a chave da Stripe, respondem 503 ou voltam a `/app/plano?erro=indisponivel`.
- **Cliente da Stripe:** criado na primeira compra, com chave de idempotência por usuário, para duas compras simultâneas não criarem dois clientes.

### Telas

| Tela | Para quem | O que mostra |
|---|---|---|
| `/planos` (pública) | Todos | Dois cartões e o seletor. Com a chave da Stripe no ambiente: Pro "Disponível" e **Assinar o Pro** (leva ao login e à tela Plano com a periodicidade escolhida). Sem a chave: "Em breve" e lista de espera. Página dinâmica por isso. |
| `/entrar` | Visitantes | Avisa que a conta é criada na hora, oferece "Crie a sua grátis" e, vindo de "Assinar o Pro", explica o caminho. |
| `/app/plano` (Grátis) | Quem não paga | Seletor Anual/Mensal e **Assinar o Pro**. |
| `/app/plano` (Pro) | Assinante | **Resumo da assinatura**: plano e periodicidade, valor atual, fim do desconto de lançamento, próxima cobrança, estado (Ativa, Pagamento pendente, Cancelamento agendado) e **Gerenciar assinatura**. Aviso próprio para pagamento pendente e para a ativação logo após pagar. |

---

## 5. Variáveis de ambiente

| Variável | Para quê | Observação |
|---|---|---|
| `STRIPE_SECRET_KEY` | Liga a cobrança | `sk_test_...` em teste, `sk_live_...` em produção. Só no servidor. |
| `STRIPE_WEBHOOK_SECRET` | Confere a assinatura do webhook | `whsec_...`. **Cada ambiente** (local, beta, produção) tem o seu endpoint e o seu valor. |
| `STRIPE_LAUNCH_COUPON_ID` | Cupom do lançamento | Opcional; padrão `lancamento_50_12m`. |
| `NEXT_PUBLIC_SITE_URL` | Base dos redirecionamentos | Local: `http://localhost:3000`. Sem `http://` ou com o endereço errado, o retorno do Checkout quebra. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Não é usada | Checkout hospedado dispensa a chave pública. |

Cole as chaves **só** no `.env.local` (ignorado pelo Git) e nas variáveis da Hostinger, nunca em conversas, prints ou commits.

---

## 6. O que foi testado

### Automático (192 testes, 16 arquivos)

- Mapeamento da assinatura da Stripe para o banco (anual, mensal, cliente expandido, status, preço desconhecido, `cancel_at`).
- Sincronização do webhook com banco e Stripe simulados: ativar o Pro, idempotência, rebaixamento (links, marca, cache), pagamento atrasado, evento sem assinatura, usuário já excluído, eventos ignorados.
- Exclusão do cliente na Stripe e bloqueio da exclusão da conta quando a Stripe falha.
- Regras de preço e desconto (50% exato, salto no máximo 2×, equivalente mensal, formatação).
- Resumo da assinatura (anual, mensal, 13ª cobrança, depois do lançamento, cancelamento agendado) e o componente que o mostra.
- Checagem de origem das rotas de formulário.

### Manual, em modo de teste

| Teste | Resultado |
|---|---|
| Assinar no **anual** com o cartão `4242 4242 4242 4242` | R$ 30,00 cobrados com o cupom; plano virou Pro pelo webhook. |
| Resumo da assinatura no painel | Valor, fim do desconto e próxima cobrança corretos. |
| **Renovação anual** com relógio de teste da Stripe (avançado 366 dias) | Segunda fatura de **R$ 60,00**, sem desconto; o cupom termina no mesmo instante em que o ano acaba. |
| **Cancelar pelo Portal** | Funcionou na Stripe, mas revelou o bug do `cancel_at` (o painel continuava "Ativa"). Corrigido, e o painel passou a mostrar "Cancelamento agendado". |
| Página pública e tela de entrada | Conferidas no navegador, anual e mensal. |
| Build de produção | Passa. |

O plano **mensal** não foi simulado mês a mês. Pela mesma regra, são 12 cobranças com desconto e a 13ª, no mês 12, já é a regular.

---

## 7. Pendências, em ordem

### Antes de ligar no beta ou na produção

1. **Separar o Supabase do beta e dos testes.** Hoje os dois ambientes usam o projeto de produção, e uma assinatura de teste grava plano real em conta real.
2. **Conta de produção da Stripe:** criar o produto, os dois preços com as mesmas `lookup_key`, o cupom e a configuração do Portal (nada disso existe fora do sandbox). Definir `redeem_by` e `max_redemptions` do cupom para encerrar o lançamento.
3. **Webhook de cada ambiente:** criar um endpoint por ambiente na Stripe e cadastrar `STRIPE_SECRET_KEY` e `STRIPE_WEBHOOK_SECRET` na Hostinger (as variáveis `NEXT_PUBLIC_*` só valem depois de um build novo).
4. **Revisar a linha da assinatura de teste** na conta usada nos testes (hoje aparece como Pro em produção e termina em 21/11/2027).

### Ainda a testar em modo de teste

- Assinar no mensal pelo seletor.
- Reativar depois de cancelar ("Não cancelar assinatura" no Portal).
- Falha de pagamento (`4000 0000 0000 0341`) e o aviso "Pagamento pendente".
- Excluir uma conta de teste com assinatura e conferir que o cliente some na Stripe.

### Produto e comunicação

- **Avisar o cliente antes da renovação com aumento** (e-mail e tela): o valor dobra no mês 12.
- Aviso no painel dizendo o que mudou quando um rebaixamento desativa links.
- Convites ao upgrade nos limites (links, aparência, remover marca).
- Levar quem chega por "Assinar o Pro" sem conta de volta à tela Plano depois do onboarding (hoje cai no painel).
- **Validar o preço regular** (R$ 9,98 e R$ 60,00) com a lista de espera. O "de/por" só pode ser anunciado se esse for um preço realmente praticado depois do lançamento.
- Conferir as taxas da Stripe: em R$ 4,99 e R$ 30,00 a taxa fixa por transação pesa muito.

### Outras regiões (decisão ainda aberta)

EUA, Europa, México e América Latina.

- **Moedas:** preços em `currency_options` dos mesmos dois preços (padrão BRL), com USD, EUR e MXN manuais, e Adaptive Pricing (conversão automática, só cartão em assinaturas internacionais) para o resto da América Latina.
- **A definir por você:** os valores em cada moeda (acima da simples conversão, por causa da taxa fixa) e se a América Latina paga em dólar ou em moeda local.
- **Imposto:** vender fora cria obrigações (IVA na Europa, sales tax nos EUA, IVA no México). Aí o Stripe Tax passa a fazer sentido. Conversar com o contador.
- **Idioma:** a interface é toda em português. Vender fora pede inglês e espanhol no painel, na landing e nos e-mails, um projeto à parte.

---

## 8. Checklist de lançamento da cobrança

- [ ] Supabase do beta separado do de produção.
- [ ] Produto, preços, cupom e Portal criados na Stripe de produção.
- [ ] Endpoint de webhook criado em cada ambiente, com o seu `whsec_...`.
- [ ] Variáveis da Stripe cadastradas na Hostinger (beta primeiro) e build novo feito.
- [ ] Roteiro completo no beta, em modo de teste: assinar (mensal e anual), cancelar, reativar, falha de pagamento, excluir conta.
- [ ] Aviso de renovação com aumento (e-mail e tela).
- [ ] Revisão dos Termos e da Política de Privacidade com a cobrança no ar (renovação automática, cancelamento, reembolso).
- [ ] Troca para as chaves de produção da Stripe e um pagamento real de baixo valor para conferir.
- [ ] Juntar na `main` (fast-forward) só depois do build passar e do beta conferido.

---

## 9. Estado do código em 21/11

- **Já no GitHub e na produção (`main`):** os planos Grátis e Pro com o desconto e o seletor Anual/Mensal (`f11d640`, `25db95d`).
- **Em commit local na `develop`, ainda não enviados ao GitHub:** a integração com a Stripe (`eceacfe`), as telas Plano e a exclusão de conta (`291e540`) e os docs (`d9237a8`).
- **Ainda sem commit no momento desta atualização:** a correção do `cancel_at`, o resumo da assinatura, a página pública ligada à cobrança, a tela de entrada, este documento e os ajustes de `HANDOFF.md` e `ROADMAP.md`.
- A cobrança só liga onde houver `STRIPE_SECRET_KEY`. Em produção e no beta, hoje, a página de preços mostra o Pro como "Em breve", com lista de espera.
