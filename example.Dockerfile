FROM node:20-alpine AS node

RUN npm install --global pnpm

FROM node AS builder

RUN mkdir -p /builder
WORKDIR /builder

# Enable build cache if dependencies have not chagned
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

COPY . ./

RUN pnpm format:check
RUN pnpm lint

RUN pnpm build:remix
RUN pnpm build:server
RUN pnpm typecheck && pnpm typecheck --p tsconfig.server.json

FROM node AS app

ENV NODE_ENV=production

RUN mkdir -p /app
WORKDIR /app

COPY --from=builder /builder/package.json package.json
COPY --from=builder /builder/pnpm-lock.yaml pnpm-lock.yaml
COPY --from=builder /builder/node_modules node_modules
COPY --from=builder /builder/build build
COPY --from=builder /builder/build-server build-server

# Remove dev dependencies
RUN pnpm prune

ENTRYPOINT [ "pnpm", "start" ]