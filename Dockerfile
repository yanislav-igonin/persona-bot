FROM node:20-alpine as builder

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./
RUN npm i
RUN npm run build


FROM node:20-alpine as runner

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

COPY --from=builder /app/dist ./dist

CMD ["npm", "start"]