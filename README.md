# Finwise

Academic finance platform powered by AI. Built as a university project to explore the intersection of financial analysis and artificial intelligence.

## Tech Stack

| Layer       | Technology                        |
| ----------- | --------------------------------- |
| Framework   | Next.js (App Router)              |
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

| Command              | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start dev server with Turbopack      |
| `npm run build`      | Production build                     |
| `npm run start`      | Start production server              |
| `npm run lint`       | Run ESLint                           |
| `npm run db:push`    | Push schema to database              |
| `npm run db:generate`| Generate migration files             |
| `npm run db:migrate` | Run pending migrations               |
| `npm run db:studio`  | Open Drizzle Studio                  |

## Roadmap

- [ ] AI-powered financial analysis chat
- [ ] Personal finance dashboard (income, expenses, budgets)
- [ ] Stock market data integration
- [ ] Financial report generation
- [ ] Data visualization with charts

## License

This project is for academic purposes.
