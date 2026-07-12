/**
 * Line Messaging API configuration
 * Loads credentials and settings from environment variables
 */
import { logger } from '../utils/logger.js';

/**
 * Configuration for Line Messaging API push message notifications
 */
export interface LineNotificationConfig {
  channelAccessToken: string;
  userId: string;
  timeoutMs: number;
  retryDelayMs: number;
  maxRetries: number;
}

/**
 * Load Line notification configuration from environment variables
 * @returns LineNotificationConfig with credentials and default settings
 */
export function loadLineConfig(): LineNotificationConfig {
  const config: LineNotificationConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
    userId: process.env.LINE_USER_ID || '',
    timeoutMs: 5000, // 5 second timeout per FR-012
    retryDelayMs: 2000, // 2 second delay before retry per FR-011
    maxRetries: 1 // Retry once per FR-011
  };

  return config;
}

/**
 * Validate that Line configuration has all required credentials
 * @param config LineNotificationConfig to validate
 * @returns true if config is valid (both token and userId are non-empty), false otherwise
 */
export function isLineConfigValid(config: LineNotificationConfig): boolean {
  const hasToken = config.channelAccessToken.length > 0;
  const hasUserId = config.userId.length > 0;
  
  return hasToken && hasUserId;
}

/**
 * Load and validate Line configuration, logging warnings if credentials are missing
 * @returns LineNotificationConfig or null if credentials are missing
 */
export function loadAndValidateLineConfig(): LineNotificationConfig | null {
  const config = loadLineConfig();
  
  if (!isLineConfigValid(config)) {
    logger.warn('Line notification credentials not configured. Skipping notification.');
    logger.warn('Set LINE_CHANNEL_ACCESS_TOKEN and LINE_USER_ID environment variables to enable notifications.');
    return null;
  }
  
  logger.info('Line notification configuration loaded successfully');
  return config;
}

