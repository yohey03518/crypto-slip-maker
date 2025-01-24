export interface MaxMarketDepthResponse {
    timestamp: number;
    last_update_version: number;
    last_update_id: number;
    asks: [string, string][]; // [price, amount][]
    bids: [string, string][]; // [price, amount][]
}

export interface VipLevel {
    level: number;
    name: string;
    benefits: string[];
}

export interface MaxUserInfoResponse {
    email: string;
    level: number;
    m_wallet_enabled?: boolean;
    current_vip_level: VipLevel;
    next_vip_level: VipLevel;
}

export interface MaxApiConfig {
    apiBaseUrl: string;
    accessKey: string;
    secretKey: string;
} 