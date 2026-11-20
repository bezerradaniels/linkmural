import type { PublicPage } from "./public-page";
import type { StyleKey, TemplateKey } from "./styles";

/*
 * Example business used by /dev/pagina and the studioforca seed.
 * Placeholders in brackets stay visible on purpose: no invented data.
 */

export const DEMO_HOURS = {
  mon: [["06:00", "22:00"]],
  tue: [["06:00", "22:00"]],
  wed: [["06:00", "22:00"]],
  thu: [["06:00", "22:00"]],
  fri: [["06:00", "22:00"]],
  sat: [["08:00", "12:00"]],
};

export const DEMO_LINKS = [
  {
    kind: "link",
    title: "Agendar aula experimental",
    subtitle: "Escolha o dia e o horário",
    url: "https://calendly.com/studioforca",
    icon: "si:calendly",
    featured: true,
  },
  {
    kind: "whatsapp",
    title: "WhatsApp",
    subtitle: null,
    url: "https://wa.me/5511999990000",
    icon: "si:whatsapp",
    featured: false,
  },
  {
    kind: "link",
    title: "Planos e preços",
    subtitle: "Mensal, trimestral e anual",
    url: "https://studioforca.com.br/planos",
    icon: "lm:coupon",
    featured: false,
  },
  {
    kind: "link",
    title: "Instagram",
    subtitle: "@studioforca",
    url: "https://instagram.com/studioforca",
    icon: "si:instagram",
    featured: false,
  },
  {
    kind: "pix",
    title: "Pagar com Pix",
    subtitle: "Chave aleatória",
    url: "123e4567-e89b-12d3-a456-426614174000",
    icon: "si:pix",
    featured: false,
  },
] as const;

export function demoPage(
  template: TemplateKey = "balcao",
  style: StyleKey = "sport",
): PublicPage {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    slug: "studioforca",
    template,
    style,
    theme: {},
    plan: "free",
    business_name: "Studio Força",
    kind: "Academia · Treino funcional",
    bio: "Treinos em grupo e personal. A primeira aula é por nossa conta.",
    city: "[Bairro, Cidade]",
    address: null,
    whatsapp: "11999990000",
    email: "contato@[seudominio].com",
    hours: DEMO_HOURS,
    status_text: null,
    show_branding: true,
    avatarUrl: null,
    coverUrl: null,
    links: DEMO_LINKS.map((l, i) => ({ ...l, id: `demo-${i}`, position: i })),
  };
}
