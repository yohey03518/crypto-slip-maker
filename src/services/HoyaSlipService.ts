import { Service } from 'typedi';
import { logger } from '../utils/logger.js';
import { authenticator } from 'otplib';

@Service()
export class HoyaSlipService {
    private readonly googleAuthKey: string;

    constructor() {
        const key = process.env.HOYA_GOOGLE_AUTH_KEY;
        if (!key) {
            throw new Error('HOYA_GOOGLE_AUTH_KEY environment variable is not set');
        }
        this.googleAuthKey = key;
    }

    private generateAuthCode(): string {
        try {
            return authenticator.generate(this.googleAuthKey);
        } catch (error) {
            logger.error('Failed to generate Google Authentication code:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }

    public async Do(): Promise<void> {
        logger.info('HoyaSlipService: Starting task');
        
        try {
            const authCode = this.generateAuthCode();
            logger.info('Generated Google Authentication code:', authCode);
            
            // TODO: Implement Hoya exchange trading logic using the authCode
            
        } catch (error) {
            logger.error('HoyaSlipService failed:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
        
        logger.info('HoyaSlipService: Task completed');
    }
} 