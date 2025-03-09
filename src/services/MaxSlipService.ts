import { Service } from 'typedi';
import { MaxApi } from '../proxies/maxExchangeProxy.js';
import { logger } from '../utils/logger.js';
import { Order } from '../types/order.js';

@Service()
export class MaxSlipService {
    private readonly orderMonitoringTimeoutMs = 60000;

    constructor(
        private readonly maxApi: MaxApi
    ) {}

    private async monitorOrder(orderId: string, startTime: number): Promise<Order> {
        let orderDetail: Order;
        
        while (true) {
            orderDetail = await this.maxApi.getOrderDetail(parseInt(orderId));
            logger.info('Order status:', orderDetail.status);
            
            if (orderDetail.status === 'completed' || orderDetail.status === 'cancelled') {
                break;
            }
            
            if (Date.now() - startTime > this.orderMonitoringTimeoutMs) {
                logger.info(`Order monitoring timed out after ${this.orderMonitoringTimeoutMs / 1000} seconds`);
                break;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return orderDetail;
    }

    public async Do(): Promise<void> {
        try {
            const tradingCurrency = 'usdt';
            const marketDepth = await this.maxApi.fetchMarketDepth(tradingCurrency);
            const lowestSellPrice = marketDepth.getLowestAskPrice();
            logger.info(`Lowest Sell Price: ${lowestSellPrice}`);

            const walletBalance = await this.maxApi.fetchWalletBalance(tradingCurrency);
            const orderResult = await this.maxApi.placeOrder({
                currency: tradingCurrency,
                side: 'buy',
                volume: 8.02, // Minimum trading amount for USDT
                price: lowestSellPrice,
            });

            const orderDetail = await this.monitorOrder(orderResult.id, Date.now());

            if (orderDetail.status === 'completed') {
                await new Promise(resolve => setTimeout(resolve, 1000));
                const updatedWalletBalance = await this.maxApi.fetchWalletBalance(tradingCurrency);
                const balanceDiff = (Math.floor((updatedWalletBalance - walletBalance) * 10000) / 10000).toFixed(4);

                if (parseFloat(balanceDiff) > 0) {
                    const latestPrice = await this.maxApi.fetchMarketDepth(tradingCurrency);
                    const currentHighestBuy = latestPrice.getHighestBidPrice();
                    if (currentHighestBuy === null) {
                        throw new Error('No bid prices available in the market');
                    }
                    logger.info(`Highest Buy Price: ${currentHighestBuy}`);

                    const sellOrderResult = await this.maxApi.placeOrder({
                        currency: tradingCurrency,
                        side: 'sell',
                        volume: parseFloat(balanceDiff),
                        price: currentHighestBuy,
                    });

                    const sellOrderDetail = await this.monitorOrder(sellOrderResult.id, Date.now());
                    logger.info('Final sell order details:', JSON.stringify(sellOrderDetail, null, 2));
                } else {
                    logger.info(`No ${tradingCurrency.toUpperCase()} balance difference detected to sell`);
                }
            }

            logger.info('Task completed');
        } catch (error) {
            logger.error('MaxSlipService failed:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
} 