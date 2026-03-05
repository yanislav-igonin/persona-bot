FROM node:22 as builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY prisma.config.ts ./
RUN npm ci
COPY src ./src
COPY prisma ./prisma
RUN npm run db:generate
RUN npm run build


FROM node:22-alpine as runner
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
RUN npm ci --omit=dev
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY --from=builder /app/dist ./dist
CMD ["npm", "start"]