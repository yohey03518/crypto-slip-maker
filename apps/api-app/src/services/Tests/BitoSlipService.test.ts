import { describe, it } from 'node:test';
import assert from 'node:assert';
import { BitoSlipService } from '../BitoSlipService.js';
import { BitoApi } from '../../proxies/bitoExchangeProxy.js';
import { MarketDepthResponse } from '../../types/marketDepth.js';
import { Order } from '../../types/order.js';

describe('BitoSlipService order delays', () => {
    it('should wait 1 second after placing buy and sell orders', async () => {
        const events: Array<{ event: string; timestamp: number }> = [];

        const mockBitoApi = {
            fetchMarketDepth: async (): Promise<MarketDepthResponse> => {
                return new MarketDepthResponse(
                    [{ price: 30.5, amount: 100 }],
                    [{ price: 30.4, amount: 100 }]
                );
            },
            fetchWalletBalance: async (): Promise<number> => {
                // Return higher balance the second time to trigger sell logic
                const callCount = events.filter(e => e.event === 'fetchWalletBalance').length;
                events.push({ event: 'fetchWalletBalance', timestamp: Date.now() });
                return callCount === 0 ? 10.0 : 15.0; 
            },
            placeOrder: async (req: any): Promise<Order> => {
                events.push({ event: `placeOrder:${req.side}`, timestamp: Date.now() });
                return { id: req.side === 'buy' ? 'buy_123' : 'sell_123', status: 'pending' };
            },
            getOrderDetail: async (id: string): Promise<Order> => {
                events.push({ event: `getOrderDetail:${id}`, timestamp: Date.now() });
                return { id, status: 'completed' };
            }
        } as unknown as BitoApi;

        const service = new BitoSlipService(mockBitoApi);
        
        await service.Do();

        // We expect the following sequence of key events:
        // 1. placeOrder:buy
        // 2. getOrderDetail:buy_123
        // 3. placeOrder:sell
        // 4. getOrderDetail:sell_123

        const buyPlaceIndex = events.findIndex(e => e.event === 'placeOrder:buy');
        const buyMonitorIndex = events.findIndex(e => e.event === 'getOrderDetail:buy_123');
        const sellPlaceIndex = events.findIndex(e => e.event === 'placeOrder:sell');
        const sellMonitorIndex = events.findIndex(e => e.event === 'getOrderDetail:sell_123');

        assert.ok(buyPlaceIndex !== -1, 'Should place buy order');
        assert.ok(buyMonitorIndex !== -1, 'Should monitor buy order');
        assert.ok(sellPlaceIndex !== -1, 'Should place sell order');
        assert.ok(sellMonitorIndex !== -1, 'Should monitor sell order');

        const buyDelay = events[buyMonitorIndex].timestamp - events[buyPlaceIndex].timestamp;
        const sellDelay = events[sellMonitorIndex].timestamp - events[sellPlaceIndex].timestamp;

        console.log(`Buy delay: ${buyDelay}ms, Sell delay: ${sellDelay}ms`);

        // Assert that the delay is at least 1000ms (allowing a small buffer for CPU execution, e.g., 950ms)
        assert.ok(buyDelay >= 950, `Buy delay should be >= 1000ms, got ${buyDelay}ms`);
        assert.ok(sellDelay >= 950, `Sell delay should be >= 1000ms, got ${sellDelay}ms`);
    });
});
