import { Service } from 'typedi';
import { logger } from '../utils/logger.js';

@Service()
export class HoyaSlipService {
    constructor() {}

    public async Do(): Promise<void> {
        logger.info('HoyaSlipService: Starting task');
        
        // TODO: Implement Hoya exchange trading logic
        
        logger.info('HoyaSlipService: Task completed');
    }
} 