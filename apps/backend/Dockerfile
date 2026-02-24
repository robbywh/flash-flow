FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
RUN npm install -g turbo
COPY . .
RUN turbo prune backend --docker

FROM node:22-alpine AS installer
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Install dependencies based on the pruned lockfile
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json

# Copy Prisma schema and config before install so the postinstall generic works
COPY --from=builder /app/out/full/apps/backend/prisma/ ./apps/backend/prisma/
COPY --from=builder /app/out/full/apps/backend/prisma.config.ts ./apps/backend/

# Prisma requires openssl native bindings, so we generate it after install
RUN npm install

# Copy source code and build
COPY --from=builder /app/out/full/ .
RUN cd apps/backend && npx prisma generate
RUN npx turbo run build --filter=backend

FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=installer /app/ .

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["node", "apps/backend/dist/main.js"]
