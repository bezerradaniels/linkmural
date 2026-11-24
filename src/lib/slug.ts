import { z } from "zod";

/*
 * Slug normalization, validation, suggestion candidates and hold cookie
 * serialization for the landing page and onboarding (docs/FASE-2.md §A).
 */

export const SLUG_MIN = 3;
export const SLUG_MAX = 30;
export const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
export const SLUG_HOLD_COOKIE = "lm_slug_hold";
export const SLUG_HOLD_MINUTES = 30;

export type SlugStatus = "livre" | "invalido" | "reservado" | "ocupado";

/**
 * Unambiguous offensive, profane, hate-speech or scam roots matched anywhere
 * in the slug (including after basic leetspeak normalization).
 */
const OFFENSIVE_SUBSTRINGS = [
  "porra",
  "caralh",
  "bucet",
  "bocet",
  "xoxot",
  "xerec",
  "piroc",
  "punhet",
  "siriric",
  "boquet",
  "arrombad",
  "cuzao",
  "cuzinh",
  "putari",
  "filhodaputa",
  "prostitut",
  "vagabund",
  "retardad",
  "desgrac",
  "imbecil",
  "viadinh",
  "pedofil",
  "estupr",
  "suicid",
  "nazist",
  "nazism",
  "racist",
  "terroris",
  "asshole",
  "motherfuck",
  "bitch",
  "pussy",
  "whore",
  "urubudopix",
  "pixpremiado",
  "cartaoclonado",
] as const;

/**
 * Shorter profane, vulgar, negative or scam tokens matched when they appear
 * as a full slug, a hyphen-separated segment, or after stripping trailing digits
 * (avoids false positives on words like "paulista", "computador", "culinaria").
 */
const OFFENSIVE_TOKENS = new Set([
  "puta",
  "puto",
  "putas",
  "putos",
  "foda",
  "foder",
  "fodase",
  "fodido",
  "fodida",
  "merda",
  "merdas",
  "bosta",
  "bostas",
  "cacete",
  "rola",
  "rolas",
  "pinto",
  "pau",
  "xota",
  "cu",
  "cus",
  "viado",
  "viados",
  "bicha",
  "bichas",
  "corno",
  "cornos",
  "corna",
  "piranha",
  "vadia",
  "vadias",
  "babaca",
  "babacas",
  "otario",
  "otaria",
  "idiota",
  "idiotas",
  "lixo",
  "fdp",
  "pqp",
  "vtnc",
  "vsf",
  "tnc",
  "fuck",
  "shit",
  "dick",
  "cock",
  "cunt",
  "slut",
  "porn",
  "porno",
  "xxx",
  "sexo",
  "nudes",
  "golpe",
  "golpes",
  "fraude",
  "scam",
  "phishing",
  "hacker",
  "roubo",
  "trafico",
  "drogas",
  "cocaina",
  "morte",
  "matar",
  "odio",
]);

function deLeet(value: string): string {
  return value
    .replace(/0/g, "o")
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .replace(/(.)\1{2,}/g, "$1$1");
}

