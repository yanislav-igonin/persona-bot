FROM node:20 as builder
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY tsconfig.json ./
COPY src ./src
RUN npm ci
RUN npm run build


FROM node:20-alpine as runner
WORKDIR /app
COPY package.json ./
COPY package-lock.json ./
COPY prisma ./prisma
COPY --from=builder /app/dist ./dist
CMD ["npm", "start"]