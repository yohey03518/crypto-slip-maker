# Multi-App Monorepo Restructuring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the repository into a pnpm-workspace monorepo containing `api-app` (Max and Bito REST API exchanges) and `playwright-app` (Hoya browser-crawler exchange), sharing code through a `@crypto-slip-maker/shared` package.

**Architecture:** Initialize a pnpm workspace at the root level. Move existing code to `/apps/api-app` and `/packages/shared` via `git mv` to preserve git history. Restore `HoyaSlipService.ts` from git history into `/apps/playwright-app` and build both applications inside distinct Dockerfiles.

**Tech Stack:** TypeScript, pnpm workspaces, Playwright, Axios, Typedi, dotenv.

---

### Task 1: Create AGENTS.md

**Files:**
- Create: `AGENTS.md`

- [ ] **Step 1: Write AGENTS.md with the agreed rules**
  Write rules on `git mv`, `README.md` syncing, branching confirmation, and self-improvement questions.
  Create `AGENTS.md` with:
  ```markdown
  # Project Principles for AI Agents

  These rules MUST be followed by all AI Agents working on this project:

  1. **Preserve Git History**: In executing any file relocation or rename, always use `git mv` instead of manual copying and deleting, ensuring commit history is preserved.
  2. **Branch Execution Confirmation**: Before starting to generate documents or code implementation, always confirm with the human whether to create a new branch or work directly on the main trunk. If working on the main trunk, do not make a commit for every single individual action.
  3. **Synchronize Documentation**: Any change related to how the application runs, its environment variables, configuration format, or execution commands must be synchronously updated in `README.md`.
  4. **Agent Self-Improvement**: When discovering or designing rules critical for future AI agents, the current agent must proactively ask the user whether to save them to `AGENTS.md` (and this rule itself is one of them).
  ```

- [ ] **Step 2: Commit AGENTS.md**
  Run: `git add AGENTS.md && git commit -m "docs: create AGENTS.md with agent rules"`
  Expected: Commit successfully created.

---

### Task 2: Configure Workspace Root Files

**Files:**
- Create: `pnpm-workspace.yaml`
- Modify: `package.json`

- [ ] **Step 1: Create `pnpm-workspace.yaml`**
  Write content:
  ```yaml
  packages:
    - "apps/*"
    - "packages/*"
  allowBuilds:
    - esbuild
  ```

- [ ] **Step 2: Modify root `package.json` to act as workspace orchestrator**
  Update the scripts and remove dependencies that are app-specific, while maintaining general scripts.
  Target Content (Entire file replace or edit):
  ```json
  {
    "name": "crypto-slip-maker-monorepo",
    "private": true,
    "version": "1.0.0",
    "description": "Monorepo workspace for crypto slip maker apps",
    "scripts": {
      "build": "pnpm -r build",
      "test": "pnpm -r test",
      "type-check": "pnpm -r type-check",
      "start:api": "pnpm --filter api-app start",
      "start:playwright": "pnpm --filter playwright-app start",
      "dev:api": "pnpm --filter api-app dev",
      "dev:playwright": "pnpm --filter playwright-app dev"
    },
    "devDependencies": {
      "typescript": "^5.x"
    }
  }
  ```

- [ ] **Step 3: Commit Workspace root setup**
  Run: `git add pnpm-workspace.yaml package.json && git commit -m "chore: setup monorepo workspace configuration at root"`
  Expected: Workspace files committed.

---

### Task 3: Setup Shared Package Directory

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`

- [ ] **Step 1: Write `packages/shared/package.json`**
  ```json
  {
    "name": "@crypto-slip-maker/shared",
    "version": "1.0.0",
    "type": "module",
    "main": "dist/index.js",
    "types": "dist/index.d.ts",
    "scripts": {
      "build": "tsc",
      "dev": "tsc --watch",
      "type-check": "tsc --noEmit",
      "test": "node --import tsx --test 'src/**/*.test.ts'"
    },
    "dependencies": {
      "axios": "^1.x",
      "qs": "^6.14.0",
      "dotenv": "^16.0.3",
      "reflect-metadata": "^0.2.1",
      "typedi": "^0.10.0"
    },
    "devDependencies": {
      "@types/node": "^20.x",
      "tsx": "^4.x",
      "typescript": "^5.x"
    }
  }
  ```

- [ ] **Step 2: Write `packages/shared/tsconfig.json`**
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "NodeNext",
      "moduleResolution": "NodeNext",
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true,
      "declaration": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }
  ```

