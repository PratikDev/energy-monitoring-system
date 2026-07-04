# Repository Guidelines

## Project Structure & Module Organization

This is a Vite React portfolio app written in TypeScript. Application entry points live in `src/main.tsx` and `src/App.tsx`. Global styles and Tailwind CSS setup are in `src/index.css`. Reusable UI primitives belong in `src/components/ui/`, following the current shadcn-style component layout. Shared utilities belong in `src/lib/`, such as `src/lib/utils.ts`. Static top-level configuration includes `vite.config.ts`, `tsconfig*.json`, `eslint.config.js`, and `components.json`. Build output is generated in `dist/` and is ignored by linting.

## Build, Test, and Development Commands

Use Bun as the package manager because this repo includes `bun.lock`.

- `bun install`: install dependencies.
- `bun run dev`: start the Vite development server.
- `bun run build`: run TypeScript project checks with `tsc -b`, then create a production Vite build.
- `bun run lint`: run ESLint across the repository.
- `bun run preview`: serve the production build locally for verification.
- `bun run shadd <component-name>`: add new shadcn UI components to the project.
- `bun run convex`: run Convex dev server once.

## Coding Style & Naming Conventions

Write TypeScript and TSX with strict compiler settings. TypeScript and React components should be in `.ts` and `.tsx` files. Prefer function components and named exports for reusable UI, matching `src/components/ui/button.tsx`. Use the `@/` path alias for imports from `src`, for example `@/components/ui/button` and `@/lib/utils`. Keep utility functions small and colocated under `src/lib/`. Component names should use PascalCase, hooks should use `useCamelCase`, and general variables/functions should use camelCase. Try to avoid `any` or `unknown` types as much as possible. Keep **EVERYTHING** type-safe. Never make a single file too long. Do code splitting with easily manageable/understandable file structure. always follow DRY strategy for everything. Whether it's a type/interface declaration or even a simple utility function. Never write same logic in multiple places. and keep everything easily extensible. CSS should primarily use Tailwind utility classes and CSS variables defined through the existing shadcn/Tailwind setup. If any css color is needs to be used that isn't available in `src/index.css` already, never use tailwind arbitrary values. always declare them as variables in `src/index.css` and use those variables in the classnames. For any frontend related task, use shadcn/ui components as much as possible.

## Testing Guidelines

No test runner or test script is configured yet. For now, validate changes with `bun run lint` and `bun run build`. When adding tests, prefer colocated files named `*.test.ts` or `*.test.tsx`, and add an explicit `test` script to `package.json` so future contributors have one standard command.

## Commit & Pull Request Guidelines

Keep commits atomic: commit only the files you touched and list each path explicitly. For tracked files run `git commit -m "<scoped message>" -- path/to/file1 path/to/file2`. For brand-new files, use the one-liner `git restore --staged :/ && git add "path/to/file1" "path/to/file2" && git commit -m "<scoped message>" -- path/to/file1 path/to/file2`. Always check the changed files by `git status` before committing. Never commit files from the thread context. Never change any file content before committing. PRs should explain user-visible impact, list schema or config changes, and link related issues. Pull requests should include a short summary, validation steps, and linked issues when relevant. Note any schema, environment, or migration impact explicitly.

## Bot Development

The Discord bot lives in `bot/` and runs on Bun. To start it locally:

```bash
make bot
```

For development without Docker:
```bash
bun --cwd bot dev
```

The bot shares Convex query functions with the dashboard — see `convex/office.ts`.

## Agent-Specific Instructions

Keep edits scoped to the requested change. Do not rewrite generated shadcn UI primitives unless the task requires it. Before changing shared styling or config, check `components.json`, `src/index.css`, and the relevant TypeScript config so new code follows the existing setup.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
