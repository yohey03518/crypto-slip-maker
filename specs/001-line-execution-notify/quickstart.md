# Quickstart: Line Execution Notification

**Feature**: Line Execution Notification  
**Branch**: `001-line-execution-notify`  
**Date**: 2025-12-03

## Overview

This guide helps developers set up and test the Line execution notification feature, which sends a single Line message summarizing the success/failure status of all enabled exchange executions.

## Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** installed (required for native test runner)
2. **Line Messaging API Channel** set up:
   - Line Developers account
   - Messaging API channel created
   - Channel access token obtained
   - Your Line user ID (for receiving notifications)

### Getting Your Line User ID

**Method 1: Via Line Official Account Manager**
1. Go to [Line Official Account Manager](https://manager.line.biz/)
2. Select your channel
3. Go to "Settings" → "Messaging API"
4. Find "Your user ID" under the "Bot" section

**Method 2: Via Line Messaging API**
1. Add your bot as a friend on Line
2. Send a message to your bot
3. Use the [Get Profile endpoint](https://developers.line.biz/en/reference/messaging-api/#get-profile) to retrieve your user ID

**Method 3: Use a temporary webhook to capture user ID**
1. Set up a temporary webhook endpoint
2. Send a message to your bot
3. Extract the `userId` from the webhook event

## Environment Setup

### 1. Clone and Install Dependencies

```bash
cd /Users/erwin.chang/git/crypto-slip-maker
git checkout 001-line-execution-notify
pnpm install
```

### 2. Configure Environment Variables

Create or update your `.env` file in the project root:

```bash
# Line Notification Configuration
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_USER_ID=your_user_id_here

# Exchange Execution Configuration (existing)
RUN_MAX=true
RUN_BITO=true
RUN_HOYA=true

# Exchange API credentials (existing - keep your current values)
# MAX_API_KEY=...
# MAX_SECRET_KEY=...
# etc.
```

**Required New Variables**:
- `LINE_CHANNEL_ACCESS_TOKEN`: Your Line Messaging API channel access token (from Line Developers Console)
- `LINE_USER_ID`: Your Line user ID (starts with 'U', 33 characters long)

**Optional**: If you want to test without sending notifications, simply omit the Line variables. The system will log a warning and continue without notifications.

### 3. Verify Configuration

Test that your Line credentials are valid:

```bash
# Run a simple curl test
curl -X POST https://api.line.me/v2/bot/message/push \
  -H "Authorization: Bearer YOUR_CHANNEL_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "YOUR_USER_ID",
    "messages": [
      {
        "type": "text",
        "text": "Test message from crypto-slip-maker"
      }
    ]
  }'
```

Expected response:
- **Success**: HTTP 200 with empty body `{}`
- **Failure**: HTTP 401/400 with error message → check your token/user ID

## Development Workflow

### 1. Run Tests (TDD)

Following the constitution's TDD mandate, always run tests before and after implementation:

```bash
# Run all tests
npm run test

# Run tests in watch mode (during development)
npm run test:watch

# Run specific test file
node --import tsx --test tests/unit/messageFormatter.test.ts
```

### 2. Build TypeScript

```bash
npm run build
```

This compiles TypeScript files from `src/` to `dist/`.

### 3. Run the Application

```bash
# Development mode (build + run)
npm run dev

# Production mode (run pre-built)
npm start
```

**Expected Behavior**:
1. Application executes enabled exchanges sequentially (Max → Bito → Hoya)
2. After all complete, one Line notification is sent
3. Notification format: `"[Success exchanges] Success[, Failed exchanges failed]"`
4. Console logs show execution details and notification status

**Example Output**:
```
[2025-12-03T10:30:00.123Z] Executing Max exchange...
[2025-12-03T10:30:05.456Z] Max completed successfully
[2025-12-03T10:30:05.500Z] Executing Bito exchange...
[2025-12-03T10:30:10.789Z] Bito completed successfully
[2025-12-03T10:30:10.800Z] Executing Hoya exchange...
[2025-12-03T10:30:15.012Z] Hoya failed: Connection timeout
[2025-12-03T10:30:15.050Z] Sending notification...
[2025-12-03T10:30:15.234Z] Line notification sent successfully on attempt 1
```

**Example Line Message Received**:
```
Max and Bito Success, Hoya failed
```

## Testing Scenarios

### Scenario 1: All Exchanges Succeed
```bash
# Ensure all exchanges are enabled and working
RUN_MAX=true RUN_BITO=true RUN_HOYA=true npm run dev
```
**Expected Notification**: `"Max, Bito and Hoya Success"`

### Scenario 2: Mixed Results
```bash
# Simulate failure by temporarily disabling an exchange's API credentials
# (e.g., set invalid HOYA_API_KEY)
npm run dev
```
**Expected Notification**: `"Max and Bito Success, Hoya failed"`

### Scenario 3: Single Exchange Enabled
```bash
RUN_MAX=true RUN_BITO=false RUN_HOYA=false npm run dev
```
**Expected Notification**: `"Max Success"` or `"Max failed"`

### Scenario 4: No Exchanges Enabled
```bash
RUN_MAX=false RUN_BITO=false RUN_HOYA=false npm run dev
```
**Expected Behavior**: 
- No notification sent
- Console log: `"No services enabled. Please check RUN_MAX, RUN_BITO, and RUN_HOYA environment variables."`

### Scenario 5: Line Credentials Missing
```bash
# Remove or comment out LINE_CHANNEL_ACCESS_TOKEN and LINE_USER_ID
unset LINE_CHANNEL_ACCESS_TOKEN LINE_USER_ID
npm run dev
```
**Expected Behavior**:
- Exchanges execute normally
- Console warning: `"Line notification credentials not configured. Skipping notification."`
- No notification sent

### Scenario 6: Line API Failure with Retry
```bash
# Use invalid LINE_CHANNEL_ACCESS_TOKEN to trigger failure
LINE_CHANNEL_ACCESS_TOKEN=invalid_token npm run dev
```
**Expected Behavior**:
- Exchanges complete normally
- First notification attempt fails (logged)
- Retry after 2 seconds (logged)
- Second attempt fails (logged with full request/response)
- Application continues (notification failure doesn't block trade results)

## Troubleshooting

### Issue: Notification not received on Line

**Possible Causes & Solutions**:

1. **Invalid LINE_CHANNEL_ACCESS_TOKEN**
   - Check console for authentication errors (HTTP 401)
   - Verify token from Line Developers Console
   - Token format: Long alphanumeric string

2. **Invalid LINE_USER_ID**
   - Check console for forbidden errors (HTTP 403)
   - Verify user ID starts with 'U' and is 33 characters long
   - Ensure you've added the bot as a friend on Line

3. **Bot not added as friend**
   - Go to your Line app, search for your bot
   - Add it as a friend
   - Try sending a message to verify connection

4. **Network/Timeout Issues**
   - Check console for timeout errors
   - Verify network connectivity to api.line.me
   - System will retry once automatically after 2 seconds

5. **Message Too Long (unlikely with 3 exchanges)**
   - Check console for message length validation errors
   - Max limit: 5000 characters
   - With 3 exchanges, message should be ~30-50 characters

### Issue: Tests Failing

**Common Problems**:

1. **Node.js version too old**
   ```bash
   node --version  # Must be 18.0.0 or higher
   ```

2. **TypeScript compilation errors**
   ```bash
   npm run type-check  # Check for TypeScript errors
   npm run build       # Build to verify no compilation issues
   ```

3. **Missing dependencies**
   ```bash
   pnpm install  # Reinstall all dependencies
   ```

4. **Test file import errors**
   - Ensure all imports use `.js` extension (ESM requirement)
   - Example: `import { logger } from '../utils/logger.js'`

### Issue: Exchanges Not Executing

**Check**:
1. Environment variables set correctly (RUN_MAX, RUN_BITO, RUN_HOYA)
2. Exchange API credentials valid
3. Console logs for specific exchange errors

**Note**: This feature doesn't modify exchange execution logic. If exchanges were working before, they should still work. The notification feature only observes and reports results.

## Development Tips

### 1. Test Line Integration Separately

Create a simple test script to verify Line API without running full exchanges:

```typescript
// test-line.ts
import axios from 'axios';
import { config } from 'dotenv';

config();

async function testLine() {
  try {
    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      {
        to: process.env.LINE_USER_ID,
        messages: [{ type: 'text', text: 'Test from crypto-slip-maker' }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      }
    );
    console.log('Success:', response.status);
  } catch (error) {
    console.error('Failed:', error.response?.data || error.message);
  }
}

testLine();
```

Run with:
```bash
npx tsx test-line.ts
```

### 2. Mock Line API for Tests

In unit/integration tests, mock axios to avoid hitting real Line API:

```typescript
import axios from 'axios';

// Mock successful response
jest.spyOn(axios, 'post').mockResolvedValue({ status: 200, data: {} });

// Mock failure response
jest.spyOn(axios, 'post').mockRejectedValue({
  response: { status: 401, data: { message: 'Authentication failed' } }
});
```

### 3. Use Different User IDs for Testing

Set up multiple Line user IDs for different team members:

```bash
# In .env or environment-specific configs
LINE_USER_ID=U1111111111111111111111111111111  # Your ID
# LINE_USER_ID=U2222222222222222222222222222222  # Teammate's ID
```

### 4. Disable Notification During Development

To run exchanges without notifications:

```bash
# Just unset or comment out Line variables in .env
# LINE_CHANNEL_ACCESS_TOKEN=...
# LINE_USER_ID=...

npm run dev  # Runs normally, logs warning about missing credentials
```

## Architecture Overview

### Component Interaction

```
server.ts (main)
    │
    ├─> MaxSlipService.Do() ──> [success/failure] ──┐
    ├─> BitoSlipService.Do() ──> [success/failure] ──┤ ExecutionResult[]
    ├─> HoyaSlipService.Do() ──> [success/failure] ──┘
    │
    └─> LineNotificationService.sendSummary(results)
            │
            ├─> MessageFormatter.format(results) → SummaryNotificationMessage
            │
            └─> POST https://api.line.me/v2/bot/message/push
                    │
                    ├─> [Success] → Log success
                    └─> [Failure] → Wait 2s → Retry → Log final result
```

### Key Files

| File | Purpose | Modify? |
|------|---------|---------|
| `src/server.ts` | Orchestration & result aggregation | ✅ Yes (with approval) |
| `src/services/LineNotificationService.ts` | Line API integration | ✅ New file |
| `src/types/executionResult.ts` | Data model definitions | ✅ New file |
| `src/utils/messageFormatter.ts` | Message formatting logic | ✅ New file |
| `src/config/LineConfig.ts` | Line API configuration | ✅ New file |
| `src/services/MaxSlipService.ts` | Existing exchange service | ❌ No changes |
| `src/services/BitoSlipService.ts` | Existing exchange service | ❌ No changes |
| `src/services/HoyaSlipService.ts` | Existing exchange service | ❌ No changes |

## Next Steps

After completing this quickstart:

1. **Review the implementation plan**: Read `plan.md` for detailed technical decisions
2. **Review the data model**: Read `data-model.md` for entity definitions
3. **Review the API contract**: Read `contracts/line-api.yaml` for Line API details
4. **Start TDD implementation**: Follow `tasks.md` (generated by `/speckit.tasks` command)
5. **Run tests continuously**: Use `npm run test:watch` during development
6. **Check constitution compliance**: Verify all changes follow `.specify/memory/constitution.md` principles

## Support & References

- **Feature Specification**: `specs/001-line-execution-notify/spec.md`
- **Implementation Plan**: `specs/001-line-execution-notify/plan.md`
- **Data Model**: `specs/001-line-execution-notify/data-model.md`
- **Line Messaging API Docs**: https://developers.line.biz/en/reference/messaging-api/
- **Line Developers Console**: https://developers.line.biz/console/
- **Project Constitution**: `.specify/memory/constitution.md`

## Questions?

If you encounter issues not covered in this guide:

1. Check console logs for detailed error messages
2. Review the troubleshooting section above
3. Verify environment variables are set correctly
4. Test Line API credentials independently
5. Ensure all tests pass before running the application

