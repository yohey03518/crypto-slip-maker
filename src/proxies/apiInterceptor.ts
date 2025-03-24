import { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { logger } from '../utils/logger.js';
import { inspect } from 'util';

function formatForLog(obj: unknown): string {
    return inspect(obj, {
        depth: null,
        colors: false,
        maxArrayLength: null,
        compact: false
    });
}

export function setupApiInterceptors(axiosInstance: AxiosInstance, apiName: string): void {
    // Request interceptor
    axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const { method, url, data, params } = config;
            logger.info(`${apiName} API Request [${method?.toUpperCase()}] ${url}:\n` + formatForLog(
                data || params || {}
            ));
            return config;
        },
        (error: AxiosError) => {
            logger.error(`${apiName} API Request Error:`, error.message);
            return Promise.reject(error);
        }
    );

    // Response interceptor
    axiosInstance.interceptors.response.use(
        (response: AxiosResponse) => {
            const { status, config: { url, method }, data } = response;
            logger.info(`${apiName} API Response [${method?.toUpperCase()}] ${url} (${status}):\n` + formatForLog(data));
            return response;
        },
        (error: AxiosError) => {
            logger.error(`${apiName} API Response Error (${error.response?.status || 'unknown'}):`
                + ` ${error.message}`);
            if (error.response?.data) {
                logger.error('Response data:\n' + formatForLog(error.response.data));
            }
            return Promise.reject(error);
        }
    );
} 