FROM node:20 as builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm i
RUN npm run build && npm run build:alias


FROM node:20-alpine as runner

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

COPY --from=builder /app/dist ./dist

CMD ["npm", "start"]