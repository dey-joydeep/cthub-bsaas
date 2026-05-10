# Production-ready Dockerfile for Beauty SaaS backend
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY . .
RUN npm run build

FROM node:20-alpine as prod
WORKDIR /app
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/locales ./src/locales
COPY --from=builder /app/src/docs ./src/docs
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
