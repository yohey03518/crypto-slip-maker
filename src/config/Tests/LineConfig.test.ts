/**
 * Unit tests for LineNotificationConfig loading and validation
 * TDD: These tests are written FIRST before implementation
 */
import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';

describe('LineNotificationConfig loading from env vars', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should load valid Line credentials from environment variables', async () => {
    // Arrange
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test_token_123';
    process.env.LINE_USER_ID = 'U1234567890abcdef';

    // Act
    const { loadLineConfig } = await import('../LineConfig.js');
    const config = loadLineConfig();

    // Assert
    assert.strictEqual(config.channelAccessToken, 'test_token_123');
    assert.strictEqual(config.userId, 'U1234567890abcdef');
    assert.strictEqual(config.timeoutMs, 5000); // Default value
    assert.strictEqual(config.retryDelayMs, 2000); // Default value
    assert.strictEqual(config.maxRetries, 1); // Default value
  });

  it('should return config with empty strings when credentials are missing', async () => {
    // Arrange
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    delete process.env.LINE_USER_ID;

    // Act
    const { loadLineConfig } = await import('../LineConfig.js');
    const config = loadLineConfig();

    // Assert
    assert.strictEqual(config.channelAccessToken, '');
    assert.strictEqual(config.userId, '');
  });

  it('should use default values for timeout, retry delay, and max retries', async () => {
    // Arrange
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test_token';
    process.env.LINE_USER_ID = 'test_user';

    // Act
    const { loadLineConfig } = await import('../LineConfig.js');
    const config = loadLineConfig();

    // Assert
    assert.strictEqual(config.timeoutMs, 5000);
    assert.strictEqual(config.retryDelayMs, 2000);
    assert.strictEqual(config.maxRetries, 1);
  });

  it('should handle partial credentials (only token provided)', async () => {
    // Arrange
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test_token';
    delete process.env.LINE_USER_ID;

    // Act
    const { loadLineConfig } = await import('../LineConfig.js');
    const config = loadLineConfig();

    // Assert
    assert.strictEqual(config.channelAccessToken, 'test_token');
    assert.strictEqual(config.userId, '');
  });

  it('should handle partial credentials (only userId provided)', async () => {
    // Arrange
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    process.env.LINE_USER_ID = 'test_user';

    // Act
    const { loadLineConfig } = await import('../LineConfig.js');
    const config = loadLineConfig();

    // Assert
    assert.strictEqual(config.channelAccessToken, '');
    assert.strictEqual(config.userId, 'test_user');
  });
});

describe('LineNotificationConfig validation', () => {
  let originalEnv: NodeJS.ProcessEnv;
  let loggedMessages: string[] = [];

  beforeEach(() => {
    originalEnv = { ...process.env };
    loggedMessages = [];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return false for isValid when token is missing', async () => {
    // Arrange
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    process.env.LINE_USER_ID = 'test_user';

    // Act
    const { loadLineConfig, isLineConfigValid } = await import('../LineConfig.js');
    const config = loadLineConfig();
    const valid = isLineConfigValid(config);

    // Assert
    assert.strictEqual(valid, false);
  });

  it('should return false for isValid when userId is missing', async () => {
    // Arrange
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test_token';
    delete process.env.LINE_USER_ID;

    // Act
    const { loadLineConfig, isLineConfigValid } = await import('../LineConfig.js');
    const config = loadLineConfig();
    const valid = isLineConfigValid(config);

    // Assert
    assert.strictEqual(valid, false);
  });

  it('should return false for isValid when both credentials are missing', async () => {
    // Arrange
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    delete process.env.LINE_USER_ID;

    // Act
    const { loadLineConfig, isLineConfigValid } = await import('../LineConfig.js');
    const config = loadLineConfig();
    const valid = isLineConfigValid(config);

    // Assert
    assert.strictEqual(valid, false);
  });

  it('should return true for isValid when both credentials are provided', async () => {
    // Arrange
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test_token_123';
    process.env.LINE_USER_ID = 'U1234567890abcdef';

    // Act
    const { loadLineConfig, isLineConfigValid } = await import('../LineConfig.js');
    const config = loadLineConfig();
    const valid = isLineConfigValid(config);

    // Assert
    assert.strictEqual(valid, true);
  });

  it('should return false for isValid when token is empty string', async () => {
    // Arrange
    process.env.LINE_CHANNEL_ACCESS_TOKEN = '';
    process.env.LINE_USER_ID = 'test_user';

    // Act
    const { loadLineConfig, isLineConfigValid } = await import('../LineConfig.js');
    const config = loadLineConfig();
    const valid = isLineConfigValid(config);

    // Assert
    assert.strictEqual(valid, false);
  });

  it('should return false for isValid when userId is empty string', async () => {
    // Arrange
    process.env.LINE_CHANNEL_ACCESS_TOKEN = 'test_token';
    process.env.LINE_USER_ID = '';

    // Act
    const { loadLineConfig, isLineConfigValid } = await import('../LineConfig.js');
    const config = loadLineConfig();
    const valid = isLineConfigValid(config);

    // Assert
    assert.strictEqual(valid, false);
  });
});

