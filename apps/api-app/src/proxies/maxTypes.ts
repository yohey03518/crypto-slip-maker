export interface MaxMarketDepthResponse {
    timestamp: number;
    last_update_version: number;
    last_update_id: number;
    asks: [string, string][]; // [price, amount][]
    bids: [string, string][]; // [price, amount][]
}

export interface MaxOrderRequest {
    market: string;
    side: 'buy' | 'sell';
    volume: string;
    price?: string;
    client_oid?: string;
    stop_price?: string;
    ord_type: 'limit' | 'market' | 'stop_limit' | 'stop_market' | 'post_only' | 'ioc_limit';
    group_id?: number;
}

export interface MaxOrderDetail {
    id: number;
    wallet_type: string;
    market: string;
    client_oid: string;
    group_id: number;
    side: 'buy' | 'sell';
    state: 'wait' | 'done' | 'cancel' | 'convert';
    ord_type: string;
    price: string;
    stop_price: string;
    avg_price: string;
    volume: string;
    remaining_volume: string;
    executed_volume: string;
    trades_count: number;
    created_at: number;
    updated_at: number;
}

export interface MaxWalletBalanceItem {
    currency: string;
    balance: string;
    locked: string;
    staked: string;
    principal: string;
    interest: string;
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

export interface MaxRawConvertRequest {
    from_currency: string;
    to_currency: string;
    from_amount?: string;
    to_amount?: string;
}

export interface MaxRawConvertOrder {
    sn: string;
    from_currency: string;
    from_amount: string;
    to_currency: string;
    to_amount: string;
    fee: string;
    fee_currency: string;
    fee_in_twd: string;
    created_at: number;
}
