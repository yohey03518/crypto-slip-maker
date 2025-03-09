import { Service } from 'typedi';
import { TradingCurrency } from '../types.js';

@Service()
export class MaxApiConfig {
    readonly apiBaseUrl: string;
    readonly accessKey: string;
    readonly secretKey: string;
    readonly quoteCurrency: string;
    readonly tradingCurrency: TradingCurrency;
    readonly orderMonitoringTimeoutMs: number;

    constructor() {
        if (!process.env.MAX_API_BASE_URL || !process.env.MAX_ACCESS_KEY || !process.env.MAX_SECRET_KEY) {
            throw new Error('Missing required MAX API environment variables');
        }

        this.apiBaseUrl = process.env.MAX_API_BASE_URL;
        this.accessKey = process.env.MAX_ACCESS_KEY;
        this.secretKey = process.env.MAX_SECRET_KEY;
        this.quoteCurrency = 'twd';
        this.tradingCurrency = 'usdt';
        this.orderMonitoringTimeoutMs = 60000;
    }
} 