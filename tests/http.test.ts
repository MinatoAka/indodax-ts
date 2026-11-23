import { MyHTTPClient } from "../src/http";

describe("MyHTTPClient", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  test("GET retries on 500, POST never retries", async () => {
    const client = new MyHTTPClient({ retries: 2, rateLimit: 100, timeout: 5 });
    let getCalls = 0;
    const mockFetch = jest.spyOn(global, "fetch" as any);

    // GET: gagal 2x, sukses ke-3
    mockFetch.mockImplementationOnce(async () => new Response("err", { status: 500 }))
      .mockImplementationOnce(async () => new Response("err", { status: 500 }))
      .mockImplementationOnce(async () => new Response(JSON.stringify({ ok: 1 }), { status: 200 }));

    const res = await client.request("GET", "https://example.com/x");
    expect(res.status).toBe(200);
    getCalls = mockFetch.mock.calls.length;
    expect(getCalls).toBe(3);

    // POST: gagal 1x, langsung lempar, tidak retry
    mockFetch.mockReset();
    mockFetch.mockImplementationOnce(async () => new Response("err", { status: 500 }));
    const res2 = await client.request("POST", "https://example.com/order", { body: "a=1" });
    expect(res2.status).toBe(500);
    expect(mockFetch.mock.calls.length).toBe(1);
  });

  test("rate limit waits between calls", async () => {
    const client = new MyHTTPClient({ rateLimit: 5, timeout: 5 }); // 200ms interval
    jest.spyOn(global, "fetch" as any).mockImplementation(async () => new Response("{}", { status: 200 }));
    const start = Date.now();
    await client.request("GET", "https://example.com/1");
    await client.request("GET", "https://example.com/2");
    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(150); // ada jeda rate limit
  });
});
