FROM node:22 AS builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./
RUN npm ci
COPY src ./src
COPY prisma ./prisma
RUN npm run build


FROM node:22-alpine AS runner
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY --from=builder /app/dist ./dist
CMD ["npm", "start"]