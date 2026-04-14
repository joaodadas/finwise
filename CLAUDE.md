# Finwise — CLAUDE.md

@AGENTS.md

## Commands

- Dev: `npm run dev`
- Build: `npm run build`
- Lint: `npm run lint`
- Type check: `npx tsc --noEmit`
- DB push: `npm run db:push`
- DB generate: `npm run db:generate`
- DB migrate: `npm run db:migrate`
- DB studio: `npm run db:studio`

## Tech Stack

- **Next.js** (App Router) + **React 19** + **TypeScript 5**
- **Drizzle ORM** + PostgreSQL (Docker)
- **better-auth** (email/password)
- **Vercel AI SDK v6** (`ai` + `@ai-sdk/anthropic`)
- **shadcn/ui** + Tailwind CSS v4

## Project Structure

```
src/
├── app/
│   ├── (public)/    # sign-in, sign-up
│   ├── (private)/   # auth-required (dashboard)
│   └── api/         # API routes (auth)
├── ai/              # AI SDK config
├── components/
│   └── ui/          # shadcn components
├── db/              # Drizzle schema + connection
├── lib/             # Auth config, utilities
└── hooks/           # React hooks
```

## Code Style

- TypeScript strict mode
- File naming: kebab-case
- Component naming: PascalCase
- Imports: use `@/` alias
- Single quotes, 2-space indentation

## Environment Variables

Required in `.env`:
- `DATABASE_URL` — PostgreSQL connection
- `BETTER_AUTH_SECRET` — Auth session secret
- `BETTER_AUTH_URL` — App base URL
- `ANTHROPIC_API_KEY` — Claude AI (optional for now)
