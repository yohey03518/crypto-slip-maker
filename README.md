# crypto-slip-maker (Monorepo)

A simple monorepo workspace to manage applications that perform short-term buy-and-sell trades to generate exchange slip reports.

## Project Structure

This project is organized as a **pnpm monorepo workspace**:

```
.
├── apps/
│   ├── api-app/ (Exchanges using REST APIs - Max, Bito)
│   └── playwright-app/ (Exchanges requiring browser automation - Hoya)
└── packages/
    └── shared/ (Shared utilities, config loaders, and business types)
```

* **`packages/shared`**: Contains type definitions, standard logger, axios api logging interceptors, and the Line Messaging API service.
* **`apps/api-app`**: Consumes REST APIs to trade on Max and Bito exchanges.
* **`apps/playwright-app`**: Uses Playwright to simulate browser interactions for HoyaBit exchange trade automation.

---

## Local Development

### 1. Installation
Install workspace dependencies and link packages together:
```bash
pnpm install
```

### 2. Configuration
Copy `.env.example` to `.env` and fill in the required API keys and configuration values:
```bash
cp .env.example .env
```

### 3. Build the Monorepo
Compile all workspace packages:
```bash
pnpm build
```

### 4. Running the Applications

* **Run API App (Max, Bito)**:
  * Development mode (auto compile and run):
    ```bash
    pnpm dev:api
    ```
  * Production mode (run compiled code):
    ```bash
    pnpm start:api
    ```

* **Run Playwright App (Hoya)**:
  * Development mode (auto compile and run):
    ```bash
    pnpm dev:playwright
    ```
  * Production mode (run compiled code):
    ```bash
    pnpm start:playwright
    ```

---

## Running inside Docker

Each app can be built and run inside its own independent docker container.

### 1. API App (Max, Bito)
Build a lightweight container (based on Node Alpine):
```bash
docker build -t api-app -f apps/api-app/Dockerfile .
docker run --env-file .env api-app
```

### 2. Playwright App (Hoya)
Build a browser-automation container (with headless browser dependencies preinstalled):
```bash
docker build -t playwright-app -f apps/playwright-app/Dockerfile .
docker run --env-file .env playwright-app
```

---

## Environment Variables

### Exchange Configuration

Configure which exchanges to run and their API credentials:

#### Max Exchange
* `RUN_MAX`: Enable Max exchange (true/false)
* `MAX_API_BASE_URL`: Max exchange API base URL (default: https://max-api.maicoin.com)
* `MAX_ACCESS_KEY`: Max exchange API access key
* `MAX_SECRET_KEY`: Max exchange API secret key

#### Bito Exchange
* `RUN_BITO`: Enable Bito exchange (true/false)
* `BITO_API_BASE_URL`: Bito exchange API base URL (default: https://api.bitopro.com)
* `BITO_API_ACCESS_KEY`: Bito exchange API access key
* `BITO_API_SECRET_KEY`: Bito exchange API secret key

#### Hoya Exchange
* `RUN_HOYA`: Enable Hoya exchange (true/false)
* `HOYA_BASE_URL`: Hoya exchange base URL (default: https://www.hoyabit.com)
* `HOYA_ACCOUNT`: Hoya exchange account username
* `HOYA_PASSWORD`: Hoya exchange account password
* `HOYA_GOOGLE_AUTH_KEY`: Hoya exchange Google Authenticator key
* `QUOTE_CURRENCY`: Quote currency for trading (e.g., USDT)

### Line Notification Configuration

Configure Line Messaging API for execution notifications:
* `LINE_CHANNEL_ACCESS_TOKEN`: Line Messaging API channel access token (from Line Developers Console)
* `LINE_USER_ID`: Target Line user ID to receive notifications (starts with 'U', 33 characters)
