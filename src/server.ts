import 'reflect-metadata';
import { Container } from 'typedi';
import { config } from 'dotenv';
import { logger } from './utils/logger.js';
import { MaxSlipService } from './services/MaxSlipService.js';
import { BitoSlipService } from './services/BitoSlipService.js';
import axios from 'axios';

// Load environment variables
config();

async function main(): Promise<void> {
  try {
    // Send single POST request with timestamp
    const webhookUrl = process.env.WEBHOOK_URL;
    if (!webhookUrl) {
      logger.info('WEBHOOK_URL environment variable is not set, skipping webhook notification');
    } else {
      const timestamp = new Date().toISOString();
      logger.info(`Generating timestamp: ${timestamp}`);
      
      try {
        await axios.post(webhookUrl, {
          timestamp: timestamp
        });
        logger.info('Successfully sent timestamp to webhook');
      } catch (error) {
        logger.error(`Webhook request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Continue execution despite webhook error
      }
    }

    const services = [];

    if (process.env.RUN_MAX === 'true') {
      services.push(Container.get(MaxSlipService));
    }

    if (process.env.RUN_BITO === 'true') {
      services.push(Container.get(BitoSlipService));
    }

    if (services.length === 0) {
      logger.info('No services enabled. Please check RUN_MAX and RUN_BITO environment variables.');
      return;
    }

    for (const service of services) {
      try {
        await service.Do();
      } catch (error) {
        logger.error('Service failed:', error instanceof Error ? error.message : 'Unknown error', typeof service);
      }
    }
  } catch (error) {
    console.error(error);
    logger.error('Script failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main(); 
