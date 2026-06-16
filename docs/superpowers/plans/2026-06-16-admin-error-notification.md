# Admin Error Notification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send detailed API error logs via Line to the system administrator when an exchange execution (excluding Hoya) fails.

**Architecture:** We will update `LineNotificationService` to support sending messages to a custom user ID (the administrator) and add a method to format and send the request/response details of a failed Axios API call. We will trigger this method from the catch block of exchange executions in `server.ts`.

**Tech Stack:** TypeScript, Node.js (with standard test runner), Axios, Line Messaging API.

---

### Task 1: Environment Configuration Setup

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update `.env.example`**
  Add the `USER_NAME` and `LINE_ADMIN_USER_ID` placeholders at the end of the file.

  Modify content in [`.env.example`](file:///Users/erwin.chang/git/crypto-slip-maker/.env.example):
  ```diff
   # Line Notification Configuration
   LINE_CHANNEL_ACCESS_TOKEN=TBD
   LINE_USER_ID=TBD
+  LINE_ADMIN_USER_ID=TBD
+  USER_NAME=TBD
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add .env.example
  git commit -m "config: add USER_NAME and LINE_ADMIN_USER_ID to .env.example"
  ```

---

### Task 2: Write Failing Tests for Admin Error Notifications

**Files:**
- Modify: `src/services/Tests/LineNotificationService.test.ts`

- [ ] **Step 1: Add failing test cases**
  Add tests to verify that `sendAdminError` properly formats and sends AxiosErrors to the administrator, and ignores non-AxiosErrors.

  Add the following tests to the `describe('LineNotificationService logic tests')` block in [`src/services/Tests/LineNotificationService.test.ts`](file:///Users/erwin.chang/git/crypto-slip-maker/src/services/Tests/LineNotificationService.test.ts):
  ```typescript
  it('should send formatted error message to admin user ID when sendAdminError is called', async () => {
    const { LineNotificationService } = await import('../LineNotificationService.js');
    const service = new LineNotificationService(validConfig);
    
    let sentRequestBody: any = null;
    service['axiosInstance'].post = async (url: string, body: any, config: any) => {
      sentRequestBody = body;
      return { data: {} } as any;
    };

    // Set environment variables for the test
    process.env.LINE_ADMIN_USER_ID = 'Uadmin12345';
    process.env.USER_NAME = 'Test User';

    const mockAxiosError = {
      isAxiosError: true,
      config: {
        method: 'POST',
        baseURL: 'https://api.bitopro.com',
        url: '/orders/usdt_twd',
        data: { action: 'BUY', amount: '10' }
      },
      response: {
        status: 400,
        data: { error: 'Invalid signature' }
      }
    };

    await service.sendAdminError('Bito', mockAxiosError as any);

    assert.ok(sentRequestBody, 'Should have sent a request');
    assert.strictEqual(sentRequestBody.to, 'Uadmin12345');
    assert.strictEqual(sentRequestBody.messages[0].type, 'text');
    
    const expectedMessage = `Test User Bito got error. The error request and response:\n` +
      `[POST] https://api.bitopro.com/orders/usdt_twd\n` +
      `Request Body: {"action":"BUY","amount":"10"}\n` +
      `Response Status: 400\n` +
      `Response Body: {"error":"Invalid signature"}`;
    assert.strictEqual(sentRequestBody.messages[0].text, expectedMessage);
  });

  it('should not send admin notification if error is not an AxiosError', async () => {
    const { LineNotificationService } = await import('../LineNotificationService.js');
    const service = new LineNotificationService(validConfig);
    
    let callCount = 0;
    service['axiosInstance'].post = async () => {
      callCount++;
      return { data: {} } as any;
    };

    process.env.LINE_ADMIN_USER_ID = 'Uadmin12345';
    process.env.USER_NAME = 'Test User';

    const mockGenericError = new Error('Generic network error');
    await service.sendAdminError('Bito', mockGenericError);

    assert.strictEqual(callCount, 0, 'Should not call sendPushMessage');
  });
  ```

- [ ] **Step 2: Run tests to verify they fail**
  Run:
  ```bash
  pnpm test
  ```
  Expected output: Compilation or runtime error indicating that `sendAdminError` is not a function.

- [ ] **Step 3: Commit the failing tests**
  Run:
  ```bash
  git add src/services/Tests/LineNotificationService.test.ts
  git commit -m "test: add failing tests for sendAdminError"
  ```

---

### Task 3: Implement `sendAdminError` in `LineNotificationService`

**Files:**
- Modify: `src/services/LineNotificationService.ts`

- [ ] **Step 1: Update `sendPushMessage` and implement `sendAdminError`**
  Modify [`src/services/LineNotificationService.ts`](file:///Users/erwin.chang/git/crypto-slip-maker/src/services/LineNotificationService.ts):
  1. Update `sendPushMessage(message: string)` signature to `sendPushMessage(message: string, toUserId?: string)`.
  2. Implement `sendAdminError(exchangeName: string, error: unknown): Promise<void>`.
  
  Target replacement in [`src/services/LineNotificationService.ts`](file:///Users/erwin.chang/git/crypto-slip-maker/src/services/LineNotificationService.ts):
  ```typescript
  // Update sendPushMessage to accept optional toUserId:
  private async sendPushMessage(message: string, toUserId?: string): Promise<void> {
    const requestBody = {
      to: toUserId || this.config.userId,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
    };
    // ... rest of sendPushMessage remains unchanged
  ```

  And add the new `sendAdminError` method inside the class:
  ```typescript
  async sendAdminError(exchangeName: string, error: unknown): Promise<void> {
    if (!axios.isAxiosError(error)) {
      logger.info(`[LineNotificationService] Error for ${exchangeName} is not an AxiosError. Skipping admin notification.`);
      return;
    }

    const adminUserId = process.env.LINE_ADMIN_USER_ID;
    if (!adminUserId) {
      logger.warn('[LineNotificationService] LINE_ADMIN_USER_ID environment variable is not set. Skipping admin notification.');
      return;
    }

    const userName = process.env.USER_NAME || 'Unknown User';
    const request = error.config;
    const response = error.response;

    if (!request) {
      logger.warn('[LineNotificationService] AxiosError has no config. Skipping admin notification.');
      return;
    }

    const method = request.method?.toUpperCase() || 'UNKNOWN';
    const fullUrl = request.baseURL ? `${request.baseURL}${request.url}` : request.url || '';
    const requestBody = request.data || request.params || {};
    
    const status = response?.status || 'unknown';
    const responseBody = response?.data || 'No response body';

    const message = `${userName} ${exchangeName} got error. The error request and response:\n` +
      `[${method}] ${fullUrl}\n` +
      `Request Body: ${typeof requestBody === 'object' ? JSON.stringify(requestBody) : requestBody}\n` +
      `Response Status: ${status}\n` +
      `Response Body: ${typeof responseBody === 'object' ? JSON.stringify(responseBody) : responseBody}`;

    if (!validateMessageLength(message)) {
      logger.error(`[LineNotificationService] Admin error message exceeds 5000 character limit: ${message.length} characters`);
    }

    try {
      await this.sendPushMessage(message, adminUserId);
      logger.info(`[LineNotificationService] Admin error notification sent for ${exchangeName}`);
    } catch (err) {
      logger.error(`[LineNotificationService] Failed to send admin error notification for ${exchangeName}:`, err instanceof Error ? err.message : 'Unknown error');
    }
  }
  ```

- [ ] **Step 2: Run tests to verify they pass**
  Run:
  ```bash
  pnpm test
  ```
  Expected output: All tests pass (including the new tests).

- [ ] **Step 3: Commit implementation**
  Run:
  ```bash
  git add src/services/LineNotificationService.ts
  git commit -m "feat: implement sendAdminError in LineNotificationService"
  ```

---

### Task 4: Integrate in `server.ts`

**Files:**
- Modify: `src/server.ts`

- [ ] **Step 1: Call `sendAdminError` on exchange execution failure**
  Modify [`src/server.ts`](file:///Users/erwin.chang/git/crypto-slip-maker/src/server.ts) in the catch block of the exchange execution loop.

  Target code to modify:
  ```typescript
      // Execute each service and collect results
      for (const { name, service } of servicesConfig) {
        try {
          logger.info(`Executing ${name} exchange...`);
          await service.Do();
          
          // Success: no exception thrown
          results.push({ exchangeName: name, success: true });
          logger.info(`${name} exchange completed successfully`);
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
          // Continue to next exchange (don't re-throw)
        }
      }
  ```

- [ ] **Step 2: Build and run tests to verify compilation and logic**
  Run:
  ```bash
  pnpm build && pnpm test
  ```
  Expected output: Compilation succeeds and all tests pass.

- [ ] **Step 3: Commit integration changes**
  Run:
  ```bash
  git add src/server.ts
  git commit -m "feat: integrate admin error notifications in server.ts"
  ```
