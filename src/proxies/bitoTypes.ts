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
    id: string;
    pair: string;
    price: string;
    avgExecutionPrice: string;
    action: 'BUY' | 'SELL';
    type: 'LIMIT' | 'MARKET' | 'STOP_LIMIT';
    timestamp: number;
    status: BitoOrderStatus;
    originalAmount: string;
    remainingAmount: string;
    executedAmount: string;
    fee: string;
    feeSymbol: string;
    bitoFee: string;
    total: string;
    seq: string;
    stopPrice?: string;
    condition?: '>=' | '<=';
    timeInForce: 'GTC' | 'POST_ONLY';
    createdTimestamp: number;
    updatedTimestamp: number;
}

export enum BitoOrderStatus {
    NotTriggered = -1,
    InProgress = 0,
    PartialDeal = 1,
    Completed = 2,
    CompletedPartialDeal = 3,
    Cancelled = 4,
    PostOnlyCancelled = 6
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