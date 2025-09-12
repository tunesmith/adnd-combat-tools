# Repository Guidelines

## Project Structure & Module Organization
- Source lives under `src/`.
  - `pages/` (Next.js routes), `components/` (UI, PascalCase), `styles/` and `*.module.css` (CSS Modules), `helpers/` (pure utilities), `tables/` (lookup data), `dungeon/` (domain logic: helpers/models/services), `types/` (shared TS types), `tests/` (unit tests).
- Static assets: `public/`. Project docs: `doc/`.
- Build outputs: `.next/` (dev/prod) and `out/` (static export used for GitHub Pages).

## Build, Test, and Development Commands
- `npm run dev` — Start Next dev server at `http://localhost:3000`.
- `npm run build` — `next build && next export`; writes static site to `out/`.
- `npm start` — Run the production server (uses `.next/`).
- `npm run dev:static` — Export and serve `./out` for local static testing.
- `npm run lint` — Lint via ESLint (Next core-web-vitals + Prettier).
- `npm test` | `test:watch` | `test:coverage` — Run Jest, watch, or collect coverage.
- `npm run deploy` — Publish `out/` to GitHub Pages via `gh-pages`.

## Coding Style & Naming Conventions
- Language: TypeScript with strict settings (see `tsconfig.json`). Avoid `any`; add explicit types.
- Formatting: Prettier. Lint rules: `next/core-web-vitals` + Prettier. Run `npm run lint` before PRs.
- Files: React components `PascalCase.tsx`; helpers/data `camelCase.ts`; CSS Modules `*.module.css`.
- Keep functions pure in `helpers/` and `dungeon/helpers/` where possible; colocate domain data in `tables/`.

## Testing Guidelines
- Framework: Jest + ts-jest. Tests live under `src/tests/` and match `**/*.(test|spec).[tj]s?(x)`.
- Name tests after the unit under test, e.g. `getHenchmanLevel.test.ts`.
- Run `npm test` locally; use `test:coverage` for PRs touching logic-heavy code.

## Commit & Pull Request Guidelines
- Commits: Imperative mood with area prefix, e.g. `dungeon: extract getMonkHenchmen` or `battle: fix initiative order`.
- Keep subjects concise; include details in the body when needed.
- PRs should include: clear summary, linked issues (e.g., `Closes #123`), screenshots/GIFs for UI, test plan (commands + expected results), and a note on docs if applicable.
- Before opening a PR: run `npm run lint` and `npm test` (or `test:coverage`).

## Deployment & Configuration Tips
- GitHub Pages uses static export under `/adnd-combat-tools` (`basePath`/`assetPrefix` set in `next.config.js` for production).
- Use Next `<Link>` and `router` to respect the `basePath`. Avoid hardcoding root `/` paths in links/assets; prefer `next/image`, `next/link`, or `public/` references.
