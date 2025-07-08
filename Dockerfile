FROM node:20-slim

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm i && pnpm exec playwright install

COPY . .

RUN pnpm build

CMD ["pnpm", "start"] 