/** Returns true when a slug contains profanity, hate speech, or scam terms. */
export function isOffensiveSlug(rawSlug: string): boolean {
  const slug = finalizeSlug(rawSlug);
  if (!slug) return false;

  const compact = slug.replace(/-/g, "");
  const compactDeLeet = deLeet(compact);
  const compactNoDigits = compact.replace(/\d+/g, "");

  for (const root of OFFENSIVE_SUBSTRINGS) {
    if (
      compact.includes(root) ||
      compactDeLeet.includes(root) ||
      compactNoDigits.includes(root)
    ) {
      return true;
    }
  }

  if (
    OFFENSIVE_TOKENS.has(compact) ||
    OFFENSIVE_TOKENS.has(compactNoDigits) ||
    OFFENSIVE_TOKENS.has(compactDeLeet)
  ) {
    return true;
  }

  const segments = slug.split("-").filter(Boolean);
  for (const seg of segments) {
    const segNoDigits = seg.replace(/\d+/g, "");
    const segDeLeet = deLeet(seg);
    if (
      OFFENSIVE_TOKENS.has(seg) ||
      OFFENSIVE_TOKENS.has(segNoDigits) ||
      OFFENSIVE_TOKENS.has(segDeLeet)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Platform routes and system/authority identifiers across PT, EN, ES and FR
 * that cannot be claimed by any user.
 */
const PLATFORM_RESERVED_SLUGS = new Set([
  // Admin, system & authority
  "admin",
  "admins",
  "administrador",
  "administradores",
  "administracao",
  "administrator",
  "administrators",
  "administration",
  "administrateur",
  "root",
  "sysadmin",
  "system",
  "sistema",
  "système",
  "suporte",
  "support",
  "soporte",
  "ajuda",
  "help",
  "ayuda",
  "aide",
  "mod",
  "moderador",
  "moderator",
  "moderacao",
  "moderation",
  "staff",
  "team",
  "equipe",
  "equipo",
  "oficial",
  "official",
  "officiel",
  "verificado",
  "verified",
  "seguranca",
  "security",
  "seguridad",
  "securite",
  "trust",
  "abuse",
  "denuncia",
  "denuncias",
  "report",
  "reports",
  "reportar",
  "status",
  "health",
  "ping",
  "linkmural",
  "muraldelinks",
  "mural-de-links",

  // Auth & account (PT / EN / ES / FR)
  "login",
  "signin",
  "sign-in",
  "entrar",
  "iniciar-sesion",
  "iniciarsesion",
  "connexion",
  "logout",
  "signout",
  "sign-out",
  "sair",
  "salir",
  "deconnexion",
  "signup",
  "sign-up",
  "register",
  "registrar",
  "cadastro",
  "cadastrar",
  "crear-cuenta",
  "crearcuenta",
  "registro",
  "inscription",
  "auth",
  "oauth",
  "callback",
  "sso",
  "mfa",
  "otp",
  "verify",
  "verificar",
  "confirm",
  "confirmar",
  "reset",
  "recuperar",
  "recuperar-senha",
  "forgot",
  "forgot-password",
  "password",
  "senha",
  "contrasena",
  "motdepasse",
  "account",
  "accounts",
  "conta",
  "contas",
  "cuenta",
  "cuentas",
  "compte",
  "profile",
  "profiles",
  "perfil",
  "perfis",
  "user",
  "users",
  "usuario",
  "usuarios",
  "utilisateur",
  "member",
  "members",
  "membro",
  "membros",

  // App, editor, dashboard & billing (PT / EN / ES / FR)
  "app",
  "apps",
  "painel",
  "dashboard",
  "panel",
  "tableau",
  "editor",
  "edit",
  "editar",
  "editeur",
  "studio",
  "builder",
  "criador",
  "criar",
  "create",
  "crear",
  "creer",
  "comecar",
  "start",
  "iniciar",
  "empezar",
  "commencer",
  "onboarding",
  "welcome",
  "bem-vindo",
  "bemvindo",
  "bienvenido",
  "bienvenue",
  "previa",
  "preview",
  "vista-previa",
  "apercu",
  "aparencia",
  "appearance",
  "apariencia",
  "apparence",
  "theme",
  "themes",
  "tema",
  "temas",
  "template",
  "templates",
  "modelo",
  "modelos",
  "widget",
  "widgets",
  "link",
  "links",
  "enlace",
  "enlaces",
  "lien",
  "liens",
  "pagina",
  "paginas",
  "page",
  "pages",
  "mural",
  "murais",
  "metricas",
  "metrics",
  "analytics",
  "estatisticas",
  "estadisticas",
  "statistiques",
  "insights",
  "settings",
  "config",
  "configuracao",
  "configuracoes",
  "configuracion",
  "ajustes",
  "parametres",
  "informacoes",
  "informacion",
  "info",
  "mais",
  "more",
  "mas",
  "plus",
  "plan",
  "plans",
  "plano",
  "planos",
  "planes",
  "forfaits",
  "pricing",
  "precos",
  "preco",
  "precios",
  "precio",
  "tarifs",
  "pro",
  "business",
  "negocios",
  "negocio",
  "empresa",
  "empresas",
  "enterprise",
  "free",
  "gratis",
  "gratuit",
  "billing",
  "faturamento",
  "facturacion",
  "facturation",
  "checkout",
  "pay",
  "payment",
  "payments",
  "pagamento",
  "pagamentos",
  "pago",
  "pagos",
  "paiement",
  "stripe",
  "assinatura",
  "assinaturas",
  "subscription",
  "subscriptions",
  "suscripcion",
  "abonnement",
  "invoice",
  "invoices",
  "fatura",
  "faturas",
  "factura",
  "portal",
  "upgrade",
  "trial",

  // Marketing, content, legal & technical routes (PT / EN / ES / FR)
  "home",
  "inicio",
  "accueil",
  "about",
  "sobre",
  "acerca",
  "a-propos",
  "apropos",
  "contact",
  "contato",
  "contacto",
  "blog",
  "news",
  "noticias",
  "actualites",
  "press",
  "imprensa",
  "prensa",
  "presse",
  "media",
  "midia",
  "careers",
  "carreiras",
  "vagas",
  "empleos",
  "jobs",
  "partners",
  "parceiros",
  "socios",
  "partenaires",
  "affiliates",
  "afiliados",
  "indique",
  "referral",
  "compare",
  "comparar",
  "comparer",
  "alternativa",
  "alternativas",
  "alternatives",
  "para",
  "for",
  "pour",
  "nichos",
  "niches",
  "examples",
  "exemplos",
  "ejemplos",
  "exemples",
  "showcase",
  "vitrine",
  "explore",
  "explorar",
  "discover",
  "descobrir",
  "directory",
  "diretorio",
  "search",
  "buscar",
  "busca",
  "recherche",
  "ferramentas",
  "tools",
  "herramientas",
  "outils",
  "utm",
  "gerador-de-utm",
  "qrcode",
  "vcard",
  "contato-vcf",
  "terms",
  "termos",
  "terminos",
  "conditions",
  "privacy",
  "privacidade",
  "privacidad",
  "confidentialite",
  "cookies",
  "lgpd",
  "gdpr",
  "legal",
  "dmca",
  "copyright",
  "feedback",
  "waitlist",
  "lista-de-espera",
  "atividades",
  "activity",
  "actividad",
  "beta",
  "dev",
  "test",
  "teste",
  "testing",
  "staging",
  "sandbox",
  "demo",
  "api",
  "graphql",
  "webhook",
  "webhooks",
  "cron",
  "static",
  "assets",
  "public",
  "images",
  "img",
  "icons",
  "brand",
  "fonts",
  "css",
  "sitemap",
  "robots",
  "llms",
  "llms-full",
  "manifest",
  "favicon",
  "opengraph",
  "opengraph-image",
  "rss",
  "feed",
  "embed",
  "iframe",
  "redirect",
  "short",
  "url",
  "www",
  "mail",
  "email",
  "smtp",
  "ftp",
  "cdn",
  "dns",
  "ssl",
]);

/** Returns true when a slug collides with platform routes or system terms. */
export function isPlatformReservedSlug(rawSlug: string): boolean {
  const slug = finalizeSlug(rawSlug);
  if (!slug) return false;
  const compact = slug.replace(/-/g, "");
  if (
    PLATFORM_RESERVED_SLUGS.has(slug) ||
    PLATFORM_RESERVED_SLUGS.has(compact)
  ) {
    return true;
  }
  if (
    slug.startsWith("admin-") ||
    slug.endsWith("-admin") ||
    slug.startsWith("administrador-") ||
    slug.endsWith("-administrador") ||
    slug.startsWith("linkmural-") ||
    slug.endsWith("-linkmural") ||
    slug.startsWith("suporte-")
  ) {
    return true;
  }
  return false;
}

/**
 * Well-known global and Brazilian brands protected from public self-registration.
 * Official representatives can request manual release from the administrator.
 */
const FAMOUS_BRAND_SLUGS = new Set([
  // Tech, Social & SaaS
  "apple",
  "iphone",
  "ipad",
  "macbook",
  "icloud",
  "appstore",
  "google",
  "youtube",
  "gmail",
  "android",
  "googleplay",
  "meta",
  "facebook",
  "instagram",
  "whatsapp",
  "threads",
  "messenger",
  "tiktok",
  "bytedance",
  "capcut",
  "microsoft",
  "windows",
  "xbox",
  "linkedin",
  "github",
  "openai",
  "chatgpt",
  "claude",
  "anthropic",
  "gemini",
  "amazon",
  "aws",
  "primevideo",
  "twitch",
  "alexa",
  "kindle",
  "netflix",
  "spotify",
  "deezer",
  "disney",
  "disneyplus",
  "hbomax",
  "paramount",
  "globo",
  "globoplay",
  "sbt",
  "record",
  "recordtv",
  "band",
  "cnn",
  "bbc",
  "uber",
  "ubereats",
  "99app",
  "99pop",
  "ifood",
  "rappi",
  "ze-delivery",
  "zedelivery",
  "airbnb",
  "booking",
  "decolar",
  "trivago",
  "canva",
  "figma",
  "adobe",
  "photoshop",
  "notion",
  "slack",
  "zoom",
  "discord",
  "telegram",
  "pinterest",
  "snapchat",
  "reddit",
  "twitter",
  "xcom",
  "roblox",
  "fortnite",
  "epicgames",
  "minecraft",
  "playstation",
  "sony",
  "nintendo",
  "samsung",
  "galaxy",
  "xiaomi",
  "motorola",
  "dell",
  "lenovo",
  "asus",
  "acer",
  "intel",
  "nvidia",
  "amd",
  "tesla",
  "spacex",
  "starlink",
  "oracle",
  "salesforce",
  "sap",
  "ibm",
  "cisco",
  "shopify",
  "wordpress",
  "wix",
  "squarespace",
  "linktree",
  "beacons",
  "bento",
  "bitly",
  "hotmart",
  "kiwify",
  "eduzz",
  "monetizze",
  "braip",
  "cakto",
  "kirvano",

  // Banks, Fintechs, Payments & Institutions (BR & Global)
  "nubank",
  "nu",
  "itau",
  "bradesco",
  "santander",
  "bancodobrasil",
  "caixa",
  "caixaeconomica",
  "btg",
  "btgpactual",
  "bancointer",
  "inter",
  "c6bank",
  "neon",
  "picpay",
  "mercadopago",
  "pagbank",
  "pagseguro",
  "stone",
  "ton",
  "infinitepay",
  "cielo",
  "getnet",
  "asaas",
  "iugu",
  "xpinvestimentos",
  "rico",
  "nomad",
  "wise",
  "paypal",
  "visa",
  "mastercard",
  "americanexpress",
  "amex",
  "sicoob",
  "sicredi",
  "safra",
  "bancopan",
  "willbank",
  "recargapay",
  "binance",
  "coinbase",
  "serasa",
  "spc",
  "receitafederal",
  "govbr",
  "inss",
  "detran",
  "correios",
  "sebrae",
  "senac",
  "senai",

  // Retail, Fashion, Food, Health, Telecom & Auto
  "mercadolivre",
  "shopee",
  "shein",
  "aliexpress",
  "temu",
  "magalu",
  "magazineluiza",
  "americanas",
  "casasbahia",
  "pontofrio",
  "fastshop",
  "kabum",
  "carrefour",
  "assai",
  "paodeacucar",
  "renner",
  "riachuelo",
  "cea",
  "marisa",
  "zara",
  "forever21",
  "adidas",
  "nike",
  "puma",
  "vans",
  "converse",
  "newbalance",
  "underarmour",
  "fila",
  "oakley",
  "rayban",
  "gucci",
  "prada",
  "louisvuitton",
  "chanel",
  "dior",
  "hermes",
  "versace",
  "balenciaga",
  "armani",
  "lacoste",
  "tommyhilfiger",
  "calvinklein",
  "levis",
  "arezzo",
  "schutz",
  "melissa",
  "havaianas",
  "vivara",
  "pandora",
  "rolex",
  "sephora",
  "natura",
  "boticario",
  "oboticario",
  "eudora",
  "avon",
  "quemdisseberenice",
  "loreal",
  "nivea",
  "dove",
  "pantene",
  "cocacola",
  "pepsi",
  "redbull",
  "monster",
  "heineken",
  "ambev",
  "brahma",
  "skol",
  "antarctica",
  "budweiser",
  "corona",
  "stellaartois",
  "nestle",
  "garoto",
  "lacta",
  "cacaushow",
  "kopenhagen",
  "mcdonalds",
  "burgerking",
  "kfc",
  "subway",
  "starbucks",
  "outback",
  "dominos",
  "pizzahut",
  "habibs",
  "spoleto",
  "giraffas",
  "bobs",
  "madero",
  "jeronimo",
  "smartfit",
  "bluefit",
  "totalpass",
  "gympass",
  "wellhub",
  "unimed",
  "hapvida",
  "amil",
  "sulamerica",
  "drogasil",
  "drogaraia",
  "paguemenos",
  "ultrafarma",
  "petz",
  "cobasi",
  "leroymerlin",
  "tokstok",
  "madeiramadeira",
  "vivo",
  "claro",
  "tim",
  "latam",
  "gol",
  "azul",
  "emirates",
  "toyota",
  "honda",
  "volkswagen",
  "fiat",
  "chevrolet",
  "ford",
  "hyundai",
  "jeep",
  "bmw",
  "mercedes",
  "audi",
  "porsche",
  "ferrari",
  "lamborghini",
  "byd",
  "petrobras",
  "shell",
  "ipiranga",
  "vale",
  "embraer",
  "weg",
]);

const BRAND_STRIP_PREFIXES = ["loja", "meu", "minha", "sou", "oficial", "use", "canal"];
const BRAND_STRIP_SUFFIXES = ["oficial", "br", "brasil", "app", "loja", "store", "shop", "online"];

/** Returns true when a slug matches a protected famous brand (or common brand look-alike). */
export function isFamousBrandSlug(rawSlug: string): boolean {
  const slug = finalizeSlug(rawSlug);
  if (!slug) return false;
  const compact = slug.replace(/-/g, "");
  if (FAMOUS_BRAND_SLUGS.has(slug) || FAMOUS_BRAND_SLUGS.has(compact)) {
    return true;
  }

  // Also check after stripping common prefixes/suffixes (e.g. "apple-oficial", "loja-nike", "meu-nubank")
  let stripped = slug;
  for (const pre of BRAND_STRIP_PREFIXES) {
    if (stripped.startsWith(`${pre}-`)) {
      stripped = stripped.slice(pre.length + 1);
    }
  }
  for (const suf of BRAND_STRIP_SUFFIXES) {
    if (stripped.endsWith(`-${suf}`)) {
      stripped = stripped.slice(0, -(suf.length + 1));
    }
  }
  const strippedCompact = stripped.replace(/-/g, "");
  if (
    FAMOUS_BRAND_SLUGS.has(stripped) ||
    FAMOUS_BRAND_SLUGS.has(strippedCompact)
  ) {
    return true;
  }

  return false;
}

/**
 * Normalizes while the person is typing: lowercase, strips accents,
 * turns spaces/underscores into hyphens, removes invalid characters,
 * collapses consecutive hyphens, strips leading hyphens, caps at 30 chars.
 * Keeps a single trailing hyphen while typing so space -> hyphen feels natural.
 */
export function normalizeSlugInput(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .slice(0, SLUG_MAX);
}

/** Final normalized slug (also trims trailing hyphens). */
export function finalizeSlug(raw: string): string {
  return normalizeSlugInput(raw).replace(/-+$/, "");
}

/** Rules: 3–30 chars, lowercase letters/digits/hyphen, no `--`, no leading/trailing `-`, no profanity, system route, or protected brand. */
export function isValidSlug(slug: string): boolean {
  return (
    SLUG_RE.test(slug) &&
    !slug.includes("--") &&
    !isOffensiveSlug(slug) &&
    !isPlatformReservedSlug(slug) &&
    !isFamousBrandSlug(slug)
  );
}

export const slugSchema = z
  .string()
  .transform(finalizeSlug)
  .refine(
    isValidSlug,
    "Use de 3 a 30 letras minúsculas, números ou hífen (sem hífen duplo ou nas pontas).",
  );

function clipCandidate(prefix: string, base: string, suffix: string): string {
  const maxBase = SLUG_MAX - prefix.length - suffix.length;
  if (maxBase < 1) return "";
  const trimmedBase = base.slice(0, maxBase).replace(/^-+|-+$/g, "");
  if (!trimmedBase) return "";
  return `${prefix}${trimmedBase}${suffix}`
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Deterministic candidate suggestions when a slug is taken or reserved.
 * The server filters these against reserved_slugs, pages and active holds
 * and returns up to 3 free options.
 */
export function buildSlugCandidates(rawSlug: string): string[] {
  const base = finalizeSlug(rawSlug);
  if (!base) return [];

  const compact = base.replace(/-/g, "");
  const variants = [
    clipCandidate("", base, "-oficial"),
    clipCandidate("", compact || base, "br"),
    clipCandidate("meu", compact || base, ""),
    clipCandidate("", base, "-br"),
    clipCandidate("sou", compact || base, ""),
    clipCandidate("", base, "-app"),
    clipCandidate("", base, "2"),
    clipCandidate("", base, "1"),
  ];

  const seen = new Set<string>([base]);
  const out: string[] = [];
  for (const v of variants) {
    if (!v || seen.has(v) || !isValidSlug(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type SlugHold = { slug: string; token: string };

export function serializeHoldCookie(slug: string, token: string): string {
  return `${slug}.${token}`;
}

export function parseHoldCookie(
  raw: string | undefined | null,
): SlugHold | null {
  if (!raw) return null;
  const dot = raw.indexOf(".");
  if (dot <= 0) return null;
  const slug = raw.slice(0, dot);
  const token = raw.slice(dot + 1);
  if (!isValidSlug(slug) || !UUID_RE.test(token)) return null;
  return { slug, token };
}
