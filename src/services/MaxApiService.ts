import axios, { AxiosError } from 'axios';
import { createHmac } from 'crypto';
import * as qs from 'qs';
import { MaxApiConfig, MaxMarketDepthResponse, MaxUserInfoResponse } from '../types.js';
import { logger } from '../utils/logger.js';

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

    async fetchUserInfo(): Promise<MaxUserInfoResponse> {
        try {
            logger.info('Fetching user info...');
            
            const payloadObj = {
                nonce: Date.now(),
                path: '/api/v3/info',
            };
            
            const response = await axios.get<MaxUserInfoResponse>(
                `${this.config.apiBaseUrl}/api/v3/info?${qs.stringify(payloadObj, {arrayFormat: 'brackets'})}`,
                { headers: this.generateAuthHeaders(payloadObj) }
            );
            
            logger.info('User info fetched successfully');
            return response.data;
        } catch (error) {
            this.handleApiError('Error fetching user info', error);
            throw error;
        }
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
} 