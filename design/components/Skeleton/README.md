# Skeleton

Formas cinzas no lugar do conteúdo enquanto ele carrega, com um brilho passando da esquerda para a direita.

- Reproduza a forma real: avatar redondo, linhas de texto com larguras diferentes, cards com o mesmo raio.
- Brilho com `shimmer`, 1,4s em `ease-in-out`, sem parar.
- Para cargas de menos de 300ms não mostre nada; acima de 1s, use skeleton, não spinner.
- Marque a área com `aria-busy="true"`.
