# Indy 500 Pool

Next.js app for running Indy 500 fantasy racing pools with snake draft driver assignment.

## Stack
- Next.js 16 (App Router, TypeScript)
- Tailwind CSS v4
- @vercel/postgres for database
- pnpm package manager

## Key Concepts
- **Pool**: A group of members who each get 3 drivers via snake draft
- **Snake Draft**: Pick K gets pole K (round 1), pole 2P+1-K (round 2), pole 2P+K (round 3), where P = pool size
- **Scoring**: Sum of each member's 3 drivers' current race positions (lower = better)

## API Routes
- `GET /api/setup` - Create database tables
- `POST /api/pools` - Create a new pool
- `GET /api/pools/[code]` - Get pool details
- `POST /api/pools/[code]/drivers` - Set 33 drivers in pole order
- `POST /api/pools/[code]/members` - Add a member
- `POST /api/pools/[code]/start` - Randomize picks and do snake draft
- `POST /api/pools/[code]/positions` - Update race positions
- `GET /api/pools/[code]/scoreboard` - Get live scoreboard

## Environment Variables
Requires `POSTGRES_URL` (or Vercel Postgres env vars) for database connectivity.

## Development
```bash
pnpm dev    # Start dev server
pnpm build  # Production build
pnpm lint   # Run ESLint
```
