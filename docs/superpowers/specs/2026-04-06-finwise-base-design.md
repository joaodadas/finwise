# Finwise — Base Project Design Spec

## Overview

Academic finance + AI platform for university coursework. Minimal viable base: authentication, database, AI SDK setup, and project scaffolding. No feature screens in this phase.

**Repo:** `joaodadas/finwise` (GitHub, personal account)  
**Scope:** Academic only

---

## Tech Stack

| Layer          | Technology                          |
| -------------- | ----------------------------------- |
| Framework      | Next.js 15 (App Router)             |
| Language       | TypeScript 5 (strict mode)          |
| UI             | shadcn/ui + Tailwind CSS v4         |
| Auth           | better-auth (email/password)        |
| Database       | PostgreSQL 16 (Docker Compose)      |
| ORM            | Drizzle ORM + `postgres` driver     |
| AI             | Vercel AI SDK v6 + @ai-sdk/anthropic |
| Package Manager| npm                                 |

---

## Project Structure

```
finwise/
├── src/
│   ├── app/
│   │   ├── (public)/              # Unauthenticated routes
│   │   │   ├── sign-in/page.tsx
│   │   │   ├── sign-up/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (private)/             # Authenticated routes
│   │   │   ├── page.tsx           # Dashboard placeholder
│   │   │   └── layout.tsx         # Auth guard
│   │   ├── api/
│   │   │   └── auth/[...all]/route.ts  # better-auth API handler
│   │   ├── layout.tsx             # Root layout (fonts, providers)
│   │   ├── page.tsx               # Landing / redirect
│   │   └── globals.css            # Tailwind v4 imports
│   ├── ai/
│   │   └── models.ts             # AI provider config (Anthropic)
│   ├── components/
│   │   └── ui/                   # shadcn base components
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema (auth tables)
│   │   └── index.ts              # DB connection pool
│   ├── lib/
│   │   ├── auth.ts               # better-auth server config
│   │   └── auth-client.ts        # better-auth client
│   └── hooks/
├── drizzle.config.ts
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── CLAUDE.md
└── package.json
```

---

## Authentication

- **Provider:** better-auth with email/password plugin
- **Tables:** `user`, `session`, `account`, `verification` (better-auth default schema via Drizzle adapter)
- **Flow:**
  1. `/sign-up` — registration form (name, email, password)
  2. `/sign-in` — login form (email, password)
  3. On success → redirect to `(private)/` dashboard placeholder
  4. `(private)/layout.tsx` checks session; redirects to `/sign-in` if unauthenticated
- **API route:** `/api/auth/[...all]/route.ts` handles all better-auth endpoints

---

## Database

- **Docker Compose** runs PostgreSQL 16 Alpine locally
- **Connection:** `postgres` driver (same as financial-agent)
- **Schema:** auth tables only (user, session, account, verification)
- **Migrations:** Drizzle Kit (`drizzle-kit generate` + `drizzle-kit migrate`)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: finwise
      POSTGRES_PASSWORD: finwise
      POSTGRES_DB: finwise
    volumes:
      - pgdata:/var/lib/postgresql/data
volumes:
  pgdata:
```

---

## AI SDK Setup

Minimal configuration only — no agents, tools, or API routes in this phase.

- `src/ai/models.ts`: exports configured Anthropic provider
- AI SDK v6 (`ai` package) + `@ai-sdk/anthropic`
- Ready to extend with agents/tools in future phases

---

## Environment Variables

`.env.example` template:

```
DATABASE_URL=postgresql://finwise:finwise@localhost:5432/finwise
BETTER_AUTH_SECRET=<generate-random-secret>
BETTER_AUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=<your-key>
```

---

## README Structure

Detailed README in English covering:
1. Project description (academic finance + AI platform)
2. Tech stack table
3. Prerequisites (Node.js 18+, Docker)
4. Getting started (clone, install, docker up, env setup, migrate, dev)
5. Project structure explanation
6. Available scripts
7. Future roadmap placeholder

---

## Out of Scope (this phase)

- Feature screens (dashboard, charts, analytics)
- AI agents and tools
- Stripe/payments
- Redis caching
- Deployment/Vercel config
- Testing setup
