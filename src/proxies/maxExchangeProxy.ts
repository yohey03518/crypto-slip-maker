import axios, { AxiosError } from 'axios';
import { createHmac } from 'crypto';
import * as qs from 'qs';
import { TradingCurrency } from '../types.js';
import { MaxApiConfig, MaxMarketDepthResponse } from './maxTypes.js';
import { logger } from '../utils/logger.js';
import { setupMaxApiInterceptors } from './maxApiInterceptor.js';

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

export class MaxApi {
    private readonly config: MaxApiConfig;
    private readonly axiosInstance;

    constructor(config: MaxApiConfig) {
        this.config = config;
        this.axiosInstance = axios.create({
            baseURL: this.config.apiBaseUrl
        });
        setupMaxApiInterceptors(this.axiosInstance);
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

    async fetchMarketDepth(currency: TradingCurrency): Promise<MaxMarketDepthResponse> {
        try {
            const market = `${currency.toLowerCase()}twd`;
            
            const response = await this.axiosInstance.get<MaxMarketDepthResponse>(
                '/api/v3/depth',
                {
                    params: {
                        market,
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

    async fetchWalletBalance(currency: TradingCurrency): Promise<Array<{
        currency: string;
        balance: string;
        locked: string;
        staked: string;
        principal: string;
        interest: string;
    }>> {
        try {
            const path = '/api/v3/wallet/spot/accounts';
            const payloadObj = {
                nonce: Date.now(),
                path,
                currency: currency
            };
            
            const response = await this.axiosInstance.get(
                path,
                { 
                    params: payloadObj,
                    headers: this.generateAuthHeaders(payloadObj)
                }
            );
            
            return response.data;
        } catch (error) {
            this.handleApiError('Error fetching wallet balance', error);
            throw error;
        }
    }

    async placeOrder(orderRequest: MaxOrderRequest): Promise<MaxOrderResponse> {
        try {
            const path = '/api/v3/wallet/spot/order';
            const payloadObj = {
                nonce: Date.now(),
                path,
                ...orderRequest
            };
            
            const response = await this.axiosInstance.post<MaxOrderResponse>(
                path,
                payloadObj,
                { 
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.generateAuthHeaders(payloadObj)
                    }
                }
            );
            
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
            
            const response = await this.axiosInstance.get<MaxOrderDetail>(
                path,
                { 
                    params: payloadObj,
                    headers: this.generateAuthHeaders(payloadObj)
                }
            );
            
            return response.data;
        } catch (error) {
            this.handleApiError('Error fetching order detail', error);
            throw error;
        }
    }

    private handleApiError(message: string, error: unknown): void {
        if (error instanceof Error) {
            logger.error(`${message}: ${error.message}`);
        } else {
            logger.error(`${message}: Unknown error`);
        }
    }
} 