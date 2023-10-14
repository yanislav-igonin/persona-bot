# BUILD

FROM node:20-alpine AS build

WORKDIR /app

COPY ./prisma ./prisma
COPY ./package*.json ./package*.json
COPY ./tsconfig.json ./tsconfig.json
COPY ./src ./src

RUN npm install
RUN npm run build

# RUNTIME

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

RUN npm install --production

CMD ["npm", "run", "start"]