- [ ] **Step 3: Commit shared package skeletons**
  Run: `git add packages/shared/package.json packages/shared/tsconfig.json && git commit -m "chore: add shared package package.json and tsconfig.json"`

---

### Task 4: Move Shared Files via `git mv`

**Files:**
- Modify/Move: `src/config/LineConfig.ts` -> `packages/shared/src/config/LineConfig.ts`
- Modify/Move: `src/config/Tests/LineConfig.test.ts` -> `packages/shared/src/config/Tests/LineConfig.test.ts`
- Modify/Move: `src/services/LineNotificationService.ts` -> `packages/shared/src/services/LineNotificationService.ts`
- Modify/Move: `src/services/Tests/LineNotificationService.test.ts` -> `packages/shared/src/services/Tests/LineNotificationService.test.ts`
- Modify/Move: `src/utils` -> `packages/shared/src/utils`
- Modify/Move: `src/types` -> `packages/shared/src/types`
- Modify/Move: `src/proxies/apiInterceptor.ts` -> `packages/shared/src/utils/apiInterceptor.ts`

- [ ] **Step 1: Execute `git mv` moves**
  Create folder structure first:
  ```bash
  mkdir -p packages/shared/src/config/Tests packages/shared/src/services/Tests packages/shared/src/utils
  ```
  Run the file moves:
  ```bash
  git mv src/config/LineConfig.ts packages/shared/src/config/
  git mv src/config/Tests/LineConfig.test.ts packages/shared/src/config/Tests/
  git mv src/services/LineNotificationService.ts packages/shared/src/services/
  git mv src/services/Tests/LineNotificationService.test.ts packages/shared/src/services/Tests/
  git mv src/types packages/shared/src/types
  git mv src/utils packages/shared/src/utils
  git mv src/proxies/apiInterceptor.ts packages/shared/src/utils/apiInterceptor.ts
  ```

- [ ] **Step 2: Fix internal relative paths in shared package**
  For the files moved into `packages/shared/src/`, make sure their relative imports are correct.
  For example, in `packages/shared/src/services/LineNotificationService.ts`:
  * Update `import { logger } from '../utils/logger.js';` to `import { logger } from '../utils/logger.js';` (no change needed).
  * Update `import { setupApiInterceptors } from '../proxies/apiInterceptor.js';` to `import { setupApiInterceptors } from '../utils/apiInterceptor.js';`.
  
  In `packages/shared/src/utils/apiInterceptor.ts`:
  * Update `import { logger } from '../utils/logger.js';` to `import { logger } from './logger.js';`.

- [ ] **Step 3: Create `packages/shared/src/index.ts` entrypoint**
  Create a file `packages/shared/src/index.ts` with content:
  ```typescript
  export * from './utils/logger.js';
  export * from './utils/messageFormatter.js';
  export * from './utils/apiInterceptor.js';
  export * from './config/LineConfig.js';
  export * from './services/LineNotificationService.js';
  export * from './types/exchange.js';
  export * from './types/executionResult.js';
  export * from './types/marketDepth.js';
  export * from './types/order.js';
  ```

- [ ] **Step 4: Commit moved files**
  Run: `git add packages/shared/src && git commit -m "refactor: migrate types, utils, line notifier config and services into shared package"`

---

### Task 5: Setup API App Package Directory

**Files:**
- Create: `apps/api-app/package.json`
- Create: `apps/api-app/tsconfig.json`

