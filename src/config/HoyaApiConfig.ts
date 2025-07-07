import { Service } from 'typedi';
import { config } from 'dotenv';

config();

@Service()
export class HoyaApiConfig {
    readonly baseUrl: string;
    readonly account: string;
    readonly password: string;
    readonly googleAuthKey: string;

    constructor() {
        const baseUrl = process.env.HOYA_BASE_URL;
        const account = process.env.HOYA_ACCOUNT;
        const password = process.env.HOYA_PASSWORD;
        const googleAuthKey = process.env.HOYA_GOOGLE_AUTH_KEY;

        if (!baseUrl) throw new Error('HOYA_BASE_URL environment variable is not set');
        if (!account) throw new Error('HOYA_ACCOUNT environment variable is not set');
        if (!password) throw new Error('HOYA_PASSWORD environment variable is not set');
        if (!googleAuthKey) throw new Error('HOYA_GOOGLE_AUTH_KEY environment variable is not set');

        this.baseUrl = baseUrl;
        this.account = account;
        this.password = password;
        this.googleAuthKey = googleAuthKey;
    }
} 