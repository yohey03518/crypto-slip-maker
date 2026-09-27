import { TradingCurrency } from '../types.js';

export type CurrencyCode = TradingCurrency | 'twd';

/**
 * Standardized request parameter for convert (flash swap) orders across exchanges
 */
export interface ConvertOrderRequest {
    fromCurrency: CurrencyCode;
    toCurrency: CurrencyCode;
    fromAmount?: number;
    toAmount?: number;
}

/**
 * Standardized domain abstraction for a completed/placed convert order
 */
export interface ConvertOrder {
    id: string;
    fromCurrency: CurrencyCode;
    fromAmount: number;
    toCurrency: CurrencyCode;
    toAmount: number;
    fee: number;
    feeCurrency: CurrencyCode;
    feeInTwd: number;
    createdAt: Date;
}
