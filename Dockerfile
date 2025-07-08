FROM mcr.microsoft.com/playwright:v1.53.0-noble

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./
RUN npm i -g pnpm && pnpm i

COPY . .

RUN pnpm build

CMD ["pnpm", "start"] 