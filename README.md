# squabble up

a mobile-first debate platform where users engage in structured arguments with ai-powered scoring.

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

## contributing

1. create a feature branch from `dev`
2. make your changes
3. run `pnpm lint`, `pnpm typecheck`, and `pnpm test`
4. open a pull request

## license

private - all rights reserved.