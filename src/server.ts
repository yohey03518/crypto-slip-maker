import { MaxApi } from './proxies/maxExchangeProxy.js';
import { logger } from './utils/logger.js';
import { config } from 'dotenv';
import { TradingCurrency } from './types.js';

// Load environment variables
config();

const MIN_TRADING_AMOUNTS: Record<TradingCurrency, number> = {
  'usdt': 8.02, // 8 is the min amount of usdt order, add a little more to make it greater than 8 when selling (minus fee)
  'btc': 0.0001, // Adding minimum amount for BTC
  // Add other currencies' minimum amounts here as needed
};

const ORDER_MONITORING_TIMEOUT_MS = 60000;

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

    const TRADING_CURRENCY: TradingCurrency = 'usdt';
    const QUOTE_CURRENCY = 'twd';
    const maxApiProxy = new MaxApi({
      apiBaseUrl: process.env.MAX_API_BASE_URL!,
      accessKey: process.env.MAX_ACCESS_KEY!,
      secretKey: process.env.MAX_SECRET_KEY!,
      quoteCurrency: QUOTE_CURRENCY
    });

    const marketDepth = await maxApiProxy.fetchMarketDepth(TRADING_CURRENCY);
    const lowestSellPrice = marketDepth.getLowestAskPrice();
    logger.info(`Lowest Sell Price: ${lowestSellPrice} ${QUOTE_CURRENCY.toUpperCase()}`);

    const walletBalance = await maxApiProxy.fetchWalletBalance(TRADING_CURRENCY);
    const orderResult = await maxApiProxy.placeOrder({
      currency: TRADING_CURRENCY,
      side: 'buy',
      volume: MIN_TRADING_AMOUNTS[TRADING_CURRENCY],
      price: lowestSellPrice,
    });
    const startTime = Date.now();
    let orderDetail;
    
    while (true) {
        orderDetail = await maxApiProxy.getOrderDetail(orderResult.id);
        logger.info('Order status:', orderDetail.state);
        
        if (orderDetail.state === 'done' || orderDetail.state === 'cancel') {
            break;
        }
        
        if (Date.now() - startTime > ORDER_MONITORING_TIMEOUT_MS) {
            logger.info(`Order monitoring timed out after ${ORDER_MONITORING_TIMEOUT_MS / 1000} seconds`);
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (orderDetail.state === 'done') {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updatedWalletBalance = await maxApiProxy.fetchWalletBalance(TRADING_CURRENCY);
        // round down to prevent deduct the balance more than the actual balance
        const balanceDiff = (Math.floor((updatedWalletBalance - walletBalance) * 10000) / 10000).toFixed(4);

        if (parseFloat(balanceDiff) > 0) {
            const latestPrice = await maxApiProxy.fetchMarketDepth(TRADING_CURRENCY);
            const currentHighestBuy = latestPrice.getHighestBidPrice();
            if (currentHighestBuy === null) {
                throw new Error('No bid prices available in the market');
            }
            logger.info(`Highest Buy Price: ${currentHighestBuy} ${QUOTE_CURRENCY.toUpperCase()}`);

            const sellOrderResult = await maxApiProxy.placeOrder({
              currency: TRADING_CURRENCY,
              side: 'sell',
              volume: parseFloat(balanceDiff),
              price: currentHighestBuy,
            });

            // Monitor sell order status
            const sellStartTime = Date.now();
            let sellOrderDetail;
            
            while (true) {
                sellOrderDetail = await maxApiProxy.getOrderDetail(sellOrderResult.id);
                logger.info('Sell order status:', sellOrderDetail.state);
                
                if (sellOrderDetail.state === 'done' || sellOrderDetail.state === 'cancel') {
                    break;
                }
                
                if (Date.now() - sellStartTime > ORDER_MONITORING_TIMEOUT_MS) {
                    logger.info(`Sell order monitoring timed out after ${ORDER_MONITORING_TIMEOUT_MS / 1000} seconds`);
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