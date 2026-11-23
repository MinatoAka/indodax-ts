import { buildQuery, signSha256 } from "./crypto";
import { MyHTTPClient } from "./http";
import { BalanceResult, SubmitOrderRequest, OrderResult, TradeHistoryRequest, Trade } from "./models";
import { PublicAPI } from "./public";

export class PrivateAPI extends PublicAPI {
  protected apiKey = "";
  protected secretKey = "";
  static BASE_URL_PRIVATE = "https://api.indodax.com";

  private getPrivateHeaders(signature: string, isPost = false): Record<string, string> {
    const h: Record<string, string> = {
      Accept: "application/json",
      "X-APIKEY": this.apiKey,
      Sign: signature,
    };
    if (isPost) h["Content-Type"] = "application/x-www-form-urlencoded";
    return h;
  }

  async getBalances(pair: string): Promise<BalanceResult> {
    if (!this.apiKey || !this.secretKey) throw new Error("missing credentials for private endpoint");
    const params: Record<string, string> = {
      timestamp: String(Date.now()),
      recvWindow: "5000",
    };
    const query = buildQuery(params);
    const sig = signSha256(query, this.secretKey);
    const endpoint = `${PrivateAPI.BASE_URL_PRIVATE}/api/v2/account?${query}`;
    const resp = await this.http.request("GET", endpoint, { headers: this.getPrivateHeaders(sig) });
    await (this as any)._checkStatus(resp);
    const data = await resp.json();
    const pairUpper = pair.toUpperCase();
    const baseAsset = pairUpper.replace("IDR", "");
    const res: BalanceResult = { idr: 0, asset: 0, assetRaw: "0" };
    for (const b of data["balances"] ?? []) {
      if (String(b["asset"]).toUpperCase() === "IDR") res.idr = parseFloat(b["free"]);
      else if (String(b["asset"]).toUpperCase() === baseAsset) {
        res.assetRaw = b["free"];
        res.asset = parseFloat(b["free"]);
      }
    }
    return res;
  }

  async submitOrder(req: SubmitOrderRequest): Promise<OrderResult> {
    if (!this.apiKey || !this.secretKey) throw new Error("missing credentials for private endpoint");
    const params: Record<string, string> = {
      symbol: req.symbol,
      side: req.side.toUpperCase(),
      type: "MARKET",
      timestamp: String(Date.now()),
      recvWindow: "5000",
    };
    if (req.quantity) params["quantity"] = req.quantity;
    if (req.quoteOrderQty) params["quoteOrderQty"] = req.quoteOrderQty;
    const payload = buildQuery(params);
    const sig = signSha256(payload, this.secretKey);
    const endpoint = `${PrivateAPI.BASE_URL_PRIVATE}/api/v2/order`;
    const resp = await this.http.request("POST", endpoint, {
      headers: this.getPrivateHeaders(sig, true),
      body: payload,
    });
    await (this as any)._checkStatus(resp);
    const data = await resp.json();
    return {
      symbol: data["symbol"] ?? "",
      orderId: data["orderId"] ?? 0,
      clientOrderId: data["clientOrderId"],
      side: data["side"],
      type: data["type"],
      fullOrderId: data["fullOrderId"],
    };
  }

  async placeMarketBuy(pair: string, idrAmount: number): Promise<OrderResult> {
    return this.submitOrder({
      symbol: pair.toUpperCase(),
      side: "BUY",
      quoteOrderQty: idrAmount.toFixed(2),
    });
  }

  async placeMarketSell(pair: string, coinAmountRaw: string): Promise<OrderResult> {
    return this.submitOrder({
      symbol: pair.toUpperCase(),
      side: "SELL",
      quantity: coinAmountRaw,
    });
  }

  async tradeHistory(req: TradeHistoryRequest): Promise<Trade[]> {
    if (!this.apiKey || !this.secretKey) throw new Error("missing credentials for private endpoint");
    if (!req.symbol) throw new Error("symbol is mandatory for trade history");
    const params: Record<string, string> = {
      symbol: req.symbol.toLowerCase(),
      timestamp: String(Date.now()),
      recvWindow: "5000",
    };
    if (req.orderId) params["orderId"] = req.orderId;
    if (req.clientOrderId) params["clientOrderId"] = req.clientOrderId;
    if (req.startTime && req.startTime > 0) params["startTime"] = String(req.startTime);
    if (req.endTime && req.endTime > 0) params["endTime"] = String(req.endTime);
    if (req.limit && req.limit > 0) params["limit"] = String(req.limit);
    if (req.sort) params["sort"] = req.sort;
    const query = buildQuery(params);
    const sig = signSha256(query, this.secretKey);
    const endpoint = `${PrivateAPI.BASE_URL_PRIVATE}/api/v2/myTrades?${query}`;
    const resp = await this.http.request("GET", endpoint, { headers: this.getPrivateHeaders(sig) });
    await (this as any)._checkStatus(resp);
    const data = (await resp.json())["data"] ?? [];
    return data.map((t: any) => ({
      tradeId: t["tradeId"] ?? "",
      orderId: t["orderId"] ?? "",
      clientOrderId: t["clientOrderId"] ?? "",
      symbol: t["symbol"] ?? "",
      price: t["price"] ?? "0",
      qty: t["qty"] ?? "0",
      quoteQty: t["quoteQty"] ?? "0",
      commission: t["commission"] ?? "0",
      commissionAsset: t["commissionAsset"] ?? "",
      isBuyer: t["isBuyer"] ?? false,
      isMaker: t["isMaker"] ?? false,
      time: t["time"] ?? 0,
    } as Trade));
  }
}
