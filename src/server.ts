import 'reflect-metadata';
import { Container } from 'typedi';
import { config } from 'dotenv';
import { logger } from './utils/logger.js';
import { MaxSlipService } from './services/MaxSlipService.js';
import { BitoSlipService } from './services/BitoSlipService.js';

// Load environment variables
config();

async function main(): Promise<void> {
  try {
    // const maxSlipService = Container.get(MaxSlipService);
    // await maxSlipService.Do();

    const bitoSlipService = Container.get(BitoSlipService);
    await bitoSlipService.Do();
  } catch (error) {
    console.error(error);
    logger.error('Script failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main(); 