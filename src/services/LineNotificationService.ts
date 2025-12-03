/**
 * Line Messaging API integration service
 * Sends push notifications for exchange execution summaries
 */
import axios from 'axios';
import { Service } from 'typedi';
import { logger } from '../utils/logger.js';
import { formatSummaryMessage, validateMessageLength } from '../utils/messageFormatter.js';
import type { ExecutionResult } from '../types/executionResult.js';
import type { LineNotificationConfig } from '../config/LineConfig.js';

/**
 * Service for sending execution summary notifications via Line Messaging API
 */
@Service()
export class LineNotificationService {
  private readonly LINE_API_ENDPOINT = 'https://api.line.me/v2/bot/message/push';
  private config: LineNotificationConfig;

  constructor(config: LineNotificationConfig) {
    this.config = config;
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
   * @throws Error if all attempts fail
   */
  private async sendWithRetry(message: string): Promise<void> {
    const maxAttempts = this.config.maxRetries + 1; // maxRetries=1 means 2 total attempts

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        logger.info(`[LineNotificationService] Attempt ${attempt}/${maxAttempts}: Sending notification`);
        
        await this.sendPushMessage(message);
        
        logger.info(`[LineNotificationService] Attempt ${attempt} succeeded`);
        return; // Success - exit retry loop
        
      } catch (error: any) {
        logger.error(`[LineNotificationService] Attempt ${attempt} failed:`, {
          error: error.message,
          code: error.code,
          status: error.response?.status,
        });

        // If this was the last attempt, log full details and throw
        if (attempt === maxAttempts) {
          logger.error('[LineNotificationService] All attempts exhausted. Logging full request/response details:', {
            endpoint: this.LINE_API_ENDPOINT,
            headers: {
              Authorization: `Bearer ${this.config.channelAccessToken.substring(0, 10)}...`, // Masked token
              'Content-Type': 'application/json'
            },
            body: {
              to: this.config.userId,
              messages: [{ type: 'text', text: message }]
            },
            error: {
              message: error.message,
              code: error.code,
              status: error.response?.status,
              statusText: error.response?.statusText,
              data: error.response?.data
            }
          });
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
   * @throws Error if the API call fails
   */
  private async sendPushMessage(message: string): Promise<void> {
    const requestBody = {
      to: this.config.userId,
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
      },
      timeout: this.config.timeoutMs
    };

    logger.info('[LineNotificationService] Sending POST request to Line API');
    const response = await axios.post(
      this.LINE_API_ENDPOINT,
      requestBody,
      requestConfig
    );

    logger.info(`[LineNotificationService] Line API response: ${response.status} ${response.statusText}`);
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

