import { MyHTTPClient } from "./http";
import { PrivateAPI } from "./private";
import { IndodaxError } from "./exceptions";

export class Client extends PrivateAPI {
  constructor(
    apiKey = "",
    secretKey = "",
    opts: { retries?: number; rateLimit?: number; timeout?: number; userAgent?: string } = {}
  ) {
    super();
    this.apiKey = apiKey;
    this.secretKey = secretKey;
    this.http = new MyHTTPClient({
      retries: opts.retries ?? 3,
      rateLimit: opts.rateLimit ?? 5,
      timeout: opts.timeout ?? 15,
      userAgent: opts.userAgent ?? "indodax-ts/1.0",
    });
  }

  async _checkStatus(resp: { status: number; text: string; json: () => Promise<any> }): Promise<void> {
    if (resp.status !== 200) {
      try {
        const data = await resp.json();
        if (data && "code" in data && "msg" in data) {
          throw new IndodaxError(data["code"], data["msg"]);
        }
      } catch (e: any) {
        if (e instanceof IndodaxError) throw e;
        // JSON parse gagal, lanjut ke error HTTP biasa
      }
      throw new Error(`HTTP ${resp.status}: ${resp.text}`);
    }
  }
}
