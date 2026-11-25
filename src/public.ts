import { MyHTTPClient } from "./http";
import { TickerResponse, TickerData, PairInfo } from "./models";
import { PrivateAPI } from "./private";

export class PublicAPI {
  protected http!: MyHTTPClient;
  static BASE_URL_PUBLIC = "https://indodax.com";

  protected checkStatus(res: { status: number; text: string; json: () => Promise<any> }): void {
    // Di-override di Client, biar PublicAPI bisa standalone.
    if ((this as any)._checkStatus) (this as any)._checkStatus(res);
  }

  async getTicker(pair: string): Promise<TickerResponse> {
    if (!pair.trim()) {
      throw new Error("pair cannot be empty");
    }

    // Endpoint baru: flat, query param, lowercase
    const endpoint = `${PrivateAPI.BASE_URL_PRIVATE}/api/v2/ticker/price?symbol=${encodeURIComponent(pair.toLowerCase())}`;
    const resp = await this.http.request("GET", endpoint);
    await (this as any)._checkStatus(resp);
    const data = await resp.json();
    
    // PARSING BARU: Langsung ambil dari root, tanpa nested "ticker"
    return {
      symbol: data["symbol"],
      price: data["price"]
    } as TickerResponse;
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
