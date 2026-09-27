import { describe, it } from 'node:test';
import assert from 'node:assert';
import { MaxApi } from '../maxExchangeProxy.js';
import type { MaxApiConfig } from '../../config/MaxApiConfig.js';
import type { MaxRawConvertOrder } from '../maxTypes.js';

describe('MaxApi Convert Proxy Abstraction', () => {
    const mockConfig: MaxApiConfig = {
        apiBaseUrl: 'https://max-api.maicoin.com',
        accessKey: 'test-access-key',
        secretKey: 'test-secret-key'
    };

    it('should correctly map raw MAX convert response to domain ConvertOrder abstraction', () => {
        const rawOrder: MaxRawConvertOrder = {
            sn: '6322d9bd-736b-4f19-b862-829e75cae1ce',
            from_currency: 'TWD',
            from_amount: '128.5',
            to_currency: 'USDT',
            to_amount: '4.0000',
            fee: '0.01',
            fee_currency: 'USDT',
            fee_in_twd: '0.32',
            created_at: 1704937708
        };

        const maxApi = new MaxApi(mockConfig);
        const domainOrder = (maxApi as any).convertToDomainConvertOrder(rawOrder);

        assert.strictEqual(domainOrder.id, '6322d9bd-736b-4f19-b862-829e75cae1ce');
        assert.strictEqual(domainOrder.fromCurrency, 'twd');
        assert.strictEqual(domainOrder.fromAmount, 128.5);
        assert.strictEqual(domainOrder.toCurrency, 'usdt');
        assert.strictEqual(domainOrder.toAmount, 4.0);
        assert.strictEqual(domainOrder.fee, 0.01);
        assert.strictEqual(domainOrder.feeCurrency, 'usdt');
        assert.strictEqual(domainOrder.feeInTwd, 0.32);
        assert.strictEqual(domainOrder.createdAt.getTime(), 1704937708 * 1000);
    });
});
