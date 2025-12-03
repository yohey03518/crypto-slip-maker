import 'reflect-metadata';
import { Container } from 'typedi';
import { config } from 'dotenv';
import { logger } from './utils/logger.js';
import { MaxSlipService } from './services/MaxSlipService.js';
import { BitoSlipService } from './services/BitoSlipService.js';
import { HoyaSlipService } from './services/HoyaSlipService.js';
import { LineNotificationService } from './services/LineNotificationService.js';
import { loadAndValidateLineConfig } from './config/LineConfig.js';
import type { ExecutionResult, ExchangeName } from './types/executionResult.js';
import axios from 'axios';

// Load environment variables
config();

async function main(): Promise<void> {
  try {
    // Initialize array to collect execution results for notification
    const results: ExecutionResult[] = [];

    // Build list of enabled services with their exchange names
    const servicesConfig: Array<{ name: ExchangeName; service: any }> = [];

    if (process.env.RUN_MAX === 'true') {
      servicesConfig.push({ name: 'Max', service: Container.get(MaxSlipService) });
    }

    if (process.env.RUN_BITO === 'true') {
      servicesConfig.push({ name: 'Bito', service: Container.get(BitoSlipService) });
    }

    if (process.env.RUN_HOYA === 'true') {
      servicesConfig.push({ name: 'Hoya', service: Container.get(HoyaSlipService) });
    }

    // Handle case where no exchanges are enabled
    if (servicesConfig.length === 0) {
      logger.info('No services enabled. Please check RUN_MAX, RUN_BITO, and RUN_HOYA environment variables.');
      return;
    }

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
        
        // Continue to next exchange (don't re-throw)
      }
    }

    // Send notification after all exchanges complete
    logger.info(`All exchanges completed. Sending notification for ${results.length} result(s)...`);
    
    // Load and validate Line configuration
    const lineConfig = loadAndValidateLineConfig();
    
    if (lineConfig) {
      try {
        const notificationService = new LineNotificationService(lineConfig);
        await notificationService.sendSummary(results);
        logger.info('Notification sent successfully');
      } catch (error) {
        logger.error('Failed to send notification:', error instanceof Error ? error.message : 'Unknown error');
        // Don't fail the entire process if notification fails
        // Trade execution is more important than notification
      }
    } else {
      logger.info('Line notification skipped (credentials not configured)');
    }
  } catch (error) {
    console.error(error);
    logger.error('Script failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main(); 
