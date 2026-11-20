# Linkmural

Linkmural é a página de links para empresas e profissionais: academias, clínicas, profissionais liberais e lojas. Todos os links do negócio ficam presos num mural só, num endereço simples: linkmural.com/nome-da-empresa.

A marca é **criativa e ousada, mas sempre clara**. Ousada na cor e na forma; clara no que diz e no que pede para a pessoa fazer.

## Ideia da marca

O símbolo é um **mural com um alfinete**: um quadro com três linhas (os links, do mais importante ao menos) e um alfinete verde-limão prendendo tudo no canto. Ele se lê na hora como "seus links, fixados num lugar só". O alfinete é o elemento-assinatura: aparece no logo, nos destaques e como recurso gráfico.

## Voz

Falamos com o dono do negócio de igual para igual: direto, animado, sem jargão de tecnologia.

- Faça: frases curtas, verbos de ação ("Crie sua página", "Fixe seus links"), números concretos ("4 de 5 links").
- Faça: tratar por "você"; nomes de planos com inicial maiúscula (Grátis, Pro, Negócios).
- Evite: termos técnicos (URL, deploy, SaaS), exclamações em sequência, emoji em textos de interface.
- O nome escrito é sempre **linkmural**, em minúsculas, no logo. Em texto corrido, **Linkmural**.

## Logo

Arquivos no grupo Logos. O logo é o símbolo à esquerda e o nome à direita, em Unbounded SemiBold, minúsculas, com espaçamento entre letras de −4%.

- **Versões:** principal (`linkmural-logo.svg`, sobre paper ou fundos claros), negativa (`linkmural-logo-negativo.svg`, sobre ink ou fundos escuros) e sobre limão (`linkmural-logo-limao.svg`).
- **Símbolo sozinho:** ícone do app, favicon, avatar de redes, carimbos. Use `linkmural-simbolo.svg` ou a versão negativa.
- **Construção:** o quadro do símbolo tem a altura das letras altas (l, k) e fica apoiado na linha de base do nome. O espaço entre símbolo e nome é 1/4 da altura do quadro.
- **Área de proteção:** em volta do logo, deixe livre no mínimo o diâmetro do alfinete em todos os lados.
- **Tamanho mínimo:** logo completo com 96px de largura na tela (25mm impresso); símbolo sozinho com 16px.
- **O anel do alfinete** tem sempre a cor do fundo: é ele que "recorta" o alfinete do quadro.

Não faça:
- Mudar as cores do alfinete ou do quadro fora das três versões.
- Esticar, inclinar, aplicar sombra, gradiente ou contorno.
- Reescrever o nome em outra fonte ou com inicial maiúscula no logo.
- Colocar o logo principal sobre fotos ou fundos médios sem contraste; use a versão negativa ou um bloco de paper atrás.

## Cores

A base é neutra e o verde-limão é a assinatura. Proporção de referência: **60% paper, 30% ink, 10% lime**.

- `paper` e `surface` formam os fundos; `ink` é texto e o quadro do símbolo; `ink-muted` é texto secundário.
- `lime` é só preenchimento (alfinete, botão principal, destaque) com `on-lime` por cima. **Nunca use lime como cor de texto sobre fundo claro**: o contraste não passa.
- No tema escuro, `paper` e `ink` se invertem; o `lime` continua igual.
- `positive`, `warning` e `negative` são só para estados (ativo, atenção, erro), nunca decoração.
- Anel de foco: `focus`, 2px com 2px de folga.

## Tipografia

- **Unbounded** (`display`): títulos, números grandes e o nome da marca. Larga e arredondada, dá a personalidade. Use de 26px para cima, peso 600, espaçamento −2% a −4%.
- **Inter** (`sans`): toda a interface e textos corridos. Corpo `body` 15px; `small` 13px; `caption` 11,5px para rótulos.
- Duas fontes no máximo por peça. Nada de Unbounded em parágrafos.
- As duas são Google Fonts, gratuitas para uso comercial.

## Forma

- Tudo tem cantos arredondados: `radius-lg` (20px) nos cards de links, `radius-xl` (28px) em blocos grandes e no ícone do app, pílulas (`radius-pill`) em botões e etiquetas.
- Cards em `surface` sobre `paper`, separados por `space-3`. Bordas finas em `line` só quando o card some no fundo.
- O alfinete (um círculo lime com anel na cor do fundo) pode marcar o item em destaque: o link principal, o plano recomendado, uma novidade. Um por tela.

## Ícones

Grupo Icons: traço de 1,8px num quadro de 24px, pontas e cantos arredondados, sem preenchimento. Desenhados como linhas simples, combinando com as barras do símbolo. Em interface, use 16 a 24px na cor do texto ao lado (`ink` ou `ink-muted`). Ícones de redes sociais seguem o mesmo traço, sem os logotipos oficiais coloridos.

## Aplicações

- **Página de links:** fundo `paper`, cards `surface`, botão principal em `lime`. No rodapé do plano Grátis, o selo "Feito com linkmural" com o símbolo de 16px.
- **Painel:** interface clara e discreta em Inter; o lime aparece só no botão principal e nos destaques.
- **Redes sociais:** avatar com o símbolo negativo sobre ink; posts com blocos de cor (ink, lime, paper) e títulos em Unbounded.
- **Ícone do app e favicon:** `linkmural-icone-app.svg` (quadro paper sobre ink, alfinete lime).
