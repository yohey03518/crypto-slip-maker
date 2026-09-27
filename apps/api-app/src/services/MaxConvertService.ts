import { Service } from 'typedi';
import { MaxApi } from '../proxies/maxExchangeProxy.js';
import { logger } from '@crypto-slip-maker/shared';

@Service()
export class MaxConvertService {
    private readonly targetUsdtAmount = 4;

    constructor(
        private readonly maxApi: MaxApi
    ) {}

    public async Do(): Promise<void> {
        try {
            logger.info(`Starting Max Convert (閃兌): Converting TWD to ${this.targetUsdtAmount} USDT...`);
            
            // Step 1: 買入 4 USDT from TWD
            const buyConvertOrder = await this.maxApi.createConvertOrder({
                fromCurrency: 'twd',
                toCurrency: 'usdt',
                toAmount: this.targetUsdtAmount
            });

            logger.info(`Buy Convert Order completed: ID=${buyConvertOrder.id}, Spent ${buyConvertOrder.fromAmount} TWD for ${buyConvertOrder.toAmount} USDT (Fee: ${buyConvertOrder.fee} ${buyConvertOrder.feeCurrency})`);

            // 查詢確認訂單資訊
            const buyOrderDetail = await this.maxApi.getConvertOrderDetail(buyConvertOrder.id);
            logger.info(`Buy Convert Order Verified: ID=${buyOrderDetail.id}`);

            // 等待短暫冷卻時間
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Step 2: 將換得的 USDT 賣回 TWD
            const usdtToSell = buyConvertOrder.toAmount;
            logger.info(`Selling ${usdtToSell} USDT back to TWD via Convert (閃兌)...`);

            const sellConvertOrder = await this.maxApi.createConvertOrder({
                fromCurrency: 'usdt',
                toCurrency: 'twd',
                fromAmount: usdtToSell
            });

            logger.info(`Sell Convert Order completed: ID=${sellConvertOrder.id}, Sold ${sellConvertOrder.fromAmount} USDT for ${sellConvertOrder.toAmount} TWD (Fee: ${sellConvertOrder.fee} ${sellConvertOrder.feeCurrency})`);

            const sellOrderDetail = await this.maxApi.getConvertOrderDetail(sellConvertOrder.id);
            logger.info(`Sell Convert Order Verified: ID=${sellOrderDetail.id}`);

            logger.info('MaxConvertService completed successfully');
        } catch (error) {
            logger.error('MaxConvertService failed:', error instanceof Error ? error.message : 'Unknown error');
            throw error;
        }
    }
}
