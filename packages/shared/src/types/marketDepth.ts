/**
 * Represents a single price level in the order book with its price and amount
 */
export type PriceLevel = {
    price: number;
    amount: number;
}

/**
 * Market depth response class that can be used across different exchanges.
 * Provides utility methods for common market depth operations.
 */
export class MarketDepthResponse {
    constructor(
        /**
         * Array of ask (sell) orders
         */
        public readonly asks: PriceLevel[],
        
        /**
         * Array of bid (buy) orders
         */
        public readonly bids: PriceLevel[]
    ) {}

    /**
     * Gets the lowest asking price from the order book
     * @returns The lowest sell price, or null if no asks available
     */
    getLowestAskPrice(): number {
        return Math.min(...this.asks.map(ask => ask.price));
    }

    /**
     * Gets the highest bid price from the order book
     * @returns The highest buy price, or null if no bids available
     */
    getHighestBidPrice(): number {
        return Math.max(...this.bids.map(bid => bid.price));
    }
} 