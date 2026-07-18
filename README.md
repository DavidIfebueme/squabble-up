# squabble up

a mobile-first debate platform where users engage in structured arguments with ai-powered scoring.

## tech stack

- **mobile**: react native (expo)
- **api**: nestjs + typeorm
- **database**: postgresql 16 + redis
- **queue**: bullmq
- **realtime**: socket.io
- **auth**: firebase auth (google oauth + email/password)
- **ai**: gemini flash 3.5 (debate scoring)
- **monorepo**: turborepo + pnpm workspaces

## getting started

### prerequisites

- node.js 22+
- pnpm 9.15+
- docker and docker compose

### setup

```bash
# install dependencies
pnpm install

# start databases
docker compose up -d

# run the api
pnpm --filter @squabble-up/api dev

# run the mobile app
pnpm --filter @squabble-up/mobile dev
```

## project structure

```
squabble-up/
├── apps/
│   ├── api/          # nestjs backend
│   └── mobile/       # expo react native app
├── packages/
│   └── shared/       # shared types, constants, and validation schemas
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## api endpoints

- `post /api/v1/auth/register` - register with email and password
- `post /api/v1/auth/login` - login with email and password
- `post /api/v1/auth/google` - login with google oauth
- `post /api/v1/debates` - create a debate
- `post /api/v1/debates/:id/start` - start a debate (participants only)
- `post /api/v1/debates/:id/complete` - complete a debate (participants only)
- `post /api/v1/rounds` - submit a round
- `post /api/v1/votes` - submit a vote
- `get  /api/v1/topics` - list topics

## contributing

1. create a feature branch from `dev`
2. make your changes
3. run `pnpm lint`, `pnpm typecheck`, and `pnpm test`
4. open a pull request

## license

private - all rights reserved.