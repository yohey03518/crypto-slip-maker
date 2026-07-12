FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm i -g pnpm

# Copy workspace configurations
COPY package*.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api-app/package*.json ./apps/api-app/
COPY apps/playwright-app/package*.json ./apps/playwright-app/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all sources and build
COPY . .
RUN pnpm --filter api-app build

# Command to run API App
CMD ["pnpm", "start:api"]