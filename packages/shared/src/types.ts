export type TradingCurrency = 'usdt' | 'btc';

export type OrderRequest = {
  currency: TradingCurrency,
  side: 'buy' | 'sell',
  volume: number,
  price: number,
}