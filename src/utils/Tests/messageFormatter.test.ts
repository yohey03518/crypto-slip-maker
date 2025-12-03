/**
 * Unit tests for message formatting functions
 * TDD: These tests are written FIRST before implementation
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { ExecutionResult } from '../../types/executionResult.js';

describe('joinWithAnd helper function', () => {
  it('should return single item as-is', async () => {
    const { joinWithAnd } = await import('../messageFormatter.js');
    const result = joinWithAnd(['Max']);
    assert.strictEqual(result, 'Max');
  });

  it('should join two items with " and "', async () => {
    const { joinWithAnd } = await import('../messageFormatter.js');
    const result = joinWithAnd(['Max', 'Bito']);
    assert.strictEqual(result, 'Max and Bito');
  });

  it('should join three items with comma and " and "', async () => {
    const { joinWithAnd } = await import('../messageFormatter.js');
    const result = joinWithAnd(['Max', 'Bito', 'Hoya']);
    assert.strictEqual(result, 'Max, Bito and Hoya');
  });

  it('should handle empty array', async () => {
    const { joinWithAnd } = await import('../messageFormatter.js');
    const result = joinWithAnd([]);
    assert.strictEqual(result, '');
  });
});

describe('formatSummaryMessage function', () => {
  it('should format all success (3 exchanges)', async () => {
    const { formatSummaryMessage } = await import('../messageFormatter.js');
    const results: ExecutionResult[] = [
      { exchangeName: 'Max', success: true },
      { exchangeName: 'Bito', success: true },
      { exchangeName: 'Hoya', success: true }
    ];
    const message = formatSummaryMessage(results);
    assert.strictEqual(message, 'Max, Bito and Hoya Success');
  });

  it('should format mixed results (2 success, 1 failure)', async () => {
    const { formatSummaryMessage } = await import('../messageFormatter.js');
    const results: ExecutionResult[] = [
      { exchangeName: 'Max', success: true },
      { exchangeName: 'Bito', success: true },
      { exchangeName: 'Hoya', success: false }
    ];
    const message = formatSummaryMessage(results);
    assert.strictEqual(message, 'Max and Bito Success, Hoya failed');
  });

  it('should format all failed (3 exchanges)', async () => {
    const { formatSummaryMessage } = await import('../messageFormatter.js');
    const results: ExecutionResult[] = [
      { exchangeName: 'Max', success: false },
      { exchangeName: 'Bito', success: false },
      { exchangeName: 'Hoya', success: false }
    ];
    const message = formatSummaryMessage(results);
    assert.strictEqual(message, 'Max, Bito and Hoya failed');
  });

  it('should format single exchange success', async () => {
    const { formatSummaryMessage } = await import('../messageFormatter.js');
    const results: ExecutionResult[] = [
      { exchangeName: 'Max', success: true }
    ];
    const message = formatSummaryMessage(results);
    assert.strictEqual(message, 'Max Success');
  });

  it('should format single exchange failure', async () => {
    const { formatSummaryMessage } = await import('../messageFormatter.js');
    const results: ExecutionResult[] = [
      { exchangeName: 'Max', success: false }
    ];
    const message = formatSummaryMessage(results);
    assert.strictEqual(message, 'Max failed');
  });

  it('should format mixed with 1 success, 2 failures', async () => {
    const { formatSummaryMessage } = await import('../messageFormatter.js');
    const results: ExecutionResult[] = [
      { exchangeName: 'Max', success: true },
      { exchangeName: 'Bito', success: false },
      { exchangeName: 'Hoya', success: false }
    ];
    const message = formatSummaryMessage(results);
    assert.strictEqual(message, 'Max Success, Bito and Hoya failed');
  });

  it('should format 2 exchanges - both success', async () => {
    const { formatSummaryMessage } = await import('../messageFormatter.js');
    const results: ExecutionResult[] = [
      { exchangeName: 'Max', success: true },
      { exchangeName: 'Bito', success: true }
    ];
    const message = formatSummaryMessage(results);
    assert.strictEqual(message, 'Max and Bito Success');
  });

  it('should format 2 exchanges - both failed', async () => {
    const { formatSummaryMessage } = await import('../messageFormatter.js');
    const results: ExecutionResult[] = [
      { exchangeName: 'Max', success: false },
      { exchangeName: 'Bito', success: false }
    ];
    const message = formatSummaryMessage(results);
    assert.strictEqual(message, 'Max and Bito failed');
  });

  it('should format 2 exchanges - mixed (1 success, 1 failure)', async () => {
    const { formatSummaryMessage } = await import('../messageFormatter.js');
    const results: ExecutionResult[] = [
      { exchangeName: 'Max', success: true },
      { exchangeName: 'Bito', success: false }
    ];
    const message = formatSummaryMessage(results);
    assert.strictEqual(message, 'Max Success, Bito failed');
  });
});

describe('validateMessageLength function', () => {
  it('should return true for message under 5000 characters', async () => {
    const { validateMessageLength } = await import('../messageFormatter.js');
    const message = 'Max, Bito and Hoya Success'; // ~27 chars
    const result = validateMessageLength(message);
    assert.strictEqual(result, true);
  });

  it('should return true for message exactly 5000 characters', async () => {
    const { validateMessageLength } = await import('../messageFormatter.js');
    const message = 'a'.repeat(5000);
    const result = validateMessageLength(message);
    assert.strictEqual(result, true);
  });

  it('should return false for message over 5000 characters', async () => {
    const { validateMessageLength } = await import('../messageFormatter.js');
    const message = 'a'.repeat(5001);
    const result = validateMessageLength(message);
    assert.strictEqual(result, false);
  });

  it('should return true for empty string', async () => {
    const { validateMessageLength } = await import('../messageFormatter.js');
    const result = validateMessageLength('');
    assert.strictEqual(result, true);
  });

  it('should return true for typical notification message', async () => {
    const { validateMessageLength } = await import('../messageFormatter.js');
    const message = 'Max and Bito Success, Hoya failed';
    const result = validateMessageLength(message);
    assert.strictEqual(result, true);
    assert.ok(message.length < 5000);
  });
});

describe('message character count validation', () => {
  it('should validate that all formatted messages are under 5000 chars', async () => {
    const { formatSummaryMessage, validateMessageLength } = await import('../messageFormatter.js');
    
    // Test all possible combinations (worst case: all exchanges with long names)
    const testCases: ExecutionResult[][] = [
      [{ exchangeName: 'Max', success: true }, { exchangeName: 'Bito', success: true }, { exchangeName: 'Hoya', success: true }],
      [{ exchangeName: 'Max', success: false }, { exchangeName: 'Bito', success: false }, { exchangeName: 'Hoya', success: false }],
      [{ exchangeName: 'Max', success: true }, { exchangeName: 'Bito', success: false }, { exchangeName: 'Hoya', success: true }],
    ];

    for (const results of testCases) {
      const message = formatSummaryMessage(results);
      assert.ok(validateMessageLength(message), `Message too long: ${message.length} chars`);
      assert.ok(message.length <= 5000, `Message exceeds limit: ${message.length} chars`);
    }
  });
});

