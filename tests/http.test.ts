import { describe, test, expect, beforeEach, vi } from "vitest";
import { MyHTTPClient } from "../src/http";

describe("MyHTTPClient", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  test("GET retries on 500, POST never retries", async () => {
    const client = new MyHTTPClient({ retries: 2, rateLimit: 1000, timeout: 5 });
    let calls = 0;
    (global as any).fetch = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls <= 2) return { status: 500, text: async () => "err", json: async () => ({}), headers: { get: () => null } };
      return { status: 200, text: async () => "{}", json: async () => ({}), headers: { get: () => null } };
    });
    const res = await client.request("GET", "https://example.com/x");
    expect(res.status).toBe(200);
    expect(calls).toBe(3);

    calls = 0;
    (global as any).fetch = vi.fn().mockImplementation(async () => {
      calls++;
      return { status: 500, text: async () => "err", json: async () => ({}), headers: { get: () => null } };
    });
    const res2 = await client.request("POST", "https://example.com/order", { body: "a=1" });
    expect(res2.status).toBe(500);
    expect(calls).toBe(1);
  });

  test("clears timeout after fetch throws", async () => {
    vi.useFakeTimers();
    const client = new MyHTTPClient({ retries: 0, rateLimit: 1000, timeout: 5 });
    (global as any).fetch = vi.fn().mockRejectedValue(new Error("network error"));
    await expect(client.request("POST", "https://example.com/x")).rejects.toThrow("network error");
    vi.clearAllTimers();
    vi.useRealTimers();
  });
});
