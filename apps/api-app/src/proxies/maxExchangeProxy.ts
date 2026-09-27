import axios, { AxiosError } from 'axios';
import { createHmac } from 'crypto';
import * as qs from 'qs';
import { OrderRequest, TradingCurrency, logger, setupApiInterceptors, MarketDepthResponse, PriceLevel, Order, Status, ExchangeApi, ConvertOrderRequest, ConvertOrder, CurrencyCode } from '@crypto-slip-maker/shared';
import { 
    MaxMarketDepthResponse,
    MaxOrderRequest,
    MaxOrderDetail,
    MaxWalletBalanceItem,
    MaxRawConvertOrder
} from './maxTypes.js';
import { Service } from 'typedi';
import { MaxApiConfig } from '../config/MaxApiConfig.js';

@Service()
export class MaxApi implements ExchangeApi {
    private readonly axiosInstance;
    private readonly quoteCurrency: string;

    constructor(private readonly config: MaxApiConfig) {
        this.axiosInstance = axios.create({
            baseURL: this.config.apiBaseUrl
        });
        setupApiInterceptors(this.axiosInstance, 'MAX');
        this.quoteCurrency = process.env.QUOTE_CURRENCY!;
    }

    private getMarketPair(baseCurrency: TradingCurrency): string {
        return `${baseCurrency.toLowerCase()}${this.quoteCurrency.toLowerCase()}`;
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
            
            const balance = response.data.find((b: MaxWalletBalanceItem) => b.currency === currency)?.balance || '0';
            return parseFloat(balance);
        } catch (error) {
            this.handleApiError('Error fetching wallet balance', error);
            throw error;
        }
    }

    /**
     * Maps MAX exchange specific order states to standardized Status
     */
    private mapOrderState(state: MaxOrderDetail['state']): Status {
        switch (state) {
            case 'done':
                return 'completed';
            case 'cancel':
                return 'cancelled';
            case 'wait':
                return 'pending';
            default:
                return 'other';
        }
    }

    /**
     * Converts MAX order detail to standardized Order type
     */
    private convertToOrder(maxOrder: MaxOrderDetail): Order {
        return {
            id: maxOrder.id.toString(),
            status: this.mapOrderState(maxOrder.state)
        };
    }

    async placeOrder(orderRequest: OrderRequest): Promise<Order> {
        try {
            const maxOrderRequest = {
                market: this.getMarketPair(orderRequest.currency),
                side: orderRequest.side,
                volume: orderRequest.volume.toString(),
                // price: orderRequest.price.toString(),
                ord_type: 'market' as const
            };

            const path = '/api/v3/wallet/spot/order';
            const payloadObj = {
                nonce: Date.now(),
                path,
                ...maxOrderRequest
            };
            
            const response = await this.axiosInstance.post<MaxOrderDetail>(
                path,
                payloadObj,
                { 
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.generateAuthHeaders(payloadObj)
                    }
                }
            );
            
            return this.convertToOrder(response.data);
        } catch (error) {
            this.handleApiError('Error placing order', error);
            throw error;
        }
    }

    async getOrderDetail(orderId: string, currency: TradingCurrency): Promise<Order> {
        try {
            const path = '/api/v3/order';
            const payloadObj = {
                nonce: Date.now(),
                path,
                id: parseInt(orderId)
            };
            
            const response = await this.axiosInstance.get<MaxOrderDetail>(
                path,
                { 
                    params: payloadObj,
                    headers: this.generateAuthHeaders(payloadObj)
                }
            );
            
            return this.convertToOrder(response.data);
        } catch (error) {
            this.handleApiError('Error fetching order detail', error);
            throw error;
        }
    }

    /**
     * Converts raw MAX Convert order response to domain ConvertOrder abstraction
     */
    private convertToDomainConvertOrder(raw: MaxRawConvertOrder): ConvertOrder {
        return {
            id: raw.sn,
            fromCurrency: raw.from_currency.toLowerCase() as CurrencyCode,
            fromAmount: parseFloat(raw.from_amount),
            toCurrency: raw.to_currency.toLowerCase() as CurrencyCode,
            toAmount: parseFloat(raw.to_amount),
            fee: parseFloat(raw.fee),
            feeCurrency: raw.fee_currency.toLowerCase() as CurrencyCode,
            feeInTwd: parseFloat(raw.fee_in_twd),
            createdAt: new Date(raw.created_at * 1000)
        };
    }

    async createConvertOrder(request: ConvertOrderRequest): Promise<ConvertOrder> {
        try {
            const path = '/api/v3/convert';
            const payloadObj: Record<string, any> = {
                nonce: Date.now(),
                path,
                from_currency: request.fromCurrency.toLowerCase(),
                to_currency: request.toCurrency.toLowerCase()
            };

            if (request.fromAmount !== undefined) {
                payloadObj.from_amount = request.fromAmount.toString();
            }
            if (request.toAmount !== undefined) {
                payloadObj.to_amount = request.toAmount.toString();
            }

            const response = await this.axiosInstance.post<MaxRawConvertOrder>(
                path,
                payloadObj,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        ...this.generateAuthHeaders(payloadObj)
                    }
                }
            );

            return this.convertToDomainConvertOrder(response.data);
        } catch (error) {
            this.handleApiError('Error creating convert order', error);
            throw error;
        }
    }

    async getConvertOrderDetail(id: string): Promise<ConvertOrder> {
        try {
            const path = '/api/v3/convert';
            const payloadObj = {
                nonce: Date.now(),
                path,
                sn: id
            };

            const response = await this.axiosInstance.get<MaxRawConvertOrder>(
                path,
                {
                    params: payloadObj,
                    headers: this.generateAuthHeaders(payloadObj)
                }
            );

            return this.convertToDomainConvertOrder(response.data);
        } catch (error) {
            this.handleApiError('Error fetching convert order detail', error);
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