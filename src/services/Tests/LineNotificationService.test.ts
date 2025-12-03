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
});