- [ ] **Step 1: Write `apps/api-app/package.json`**
  ```json
  {
    "name": "api-app",
    "version": "1.0.0",
    "type": "module",
    "main": "dist/server.js",
    "scripts": {
      "build": "tsc",
      "dev": "tsc && node dist/server.js",
      "start": "node dist/server.js",
      "type-check": "tsc --noEmit",
      "test": "node --import tsx --test 'src/**/Tests/*.test.ts'"
    },
    "dependencies": {
      "@crypto-slip-maker/shared": "workspace:*",
      "@types/qs": "^6.9.18",
      "axios": "^1.x",
      "qs": "^6.14.0",
      "dotenv": "^16.0.3",
      "reflect-metadata": "^0.2.1",
      "typedi": "^0.10.0",
      "otplib": "^12.0.1"
    },
    "devDependencies": {
      "@types/node": "^20.x",
      "tsx": "^4.x",
      "typescript": "^5.x",
      "@types/dotenv": "^8.2.0",
      "@types/otplib": "^10.0.0"
    }
  }
  ```

- [ ] **Step 2: Write `apps/api-app/tsconfig.json`**
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "NodeNext",
      "moduleResolution": "NodeNext",
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }
  ```

- [ ] **Step 3: Commit API app package files**
  Run: `git add apps/api-app/package.json apps/api-app/tsconfig.json && git commit -m "chore: add api-app package.json and tsconfig.json"`

---

### Task 6: Move API App Files via `git mv`

**Files:**
- Modify/Move: `src/config/BitoApiConfig.ts` -> `apps/api-app/src/config/BitoApiConfig.ts`
- Modify/Move: `src/config/MaxApiConfig.ts` -> `apps/api-app/src/config/MaxApiConfig.ts`
- Modify/Move: `src/proxies` -> `apps/api-app/src/proxies`
- Modify/Move: `src/services/BitoSlipService.ts` -> `apps/api-app/src/services/BitoSlipService.ts`
- Modify/Move: `src/services/MaxSlipService.ts` -> `apps/api-app/src/services/MaxSlipService.ts`
- Modify/Move: `src/services/Tests` -> `apps/api-app/src/services/Tests` (including `BitoSlipService.test.ts`)
- Modify/Move: `src/server.ts` -> `apps/api-app/src/server.ts`

- [ ] **Step 1: Execute `git mv` moves**
  Create folder structure:
  ```bash
  mkdir -p apps/api-app/src/config apps/api-app/src/services
  ```
  Run the moves:
  ```bash
  git mv src/config/BitoApiConfig.ts apps/api-app/src/config/
  git mv src/config/MaxApiConfig.ts apps/api-app/src/config/
  git mv src/proxies apps/api-app/src/proxies
  git mv src/services/BitoSlipService.ts apps/api-app/src/services/
  git mv src/services/MaxSlipService.ts apps/api-app/src/services/
  git mv src/server.ts apps/api-app/src/server.ts
  ```
  Wait! Is `src/services/Tests` in git? The earlier `git ls-files` output had:
  `src/services/Tests/LineNotificationService.test.ts` (this is now moved to `packages/shared/src/services/Tests`).
  Is there any other file? We had `src/services/Tests/BitoSlipService.test.ts` which was untracked. Let's move it with a simple `mv` or `git add` and then `git mv`. Since it is untracked, we can run:
  ```bash
  mkdir -p apps/api-app/src/services/Tests
  mv src/services/Tests/BitoSlipService.test.ts apps/api-app/src/services/Tests/BitoSlipService.test.ts
  ```

- [ ] **Step 2: Commit moved API files**
  Run: `git add apps/api-app/src && git commit -m "refactor: migrate API app configuration, proxies, services, and server entrypoint"`

---

### Task 7: Update Imports in API App and Build Shared Package

**Files:**
- Modify: `apps/api-app/src/**/*`
- Modify: `packages/shared/src/**/*`

- [ ] **Step 1: Install dependencies**
  Run: `pnpm install`
  Expected: Workspace links and dependencies installed.

- [ ] **Step 2: Build Shared Package first**
  Run: `pnpm --filter @crypto-slip-maker/shared build`
  Expected: Package builds successfully into `packages/shared/dist/`.

- [ ] **Step 3: Update imports in API app files to use `@crypto-slip-maker/shared`**
  Modify all relative imports that point to elements moved to shared package.
  Specifically, change imports pointing to `../utils/logger.js`, `../types/*`, `../config/LineConfig.js`, etc. to import from `@crypto-slip-maker/shared`.
  
  For example, in `apps/api-app/src/server.ts`:
  ```typescript
  import 'reflect-metadata';
  import { Container } from 'typedi';
  import { config } from 'dotenv';
  import { logger, LineNotificationService, loadAndValidateLineConfig } from '@crypto-slip-maker/shared';
  import type { ExecutionResult, ExchangeName } from '@crypto-slip-maker/shared';
  import { MaxSlipService } from './services/MaxSlipService.js';
  import { BitoSlipService } from './services/BitoSlipService.js';
  ```

  Similarly in `apps/api-app/src/services/MaxSlipService.ts`, `apps/api-app/src/services/BitoSlipService.ts`, and proxies.

- [ ] **Step 4: Verify API App build and tests**
  Run build: `pnpm --filter api-app build`
  Run test: `pnpm --filter api-app test`
  Expected: All compile and tests pass.

- [ ] **Step 5: Commit updates**
  Run: `git add apps/api-app/src && git commit -m "refactor: update api-app imports to use @crypto-slip-maker/shared and verify compile"`

---

### Task 8: Setup Playwright App Package Directory

**Files:**
- Create: `apps/playwright-app/package.json`
- Create: `apps/playwright-app/tsconfig.json`

- [ ] **Step 1: Write `apps/playwright-app/package.json`**
  ```json
  {
    "name": "playwright-app",
    "version": "1.0.0",
    "type": "module",
    "main": "dist/server.js",
    "scripts": {
      "build": "tsc",
      "dev": "tsc && node dist/server.js",
      "start": "node dist/server.js",
      "type-check": "tsc --noEmit"
    },
    "dependencies": {
      "@crypto-slip-maker/shared": "workspace:*",
      "playwright": "^1.44.0",
      "dotenv": "^16.0.3",
      "reflect-metadata": "^0.2.1",
      "typedi": "^0.10.0",
      "otplib": "^12.0.1"
    },
    "devDependencies": {
      "@types/node": "^20.x",
      "typescript": "^5.x",
      "@types/dotenv": "^8.2.0",
      "@types/otplib": "^10.0.0"
    }
  }
  ```

- [ ] **Step 2: Write `apps/playwright-app/tsconfig.json`**
  ```json
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "NodeNext",
      "moduleResolution": "NodeNext",
      "outDir": "./dist",
      "rootDir": "./src",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true,
      "experimentalDecorators": true,
      "emitDecoratorMetadata": true
    },
    "include": ["src/**/*"],
    "exclude": ["node_modules", "dist"]
  }
  ```

- [ ] **Step 3: Commit Playwright app skeletons**
  Run: `git add apps/playwright-app/package.json apps/playwright-app/tsconfig.json && git commit -m "chore: add playwright-app package.json and tsconfig.json"`

---

### Task 9: Migrate Hoya Config and Restore HoyaSlipService

**Files:**
- Modify/Move: `src/config/HoyaApiConfig.ts` -> `apps/playwright-app/src/config/HoyaApiConfig.ts`
- Create: `apps/playwright-app/src/services/HoyaSlipService.ts`

- [ ] **Step 1: Move Hoya config file**
  Create folder structure:
  ```bash
  mkdir -p apps/playwright-app/src/config apps/playwright-app/src/services
  ```
  Run:
  ```bash
  git mv src/config/HoyaApiConfig.ts apps/playwright-app/src/config/
  ```

- [ ] **Step 2: Restore `HoyaSlipService.ts` from git history**
  Run a git show command to extract `HoyaSlipService.ts` from commit `a1b694e^` and write it to `apps/playwright-app/src/services/HoyaSlipService.ts`.
  Content of the restored file should update imports to use `@crypto-slip-maker/shared`:
  ```typescript
  import { Service } from 'typedi';
  import { logger } from '@crypto-slip-maker/shared';
  import { authenticator } from 'otplib';
  import { chromium, Browser, Page } from 'playwright';
  import { HoyaApiConfig } from '../config/HoyaApiConfig.js';

  @Service()
  export class HoyaSlipService {
      private browser: Browser | null = null;
      private page: Page | null = null;

      constructor(
          private readonly config: HoyaApiConfig
      ) {}

      private generateAuthCode(): string {
          try {
              return authenticator.generate(this.config.googleAuthKey);
          } catch (error) {
              logger.error('Failed to generate Google Authentication code:', error instanceof Error ? error.message : 'Unknown error');
              throw error;
          }
      }

      private async captureScreenshot(errorContext: string): Promise<void> {
          if (!this.page) return;
          
          try {
              const screenshot = await this.page.screenshot({ 
                  type: 'png',
                  fullPage: true
              }).then(buffer => buffer.toString('base64'));
              
              logger.error(`Screenshot for ${errorContext}:
  === BEGIN SCREENSHOT ===
  data:image/png;base64,${screenshot}
  === END SCREENSHOT ===`);
          } catch (screenshotError) {
              logger.error('Failed to capture error screenshot:', screenshotError instanceof Error ? screenshotError.message : 'Unknown error');
          }
      }

      private async handleError(error: unknown, context: string): Promise<never> {
          await this.captureScreenshot(context);
          logger.error(`${context}:`, error instanceof Error ? error.message : 'Unknown error');
          throw error;
      }

      private async simulateMouseMovement(element: any): Promise<void> {
          if (!this.page) return;
          
          const box = await element.boundingBox();
          if (!box) return;

          const viewport = await this.page.viewportSize();
          if (!viewport) return;

          const startX = Math.random() * viewport.width;
          const startY = Math.random() * viewport.height;
          
          const targetX = box.x + box.width / 2;
          const targetY = box.y + box.height / 2;

          const cp1x = startX + (Math.random() * 200 - 100);
          const cp1y = startY + (Math.random() * 200 - 100);
          const cp2x = targetX + (Math.random() * 200 - 100);
          const cp2y = targetY + (Math.random() * 200 - 100);

          const steps = 50;
          for (let i = 0; i <= steps; i++) {
              const t = i / steps;
              const x = Math.pow(1 - t, 3) * startX + 
                       3 * Math.pow(1 - t, 2) * t * cp1x + 
                       3 * (1 - t) * Math.pow(t, 2) * cp2x + 
                       Math.pow(t, 3) * targetX;
              const y = Math.pow(1 - t, 3) * startY + 
                       3 * Math.pow(1 - t, 2) * t * cp1y + 
                       3 * (1 - t) * Math.pow(t, 2) * cp2y + 
                       Math.pow(t, 3) * targetY;
              
              await this.page.mouse.move(x, y);
              
              if (Math.random() < 0.2) {
                  await this.page.waitForTimeout(Math.random() * 100);
              }
          }

          await this.page.mouse.move(targetX, targetY);
      }

      private async initBrowser(): Promise<void> {
          try {
              this.browser = await chromium.launch({
                  headless: true,
                  args: [
                      '--disable-blink-features=AutomationControlled',
                      '--disable-features=IsolateOrigins,site-per-process',
                      '--window-size=1920,1080'
                  ]
              });

              const context = await this.browser.newContext({
                  viewport: { width: 1920, height: 1080 },
                  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                  deviceScaleFactor: 1,
                  hasTouch: false,
                  isMobile: false,
                  locale: 'zh-TW',
                  timezoneId: 'Asia/Taipei',
                  permissions: ['geolocation']
              });

              await context.addInitScript(() => {
                  Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
                  Object.defineProperty(navigator, 'plugins', { 
                      get: () => [
                          { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer' },
                          { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai' },
                          { name: 'Native Client', filename: 'internal-nacl-plugin' }
                      ]
                  });
                  Object.defineProperty(navigator, 'languages', { get: () => ['zh-TW', 'zh', 'en-US', 'en'] });
                  
                  const getParameter = WebGLRenderingContext.prototype.getParameter;
                  WebGLRenderingContext.prototype.getParameter = function(parameter) {
                      if (parameter === 37445) {
                          return 'Intel Inc.'
                      }
                      if (parameter === 37446) {
                          return 'Intel(R) Iris(TM) Plus Graphics'
                      }
                      return getParameter.apply(this, [parameter]);
                  };
              });

              this.page = await context.newPage();
              logger.info('Browser initialized successfully');
          } catch (error) {
              await this.handleError(error, 'Failed to initialize browser');
          }
      }

      private async cleanup(): Promise<void> {
          try {
              if (this.page) {
                  await this.page.close();
                  this.page = null;
              }
              if (this.browser) {
                  await this.browser.close();
                  this.browser = null;
              }
              logger.info('Browser cleanup completed');
          } catch (error) {
              logger.error('Failed to cleanup browser:', error instanceof Error ? error.message : 'Unknown error');
          }
      }

      public async Do(): Promise<void> {
          logger.info('HoyaSlipService: Starting task');
          
          try {
              await this.initBrowser();
              if (!this.page) throw new Error('Browser page not initialized');

              await this.page.goto(`${this.config.baseUrl}/login`);
              await this.page.waitForTimeout(2000);
              logger.info('Go to Hoya login page');

              const loginAccount = this.page.locator('#account');
              await this.simulateMouseMovement(loginAccount);
              await this.page.waitForTimeout(500);
              await loginAccount.click();
              await this.page.waitForTimeout(300);
              await loginAccount.pressSequentially(this.config.account, { delay: 100 });
              await this.page.waitForTimeout(1000);

              const loginPassword = this.page.locator('#password');
              await this.simulateMouseMovement(loginPassword);
              await this.page.waitForTimeout(500);
              await loginPassword.click();
              await this.page.waitForTimeout(300);
              await loginPassword.pressSequentially(this.config.password, { delay: 100 });
              await this.page.waitForTimeout(2000);

              const loginButton = this.page.locator('section').filter({ hasText: '登入' }).getByRole('button');
              await this.simulateMouseMovement(loginButton);
              await this.page.waitForTimeout(500);
              await loginButton.click();
              logger.info('Login button clicked');

              await this.page.waitForTimeout(3000);
              const authCode = this.generateAuthCode();
              for (let i = 0; i < 6; i++) {
                  await this.page.getByTestId(`verify-input-${i}`).fill(authCode[i].toString());
              }
              logger.info('Auth code filled');
              await this.page.waitForTimeout(3000);
              await this.page.goto(`${this.config.baseUrl}/trade-convert`);
              await this.page.waitForTimeout(2000);
              await this.page.getByPlaceholder('請輸入數額').click();
              await this.page.waitForTimeout(1000);
              await this.page.getByPlaceholder('請輸入數額').pressSequentially('300', { delay: 100 });
              logger.info('Buy amount input filled');
              await this.page.getByRole('button', { name: '訂單預覽' }).click();
              await this.page.waitForTimeout(500);
              await this.page.getByRole('button', { name: '確認送出' }).click();
              await this.page.waitForTimeout(1000);
              logger.info('Buy order confirmed');

              await this.page.goto(`${this.config.baseUrl}/trade-convert`);
              await this.page.waitForTimeout(3000);

              await this.page.getByRole('tab', { name: '賣出' }).click();
              await this.page.waitForTimeout(500)
              await this.page.getByText('最大值').click();
              logger.info('Sell max amount selected');
              await this.page.getByRole('button', { name: '訂單預覽' }).click();
              await this.page.waitForTimeout(500);
              await this.page.getByRole('button', { name: '確認送出' }).click();
              logger.info('Sell order confirmed');
              await this.page.waitForTimeout(3000);

          } catch (error) {
              await this.handleError(error, 'HoyaSlipService execution failed');
          } finally {
              await this.cleanup();
          }
          
          logger.info('HoyaSlipService: Task completed');
      }
  }
  ```

- [ ] **Step 3: Update `HoyaApiConfig.ts` relative import**
  In `apps/playwright-app/src/config/HoyaApiConfig.ts`, update relative import to typedi:
  No changes should be needed since it's just `import { Service } from 'typedi';` and `import { config } from 'dotenv';`.

- [ ] **Step 4: Commit Hoya service and config**
  Run: `git add apps/playwright-app/src/config apps/playwright-app/src/services && git commit -m "feat: restore HoyaSlipService and move HoyaApiConfig"`

---

### Task 10: Create Playwright App Runner

**Files:**
- Create: `apps/playwright-app/src/server.ts`

- [ ] **Step 1: Write `apps/playwright-app/src/server.ts`**
  Create runner for Hoya:
  ```typescript
  import 'reflect-metadata';
  import { Container } from 'typedi';
  import { config } from 'dotenv';
  import { logger, LineNotificationService, loadAndValidateLineConfig } from '@crypto-slip-maker/shared';
  import type { ExecutionResult } from '@crypto-slip-maker/shared';
  import { HoyaSlipService } from './services/HoyaSlipService.js';

  // Load environment variables
  config();

  async function main(): Promise<void> {
    try {
      const results: ExecutionResult[] = [];
      
      if (process.env.RUN_HOYA === 'true') {
        logger.info('Executing Hoya exchange...');
        const service = Container.get(HoyaSlipService);
        try {
          await service.Do();
          results.push({ exchangeName: 'Hoya', success: true });
          logger.info('Hoya exchange completed successfully');
        } catch (error) {
          results.push({ exchangeName: 'Hoya', success: false });
          logger.error('Hoya exchange failed:', error instanceof Error ? error.message : 'Unknown error');
        }

        // Send summary notification for Hoya
        const lineConfig = loadAndValidateLineConfig();
        if (lineConfig) {
          try {
            const notificationService = new LineNotificationService(lineConfig);
            await notificationService.sendSummary(results);
            logger.info('Notification sent successfully');
          } catch (notifError) {
            logger.error('Failed to send notification:', notifError instanceof Error ? notifError.message : 'Unknown error');
          }
        }
      } else {
        logger.info('Hoya exchange is not enabled (RUN_HOYA !== true).');
      }
    } catch (error) {
      logger.error('Playwright runner failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  main();
  ```

- [ ] **Step 2: Verify Playwright App compile**
  Run: `pnpm install && pnpm --filter playwright-app build`
  Expected: Successful compilation without errors.

- [ ] **Step 3: Commit Playwright App Runner**
  Run: `git add apps/playwright-app/src/server.ts && git commit -m "feat: add playwright-app runner entrypoint and verify compilation"`

---

### Task 11: Setup App-Specific Dockerfiles

**Files:**
- Modify/Move: `Dockerfile` -> `apps/api-app/Dockerfile`
- Create: `apps/playwright-app/Dockerfile`
- Modify: `.dockerignore`

- [ ] **Step 1: Move and modify API app Dockerfile**
  Run: `git mv Dockerfile apps/api-app/Dockerfile`
  Modify it to build the monorepo workspace for api-app:
  ```dockerfile
  FROM node:20-alpine AS builder

  WORKDIR /app

  # Install pnpm
  RUN npm i -g pnpm

  # Copy workspace configurations
  COPY package*.json pnpm-workspace.yaml pnpm-lock.yaml ./
  COPY packages/shared/package*.json ./packages/shared/
  COPY apps/api-app/package*.json ./apps/api-app/

  # Install dependencies
  RUN pnpm install --frozen-lockfile

  # Copy all sources and build
  COPY . .
  RUN pnpm build

  # Command to run API App
  CMD ["pnpm", "start:api"]
  ```

- [ ] **Step 2: Create Playwright App Dockerfile**
  Write `apps/playwright-app/Dockerfile`:
  ```dockerfile
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
  ```

- [ ] **Step 3: Modify `.dockerignore` to allow workspace builds**
  Make sure `.dockerignore` does not ignore `apps/` or `packages/`.
  Let's verify what is currently in `.dockerignore`.
  Then commit.
  Run: `git add apps/api-app/Dockerfile apps/playwright-app/Dockerfile && git commit -m "chore: relocate Dockerfiles to respective applications and modify for workspace build"`

---

### Task 12: Update README.md and Clean up

**Files:**
- Modify: `README.md`
- Delete: unused root directories (like old `src/`, if any files are left, clean them up)

- [ ] **Step 1: Update README.md**
  Update build commands, running instructions, directory layout description, and environment variable requirements for both `api-app` and `playwright-app`.
  
- [ ] **Step 2: Remove old `src/` folder if empty**
  Check and remove any leftover empty files or folders in the root `src/` directory.
  
- [ ] **Step 3: Commit documentation updates**
  Run: `git add README.md && git commit -m "docs: update README.md with workspace setup and run commands"`
