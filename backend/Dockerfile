
  FROM node:20-alpine AS base
  WORKDIR /app


  COPY package*.json ./
  RUN npm ci --omit=dev


  COPY tsconfig.json ./
  COPY src ./src
  RUN npm install typescript ts-node --save-dev && npx tsc


  FROM node:20-alpine
  WORKDIR /app
  COPY package*.json ./
  RUN npm ci --omit=dev
  COPY --from=base /app/dist ./dist

  EXPOSE 5000
  CMD ["node", "dist/index.js"]