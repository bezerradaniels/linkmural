# Input

Campo de texto com rótulo sempre visível em cima; ajuda e erro embaixo.

- Altura 44px, borda `line-strong`, raio `radius-md`, fundo `surface`.
- Foco: borda `ink` + brilho lime de 3px (`box-shadow`), em `duration-base`.
- Erro: `aria-invalid="true"`, borda `negative` e mensagem dizendo como corrigir.
- Com prefixo (`lm-affix`): usado no endereço da página, "linkmural.com/".
- Teclado certo no celular: `type="tel"` para telefone, `type="url"` para links, `type="email"`.
- Nunca use o placeholder no lugar do rótulo.
