FROM node:22 as builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma
RUN npm run db:generate
RUN npm ci
RUN npm run build


FROM node:22-alpine as runner
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
RUN npm run db:generate
CMD ["npm", "start"]