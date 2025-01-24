import { MaxApiService } from './services/MaxApiService.js';
import { logger } from './utils/logger.js';
import { config } from 'dotenv';

// Load environment variables
config();

const validateEnvVariables = () => {
    const required = ['MAX_API_BASE_URL', 'MAX_ACCESS_KEY', 'MAX_SECRET_KEY'];
    const missing = required.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
};

async function main(): Promise<void> {
    try {
        validateEnvVariables();

        const maxApiService = new MaxApiService({
            apiBaseUrl: process.env.MAX_API_BASE_URL!,
            accessKey: process.env.MAX_ACCESS_KEY!,
            secretKey: process.env.MAX_SECRET_KEY!
        });

        // Fetch USDT price
        const marketDepth = await maxApiService.fetchUSDTPrice();
        
        // Get highest bid and lowest ask
        const highestBid = Math.max(...marketDepth.bids.map((bid: [string, string]) => parseFloat(bid[0])));
        const lowestAsk = Math.min(...marketDepth.asks.map((ask: [string, string]) => parseFloat(ask[0])));
        
        logger.info(`Highest Bid: ${highestBid} TWD`);
        logger.info(`Lowest Ask: ${lowestAsk} TWD`);
        
        // Fetch user information
        const userInfo = await maxApiService.fetchUserInfo();
        logger.info(`User email: ${userInfo.email}`);
        logger.info(`User level: ${userInfo.level}`);
        logger.info(`M-Wallet enabled: ${userInfo.m_wallet_enabled}`);
        
        logger.info('Task completed');
    } catch (error) {
        logger.error('Script failed:', error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
}

main(); 