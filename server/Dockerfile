# syntax=docker/dockerfile:1
# ----- Build stage -----
FROM node:20-bookworm-slim AS build
WORKDIR /app

# OpenSSL is required by Prisma's engines (and for VIES HTTPS calls at runtime).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies (including dev) with a clean, reproducible install.
COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drop dev dependencies for a lean runtime image (prisma CLI is a prod dep, so it
# survives and remains available for `migrate deploy`).
RUN npm prune --omit=dev

# ----- Runtime stage -----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Run as an unprivileged user; own the app dir so Prisma can use its engine cache.
RUN useradd --system --uid 1001 luma

COPY --from=build --chown=luma:luma /app/node_modules ./node_modules
COPY --from=build --chown=luma:luma /app/dist ./dist
COPY --from=build --chown=luma:luma /app/prisma ./prisma
COPY --chown=luma:luma package.json ./

USER luma
EXPOSE 4000

# Apply pending migrations, then start the API. (Seed demo data separately with:
# `docker compose exec api node dist/seed.js`.)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
