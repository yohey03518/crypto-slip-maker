import { describe, it, mock } from 'node:test';
import assert from 'node:assert';
import { MaxConvertService } from '../MaxConvertService.js';
import type { MaxApi } from '../../proxies/maxExchangeProxy.js';
import type { ConvertOrder } from '@crypto-slip-maker/shared';

describe('MaxConvertService', () => {
    it('should convert TWD to 4 USDT and then convert received USDT back to TWD', async () => {
        const buyResult: ConvertOrder = {
            id: 'sn-buy-123',
            fromCurrency: 'twd',
            fromAmount: 128.5,
            toCurrency: 'usdt',
            toAmount: 4,
            fee: 0.01,
            feeCurrency: 'usdt',
            feeInTwd: 0.32,
            createdAt: new Date()
        };

        const sellResult: ConvertOrder = {
            id: 'sn-sell-123',
            fromCurrency: 'usdt',
            fromAmount: 4,
            toCurrency: 'twd',
            toAmount: 128.2,
            fee: 0.01,
            feeCurrency: 'twd',
            feeInTwd: 0.01,
            createdAt: new Date()
        };

        const mockCreateConvertOrder = mock.fn(async (req: any) => {
            if (req.fromCurrency === 'twd' && req.toCurrency === 'usdt') {
                return buyResult;
            }
            if (req.fromCurrency === 'usdt' && req.toCurrency === 'twd') {
                return sellResult;
            }
            throw new Error('Unexpected parameters');
        });

        const mockGetConvertOrderDetail = mock.fn(async (id: string) => {
            return id === 'sn-buy-123' ? buyResult : sellResult;
        });

        const mockMaxApi = {
            createConvertOrder: mockCreateConvertOrder,
            getConvertOrderDetail: mockGetConvertOrderDetail
        } as unknown as MaxApi;

        const service = new MaxConvertService(mockMaxApi);
        await service.Do();

        assert.strictEqual(mockCreateConvertOrder.mock.callCount(), 2);
        
        // Buy verification
        const firstCall = mockCreateConvertOrder.mock.calls[0].arguments[0];
        assert.deepStrictEqual(firstCall, {
            fromCurrency: 'twd',
            toCurrency: 'usdt',
            toAmount: 4
        });

        // Sell verification
        const secondCall = mockCreateConvertOrder.mock.calls[1].arguments[0];
        assert.deepStrictEqual(secondCall, {
            fromCurrency: 'usdt',
            toCurrency: 'twd',
            fromAmount: 4
        });

        // Verification query calls
        assert.strictEqual(mockGetConvertOrderDetail.mock.callCount(), 2);
        assert.strictEqual(mockGetConvertOrderDetail.mock.calls[0].arguments[0], 'sn-buy-123');
        assert.strictEqual(mockGetConvertOrderDetail.mock.calls[1].arguments[0], 'sn-sell-123');
    });
});
