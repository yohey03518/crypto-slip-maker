export interface BitoMarketDepthResponse {
    timestamp: number;
    asks: [string, string][]; // [price, amount][]
    bids: [string, string][]; // [price, amount][]
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
    currency: string;
    balance: string;
    locked: string;
    available: string;
} 