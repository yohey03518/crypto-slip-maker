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

    const marketDepth = await maxApiService.fetchUSDTPrice();

    const lowestSellPrice = Math.min(...marketDepth.asks.map((ask: [string, string]) => parseFloat(ask[0])));

    logger.info(`Lowest Sell Price: ${lowestSellPrice} TWD`);

    const walletBalance = await maxApiService.fetchWalletBalance();
    logger.info('Wallet Balance:', JSON.stringify(walletBalance, null, 2));
    const orderRequest = {
      market: 'usdttwd',
      side: 'buy' as const,
      volume: '8.10', // 8 is the min amount of usdt order
      price: lowestSellPrice.toString(),
      ord_type: 'limit' as const
    };

    const orderResult = await maxApiService.placeOrder(orderRequest);
    logger.info('Order placed:', JSON.stringify(orderResult, null, 2));

    const startTime = Date.now();
    let orderDetail;
    
    while (true) {
        orderDetail = await maxApiService.getOrderDetail(orderResult.id);
        logger.info('Order status:', orderDetail.state);
        
        if (orderDetail.state === 'done' || orderDetail.state === 'cancel') {
            break;
        }
        
        if (Date.now() - startTime > 10000) {
            logger.info('Order monitoring timed out after 10 seconds');
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    logger.info('Final order details:', JSON.stringify(orderDetail, null, 2));

    if (orderDetail.state === 'done') {
        // Get updated wallet balance after buy order
        const updatedWalletBalance = await maxApiService.fetchWalletBalance();
        logger.info('Updated Wallet Balance:', JSON.stringify(updatedWalletBalance, null, 2));

        // Calculate USDT volume difference
        const initialUsdtBalance = walletBalance.find(b => b.currency === 'usdt')?.balance || '0';
        const updatedUsdtBalance = updatedWalletBalance.find(b => b.currency === 'usdt')?.balance || '0';
        const usdtDifference = (parseFloat(updatedUsdtBalance) - parseFloat(initialUsdtBalance)).toFixed(2);

        if (parseFloat(usdtDifference) > 0) {
            const latestPrice = await maxApiService.fetchUSDTPrice();
            let currentHighestBuy = Math.max(...latestPrice.bids.map((bid: [string, string]) => parseFloat(bid[0])));
            logger.info(`Highest Buy Price: ${currentHighestBuy} TWD`);
            const sellOrderRequest = {
                market: 'usdttwd',
                side: 'sell' as const,
                volume: usdtDifference,
                price: currentHighestBuy.toString(),
                ord_type: 'limit' as const
            };

            logger.info('Placing sell order:', JSON.stringify(sellOrderRequest, null, 2));
            const sellOrderResult = await maxApiService.placeOrder(sellOrderRequest);
            logger.info('Sell order placed:', JSON.stringify(sellOrderResult, null, 2));

            // Monitor sell order status
            const sellStartTime = Date.now();
            let sellOrderDetail;
            
            while (true) {
                sellOrderDetail = await maxApiService.getOrderDetail(sellOrderResult.id);
                logger.info('Sell order status:', sellOrderDetail.state);
                
                if (sellOrderDetail.state === 'done' || sellOrderDetail.state === 'cancel') {
                    break;
                }
                
                if (Date.now() - sellStartTime > 10000) {
                    logger.info('Sell order monitoring timed out after 10 seconds');
                    break;
                }
                
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            logger.info('Final sell order details:', JSON.stringify(sellOrderDetail, null, 2));
        } else {
            logger.info('No USDT balance difference detected to sell');
        }
    }

    logger.info('Task completed');
  } catch (error) {
    logger.error('Script failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main(); 