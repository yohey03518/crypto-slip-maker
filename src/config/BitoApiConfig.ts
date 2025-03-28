import { Service } from 'typedi';

@Service()
export class BitoApiConfig {
    readonly apiBaseUrl: string;
    readonly accessKey: string;
    readonly secretKey: string;

    constructor() {
        this.apiBaseUrl = process.env.BITO_API_BASE_URL || 'https://api.bitopro.com/v3';
        
        const accessKey = process.env.BITO_API_ACCESS_KEY;
        const secretKey = process.env.BITO_API_SECRET_KEY;
        
        if (!accessKey || !secretKey) {
            throw new Error('BITO_API_ACCESS_KEY and BITO_API_SECRET_KEY must be set in environment variables');
        }
        
        this.accessKey = accessKey;
        this.secretKey = secretKey;
    }
} 