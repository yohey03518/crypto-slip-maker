import axios, { AxiosError } from 'axios';
import { createHmac } from 'crypto';
import * as qs from 'qs';
import { OrderRequest, TradingCurrency } from '../types.js';
import { MaxApiConfig, MaxMarketDepthResponse } from './maxTypes.js';
import { logger } from '../utils/logger.js';
import { setupMaxApiInterceptors } from './maxApiInterceptor.js';
import { MarketDepthResponse, PriceLevel } from '../types/marketDepth.js';

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

interface WalletBalanceItem {
    currency: string;
    balance: string;
    locked: string;
    staked: string;
    principal: string;
    interest: string;
}

export class MaxApi {
    private readonly config: MaxApiConfig;
    private readonly axiosInstance;
    private readonly quoteCurrency: string;

    constructor(config: MaxApiConfig) {
        this.config = config;
        this.axiosInstance = axios.create({
            baseURL: this.config.apiBaseUrl
        });
        setupMaxApiInterceptors(this.axiosInstance);
        this.quoteCurrency = config.quoteCurrency.toLowerCase();
    }

    private getMarketPair(baseCurrency: TradingCurrency): string {
        return `${baseCurrency.toLowerCase()}${this.quoteCurrency}`;
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

    async fetchMarketDepth(currency: TradingCurrency): Promise<MarketDepthResponse> {
        try {
            const market = this.getMarketPair(currency);
            
            const response = await this.axiosInstance.get<MaxMarketDepthResponse>(
                '/api/v3/depth',
                {
                    params: {
                        market,
                        limit: 5
                    }
                }
            );
            
            // Convert string arrays from MaxMarketDepthResponse to PriceLevel objects
            const asks: PriceLevel[] = response.data.asks.map(([price, amount]) => ({
                price: parseFloat(price),
                amount: parseFloat(amount)
            }));
            
            const bids: PriceLevel[] = response.data.bids.map(([price, amount]) => ({
                price: parseFloat(price),
                amount: parseFloat(amount)
            }));

            return new MarketDepthResponse(asks, bids);
        } catch (error) {
            this.handleApiError('Error fetching price', error);
            throw error;
        }
    }

    async fetchWalletBalance(currency: TradingCurrency): Promise<number> {
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
            
            const balance = response.data.find((b: WalletBalanceItem) => b.currency === currency)?.balance || '0';
            return parseFloat(balance);
        } catch (error) {
            this.handleApiError('Error fetching wallet balance', error);
            throw error;
        }
    }

    async placeOrder(orderRequest: OrderRequest): Promise<MaxOrderResponse> {
        try {
            const maxOrderRequest = {
                market: this.getMarketPair(orderRequest.currency),
                side: orderRequest.side,
                volume: orderRequest.volume.toString(),
                price: orderRequest.price.toString(),
                ord_type: 'limit' as const
            };

            const path = '/api/v3/wallet/spot/order';
            const payloadObj = {
                nonce: Date.now(),
                path,
                ...maxOrderRequest
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