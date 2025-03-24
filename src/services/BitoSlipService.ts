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
        // Implementation will be added later
    }
} 