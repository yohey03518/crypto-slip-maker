import 'reflect-metadata';
import { Container } from 'typedi';
import { config } from 'dotenv';
import { logger, LineNotificationService, loadAndValidateLineConfig } from '@crypto-slip-maker/shared';
import type { ExecutionResult } from '@crypto-slip-maker/shared';
import { HoyaSlipService } from './services/HoyaSlipService.js';

// Load environment variables
config();

async function main(): Promise<void> {
  try {
    const results: ExecutionResult[] = [];
    
    if (process.env.RUN_HOYA === 'true') {
      logger.info('Executing Hoya exchange...');
      const service = Container.get(HoyaSlipService);
      try {
        await service.Do();
        results.push({ exchangeName: 'Hoya', success: true });
        logger.info('Hoya exchange completed successfully');
      } catch (error) {
        results.push({ exchangeName: 'Hoya', success: false });
        logger.error('Hoya exchange failed:', error instanceof Error ? error.message : 'Unknown error');
      }

      // Send summary notification for Hoya
      const lineConfig = loadAndValidateLineConfig();
      if (lineConfig) {
        try {
          const notificationService = new LineNotificationService(lineConfig);
          await notificationService.sendSummary(results);
          logger.info('Notification sent successfully');
        } catch (notifError) {
          logger.error('Failed to send notification:', notifError instanceof Error ? notifError.message : 'Unknown error');
        }
      }
    } else {
      logger.info('Hoya exchange is not enabled (RUN_HOYA !== true).');
    }
  } catch (error) {
    logger.error('Playwright runner failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();
