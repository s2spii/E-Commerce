# syntax=docker/dockerfile:1
# ----- Build stage -----
FROM node:20-bookworm-slim AS build
WORKDIR /app

# Install dependencies (including dev) with a clean, reproducible install.
COPY package.json package-lock.json* ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drop dev dependencies for a lean runtime image.
RUN npm prune --omit=dev

# ----- Runtime stage -----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Run as an unprivileged user.
RUN useradd --system --uid 1001 luma

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

USER luma
EXPOSE 4000

# Apply pending migrations, then start the API.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
