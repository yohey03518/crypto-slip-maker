export interface BitoPriceLevel {
    amount: string;
    count: number;
    price: string;
    total: string;
}

export interface BitoMarketDepthResponse {
    asks: BitoPriceLevel[];
    bids: BitoPriceLevel[];
}

export interface BitoOrderRequest {
    market: string;
    side: 'buy' | 'sell';
    volume: string;
    price?: string;
    type: 'limit' | 'market';
}

export interface BitoOrderDetail {
    id: number;
    market: string;
    side: 'buy' | 'sell';
    state: 'pending' | 'completed' | 'cancelled';
    type: string;
    price: string;
    avgPrice: string;
    volume: string;
    remainingVolume: string;
    executedVolume: string;
    createdAt: number;
    updatedAt: number;
}

export interface BitoWalletBalanceItem {
    amount: string;
    available: string;
    currency: string;
    stake: string;
    tradable: boolean;
}

export interface BitoWalletBalanceResponse {
    data: BitoWalletBalanceItem[];
} 