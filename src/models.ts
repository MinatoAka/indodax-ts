export interface BalanceResult {
  idr: number;
  asset: number;
  assetRaw: string;
}

export interface SubmitOrderRequest {
  symbol: string;
  side: string;
  quoteOrderQty?: string;
  quantity?: string;
}

export interface OrderResult {
  symbol: string;
  orderId: number;
  clientOrderId?: string;
  side?: string;
  type?: string;
  fullOrderId?: string;
}

export interface PairInfo {
  id: string;
  minQty: number;
}

export interface TickerData {
  buy: string;
  sell: string;
  last: string;
  high: string;
  low: string;
  serverTime: number;
}

export class TickerResponse {
  ticker: TickerData;
  constructor(ticker: TickerData) { this.ticker = ticker; }
  getLastPrice(): number { return parseFloat(this.ticker.last); }
  getHighestBid(): number { return parseFloat(this.ticker.buy); }
  getLowestAsk(): number { return parseFloat(this.ticker.sell); }
  getDayHigh(): number { return parseFloat(this.ticker.high); }
  getDayLow(): number { return parseFloat(this.ticker.low); }
}

export interface TradeHistoryRequest {
  symbol: string;
  fullOrderId?: string;
  clientOrderId?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
  sort?: string;
}

export interface Trade {
  tradeId: string;
  orderId: string;
  clientOrderId: string;
  symbol: string;
  price: string;
  qty: string;
  quoteQty: string;
  commission: string;
  commissionAsset: string;
  isBuyer: boolean;
  isMaker: boolean;
  time: number;
}
