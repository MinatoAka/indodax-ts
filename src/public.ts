import { MyHTTPClient } from "./http";
import { TickerResponse, TickerData, PairInfo } from "./models";

export class PublicAPI {
  protected http!: MyHTTPClient;
  static BASE_URL_PUBLIC = "https://indodax.com";

  protected checkStatus(res: { status: number; text: string; json: () => Promise<any> }): void {
    // Di-override di Client, biar PublicAPI bisa standalone.
    if ((this as any)._checkStatus) (this as any)._checkStatus(res);
  }

  async getTicker(pair: string): Promise<TickerResponse> {
    if (!pair.trim()) throw new Error("pair cannot be empty");
    const endpoint = `${PublicAPI.BASE_URL_PUBLIC}/api/ticker/${encodeURIComponent(pair.toLowerCase())}`;
    const resp = await this.http.request("GET", endpoint);
    await (this as any)._checkStatus(resp);
    const data = await resp.json();
    const t = data["ticker"];
    const tickerData: TickerData = {
      buy: t["buy"],
      sell: t["sell"],
      last: t["last"],
      high: t["high"],
      low: t["low"],
      serverTime: t["server_time"],
    };
    return new TickerResponse(tickerData);
  }

  async getPairs(): Promise<PairInfo[]> {
    const endpoint = `${PublicAPI.BASE_URL_PUBLIC}/api/pairs`;
    const resp = await this.http.request("GET", endpoint);
    await (this as any)._checkStatus(resp);
    const results: PairInfo[] = [];
    for (const p of await resp.json()) {
      try {
        const minQty = parseFloat(p["trade_min_traded_currency"]);
        if (minQty > 0) results.push({ id: String(p["id"]).toUpperCase(), minQty });
      } catch { continue; }
    }
    return results;
  }
}
