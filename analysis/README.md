# analysis

Scripts to export study data from PostgreSQL to CSV, run paired statistical tests (Wilcoxon, McNemar, binomial), and generate thesis figures (PDF) for the `Results` section.

Database access uses **Bun’s built-in SQL driver** (`SQL` from `"bun"`); no `postgres` npm package is required.

[Bun loads `.env` automatically](https://bun.sh/docs/runtime/env) when you run scripts (`.env`, then `.env.<NODE_ENV>`, then `.env.local`). You do **not** need the `dotenv` package.

## Setup

From this directory:

```bash
bun install
```

## Environment

`export-csv.ts` needs `DATABASE_URL` (same connection string as the artifact).

- If you run `bun run export` from **`analysis/`**, put `DATABASE_URL` in `analysis/.env` (or export it in the shell).
- If `DATABASE_URL` only exists in **`artifact/.env`**, either symlink/copy it, or run:

```bash
bun run export:artifact-env
```

which uses `bun --env-file=../artifact/.env` (see [manual env files](https://bun.sh/docs/runtime/env#manually-specifying-env-files)).

## Commands

| Command | What it does |
|--------|----------------|
| `bun run export` | Query Postgres and write CSVs under `analysis/csv/` |
| `bun run pdf-comments -- <file.pdf>` | Extract embedded PDF annotations/comments |
| `bun run stats` | Read those CSVs and print test statistics (console) |
| `bun run figures` | Build vector PDF figures into `../graphics/` (needs CSVs from `export`) |
| `bun run gen-tex` | Regenerate `../sections/generated-result-values.tex` from CSVs (needs `export` first) |
| `bun run analyse` | Run `export`, then `stats`, then `figures`, then `gen-tex` |
| `bun run typecheck` | Typecheck with `tsc` |

## Typical workflow

```bash
cd analysis
bun install
bun run analyse
```

Numeric placeholders in `sections/results.tex` are filled via `\input{sections/generated-result-values}`; rerun `gen-tex` (or `analyse`) after each export. Figures are written as:

- `graphics/results-completion-time.pdf` — paired lines (seconds)
- `graphics/results-interaction-count.pdf` — paired lines (interaction count)
- `graphics/results-likert-ratings.pdf` — median bars for helpfulness, intrusiveness, control

`plot-figures.ts` uses [`pdf-lib`](https://pdf-lib.js.org/) (vector PDFs suitable for LaTeX `\includegraphics`).

See also `queries.sql` for raw SQL you can run in `psql` if you prefer.
