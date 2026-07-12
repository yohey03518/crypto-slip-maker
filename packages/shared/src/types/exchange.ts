import { TradingCurrency, OrderRequest } from '../types.js';
import { MarketDepthResponse } from './marketDepth.js';
import { Order } from './order.js';

/**
 * Interface defining the contract for cryptocurrency exchange APIs
 */
export interface ExchangeApi {
    /**
     * Fetches the current market depth (order book) for a given currency pair
     * @param currency The base currency to fetch market depth for
     * @returns Promise resolving to standardized market depth response
     */
    fetchMarketDepth(currency: TradingCurrency): Promise<MarketDepthResponse>;

    /**
     * Fetches the current wallet balance for a specific currency
     * @param currency The currency to fetch balance for
     * @returns Promise resolving to the balance amount as a number
     */
    fetchWalletBalance(currency: TradingCurrency): Promise<number>;

    /**
     * Places a new order on the exchange
     * @param orderRequest The order details including currency, side, volume, and price
     * @returns Promise resolving to standardized order response
     */
    placeOrder(orderRequest: OrderRequest): Promise<Order>;

    /**
     * Fetches the details of a specific order
     * @param orderId The ID of the order to fetch details for
     * @param currency The currency of the order
     * @returns Promise resolving to standardized order response
     */
    getOrderDetail(orderId: string, currency: TradingCurrency): Promise<Order>;
} 