import axios, { AxiosError } from 'axios';
import { createHmac } from 'crypto';
import * as qs from 'qs';
import { MaxApiConfig, MaxMarketDepthResponse } from '../types.js';
import { logger } from '../utils/logger.js';

interface MaxOrderRequest {
    market: string;
    side: 'buy' | 'sell';
    volume: string;
    price?: string;
    client_oid?: string;
    stop_price?: string;
    ord_type: 'limit' | 'market' | 'stop_limit' | 'stop_market' | 'post_only' | 'ioc_limit';
    group_id?: number;
}

interface MaxOrderResponse {
    id: number;
    wallet_type: string;
    market: string;
    client_oid: string;
    group_id: number;
    side: 'buy' | 'sell';
    state: string;
    ord_type: string;
    price: string;
    stop_price: string;
    avg_price: string;
    volume: string;
    remaining_volume: string;
    executed_volume: string;
    trades_count: number;
    created_at: number;
    updated_at: number;
}

interface MaxOrderDetail {
    id: number;
    wallet_type: string;
    market: string;
    client_oid: string;
    group_id: number;
    side: 'buy' | 'sell';
    state: 'wait' | 'done' | 'cancel' | 'convert';
    ord_type: string;
    price: string;
    stop_price: string;
    avg_price: string;
    volume: string;
    remaining_volume: string;
    executed_volume: string;
    trades_count: number;
    created_at: number;
    updated_at: number;
}

export class MaxApiService {
    private readonly config: MaxApiConfig;

    constructor(config: MaxApiConfig) {
        this.config = config;
    }

    private generateAuthHeaders(payloadObj: Record<string, any>): Record<string, string> {
        const payloadStr = Buffer.from(JSON.stringify(payloadObj)).toString('base64');
        const signature = createHmac('sha256', this.config.secretKey)
            .update(payloadStr)
            .digest('hex');

        return {
            'X-MAX-ACCESSKEY': this.config.accessKey,
            'X-MAX-PAYLOAD': payloadStr,
            'X-MAX-SIGNATURE': signature
        };
    }

    async fetchUSDTPrice(): Promise<MaxMarketDepthResponse> {
        try {
            logger.info('Starting price fetch...');
            
            const response = await axios.get<MaxMarketDepthResponse>(
                `${this.config.apiBaseUrl}/api/v3/depth`,
                {
                    params: {
                        market: 'usdttwd',
                        limit: 5
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            this.handleApiError('Error fetching price', error);
            throw error;
        }
    }

    private handleApiError(message: string, error: unknown): void {
        if (error instanceof AxiosError) {
            logger.error(`${message}: ${error.message}`);
            logger.error('Response body:', error.response?.data);
        } else if (error instanceof Error) {
            logger.error(`${message}: ${error.message}`);
        } else {
            logger.error(`${message}: Unknown error`);
        }
    }
    async fetchWalletBalance(): Promise<Array<{
        currency: string;
        balance: string;
        locked: string;
        staked: string;
        principal: string;
        interest: string;
    }>> {
        try {
            logger.info('Fetching wallet balance...');
            
            const path = '/api/v3/wallet/spot/accounts';
            const payloadObj = {
                nonce: Date.now(),
                path,
                currency: 'usdt'
            };
            
            const response = await axios.get(
                `${this.config.apiBaseUrl}${path}?${qs.stringify(payloadObj, {arrayFormat: 'brackets'})}`,
                { headers: this.generateAuthHeaders(payloadObj) }
            );
            
            return response.data;
        } catch (error) {
            this.handleApiError('Error fetching wallet balance', error);
            throw error;
        }
    }

    async placeOrder(orderRequest: MaxOrderRequest): Promise<MaxOrderResponse> {
        try {
            logger.info('Placing order...');
            
            const path = '/api/v3/wallet/spot/order';
            const payloadObj = {
                nonce: Date.now(),
                path,
                ...orderRequest
            };
            
            const response = await axios.post<MaxOrderResponse>(
                `${this.config.apiBaseUrl}${path}`,
                payloadObj,
                { 
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.generateAuthHeaders(payloadObj)
                    }
                }
            );
            
            logger.info('Order placed successfully');
            return response.data;
        } catch (error) {
            this.handleApiError('Error placing order', error);
            throw error;
        }
    }

    async getOrderDetail(orderId: number): Promise<MaxOrderDetail> {
        try {
            const path = '/api/v3/order';
            const payloadObj = {
                nonce: Date.now(),
                path,
                id: orderId
            };
            
            const response = await axios.get<MaxOrderDetail>(
                `${this.config.apiBaseUrl}${path}?${qs.stringify(payloadObj, {arrayFormat: 'brackets'})}`,
                { headers: this.generateAuthHeaders(payloadObj) }
            );
            
            return response.data;
        } catch (error) {
            this.handleApiError('Error fetching order detail', error);
            throw error;
        }
    }
} 