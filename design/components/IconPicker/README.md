# IconPicker

Seletor de ícones para os links. Redes e serviços usam os **logotipos oficiais**; contato e negócio usam os ícones de traço da marca Linkmural.

## Fonte dos logos
- Biblioteca **Simple Icons** (`simple-icons`, licença CC0 para os SVGs), com o caminho e a cor oficial de cada marca. No Next: `import { siInstagram } from "simple-icons"` → `siInstagram.path` e `siInstagram.hex`.
- Os logos continuam sendo marcas registradas das empresas. Use-os só para apontar para o perfil ou serviço do cliente, sem alterar forma ou proporção, e siga as regras de marca de cada rede (a biblioteca indica o link das diretrizes em `guidelines`).
- **LinkedIn e Kwai** não estão na biblioteca (saíram a pedido das empresas). Por enquanto usam ícone de traço; para o logo oficial, baixar do kit de marca de cada uma (LinkedIn Brand, Kwai) e adicionar à mão.

## Grupos (36 opções)
- Redes sociais: Instagram, WhatsApp, Facebook, TikTok, YouTube, Telegram, X, Threads, Pinterest, Spotify, Discord, Twitch
- Pagamentos e compras: Pix, Mercado Pago, PicPay, Nubank, iFood, Shopee
- Serviços: Google Maps, Waze, Calendly, Gmail, Tripadvisor, Airbnb
- Contato e negócio (traço): Ligar, E-mail, Endereço, Contato, Agenda, Loja, Cardápio, Catálogo, Portfólio, Site, Cupom, PDF, Ingressos, LinkedIn, Kwai, Avaliações, Pagamento, Link

## Na página: duas opções de cor
- **Cor oficial** (padrão): cada logo na cor da marca. Marcas pretas (TikTok, X, Threads) seguem a cor do texto, para funcionar no estilo Dark.
- **Na cor do estilo**: todos os logos na cor do texto do estilo (Calm, Zen, Classic ficam mais uniformes). Opção em Aparência → Ícones.

## Reconhecimento automático
O domínio colado escolhe o logo e sugere o título: `instagram.com`, `wa.me`/`api.whatsapp.com`, `facebook.com`, `tiktok.com`, `youtube.com`/`youtu.be`, `t.me`, `x.com`/`twitter.com`, `threads.net`, `pin.it`/`pinterest.com`, `open.spotify.com`, `discord.gg`, `twitch.tv`, `link.mercadopago.com.br`, `picpay.me`, `nubank.com.br`, `ifood.com.br`, `shopee.com.br`, `maps.google.com`/`maps.app.goo.gl`, `waze.com`, `calendly.com`, `tripadvisor.com`, `airbnb.com`; `tel:`, `mailto:` e `.pdf` usam os ícones de traço. Chave Pix colada (CPF, e-mail, telefone ou aleatória) vira um link Pix com botão de copiar.

## Busca
Entende sinônimos em português: "zap" → WhatsApp, "insta" → Instagram, "face" → Facebook, "mapa" → Google Maps, "menu" → Cardápio, "pagar" → Pix e Pagamento.

## Seletor
- Logos em quadrado de 36px com fundo na cor da marca a 12%. O escolhido ganha contorno `ink` de 2px.
- Cada item é um botão com `aria-pressed`; as setas do teclado andam pela grade. O nome sempre aparece no card do link, então o logo é decorativo (`aria-hidden`).
