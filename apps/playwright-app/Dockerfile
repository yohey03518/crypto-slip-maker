FROM mcr.microsoft.com/playwright:v1.44.0-jammy AS builder

WORKDIR /app

RUN npm i -g pnpm

COPY package*.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/playwright-app/package*.json ./apps/playwright-app/

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

CMD ["pnpm", "start:playwright"]
