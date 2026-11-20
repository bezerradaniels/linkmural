import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como o linkmural coleta, usa e protege dados pessoais, de acordo com a LGPD.",
};

export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de Privacidade" updated="20 de novembro de 2026">
      <p>
        O linkmural (linkmural.com) é uma ferramenta para negócios e
        profissionais criarem uma página de links. Esta política explica quais
        dados pessoais tratamos, para quê e quais são os seus direitos, conforme
        a Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).
      </p>

      <h2>1. Quem é o responsável</h2>
      <p>
        O linkmural é o controlador dos dados das contas. Para qualquer assunto
        de privacidade, fale com a gente em{" "}
        <a href="mailto:oi@linkmural.com">oi@linkmural.com</a>.
      </p>
      <p>
        Nas páginas publicadas pelos nossos clientes, o conteúdo é de
        responsabilidade de quem publicou. Em relação às métricas dessas
        páginas, o linkmural atua como operador para o dono da página.
      </p>

      <h2>2. Quais dados tratamos</h2>
      <ul>
        <li>
          <strong>Conta:</strong> e-mail e nome. Se você entrar com o Google,
          recebemos do Google o seu nome, e-mail e foto de perfil. Não temos
          acesso à sua senha do Google.
        </li>
        <li>
          <strong>Sua página:</strong> o que você escolhe publicar, como nome do
          negócio, logo, descrição, WhatsApp, e-mail, endereço, horários e
          links. Esses dados ficam públicos na sua página porque esse é o
          objetivo do serviço.
        </li>
        <li>
          <strong>Pagamento:</strong> nos planos pagos, o pagamento é feito pela
          Stripe. Nós não recebemos nem guardamos o número do seu cartão;
          guardamos só o identificador da assinatura, o plano e a situação do
          pagamento.
        </li>
        <li>
          <strong>Métricas de visitantes:</strong> quando alguém visita uma
          página ou toca em um link, registramos apenas o site de origem (por
          exemplo, instagram.com), a campanha de origem quando existe
          (utm_source), o país e o tipo de aparelho (celular, computador ou
          tablet).{" "}
          <strong>
            Não guardamos o endereço IP nem a identificação completa do
            navegador
          </strong>{" "}
          dos visitantes.
        </li>
        <li>
          <strong>Denúncias:</strong> o motivo e o texto que a pessoa escrever
          ao denunciar uma página.
        </li>
      </ul>

      <h2>3. Para que usamos</h2>
      <ul>
        <li>Criar e manter sua conta e sua página (execução de contrato).</li>
        <li>
          Mostrar métricas de visitas e cliques ao dono da página (execução de
          contrato).
        </li>
        <li>
          Enviar e-mails do serviço, como o link de acesso, avisos sobre a
          página e dicas de uso (execução de contrato e legítimo interesse; você
          pode deixar de receber as dicas).
        </li>
        <li>
          Cobrar os planos pagos (execução de contrato e obrigações legais e
          fiscais).
        </li>
        <li>
          Prevenir golpes, spam e abuso, inclusive analisando denúncias e links
          perigosos (legítimo interesse).
        </li>
      </ul>
      <p>
        Não vendemos dados pessoais e não usamos seus dados para publicidade de
        terceiros.
      </p>

      <h2>4. Cookies</h2>
      <p>Usamos apenas cookies necessários para o serviço funcionar:</p>
      <ul>
        <li>de sessão, para manter você conectado;</li>
        <li>
          para lembrar a página para onde você volta depois de entrar (dura 30
          minutos);
        </li>
        <li>para reservar por 30 minutos o endereço escolhido no cadastro.</li>
      </ul>
      <p>Não usamos cookies de publicidade nem de rastreamento entre sites.</p>

      <h2>5. Com quem compartilhamos</h2>
      <p>
        Usamos fornecedores que tratam dados em nosso nome, apenas para prestar
        o serviço:
      </p>
      <ul>
        <li>
          Supabase: banco de dados, autenticação e armazenamento de imagens;
        </li>
        <li>Hostinger: hospedagem do site;</li>
        <li>Cloudflare: entrega e proteção do site;</li>
        <li>Stripe: pagamentos dos planos;</li>
        <li>Resend: envio de e-mails;</li>
        <li>Google: login com Google, quando você escolhe essa opção.</li>
      </ul>
      <p>
        Alguns desses fornecedores processam dados fora do Brasil. Nesses casos,
        a transferência segue as garantias previstas na LGPD. Também podemos
        compartilhar dados quando a lei ou uma ordem judicial exigir.
      </p>

      <h2>6. Por quanto tempo guardamos</h2>
      <p>
        Mantemos os dados enquanto sua conta existir. Ao excluir a conta,
        apagamos a conta, as páginas, os links e as métricas ligadas a ela, e
        cancelamos a assinatura. Registros que a lei nos obriga a guardar, como
        os de cobrança, são mantidos pelo prazo legal.
      </p>

      <h2>7. Seus direitos</h2>
      <p>
        Você pode pedir a qualquer momento: confirmação de que tratamos seus
        dados, acesso, correção, anonimização ou exclusão, portabilidade,
        informação sobre com quem compartilhamos e revogação de consentimento,
        nos termos do art. 18 da LGPD. Basta escrever para{" "}
        <a href="mailto:oi@linkmural.com">oi@linkmural.com</a>. Você também pode
        reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
      </p>

      <h2>8. Segurança</h2>
      <p>
        Os dados trafegam com criptografia (HTTPS), e o acesso a eles é limitado
        por regras no banco de dados: cada pessoa só acessa a própria conta.
        Nenhum sistema é totalmente imune a falhas; se acontecer um incidente
        relevante, avisaremos você e a ANPD como a lei determina.
      </p>

      <h2>9. Menores de idade</h2>
      <p>
        O linkmural é voltado a negócios e profissionais e não se destina a
        menores de 18 anos.
      </p>

      <h2>10. Mudanças nesta política</h2>
      <p>
        Podemos atualizar esta política. Quando a mudança for importante,
        avisaremos por e-mail ou no painel. Veja também os{" "}
        <Link href="/termos">Termos de uso</Link>.
      </p>
    </LegalPage>
  );
}
