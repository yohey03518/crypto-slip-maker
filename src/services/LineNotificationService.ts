/**
 * Line Messaging API integration service
 * Sends push notifications for exchange execution summaries
 */
import axios, { AxiosInstance } from 'axios';
import { Service } from 'typedi';
import { logger } from '../utils/logger.js';
import { setupApiInterceptors } from '../proxies/apiInterceptor.js';
import { formatSummaryMessage, validateMessageLength } from '../utils/messageFormatter.js';
import type { ExecutionResult } from '../types/executionResult.js';
import type { LineNotificationConfig } from '../config/LineConfig.js';

/**
 * Service for sending execution summary notifications via Line Messaging API
 */
@Service()
export class LineNotificationService {
  private readonly LINE_API_ENDPOINT = 'https://api.line.me/v2/bot/message/push';
  private readonly axiosInstance: AxiosInstance;
  private config: LineNotificationConfig;

  constructor(config: LineNotificationConfig) {
    this.config = config;
    
    // Create axios instance with interceptors for request/response logging
    this.axiosInstance = axios.create({
      baseURL: 'https://api.line.me',
      timeout: this.config.timeoutMs
    });
    setupApiInterceptors(this.axiosInstance, 'LINE');
  }

  /**
   * Send execution summary notification to Line
   * Formats results and sends a single push message with retry logic
   * 
   * @param results Array of execution results from exchanges
   * @throws Error if notification fails after all retry attempts
   */
  async sendSummary(results: ExecutionResult[]): Promise<void> {
    // Entry logging
    logger.info('[LineNotificationService] Preparing to send execution summary notification');
    logger.info(`[LineNotificationService] Processing ${results.length} execution result(s)`);

    // Format message
    const message = formatSummaryMessage(results);
    logger.info(`[LineNotificationService] Formatted message: "${message}"`);

    // Validate message length
    if (!validateMessageLength(message)) {
      logger.error(`[LineNotificationService] Message exceeds 5000 character limit: ${message.length} characters`);
      throw new Error(`Message too long: ${message.length} characters (max 5000)`);
    }

    // Send with retry logic
    try {
      await this.sendWithRetry(message);
      logger.info('[LineNotificationService] Notification sent successfully');
    } catch (error) {
      logger.error('[LineNotificationService] Failed to send notification after all retries');
      throw error;
    }
  }

  /**
   * Send push message with retry logic
   * Retries once after a delay if the initial attempt fails
   * 
   * @param message The formatted message text to send
   * @param toUserId Optional recipient user ID (defaults to regular user ID)
   * @throws Error if all attempts fail
   */
  private async sendWithRetry(message: string, toUserId?: string): Promise<void> {
    const maxAttempts = this.config.maxRetries + 1; // maxRetries=1 means 2 total attempts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info(`[LineNotificationService] Attempt ${attempt}/${maxAttempts}: Sending notification`);
        
        await this.sendPushMessage(message, toUserId);
        
        logger.info(`[LineNotificationService] Attempt ${attempt} succeeded`);
        return; // Success - exit retry loop
        
      } catch (error: any) {
        logger.error(`[LineNotificationService] Attempt ${attempt} failed:`, {
          error: error.message,
          code: error.code,
          status: error.response?.status,
        });

        // If this was the last attempt, log summary and throw
        // Detailed request/response already logged by axios interceptor
        if (attempt === maxAttempts) {
          logger.error('[LineNotificationService] All attempts exhausted. See previous logs for full request/response details.');
          throw error;
        }

        // Wait before retry
        logger.info(`[LineNotificationService] Waiting ${this.config.retryDelayMs}ms before retry...`);
        await this.delay(this.config.retryDelayMs);
      }
    }
  }

  /**
   * Send a push message to Line Messaging API
   * 
   * @param message The message text to send
   * @param toUserId Optional recipient user ID (defaults to regular user ID)
   * @throws Error if the API call fails
   */
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

    const requestConfig = {
      headers: {
        'Authorization': `Bearer ${this.config.channelAccessToken}`,
        'Content-Type': 'application/json'
      }
    };

    // Use axios instance with interceptors for automatic logging
    const response = await this.axiosInstance.post(
      '/v2/bot/message/push',
      requestBody,
      requestConfig
    );
  }

  /**
   * Send administrator notification for a failed exchange API request
   * 
   * @param exchangeName Name of the exchange (e.g. Max, Bito)
   * @param error The error object thrown
   */
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
      await this.sendWithRetry(message, adminUserId);
      logger.info(`[LineNotificationService] Admin error notification sent for ${exchangeName}`);
    } catch (err) {
      logger.error(`[LineNotificationService] Failed to send admin error notification for ${exchangeName}:`, err instanceof Error ? err.message : 'Unknown error');
    }
  }

  /**
   * Delay execution for the specified number of milliseconds
   * 
   * @param ms Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

