# Linkmural

Página de links para negócios e profissionais (linkmural.com/<endereco>). Next.js 16 + Supabase, deploy na Hostinger a partir da branch `main`.

- Especificação: [docs/HANDOFF.md](docs/HANDOFF.md)
- Fases e progresso: [docs/ROADMAP.md](docs/ROADMAP.md)
- Regras do projeto: [CLAUDE.md](CLAUDE.md)
- Repositório: https://github.com/bezerradaniels/linkmural

## Desenvolvimento local

```bash
cp .env.example .env.local   # preencha as chaves
npm install
npm run dev                  # http://localhost:3000 (componentes em /dev/ui)
```

## Antes de cada commit

```bash
npm run lint && npm run typecheck && npm test
npm run test:e2e             # Playwright (precisa de: npx playwright install chromium)
npm run build                # o mesmo build da Hostinger
```
