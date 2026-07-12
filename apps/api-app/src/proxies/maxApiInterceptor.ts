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

export function setupMaxApiInterceptors(axiosInstance: AxiosInstance): void {
    // Request interceptor
    axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const { method, url, data, params } = config;
            logger.info(`MAX API Request [${method?.toUpperCase()}] ${url}:\n` + formatForLog(
                data || params || {}
            ));
            return config;
        },
        (error: AxiosError) => {
            logger.error('MAX API Request Error:', error.message);
            return Promise.reject(error);
        }
    );

    // Response interceptor
    axiosInstance.interceptors.response.use(
        (response: AxiosResponse) => {
            const { status, config: { url, method }, data } = response;
            logger.info(`MAX API Response [${method?.toUpperCase()}] ${url} (${status}):\n` + formatForLog(data));
            return response;
        },
        (error: AxiosError) => {
            logger.error(`MAX API Response Error (${error.response?.status || 'unknown'}):`
                + ` ${error.message}`);
            if (error.response?.data) {
                logger.error('Response data:\n' + formatForLog(error.response.data));
            }
            return Promise.reject(error);
        }
    );
} 