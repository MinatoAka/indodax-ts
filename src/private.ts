import { buildQuery, signSha256 } from "./crypto";
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
    const symbol = req.symbol.trim().toUpperCase();
    const side = req.side.trim().toUpperCase();
    if (!symbol) throw new Error("symbol cannot be empty");
    if (side !== "BUY" && side !== "SELL") throw new Error("side must be BUY or SELL");

    const hasQuantity = req.quantity !== undefined && req.quantity.trim() !== "";
    const hasQuoteOrderQty = req.quoteOrderQty !== undefined && req.quoteOrderQty.trim() !== "";
    if (hasQuantity === hasQuoteOrderQty) {
      throw new Error("exactly one of quantity or quoteOrderQty is required");
    }

    if (hasQuantity) {
      const quantity = Number(req.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("quantity must be greater than zero");
    } else {
      const quoteOrderQty = Number(req.quoteOrderQty);
      if (!Number.isFinite(quoteOrderQty) || quoteOrderQty <= 0) {
        throw new Error("quoteOrderQty must be greater than zero");
      }
      if (side !== "BUY") throw new Error("quoteOrderQty is only valid for BUY market orders");
      if (!Number.isSafeInteger(quoteOrderQty)) {
        throw new Error("quoteOrderQty must be a whole IDR amount");
      }
    }

    const params: Record<string, string> = {
      symbol,
      side,
      type: "MARKET",
      timestamp: String(Date.now()),
      recvWindow: "5000",
    };
    if (hasQuantity) params["quantity"] = req.quantity!.trim();
    if (hasQuoteOrderQty) params["quoteOrderQty"] = req.quoteOrderQty!.trim();
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
    if (!Number.isFinite(idrAmount) || idrAmount <= 0) {
      throw new Error("quoteOrderQty must be greater than zero");
    }
    if (!Number.isSafeInteger(idrAmount)) {
      throw new Error("quoteOrderQty must be a whole IDR amount");
    }
    return this.submitOrder({
      symbol: pair.toUpperCase(),
      side: "BUY",
      quoteOrderQty: String(idrAmount),
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
