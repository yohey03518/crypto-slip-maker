# Design Spec: Multi-App Monorepo Restructuring

This design specification outlines the plan to refactor the repository from a single-app project to a multi-app monorepo managed with **pnpm workspaces**. 

## 1. Goals
* **Separation of Execution Contexts**: Move the Rest-API based exchanges (Max, Bito) and the Playwright-based crawler exchanges (Hoya) into separate applications so they can be run, scaled, and built into different Docker containers.
* **Minimize Image Sizes**: Ensure `api-app` remains lightweight by utilizing a node alpine image without Playwright browser dependencies, while `playwright-app` uses a Playwright base image.
* **Preserve History**: Use `git mv` for all file renames and relocations to maintain complete commit history.
* **Restore Hoya Exchange**: Restore the previously removed `HoyaSlipService.ts` from git history and verify the crawler's basic structure compiles successfully.
* **Establish Agent Guidelines**: Create `AGENTS.md` to define project-wide standards for AI agents.

---

## 2. Directory Structure

The repository will be structured as a pnpm monorepo workspace:

```
.
├── package.json (Root package.json)
├── pnpm-workspace.yaml (Root workspace configuration)
├── pnpm-lock.yaml (Root lockfile)
├── AGENTS.md (Root workspace rules for AI Agents)
├── README.md (Root project documentation & orchestration)
├── apps/
│   ├── api-app/ (Exchanges using REST APIs - Max, Bito)
│   │   ├── package.json
│   │   ├── Dockerfile
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── server.ts (Entry point for API runner)
│   │       ├── config/ (BitoApiConfig, MaxApiConfig)
│   │       ├── proxies/ (bitoExchangeProxy, maxExchangeProxy)
│   │       └── services/ (BitoSlipService, MaxSlipService)
│   │
│   └── playwright-app/ (Exchanges requiring browser automation - Hoya)
│       ├── package.json
│       ├── Dockerfile
│       ├── tsconfig.json
│       └── src/
│           ├── server.ts (Entry point for Playwright runner)
│           ├── config/ (HoyaApiConfig)
│           └── services/ (HoyaSlipService - restored from git history)
│
└── packages/
    └── shared/ (Shared utilities, config loaders, and business types)
        ├── package.json
        ├── tsconfig.json
        └── src/
            ├── config/ (LineConfig)
            ├── services/ (LineNotificationService)
            ├── types/ (executionResult, order, marketDepth, exchange)
            └── utils/ (logger, messageFormatter)
```

---

## 3. Package & Dependency Organization

### Root Level
* **`pnpm-workspace.yaml`**:
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  allowBuilds:
    - esbuild
  ```
* **Root `package.json`**:
  * Orchestration scripts:
    * `pnpm build`: Build all workspace packages and apps.
    * `pnpm test`: Run tests across the workspace.
    * `pnpm start:api`: Run `api-app`.
    * `pnpm start:playwright`: Run `playwright-app`.

### `@crypto-slip-maker/shared` (`packages/shared`)
* **Purpose**: House type definitions, logging logic, helper utilities, and Line notification services.
* **Dependencies**: `dotenv`, `reflect-metadata`, `typedi`, `@types/node`, `typescript`.

### `api-app` (`apps/api-app`)
* **Purpose**: Execute Bito and Max API exchanges.
* **Dependencies**: `@crypto-slip-maker/shared` (workspace link), `axios`, `qs`, `reflect-metadata`, `typedi`, `otplib`.
* **Execution**: Command triggers `src/server.ts` to run enabled API services sequentially.

### `playwright-app` (`apps/playwright-app`)
* **Purpose**: Execute Hoya Playwright browser crawler.
* **Dependencies**: `@crypto-slip-maker/shared` (workspace link), `playwright`, `otplib`, `reflect-metadata`, `typedi`.
* **Execution**: Command triggers `src/server.ts` to execute Hoya exchange.

---

## 4. File Relocation Plan (using `git mv`)

To ensure git tracking is preserved, we will run:
```bash
# Create target directory structures
mkdir -p apps/api-app/src apps/playwright-app/src packages/shared/src

# Move shared packages
git mv src/config/LineConfig.ts packages/shared/src/config/
git mv src/config/Tests/LineConfig.test.ts packages/shared/src/config/Tests/
git mv src/services/LineNotificationService.ts packages/shared/src/services/
git mv src/services/Tests/LineNotificationService.test.ts packages/shared/src/services/Tests/
git mv src/types packages/shared/src/types
git mv src/utils packages/shared/src/utils

# Move api-app files
git mv src/config/BitoApiConfig.ts apps/api-app/src/config/
git mv src/config/MaxApiConfig.ts apps/api-app/src/config/
git mv src/proxies apps/api-app/src/proxies
git mv src/services/BitoSlipService.ts apps/api-app/src/services/
git mv src/services/MaxSlipService.ts apps/api-app/src/services/
git mv src/services/Tests/BitoSlipService.test.ts apps/api-app/src/services/Tests/
git mv src/server.ts apps/api-app/src/server.ts

# Move playwright-app files
git mv src/config/HoyaApiConfig.ts apps/playwright-app/src/config/
# Note: HoyaSlipService.ts will be restored from history directly into apps/playwright-app/src/services/
```

---

## 5. Dockerization Strategy

### `apps/api-app/Dockerfile`
Uses `node:20-alpine`. Only copies necessary build files from workspace root and the api-app directory. Builds and runs `node dist/server.js`.

### `apps/playwright-app/Dockerfile`
Uses a Playwright-supported Node base image. Installs chromium browser dependencies to allow headless browser executions. Runs the playwright service runner.

---

## 6. Project Documentation & Rules

### `AGENTS.md` (New File)
Contains the following principles for future AI agents:
1. **Preserve Git History**: In executing any file relocation or rename, always use `git mv`.
2. **Synchronize Documentation**: Any change related to how the application runs, its environment variables, or run commands must be updated in `README.md`.
3. **Agent Self-Improvement**: When discovering or designing rules critical for future AI agents, the current agent must proactively ask the user whether to save them to `AGENTS.md`.

### `README.md` (Modified File)
Updated to explain the workspace layout, how to run local developers scripts, and how to execute individual docker images.

---

## 7. Verification Strategy
1. **Compilation Check**: Run TypeScript compilation across the monorepo workspace to ensure all imports (relative paths adjusted to package dependencies) compile cleanly.
2. **Unit Tests**: Run tests via `pnpm test` to verify that message formatters, Line configuration checks, and API services function properly.
3. **Manual Validation**: Execute mock service calls to confirm `LineNotificationService` and `server.ts` run correctly in their new locations.
