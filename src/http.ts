// POST TIDAK PERNAH DI-RETRY demi keamanan. Hanya GET / HEAD yang di-retry.
export class MyHTTPClient {
  private timeout: number;
  private rateLimitInterval: number;
  private lastRequestTime = 0;
  private retries: number;
  private backoffFactor: number;
  private userAgent: string;
  private queue: Promise<void> = Promise.resolve();

  constructor(opts: {
    retries?: number;
    backoffFactor?: number;
    rateLimit?: number;
    timeout?: number;
    userAgent?: string;
  } = {}) {
    const rateLimit = opts.rateLimit && opts.rateLimit > 0 ? opts.rateLimit : 5;
    this.retries = opts.retries ?? 3;
    this.backoffFactor = opts.backoffFactor ?? 1.0;
    this.timeout = opts.timeout ?? 15;
    this.userAgent = opts.userAgent ?? "indodax-ts/1.0";
    this.rateLimitInterval = 1000 / rateLimit;
  }

  private async rateLimitWait(): Promise<void> {
    // Antrean berurutan biar rate limit aman walau dipanggil barengan.
    const prev = this.queue;
    let release!: () => void;
    this.queue = new Promise((res) => { release = res; });
    await prev;
    try {
      const now = Date.now();
      const elapsed = now - this.lastRequestTime;
      if (elapsed < this.rateLimitInterval) {
        await new Promise((r) => setTimeout(r, this.rateLimitInterval - elapsed));
      }
      this.lastRequestTime = Date.now();
    } finally {
      release();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  async request(method: string, url: string, opts: { headers?: Record<string, string>; body?: string } = {}): Promise<{ status: number; text: string; json: () => Promise<any> }> {
    const isSafe = ["HEAD", "GET", "OPTIONS"].includes(method.toUpperCase());
    const maxAttempts = isSafe ? this.retries + 1 : 1;

    let lastErr: any = null;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await this.rateLimitWait();
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), this.timeout * 1000);
        let res: Response;
        try {
          res = await fetch(url, {
            method,
            headers: { "User-Agent": this.userAgent, ...(opts.headers ?? {}) },
            body: opts.body,
            signal: ctrl.signal,
          });
        } finally {
          clearTimeout(t);
        }

        // Retry untuk 429 / 5xx, hanya untuk method aman.
        if (isSafe && [429, 500, 502, 503, 504].includes(res.status) && attempt < maxAttempts - 1) {
          const retryAfter = res.headers.get("retry-after");
          let delayMs = this.backoffFactor * 1000 * Math.pow(2, attempt) + Math.random() * 500;
          if (retryAfter) {
            const sec = parseFloat(retryAfter);
            if (!isNaN(sec)) delayMs = sec * 1000;
          }
          await this.sleep(delayMs);
          continue;
        }

        const text = await res.text();
        return {
          status: res.status,
          text,
          json: async () => JSON.parse(text),
        };
      } catch (e: any) {
        lastErr = e;
        if (!isSafe || attempt >= maxAttempts - 1) throw e;
        const delayMs = this.backoffFactor * 1000 * Math.pow(2, attempt) + Math.random() * 500;
        await this.sleep(delayMs);
      }
    }
    throw lastErr;
  }
}
