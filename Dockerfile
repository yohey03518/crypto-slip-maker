FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm i

COPY . .

RUN pnpm build

CMD ["pnpm", "start"] 