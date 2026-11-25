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

export class TickerResponse {
  symbol: string;
  price:  string;
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
