FROM node:22-alpine AS builder
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN npm install -g turbo
COPY . .
RUN turbo prune web --docker

FROM node:22-alpine AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# First install dependencies
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm install

# Build the project
COPY --from=builder /app/out/full/ .
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npx turbo run build --filter=web

FROM node:22-alpine AS runner
WORKDIR /app
COPY --from=installer /app/ .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Start the built TanStack Start SSR application
CMD ["npm", "run", "preview", "--workspace=web", "--", "--host", "0.0.0.0", "--port", "3000"]
