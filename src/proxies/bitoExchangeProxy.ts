import axios, { AxiosError } from 'axios';
import { createHmac } from 'crypto';
import * as qs from 'qs';
import { OrderRequest, TradingCurrency } from '../types.js';
import { 
    BitoMarketDepthResponse,
    BitoOrderRequest,
    BitoOrderDetail,
    BitoWalletBalanceItem,
    BitoWalletBalanceResponse,
    BitoOrderStatus
} from './bitoTypes.js';
import { logger } from '../utils/logger.js';
import { setupApiInterceptors } from './apiInterceptor.js';
import { MarketDepthResponse, PriceLevel } from '../types/marketDepth.js';
import { Order, Status } from '../types/order.js';
import { ExchangeApi } from '../types/exchange.js';
import { Service } from 'typedi';
import { BitoApiConfig } from '../config/BitoApiConfig.js';

@Service()
export class BitoApi implements ExchangeApi {
    private readonly axiosInstance;
    private readonly quoteCurrency: string;

    constructor(private readonly config: BitoApiConfig) {
        this.axiosInstance = axios.create({
            baseURL: this.config.apiBaseUrl
        });
        setupApiInterceptors(this.axiosInstance, 'BITO');
        this.quoteCurrency = config.quoteCurrency.toLowerCase();
    }

    private getMarketPair(baseCurrency: TradingCurrency): string {
        return `${baseCurrency.toLowerCase()}${this.quoteCurrency}`;
    }

    private generateAuthHeaders(payloadObj: Record<string, any>, method: 'GET' | 'POST'): Record<string, string> {
        const payload = method === 'GET' ? {
            ...payloadObj,
            nonce: Date.now()
        } : {
            ...payloadObj,
        };
        
        const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
        const signature = createHmac('sha384', this.config.secretKey)
            .update(payloadStr)
            .digest('hex');

        return {
            'X-BITOPRO-APIKEY': this.config.accessKey,
            'X-BITOPRO-PAYLOAD': payloadStr,
            'X-BITOPRO-SIGNATURE': signature
        };
    }

    async fetchMarketDepth(currency: TradingCurrency): Promise<MarketDepthResponse> {
        try {
            const response = await this.axiosInstance.get<BitoMarketDepthResponse>(
                `/order-book/${currency}_${this.quoteCurrency}?limit=5`
            );
            
            // Convert response data to PriceLevel objects
            const asks: PriceLevel[] = response.data.asks.map(level => ({
                price: parseFloat(level.price),
                amount: parseFloat(level.amount)
            }));
            
            const bids: PriceLevel[] = response.data.bids.map(level => ({
                price: parseFloat(level.price),
                amount: parseFloat(level.amount)
            }));

            return new MarketDepthResponse(asks, bids);
        } catch (error) {
            this.handleApiError('Error fetching market depth', error);
            throw error;
        }
    }

    async fetchWalletBalance(currency: TradingCurrency): Promise<number> {
        try {
            const path = '/accounts/balance';
            const payloadObj = {
                path
            };
            
            const response = await this.axiosInstance.get<BitoWalletBalanceResponse>(
                path,
                { 
                    headers: this.generateAuthHeaders(payloadObj, 'GET')
                }
            );
            
            const balance = response.data.data.find((b: BitoWalletBalanceItem) => b.currency.toLowerCase() === currency.toLowerCase())?.available || '0';
            return parseFloat(balance);
        } catch (error) {
            this.handleApiError('Error fetching wallet balance', error);
            throw error;
        }
    }

    private mapOrderState(state: BitoOrderStatus): Status {
        switch (state) {
            case BitoOrderStatus.Completed:
                return 'completed';
            case BitoOrderStatus.Cancelled:
                return 'cancelled';
            case BitoOrderStatus.InProgress:
                return 'pending';
            default:
                return 'other';
        }
    }

    private convertToOrder(bitoOrder: BitoOrderDetail): Order {
        return {
            id: bitoOrder.id.toString(),
            status: this.mapOrderState(bitoOrder.status)
        };
    }

    async placeOrder(orderRequest: OrderRequest): Promise<Order> {
        try {
            const path = `/orders/${orderRequest.currency}_${this.quoteCurrency}`;
            const payloadObj = {
                action: orderRequest.side.toUpperCase(),
                amount: orderRequest.volume.toString(),
                price: orderRequest.price.toString(),
                type: 'LIMIT',
                timestamp: Date.now(),
                path
            };

            const response = await this.axiosInstance.post(
                path,
                payloadObj,
                {
                    headers: this.generateAuthHeaders(payloadObj, 'POST')
                }
            );

            return {
                id: response.data.orderId.toString(),
                status: 'pending'
            };
        } catch (error) {
            this.handleApiError('Error placing order', error);
            throw error;
        }
    }

    async getOrderDetail(orderId: string): Promise<Order> {
        try {
            const path = `/orders/usdt_twd/${orderId}`;
            const payloadObj = {
                path
            };

            const response = await this.axiosInstance.get<BitoOrderDetail>(
                path,
                {
                    headers: this.generateAuthHeaders(payloadObj, 'GET')
                }
            );

            return this.convertToOrder(response.data);
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