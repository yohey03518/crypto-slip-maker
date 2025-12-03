/**
 * Test fixtures and unit tests for ExecutionResult and ExecutionSummary types
 */
import { describe, it } from 'node:test';
import assert from 'node:assert';
import type { ExecutionResult, ExecutionSummary, ExchangeName } from '../executionResult.js';

// Test fixtures for reuse across tests
export const successResult: ExecutionResult = { 
  exchangeName: 'Max', 
  success: true 
};

export const failureResult: ExecutionResult = { 
  exchangeName: 'Bito', 
  success: false 
};

export const allSuccessSummary: ExecutionSummary = {
  results: [
    { exchangeName: 'Max', success: true },
    { exchangeName: 'Bito', success: true },
    { exchangeName: 'Hoya', success: true }
  ],
  timestamp: new Date('2025-12-03T10:00:00Z')
};

export const mixedSummary: ExecutionSummary = {
  results: [
    { exchangeName: 'Max', success: true },
    { exchangeName: 'Bito', success: true },
    { exchangeName: 'Hoya', success: false }
  ],
  timestamp: new Date('2025-12-03T10:00:00Z')
};

export const allFailedSummary: ExecutionSummary = {
  results: [
    { exchangeName: 'Max', success: false },
    { exchangeName: 'Bito', success: false },
    { exchangeName: 'Hoya', success: false }
  ],
  timestamp: new Date('2025-12-03T10:00:00Z')
};

export const singleSuccessSummary: ExecutionSummary = {
  results: [
    { exchangeName: 'Max', success: true }
  ],
  timestamp: new Date('2025-12-03T10:00:00Z')
};

export const singleFailureSummary: ExecutionSummary = {
  results: [
    { exchangeName: 'Max', success: false }
  ],
  timestamp: new Date('2025-12-03T10:00:00Z')
};

describe('ExecutionSummary validation logic', () => {
  it('should correctly identify all success results using every()', () => {
    assert.strictEqual(allSuccessSummary.results.length, 3);
    assert.ok(allSuccessSummary.results.every(r => r.success === true));
  });

  it('should correctly count success and failure results using filter()', () => {
    assert.strictEqual(mixedSummary.results.length, 3);
    const successCount = mixedSummary.results.filter(r => r.success).length;
    const failureCount = mixedSummary.results.filter(r => !r.success).length;
    assert.strictEqual(successCount, 2);
    assert.strictEqual(failureCount, 1);
  });

  it('should correctly identify all failed results using every()', () => {
    assert.strictEqual(allFailedSummary.results.length, 3);
    assert.ok(allFailedSummary.results.every(r => r.success === false));
  });

  it('should validate timestamp is a valid Date object', () => {
    assert.ok(allSuccessSummary.timestamp instanceof Date);
    assert.ok(!isNaN(allSuccessSummary.timestamp.getTime()));
  });
});

