import { Service } from 'typedi';
import { TradingCurrency } from '../types.js';

@Service()
export class BitoApiConfig {
    readonly apiBaseUrl: string;
    readonly quoteCurrency: string;
    readonly tradingCurrency: TradingCurrency;
    readonly orderMonitoringTimeoutMs: number;
    readonly accessKey: string;
    readonly secretKey: string;

    constructor() {
        this.apiBaseUrl = process.env.BITO_API_BASE_URL || 'https://api.bitopro.com/v3';
        this.quoteCurrency = 'twd';
        this.tradingCurrency = 'usdt';
        this.orderMonitoringTimeoutMs = 60000;
        
        const accessKey = process.env.BITO_API_ACCESS_KEY;
        const secretKey = process.env.BITO_API_SECRET_KEY;
        
        if (!accessKey || !secretKey) {
            throw new Error('BITO_API_ACCESS_KEY and BITO_API_SECRET_KEY must be set in environment variables');
        }
        
        this.accessKey = accessKey;
        this.secretKey = secretKey;
    }
} 