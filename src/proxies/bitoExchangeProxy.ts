import axios, { AxiosError } from 'axios';
import { createHmac } from 'crypto';
import * as qs from 'qs';
import { OrderRequest, TradingCurrency } from '../types.js';
import { 
    BitoMarketDepthResponse,
    BitoOrderRequest,
    BitoOrderDetail,
    BitoWalletBalanceItem
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

    private generateAuthHeaders(payloadObj: Record<string, any>): Record<string, string> {
        // TODO: Implement Bito-specific authentication
        return {};
    }

    async fetchMarketDepth(currency: TradingCurrency): Promise<MarketDepthResponse> {
        // TODO: Implement Bito-specific market depth fetching
        return new MarketDepthResponse([], []);
    }

    async fetchWalletBalance(currency: TradingCurrency): Promise<number> {
        // TODO: Implement Bito-specific wallet balance fetching
        return 0;
    }

    private mapOrderState(state: BitoOrderDetail['state']): Status {
        switch (state) {
            case 'completed':
                return 'completed';
            case 'cancelled':
                return 'cancelled';
            case 'pending':
                return 'pending';
            default:
                return 'other';
        }
    }

    private convertToOrder(bitoOrder: BitoOrderDetail): Order {
        return {
            id: bitoOrder.id.toString(),
            status: this.mapOrderState(bitoOrder.state)
        };
    }

    async placeOrder(orderRequest: OrderRequest): Promise<Order> {
        // TODO: Implement Bito-specific order placement
        throw new Error('Not implemented');
    }

    async getOrderDetail(orderId: number): Promise<Order> {
        // TODO: Implement Bito-specific order detail fetching
        throw new Error('Not implemented');
    }

    private handleApiError(message: string, error: unknown): void {
        if (error instanceof Error) {
            logger.error(`${message}: ${error.message}`);
        } else {
            logger.error(`${message}: Unknown error`);
        }
    }
} 