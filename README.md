# PromptDevKit

PromptDevKit is a Next.js (App Router) application for creating, organising, and collaborating on AI prompts. It uses Prisma with PostgreSQL for persistence, Tailwind CSS for styling, and Auth.js (NextAuth v5) for authentication.

## Features

- Personal and team workspaces with dedicated prompt lists and access control.
- Prompt CRUD, tagging, history tracking, and collaborative comments.
- Workspace-aware APIs that surface team metadata (authors, timestamps) where relevant.

## Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io/) 8+
- Docker (for local PostgreSQL via `docker compose`)

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Copy `.env.example` to `.env` and adjust values as needed (PostgreSQL defaults to `localhost:5432`).
3. Start the database:
   ```bash
   docker compose up -d
   ```
4. Generate the Prisma client and apply migrations:
   ```bash
   pnpm prisma generate
   pnpm prisma migrate dev
   ```

## Running the app

Start the development server:
```bash
pnpm dev
```
Then visit [http://localhost:3000](http://localhost:3000).

## Available scripts

```bash
pnpm lint   # Run ESLint
pnpm build  # Create a production build
pnpm test   # (When available) run automated tests
```

## Workspace-aware prompt management

- Use the workspace switcher on the dashboard to toggle between personal and team prompts.
- Team prompts require selecting a specific team; author and timestamp details are shown for history items and comments.
- Personal prompts remain private to the owner and do not display team metadata.

## Deployment

PromptDevKit is a standard Next.js app and can be deployed to any platform that supports Node.js (e.g., Vercel). Ensure environment variables and the database are configured appropriately for your target environment.
