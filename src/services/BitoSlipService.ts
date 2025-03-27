import { Service } from 'typedi';
import { BitoApi } from '../proxies/bitoExchangeProxy.js';
import { logger } from '../utils/logger.js';
import { Order } from '../types/order.js';

@Service()
export class BitoSlipService {
    private readonly orderMonitoringTimeoutMs = 60000;

    constructor(
        private readonly bitoApi: BitoApi
    ) {}

    private async monitorOrder(orderId: string, startTime: number): Promise<Order> {
        let orderDetail: Order;
        
        while (true) {
            orderDetail = await this.bitoApi.getOrderDetail(parseInt(orderId));
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
        const marketDepth = await this.bitoApi.fetchMarketDepth('usdt');
        logger.info('Market depth:', marketDepth);
        
        const lowestAskPrice = Math.min(...marketDepth.asks.map(ask => ask.price));
        logger.info('Lowest ask price:', lowestAskPrice);
        
        const balance = await this.bitoApi.fetchWalletBalance('usdt');
        logger.info('USDT Balance:', balance);

        const feeRate = 0.0002;
        const buyAmount = 0.252 / lowestAskPrice / feeRate;
        const order = await this.bitoApi.placeOrder({
            currency: 'usdt',
            volume: Math.ceil(buyAmount * 10000) / 10000,
            side: 'buy',
            // todo: use this price for real trading
            // price: Math.ceil((lowestAskPrice + 0.002) * 10000) / 10000,
            price: Math.ceil((lowestAskPrice - 0.2) * 10000) / 10000,
        });
        logger.info('Order:', order);
    }
} 