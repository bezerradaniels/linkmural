# Select

Menu suspenso: escolha numa lista (Select) ou ações de um item (menu de "mais ações").

- Gatilho igual a um campo (`lm-select`): rótulo em `ink-muted` e o valor escolhido; aberto, ganha a borda `ink` e o brilho lime.
- Lista (`lm-menu`) em `surface`, `shadow-lg`, itens de 40px; o escolhido em negrito com o visto à direita.
- Ação destrutiva sempre por último, separada por uma linha e em `negative`.
- Abre com `lm-pop` (desce 4px e aparece em `duration-base`). Setas do teclado navegam; Esc fecha.
- No celular, listas longas viram Sheet.
