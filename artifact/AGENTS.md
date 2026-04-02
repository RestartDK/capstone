# Agent notes

## Package manager and runtime

This project uses **Bun**, not npm, pnpm, or yarn.

- Install dependencies: `bun install`
- Run scripts: `bun run <script>` (e.g. `bun run dev`, `bun run typecheck`, `bun run lint`)
- Some tooling runs directly with Bun (e.g. `bun run scripts/health-pg.ts` via the `health:pg` script)

When suggesting or running commands for this repo, default to **Bun** so installs and scripts stay consistent with `package.json` and local workflows.
