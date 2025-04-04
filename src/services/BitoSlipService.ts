import { Service } from 'typedi';
import { BitoApi } from '../proxies/bitoExchangeProxy.js';
import { logger } from '../utils/logger.js';
import { Order } from '../types/order.js';
import { TradingCurrency } from '../types.js';
@Service()
export class BitoSlipService {
    private readonly orderMonitoringTimeoutMs = 60000;
    private readonly tradingCurrency: TradingCurrency = 'usdt';

    constructor(
        private readonly bitoApi: BitoApi
    ) {}

    private async monitorOrder(orderId: string, startTime: number): Promise<Order> {
        let orderDetail: Order;
        
        while (true) {
            orderDetail = await this.bitoApi.getOrderDetail(orderId, this.tradingCurrency);
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
        const marketDepth = await this.bitoApi.fetchMarketDepth(this.tradingCurrency);
        logger.info('Market depth:', marketDepth);
        
        const lowestAskPrice = Math.min(...marketDepth.asks.map(ask => ask.price));
        logger.info('Lowest ask price:', lowestAskPrice);
        
        const initBalance = await this.bitoApi.fetchWalletBalance(this.tradingCurrency);
        logger.info(`${this.tradingCurrency.toUpperCase()} Balance:`, initBalance);

        const feeRate = 0.002;
        const expectedBuyFee = 0.251;
        const buyAmount = expectedBuyFee / lowestAskPrice / feeRate;
        const order = await this.bitoApi.placeOrder({
            currency: this.tradingCurrency,
            volume: Math.ceil(buyAmount * 10000) / 10000,
            side: 'buy',
            price: Math.ceil((lowestAskPrice + 0.002) * 1000) / 1000,
        });
        logger.info('Order:', order);

        const orderDetail = await this.monitorOrder(order.id, Date.now());
        logger.info('Order detail:', orderDetail);

        if (orderDetail.status === 'completed') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const updatedBalance = await this.bitoApi.fetchWalletBalance(this.tradingCurrency);
            const balanceDiff = (Math.floor((updatedBalance - initBalance) * 10000) / 10000).toFixed(4);

            if (parseFloat(balanceDiff) > 0) {
                const latestMarketDepth = await this.bitoApi.fetchMarketDepth(this.tradingCurrency);
                const highestBidPrice = Math.max(...latestMarketDepth.bids.map(bid => bid.price));
                logger.info('Highest bid price:', highestBidPrice);

                const sellOrder = await this.bitoApi.placeOrder({
                    currency: this.tradingCurrency,
                    volume: parseFloat(balanceDiff),
                    side: 'sell',
                    price: Math.floor(highestBidPrice * 1000) / 1000,
                });
                logger.info('Sell order:', sellOrder);

                const sellOrderDetail = await this.monitorOrder(sellOrder.id, Date.now());
                logger.info('Sell order detail:', sellOrderDetail);
            } else {
                logger.info(`No ${this.tradingCurrency.toUpperCase()} balance difference detected to sell`);
            }
        }

        logger.info('Task completed');
    }
} 