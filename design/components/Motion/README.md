# Motion

Movimento curto e com propósito: confirma o toque, mostra de onde algo veio, e o alfinete assina a marca.

| Movimento | Onde | Tempo e curva |
| --- | --- | --- |
| Hover sobe 1–2px + sombra | Botões e cards | `duration-base`, `ease-out` |
| Toque encolhe (0,98–0,99) | Tudo que é clicável | `duration-fast`, `ease-out` |
| Alfinete cai e fixa | Link em destaque, publicar a página, item salvo | `duration-pin`, `ease-pin` |
| Entrada sobe 12px e aparece | Toasts, diálogos, listas que carregam | `duration-slow`, `ease-out` |
| Pulso | Só o "Aberto agora" | 1,8s, sem parar |

- Listas entram em cascata, 40ms entre itens, no máximo 6 itens animados.
- Nada de animação em loop além do skeleton e do ponto "ao vivo".
- Respeite `prefers-reduced-motion`: a folha de estilos zera animações e transições.
