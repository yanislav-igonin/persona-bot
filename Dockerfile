# BUILD

FROM node:20-alpine AS build

WORKDIR /app

COPY ./prisma ./
COPY ./package*.json ./
COPY ./tsconfig.json ./
COPY ./src ./

RUN npm install
RUN npm run build

# RUNTIME

FROM node:20-alpine

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./
COPY --from=build /app/prisma ./

RUN npm install # TODO: only prod

RUN npx prisma db push

CMD ["npm", "run", "start"]