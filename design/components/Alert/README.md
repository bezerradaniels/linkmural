# Alert

Mensagem que fica na tela, ligada a um contexto: limite, cobrança, erro ao salvar.

- Quatro tipos: **info** (lime-soft), **sucesso** (positive-soft), **atenção** (warning-soft), **erro** (negative-soft). Texto sempre `ink`; só o ícone leva a cor do estado.
- Título curto em negrito + uma frase com o próximo passo.
- Erro usa `role="alert"`; os outros `role="status"`.
- Sem borda lateral colorida: o tipo vem do fundo e do ícone.
