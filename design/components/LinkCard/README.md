# LinkCard

O card de link é a peça central da página pública: ícone, título, subtítulo e a seta que se move no hover.

- Hover: sobe 2px e ganha `shadow-md`; a seta anda na diagonal. Toque: `scale(0.99)`.
- **Destaque** (`--featured`): fundo lime e o alfinete (`lm-pin`) no canto, que "cai" com `duration-pin` e `ease-pin`. Um por página: o link principal.
- Título até ~28 caracteres; subtítulo opcional, uma linha.
- O card inteiro é o link (`<a>`), com foco visível.
- As cores aqui são as da marca Linkmural; nas páginas dos clientes elas vêm do estilo escolhido (Sport, Calm, Classic, Pop, Bold, Fresh, Zen, Dark).
