import { Service } from 'typedi';
import { TradingCurrency } from '../types.js';

@Service()
export class BitoApiConfig {
    readonly apiBaseUrl: string;
    readonly accessKey: string;
    readonly secretKey: string;
    readonly quoteCurrency: string;
    readonly tradingCurrency: TradingCurrency;
    readonly orderMonitoringTimeoutMs: number;

    constructor() {
        if (!process.env.BITO_API_BASE_URL || !process.env.BITO_ACCESS_KEY || !process.env.BITO_SECRET_KEY) {
            throw new Error('Missing required BITO API environment variables');
        }

        this.apiBaseUrl = process.env.BITO_API_BASE_URL;
        this.accessKey = process.env.BITO_ACCESS_KEY;
        this.secretKey = process.env.BITO_SECRET_KEY;
        this.quoteCurrency = 'twd';
        this.tradingCurrency = 'usdt';
        this.orderMonitoringTimeoutMs = 60000;
    }
} 