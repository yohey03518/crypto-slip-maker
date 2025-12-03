# crypto-slip-maker
A simple project to get slip by buying and selling in a short time.

## How to run

```bash
pnpm i
pnpm start
```

## Environment Variables

### Exchange Configuration

Configure which exchanges to run and their API credentials:

#### Max Exchange
- `MAX_API_BASE_URL`: Max exchange API base URL (default: https://max-api.maicoin.com)
- `MAX_ACCESS_KEY`: Max exchange API access key
- `MAX_SECRET_KEY`: Max exchange API secret key
- `RUN_MAX`: Enable Max exchange (true/false)

#### Bito Exchange
- `BITO_API_BASE_URL`: Bito exchange API base URL (default: https://api.bitopro.com)
- `BITO_API_ACCESS_KEY`: Bito exchange API access key
- `BITO_API_SECRET_KEY`: Bito exchange API secret key
- `RUN_BITO`: Enable Bito exchange (true/false)

#### Hoya Exchange
- `QUOTE_CURRENCY`: Quote currency for trading (e.g., USDT)
- `RUN_HOYA`: Enable Hoya exchange (true/false)
- `HOYA_BASE_URL`: Hoya exchange base URL (default: https://www.hoyabit.com)
- `HOYA_ACCOUNT`: Hoya exchange account username
- `HOYA_PASSWORD`: Hoya exchange account password
- `HOYA_GOOGLE_AUTH_KEY`: Hoya exchange Google Authenticator key

### Line Notification Configuration

Configure Line Messaging API for execution notifications:

- `LINE_CHANNEL_ACCESS_TOKEN`: Line Messaging API channel access token (from Line Developers Console)
- `LINE_USER_ID`: Target Line user ID to receive notifications (starts with 'U', 33 characters)

**Note**: If Line credentials are not configured, the application will log a warning and continue without sending notifications. Trade execution is not affected.

### Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Fill in your exchange API credentials and Line notification settings in `.env`

3. Enable desired exchanges by setting `RUN_MAX`, `RUN_BITO`, or `RUN_HOYA` to `true`
