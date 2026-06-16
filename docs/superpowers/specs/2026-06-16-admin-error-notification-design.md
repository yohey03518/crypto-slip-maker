# Design Spec: Administrator Line Error Notifications

This document outlines the design for sending detailed API error logs to the system administrator via the Line Messaging API when an exchange service encounters an error.

## Requirements

1. **Environment Variables**:
   * `USER_NAME`: The name of the user/account running the bot (e.g. `John Doe`).
   * `LINE_ADMIN_USER_ID`: The Line User ID of the system administrator.

2. **Error Capture & Notification**:
   * When any exchange (excluding Hoya) encounters an error during execution, send a detailed API request/response log to the administrator via Line.
   * Send 1 message per failed exchange (1 exchange = 1 message).
   * Do not include headers.
   * Format of the message:
     ```text
     {User name} {Exchange} got error. The error request and response:
     {error API url and request}
     {error API response status code and body}
     ```

3. **Exclusion**:
   * Hoya (which uses Playwright UI automation) is excluded from administrator error logging.

## Architectural Changes

### 1. Environment Configurations
We will update `.env.example` and the configuration loading mechanism to support `USER_NAME` and `LINE_ADMIN_USER_ID`.

### 2. `LineNotificationService` Updates
Add a new method `sendAdminError(exchangeName: string, error: unknown)` to [LineNotificationService](file:///Users/erwin.chang/git/crypto-slip-maker/src/services/LineNotificationService.ts):
* Exclude non-`AxiosError` exceptions.
* Extract `method`, `url` (including `baseURL`), and `data`/`params` from `error.config`.
* Extract `status` and `data` from `error.response`.
* Format the message template as specified.
* Update `sendPushMessage` and helper `sendWithRetry` in `LineNotificationService` to accept an optional `toUserId` argument.

### 3. Execution flow integration in `server.ts`
Modify the `catch` block in [server.ts](file:///Users/erwin.chang/git/crypto-slip-maker/src/server.ts):
```typescript
      } catch (error) {
        // Failure: exception thrown during execution
        results.push({ exchangeName: name, success: false });
        logger.error(`${name} exchange failed:`, error instanceof Error ? error.message : 'Unknown error');
        
        // Send admin notification for API errors (excluding Hoya)
        if (name !== 'Hoya') {
          try {
            const lineConfig = loadAndValidateLineConfig();
            if (lineConfig) {
              const notificationService = new LineNotificationService(lineConfig);
              await notificationService.sendAdminError(name, error);
            }
          } catch (notifError) {
            logger.error(`Failed to send admin notification for ${name} error:`, notifError instanceof Error ? notifError.message : 'Unknown error');
          }
        }
      }
```

## Testing Plan

1. **Unit/Integration Tests**:
   * Add a test case for `LineNotificationService.sendAdminError` under `src/services/Tests` or verify formatting.
2. **Manual Verification**:
   * Run the script with invalid API credentials/keys for Bito or Max to trigger a 4xx error.
   * Verify the formatted admin message matches the requested structure.
   * Verify Hoya errors do not trigger administrator error notifications.
