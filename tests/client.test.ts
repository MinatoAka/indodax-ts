import { describe, test, expect, beforeEach, vi } from "vitest";
import { Client } from "../src/client";
import { IndodaxError } from "../src/exceptions";

function mockFetch(body: any, status = 200) {
  (global as any).fetch = vi.fn().mockResolvedValue({
    status,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    json: async () => body,
    headers: { get: (_: string) => null },
  });
  return (global as any).fetch as any;
}

describe("Client", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test("getTicker returns TickerResponse", async () => {
    mockFetch({ ticker: { buy: "27000000", sell: "27100000", last: "27050000", high: "28000000", low: "26000000", server_time: 123 } });
    const c = new Client("", "", { rateLimit: 1000 });
    const t = await c.getTicker("ETHIDR");
    expect(t.getLastPrice()).toBe(27050000);
  });

  test("getTicker empty pair throws", async () => {
    const c = new Client("", "", { rateLimit: 1000 });
    await expect(c.getTicker("   ")).rejects.toThrow("pair cannot be empty");
  });

  test("getPairs filters minQty > 0", async () => {
    mockFetch([
      { id: "ethidr", trade_min_traded_currency: "10000" },
      { id: "btcidr", trade_min_traded_currency: "0" },
      { id: "bad" },
    ]);
    const c = new Client("", "", { rateLimit: 1000 });
    const pairs = await c.getPairs();
    expect(pairs).toHaveLength(1);
    expect(pairs[0].id).toBe("ETHIDR");
  });

  test("getBalances parses IDR + assetRaw", async () => {
    mockFetch({ balances: [{ asset: "IDR", free: "1000000" }, { asset: "ETH", free: "0.001234" }] });
    const c = new Client("KEY", "SECRET", { rateLimit: 1000 });
    const b = await c.getBalances("ETHIDR");
    expect(b.idr).toBe(1000000);
    expect(b.assetRaw).toBe("0.001234");
  });

  test("placeMarketBuy uses whole quoteOrderQty", async () => {
    const mock = mockFetch({ symbol: "ETHIDR", orderId: 123, side: "BUY", type: "MARKET" });
    const c = new Client("KEY", "SECRET", { rateLimit: 1000 });
    const r = await c.placeMarketBuy("ETHIDR", 27000000);
    expect(r.orderId).toBe(123);
    const body = (mock.mock.calls[0][1] as any).body as string;
    expect(body).toContain("quoteOrderQty=27000000");
  });

  test("placeMarketBuy rejects decimal amount", async () => {
    const c = new Client("KEY", "SECRET", { rateLimit: 1000 });
    await expect(c.placeMarketBuy("ETHIDR", 27000000.5)).rejects.toThrow("whole IDR amount");
  });

  test("submitOrder rejects both quantity and quoteOrderQty", async () => {
    const c = new Client("KEY", "SECRET", { rateLimit: 1000 });
    await expect(c.submitOrder({ symbol: "ETHIDR", side: "BUY", quantity: "0.1", quoteOrderQty: "27000000" }))
      .rejects.toThrow("exactly one");
  });

  test("submitOrder rejects invalid side", async () => {
    const c = new Client("KEY", "SECRET", { rateLimit: 1000 });
    await expect(c.submitOrder({ symbol: "ETHIDR", side: "HOLD", quantity: "0.1" }))
      .rejects.toThrow("BUY or SELL");
  });

  test("placeMarketSell uses quantity raw", async () => {
    const mock = mockFetch({ symbol: "ETHIDR", orderId: 456, side: "SELL", type: "MARKET" });
    const c = new Client("KEY", "SECRET", { rateLimit: 1000 });
    const r = await c.placeMarketSell("ETHIDR", "0.001234");
    expect(r.orderId).toBe(456);
    const body = (mock.mock.calls[0][1] as any).body as string;
    expect(body).toContain("quantity=0.001234");
    expect(body).not.toContain("quoteOrderQty");
  });

  test("tradeHistory uses fullOrderId parameter", async () => {
    const mock = mockFetch({ data: [{ tradeId: "1", orderId: "ethidr-market-3568", clientOrderId: "c1", symbol: "ETHIDR", price: "27000000", qty: "0.01", quoteQty: "270000", commission: "0", commissionAsset: "IDR", isBuyer: true, isMaker: false, time: 123 }] });
    const c = new Client("KEY", "SECRET", { rateLimit: 1000 });
    await c.tradeHistory({ symbol: "ETHIDR", orderId: "ethidr-market-3568" });
    const url = mock.mock.calls[0][0] as string;
    expect(url).toContain("fullOrderId=ethidr-market-3568");
  });

  test("tradeHistory rejects fullOrderId with clientOrderId", async () => {
    mockFetch({ data: [] });
    const c = new Client("KEY", "SECRET", { rateLimit: 1000 });
    await expect(c.tradeHistory({
      symbol: "ETHIDR",
      orderId: "ethidr-market-3568",
      clientOrderId: "c1",
    })).rejects.toThrow("cannot be used together");
  });

  test("_checkStatus throws IndodaxError", async () => {
    mockFetch({ code: -1003, msg: "rate limit" }, 429);
    const c = new Client("KEY", "SECRET", { rateLimit: 1000 });
    try {
      await c.getTicker("ETHIDR");
      throw new Error("should throw");
    } catch (e: any) {
      expect(e).toBeInstanceOf(IndodaxError);
      expect(e.isRateLimit()).toBe(true);
    }
  });
});
