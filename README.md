# Resourcify

Campus Resource Management Platform for conflict-free booking of classrooms, labs, equipment, auditoriums, and shared spaces.

Live app: https://resourcify-apex.vercel.app

## Current Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Supabase-ready API and migration foundation
- Vercel deployment

## Local Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000.

For production verification:

```bash
npm run build
```

## Sprint Workflow

Each sprint handles one feature at a time.

1. Sprint overview is shared first.
2. Work starts only after sprint approval.
3. Output is reviewed before commit.
4. Commit and push happen only after output approval.
5. The next sprint starts after the team says `<number>-sprint completed`.

## Deployment

The current production deployment is hosted on Vercel:

https://resourcify-apex.vercel.app

Automatic GitHub deployments still need the Vercel account to connect GitHub as a login connection.
