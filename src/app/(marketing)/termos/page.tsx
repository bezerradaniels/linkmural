import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Regras de uso do linkmural, a página de links para negócios.",
};

export default function TermosPage() {
  return (
    <LegalPage title="Termos de uso" updated="20 de novembro de 2026">
      <p>
        Estes termos valem para quem cria uma conta no linkmural
        (linkmural.com). Ao usar o serviço, você concorda com eles e com a{" "}
        <Link href="/privacidade">Política de Privacidade</Link>.
      </p>

      <h2>1. O serviço</h2>
      <p>
        O linkmural permite criar uma página pública com informações e links do
        seu negócio. Há um plano gratuito e planos pagos, com os recursos e
        limites descritos na página de planos.
      </p>

      <h2>2. Sua conta</h2>
      <ul>
        <li>Você precisa ter 18 anos ou mais e informar um e-mail válido.</li>
        <li>
          Você é responsável pelo que acontece na sua conta e deve manter o
          acesso seguro.
        </li>
        <li>
          O endereço da página (linkmural.com/seu-endereco) não pode imitar
          outra pessoa ou marca.
        </li>
      </ul>

      <h2>3. O que você publica</h2>
      <p>
        O conteúdo da sua página é seu e é de sua responsabilidade. Você nos
        autoriza a exibi-lo para prestar o serviço. Não é permitido publicar ou
        apontar para:
      </p>
      <ul>
        <li>golpes, phishing, vírus ou páginas que enganem quem clica;</li>
        <li>conteúdo ilegal, discriminatório, violento ou de exploração;</li>
        <li>uso de marcas, nomes ou imagens de terceiros sem autorização;</li>
        <li>spam ou tentativas de burlar os limites do serviço.</li>
      </ul>
      <p>
        Podemos esconder links, bloquear páginas ou suspender contas que
        descumpram estas regras, inclusive a partir de denúncias.
      </p>

      <h2>4. Planos e pagamento</h2>
      <ul>
        <li>
          Os planos pagos são cobrados por mês ou por ano, de forma recorrente,
          pela Stripe.
        </li>
        <li>
          Você pode cancelar quando quiser; o plano continua até o fim do
          período já pago.
        </li>
        <li>
          Ao voltar para o Grátis, os recursos pagos deixam de funcionar: links
          acima do limite são desativados (não apagados) e páginas extras e
          domínio próprio são despublicados.
        </li>
        <li>Mudanças de preço serão avisadas com antecedência.</li>
      </ul>

      <h2>5. Disponibilidade</h2>
      <p>
        Trabalhamos para manter o linkmural no ar, mas o serviço é oferecido
        como está e pode ter interrupções para manutenção ou por falhas de
        fornecedores.
      </p>

      <h2>6. Responsabilidade</h2>
      <p>
        Não respondemos pelo conteúdo publicado pelos usuários nem pelos sites
        para onde os links apontam. Nossa responsabilidade, quando existir, fica
        limitada ao valor pago por você nos últimos 12 meses, exceto nos casos
        em que a lei não permitir essa limitação.
      </p>

      <h2>7. Encerramento</h2>
      <p>
        Você pode excluir sua conta a qualquer momento. Podemos encerrar contas
        que violem estes termos.
      </p>

      <h2>8. Mudanças e lei aplicável</h2>
      <p>
        Podemos atualizar estes termos e avisaremos quando a mudança for
        importante. Estes termos seguem a lei brasileira, inclusive o Código de
        Defesa do Consumidor quando aplicável. Dúvidas:{" "}
        <a href="mailto:oi@linkmural.com">oi@linkmural.com</a>.
      </p>
    </LegalPage>
  );
}
