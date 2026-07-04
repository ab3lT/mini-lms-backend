# syntax=docker/dockerfile:1

########################################
# 1. Install dependencies + generate Prisma client
########################################
FROM node:20-slim AS deps
WORKDIR /app

# Prisma's engines need OpenSSL at runtime/build time.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

########################################
# 2. Compile TypeScript -> dist/
########################################
FROM deps AS builder
WORKDIR /app
COPY . .
RUN npm run build

########################################
# 3. Production runtime image
########################################
FROM node:20-slim AS runner
WORKDIR /app

RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

# Full node_modules (including the generated Prisma client and the prisma
# CLI needed by docker-entrypoint.sh to run migrations) carried over from
# the build stage - avoids re-resolving/re-generating anything at runtime.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package.json ./
COPY docker-entrypoint.sh ./

RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
