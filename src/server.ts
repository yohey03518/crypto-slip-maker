import { MaxApiProxy } from './services/MaxApiProxy.js';
import { logger } from './utils/logger.js';
import { config } from 'dotenv';

// Load environment variables
config();

const MIN_TRADING_AMOUNTS: Record<string, string> = {
  'usdt': '8.10', // 8 is the min amount of usdt order, add 0.1 to make it greater than 8 when selling (minus fee)
  // Add other currencies' minimum amounts here as needed
};

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

    const TRADING_CURRENCY = 'usdt';
    const MARKET = `${TRADING_CURRENCY}twd`;

    if (!MIN_TRADING_AMOUNTS[TRADING_CURRENCY]) {
      throw new Error(`No minimum trading amount defined for ${TRADING_CURRENCY}`);
    }

    const maxApiProxy = new MaxApiProxy({
      apiBaseUrl: process.env.MAX_API_BASE_URL!,
      accessKey: process.env.MAX_ACCESS_KEY!,
      secretKey: process.env.MAX_SECRET_KEY!
    });

    const marketDepth = await maxApiProxy.fetchMarketDepth(TRADING_CURRENCY);

    const lowestSellPrice = Math.min(...marketDepth.asks.map((ask: [string, string]) => parseFloat(ask[0])));

    logger.info(`Lowest Sell Price: ${lowestSellPrice} TWD`);

    const walletBalance = await maxApiProxy.fetchWalletBalance(TRADING_CURRENCY);
    logger.info('Wallet Balance:', JSON.stringify(walletBalance, null, 2));
    const orderRequest = {
      market: MARKET,
      side: 'buy' as const,
      volume: MIN_TRADING_AMOUNTS[TRADING_CURRENCY],
      price: lowestSellPrice.toString(),
      ord_type: 'limit' as const
    };

    const orderResult = await maxApiProxy.placeOrder(orderRequest);
    logger.info('Order placed:', JSON.stringify(orderResult, null, 2));

    const startTime = Date.now();
    let orderDetail;
    
    while (true) {
        orderDetail = await maxApiProxy.getOrderDetail(orderResult.id);
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
    
    logger.info('Final buy order details:', JSON.stringify(orderDetail, null, 2));

    if (orderDetail.state === 'done') {
        // Get updated wallet balance after buy order
        const updatedWalletBalance = await maxApiProxy.fetchWalletBalance(TRADING_CURRENCY);
        logger.info('Updated Wallet Balance:', JSON.stringify(updatedWalletBalance, null, 2));

        // Calculate volume difference
        const initialBalance = walletBalance.find(b => b.currency === TRADING_CURRENCY)?.balance || '0';
        const updatedBalance = updatedWalletBalance.find(b => b.currency === TRADING_CURRENCY)?.balance || '0';
        const balanceDiff = (parseFloat(updatedBalance) - parseFloat(initialBalance)).toFixed(2);

        if (parseFloat(balanceDiff) > 0) {
            const latestPrice = await maxApiProxy.fetchMarketDepth(TRADING_CURRENCY);
            let currentHighestBuy = Math.max(...latestPrice.bids.map((bid: [string, string]) => parseFloat(bid[0])));
            logger.info(`Highest Buy Price: ${currentHighestBuy} TWD`);
            const sellOrderRequest = {
                market: MARKET,
                side: 'sell' as const,
                volume: balanceDiff,
                price: currentHighestBuy.toString(),
                ord_type: 'limit' as const
            };

            logger.info('Placing sell order:', JSON.stringify(sellOrderRequest, null, 2));
            const sellOrderResult = await maxApiProxy.placeOrder(sellOrderRequest);
            logger.info('Sell order placed:', JSON.stringify(sellOrderResult, null, 2));

            // Monitor sell order status
            const sellStartTime = Date.now();
            let sellOrderDetail;
            
            while (true) {
                sellOrderDetail = await maxApiProxy.getOrderDetail(sellOrderResult.id);
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
            logger.info(`No ${TRADING_CURRENCY.toUpperCase()} balance difference detected to sell`);
        }
    }

    logger.info('Task completed');
  } catch (error) {
    logger.error('Script failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main(); 