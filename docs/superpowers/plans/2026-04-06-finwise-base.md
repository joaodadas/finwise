# Finwise — Base Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold a Next.js academic finance + AI platform with auth, PostgreSQL (Docker), and AI SDK setup. Push to GitHub as `joaodadas/finwise`.

**Architecture:** Next.js App Router with route groups `(public)` and `(private)`. better-auth handles email/password authentication with Drizzle ORM adapter on PostgreSQL. AI SDK configured but no agents/tools yet.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Drizzle ORM, PostgreSQL 16, better-auth, shadcn/ui, Tailwind CSS v4, Vercel AI SDK v6

---

## File Map

### Create
- `docker-compose.yml` — PostgreSQL container
- `src/db/index.ts` — DB connection pool
- `src/db/schema.ts` — Drizzle schema (auth tables)
- `drizzle.config.ts` — Drizzle Kit config
- `src/lib/auth.ts` — better-auth server config
- `src/lib/auth-client.ts` — better-auth React client
- `src/lib/utils.ts` — cn() utility (shadcn)
- `src/app/api/auth/[...all]/route.ts` — Auth API handler
- `src/components/login-form.tsx` — Sign-in form
- `src/components/signup-form.tsx` — Sign-up form
- `src/app/(public)/layout.tsx` — Public layout
- `src/app/(public)/sign-in/page.tsx` — Sign-in page
- `src/app/(public)/sign-up/page.tsx` — Sign-up page
- `src/app/(private)/layout.tsx` — Private layout (auth guard)
- `src/app/(private)/page.tsx` — Dashboard placeholder
- `src/ai/models.ts` — AI SDK provider config
- `.env.example` — Environment template
- `CLAUDE.md` — Dev instructions
- `README.md` — Detailed project docs

### Modify
- `src/app/layout.tsx` — Add Toaster, dark mode, font
- `src/app/page.tsx` — Landing page with auth redirect
- `src/app/globals.css` — shadcn theme variables
- `package.json` — Add db scripts
- `.gitignore` — Add .env, drizzle meta

---

## Task 1: Scaffold Next.js + Docker Compose

