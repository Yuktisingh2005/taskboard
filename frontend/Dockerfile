  FROM node:20-alpine AS base
  WORKDIR /app

  COPY package*.json ./
  RUN npm ci

  COPY . .
  RUN npm run build

  # ── Runtime stage ──────────────────────────────────────────────────
  FROM node:20-alpine
  WORKDIR /app
  COPY --from=base /app/.next/standalone ./
  COPY --from=base /app/.next/static ./.next/static

  EXPOSE 3000
  ENV PORT=3000
  CMD ["node", "server.js"]