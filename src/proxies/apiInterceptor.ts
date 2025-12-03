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

/**
 * Mask sensitive headers for logging
 * @param headers Request headers object
 * @returns Sanitized headers with sensitive values masked
 */
function maskSensitiveHeaders(headers: Record<string, any> | undefined): Record<string, any> {
    if (!headers) return {};
    
    const masked = { ...headers };
    
    // Mask Authorization header
    if (masked['Authorization'] || masked['authorization']) {
        const authKey = masked['Authorization'] ? 'Authorization' : 'authorization';
        const authValue = masked[authKey];
        if (typeof authValue === 'string' && authValue.length > 10) {
            masked[authKey] = `${authValue.substring(0, 10)}...`;
        }
    }
    
    return masked;
}

export function setupApiInterceptors(axiosInstance: AxiosInstance, apiName: string): void {
    // Request interceptor
    axiosInstance.interceptors.request.use(
        (config: InternalAxiosRequestConfig) => {
            const { method, url, data, params, headers } = config;
            const maskedHeaders = maskSensitiveHeaders(headers as Record<string, any>);
            
            logger.info(`${apiName} API Request [${method?.toUpperCase()}] ${url}:\n` 
                + `Headers: ${formatForLog(maskedHeaders)}\n`
                + `Body: ${formatForLog(data || params || {})}`
            );
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
            logger.info(`${apiName} API Response [${method?.toUpperCase()}] ${url} (${status}):\n` 
                + formatForLog(data)
            );
            return response;
        },
        (error: AxiosError) => {
            const maskedHeaders = maskSensitiveHeaders(error.config?.headers as Record<string, any>);
            logger.error(`${apiName} API Response Error (${error.response?.status || 'unknown'}): ${error.message}\n`
                + `Headers: ${formatForLog(maskedHeaders)}`
            );
            if (error.response?.data) {
                logger.error('Response data:\n' + formatForLog(error.response.data));
            }
            return Promise.reject(error);
        }
    );
} 