**Files:**
- Create: `docker-compose.yml`
- Modify: project root (create-next-app output)

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/joaovitordadas/Developer
npx create-next-app@latest finwise --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack
```

Accept defaults. This scaffolds the base project.

- [ ] **Step 2: Create Docker Compose file**

Create `docker-compose.yml`:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: finwise-db
    restart: unless-stopped
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: finwise
      POSTGRES_PASSWORD: finwise
      POSTGRES_DB: finwise
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

- [ ] **Step 3: Start PostgreSQL**

```bash
docker compose up -d
```

Expected: Container `finwise-db` running on port 5432.

- [ ] **Step 4: Create .env file**

Create `.env`:

```
DATABASE_URL=postgresql://finwise:finwise@localhost:5432/finwise
BETTER_AUTH_SECRET=finwise-dev-secret-change-in-production
BETTER_AUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with Docker Compose for PostgreSQL"
```

---

## Task 2: Install Dependencies + shadcn Init

**Files:**
- Modify: `package.json`
- Create: `components.json`, `src/lib/utils.ts`, `src/components/ui/*`

- [ ] **Step 1: Install core dependencies**

```bash
cd /Users/joaovitordadas/Developer/finwise
npm install drizzle-orm postgres better-auth ai @ai-sdk/anthropic sonner
npm install -D drizzle-kit dotenv tsx
```

- [ ] **Step 2: Initialize shadcn/ui**

```bash
npx shadcn@latest init -d
```

This sets up `components.json`, `src/lib/utils.ts`, and Tailwind config.

- [ ] **Step 3: Add shadcn components**

```bash
npx shadcn@latest add button card input label
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: install dependencies and initialize shadcn/ui"
```

---

## Task 3: Database Layer

**Files:**
- Create: `src/db/index.ts`, `src/db/schema.ts`, `drizzle.config.ts`
- Modify: `package.json` (add db scripts)

- [ ] **Step 1: Create DB connection**

Create `src/db/index.ts`:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const client = postgres(process.env.DATABASE_URL!, {
  prepare: false,
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
})

export const db = drizzle(client, { schema })
```

- [ ] **Step 2: Create auth schema**

Create `src/db/schema.ts`:

```typescript
import {
  pgTable,
  text,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})
```

- [ ] **Step 3: Create Drizzle config**

Create `drizzle.config.ts`:

```typescript
import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

- [ ] **Step 4: Add db scripts to package.json**

Add to `scripts` in `package.json`:

```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 5: Push schema to database**

```bash
npm run db:push
```

Expected: Tables `user`, `session`, `account`, `verification` created in PostgreSQL.

- [ ] **Step 6: Verify with Drizzle Studio**

```bash
npm run db:studio
```

Expected: Opens browser showing the 4 tables.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add Drizzle ORM schema and PostgreSQL connection"
```

---

## Task 4: Authentication Setup

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth-client.ts`, `src/app/api/auth/[...all]/route.ts`

- [ ] **Step 1: Create better-auth server config**

Create `src/lib/auth.ts`:

```typescript
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { nextCookies } from 'better-auth/next-js'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [nextCookies()],
})
```

- [ ] **Step 2: Create better-auth client**

Create `src/lib/auth-client.ts`:

```typescript
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient()

export const { signIn, signOut, useSession } = authClient
```

- [ ] **Step 3: Create auth API route**

Create `src/app/api/auth/[...all]/route.ts`:

```typescript
import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

export const { GET, POST } = toNextJsHandler(auth)
```

- [ ] **Step 4: Verify auth endpoint**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000/api/auth/ok | head -20
kill %1
```

Expected: Returns JSON response confirming auth is running.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: configure better-auth with email/password authentication"
```

---

## Task 5: Auth UI Pages + Route Groups

**Files:**
- Create: `src/components/login-form.tsx`, `src/components/signup-form.tsx`
- Create: `src/app/(public)/layout.tsx`, `src/app/(public)/sign-in/page.tsx`, `src/app/(public)/sign-up/page.tsx`
- Create: `src/app/(private)/layout.tsx`, `src/app/(private)/page.tsx`
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

- [ ] **Step 1: Update root layout**

Replace `src/app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Finwise',
  description: 'Academic finance + AI platform',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

- [ ] **Step 2: Create login form component**

Create `src/components/login-form.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await authClient.signIn.email({
      email: emailRef.current!.value,
      password: passwordRef.current!.value,
    })

    if (result.error) {
      toast.error('Login failed', {
        description: result.error.message,
      })
      setLoading(false)
      return
    }

    toast.success('Logged in successfully!')
    router.push('/dashboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              ref={emailRef}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              ref={passwordRef}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Don&apos;t have an account?{' '}
            <a href="/sign-up" className="underline text-foreground">
              Sign up
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create signup form component**

Create `src/components/signup-form.tsx`:

```tsx
'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authClient } from '@/lib/auth-client'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function SignupForm() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const result = await authClient.signUp.email({
      name: nameRef.current!.value,
      email: emailRef.current!.value,
      password: passwordRef.current!.value,
    })

    if (result.error) {
      toast.error('Signup failed', {
        description: result.error.message,
      })
      setLoading(false)
      return
    }

    toast.success('Account created!')
    router.push('/dashboard')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Create Account</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              ref={nameRef}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              ref={emailRef}
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              ref={passwordRef}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
            Already have an account?{' '}
            <a href="/sign-in" className="underline text-foreground">
              Sign in
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Create public layout**

Create `src/app/(public)/layout.tsx`:

```typescript
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
```

- [ ] **Step 5: Create sign-in page**

Create `src/app/(public)/sign-in/page.tsx`:

```tsx
import { LoginForm } from '@/components/login-form'

export default function SignInPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Create sign-up page**

Create `src/app/(public)/sign-up/page.tsx`:

```tsx
import { SignupForm } from '@/components/signup-form'

export default function SignUpPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-4">
      <div className="w-full max-w-md">
        <SignupForm />
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Create private layout (auth guard)**

Create `src/app/(private)/layout.tsx`:

```typescript
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/sign-in')
  }

  return <>{children}</>
}
```

- [ ] **Step 8: Create dashboard placeholder**

Create `src/app/(private)/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </div>
  )
}
```

Note: The `(private)` route group renders at `/` by default. The root `src/app/page.tsx` will redirect authenticated users here.

- [ ] **Step 9: Update root page**

Replace `src/app/page.tsx`:

```tsx
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session) {
    redirect('/dashboard')
  }

  redirect('/sign-in')
}
```

Wait — route groups with `page.tsx` at the same path will conflict. The root `src/app/page.tsx` handles `/`. The `(private)/page.tsx` needs a named route.

Fix: rename `src/app/(private)/page.tsx` to `src/app/(private)/dashboard/page.tsx` so it serves `/dashboard`.

Create `src/app/(private)/dashboard/page.tsx`:

```tsx
export default function DashboardPage() {
  return (
    <div className="flex min-h-svh items-center justify-center">
      <h1 className="text-2xl font-bold">Dashboard</h1>
    </div>
  )
}
```

- [ ] **Step 10: Verify build**

```bash
npm run build
```

Expected: Build succeeds. Pages `/sign-in`, `/sign-up`, `/dashboard` all compile.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add auth pages, route groups, and auth guard"
```

---

## Task 6: AI SDK Setup

**Files:**
- Create: `src/ai/models.ts`

- [ ] **Step 1: Create AI provider config**

Create `src/ai/models.ts`:

```typescript
import { anthropic } from '@ai-sdk/anthropic'

export const defaultModel = anthropic('claude-sonnet-4-5-20250514')
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/ai/models.ts
git commit -m "feat: configure AI SDK with Anthropic provider"
```

---

## Task 7: Config Files

**Files:**
- Create: `.env.example`, `CLAUDE.md`
- Modify: `.gitignore`

- [ ] **Step 1: Create .env.example**

Create `.env.example`:

```
DATABASE_URL=postgresql://finwise:finwise@localhost:5432/finwise
BETTER_AUTH_SECRET=<generate-a-random-secret>
BETTER_AUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=<your-anthropic-api-key>
```

- [ ] **Step 2: Update .gitignore**

Append to `.gitignore`:

```
# env
.env
.env.local

# drizzle
drizzle/meta

# editor
.cursor
.claude
```

- [ ] **Step 3: Create CLAUDE.md**

Create `CLAUDE.md`:

```markdown
# Finwise — CLAUDE.md

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

- **Next.js 15** (App Router) + **React 19** + **TypeScript 5**
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
```

- [ ] **Step 4: Commit**

```bash
git add .env.example CLAUDE.md .gitignore
git commit -m "chore: add env template, CLAUDE.md, and update gitignore"
```

---

## Task 8: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

Create `README.md`:

````markdown
# Finwise

Academic finance platform powered by AI. Built as a university project to explore the intersection of financial analysis and artificial intelligence.

## Tech Stack

| Layer       | Technology                        |
| ----------- | --------------------------------- |
| Framework   | Next.js 15 (App Router)           |
| Language    | TypeScript 5                      |
| UI          | shadcn/ui + Tailwind CSS v4       |
| Auth        | better-auth (email/password)      |
| Database    | PostgreSQL 16 (Docker)            |
| ORM         | Drizzle ORM                       |
| AI          | Vercel AI SDK + Anthropic Claude  |

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Docker](https://www.docker.com/) and Docker Compose
- [Anthropic API Key](https://console.anthropic.com/) (optional for initial setup)

## Getting Started

### 1. Clone the repository

```bash
git clone git@github.com:joaodadas/finwise.git
cd finwise
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port 5432 with:
- User: `finwise`
- Password: `finwise`
- Database: `finwise`

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in any missing values. The defaults work for local development with Docker.

### 5. Push the database schema

```bash
npm run db:push
```

This creates the authentication tables (`user`, `session`, `account`, `verification`).

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/
│   ├── (public)/        # Public routes (sign-in, sign-up)
│   ├── (private)/       # Auth-protected routes (dashboard)
│   └── api/auth/        # better-auth API handler
├── ai/
│   └── models.ts        # AI provider configuration
├── components/
│   ├── ui/              # shadcn/ui base components
│   ├── login-form.tsx   # Sign-in form
│   └── signup-form.tsx  # Sign-up form
├── db/
│   ├── schema.ts        # Drizzle ORM schema
│   └── index.ts         # Database connection
└── lib/
    ├── auth.ts          # better-auth server config
    └── auth-client.ts   # better-auth React client
```

## Available Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `npm run dev`      | Start dev server with Turbopack      |
| `npm run build`    | Production build                     |
| `npm run start`    | Start production server              |
| `npm run lint`     | Run ESLint                           |
| `npm run db:push`  | Push schema to database              |
| `npm run db:generate` | Generate migration files          |
| `npm run db:migrate`  | Run pending migrations             |
| `npm run db:studio`   | Open Drizzle Studio                |

## Roadmap

- [ ] AI-powered financial analysis chat
- [ ] Personal finance dashboard (income, expenses, budgets)
- [ ] Stock market data integration
- [ ] Financial report generation
- [ ] Data visualization with charts

## License

This project is for academic purposes.
````

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add detailed README with setup instructions"
```

---

## Task 9: Push to GitHub

**Files:** None (git operations only)

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create joaodadas/finwise --public --source=. --description "Academic finance + AI platform"
```

- [ ] **Step 2: Push all commits**

```bash
git push -u origin main
```

Expected: All commits pushed. Repo visible at `https://github.com/joaodadas/finwise`.

- [ ] **Step 3: Verify repo**

```bash
gh repo view joaodadas/finwise --web
```

Expected: Opens browser showing the repo with README rendered.

- [ ] **Step 4: Commit** (no commit needed — just git push)

---

## Verification Checklist

After all tasks complete:

- [ ] `docker compose ps` shows `finwise-db` running
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts without errors
- [ ] `/sign-in` renders login form
- [ ] `/sign-up` renders signup form
- [ ] Creating an account redirects to `/dashboard`
- [ ] `/dashboard` redirects to `/sign-in` when not authenticated
- [ ] `gh repo view joaodadas/finwise` shows the repo
