/**
 * Contract and integration tests for LineNotificationService
 * TDD: These tests are written FIRST before implementation
 * 
 * Note: These tests verify the contract structure and logic flow
 * Full integration tests with actual Line API calls should be done manually
 * using the quickstart scenarios
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { ExecutionResult } from '../../types/executionResult.js';
import type { LineNotificationConfig } from '../../config/LineConfig.js';

// Test configuration
const validConfig: LineNotificationConfig = {
  channelAccessToken: 'test_token_123',
  userId: 'U1234567890abcdef',
  timeoutMs: 5000,
  retryDelayMs: 100, // Shorter for tests
  maxRetries: 1
};

describe('LineNotificationService logic tests', () => {
  it('should use message formatter to create notification text', async () => {
    const { formatSummaryMessage } = await import('../../utils/messageFormatter.js');
    
    const results: ExecutionResult[] = [
      { exchangeName: 'Max', success: true },
      { exchangeName: 'Bito', success: false }
    ];
    
    const message = formatSummaryMessage(results);
    assert.strictEqual(message, 'Max Success, Bito failed');
  });

  it('should validate message length correctly using length comparison', async () => {
    const { validateMessageLength } = await import('../../utils/messageFormatter.js');
    
    const shortMessage = 'Max Success';
    const longMessage = 'a'.repeat(5001);
    
    assert.strictEqual(validateMessageLength(shortMessage), true);
    assert.strictEqual(validateMessageLength(longMessage), false);
  });

  it('should create service instance and validate it can be instantiated', async () => {
    const { LineNotificationService } = await import('../LineNotificationService.js');
    const service = new LineNotificationService(validConfig);
    
    assert.ok(service, 'Service should be created');
    assert.ok(typeof service.sendSummary === 'function', 'Service should have sendSummary method');
  });

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
});

