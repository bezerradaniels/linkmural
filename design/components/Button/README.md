# Button

O botão em pílula é a ação da tela; o primário em lime aparece no máximo uma vez por tela.

## Variantes
- **Primário** (`lm-btn--primary`): lime com texto `on-lime`. Publicar, Criar minha página, Assinar.
- **Secundário** (`lm-btn--secondary`): ink. Ações fortes que não são a principal (Adicionar link).
- **Outline** e **Ghost**: ações de apoio (Ver planos, Cancelar).
- **Destrutivo** (`lm-btn--danger`): só para excluir; sempre com confirmação.
- Tamanhos: `--sm` 32px, padrão 44px, `--lg` 52px. Só ícone: `--icon`, sempre com `aria-label`.

## Estados
- Hover: sobe 1px (`translateY(-1px)`); o primário ganha `lime-strong` e `shadow-md`.
- Pressionado: `scale(0.98)` em `duration-fast`.
- Foco do teclado: anel `focus` de 2px com 2px de folga.
- Carregando: spinner + verbo no gerúndio ("Publicando…"), com `aria-busy`.
- Desativado: opacidade 45%; explique o motivo ao lado ou no texto ("Limite atingido").

## Texto
Verbo primeiro, sem ponto final, até 3 palavras quando possível.
