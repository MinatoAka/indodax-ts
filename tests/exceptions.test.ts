import { describe, test, expect } from "vitest";
import { IndodaxError } from "../src/exceptions";

describe("IndodaxError", () => {
  test("helpers map codes correctly", () => {
    expect(new IndodaxError(-1003, "rate").isRateLimit()).toBe(true);
    expect(new IndodaxError(-1002, "x").isInvalidCredentials()).toBe(true);
    expect(new IndodaxError(-2014, "x").isInvalidCredentials()).toBe(true);
    expect(new IndodaxError(-1021, "x").isInvalidTimestamp()).toBe(true);
    expect(new IndodaxError(-1022, "x").isInvalidSignature()).toBe(true);
    expect(new IndodaxError(-4026, "x").isInsufficientBalance()).toBe(true);
    expect(new IndodaxError(-2013, "x").isOrderNotFound()).toBe(true);
    expect(new IndodaxError(1112, "x").isOrderNotFound()).toBe(true);
    expect(new IndodaxError(-1016, "x").isMarketSuspended()).toBe(true);
    expect(new IndodaxError(-2010, "x").isOrderRejected()).toBe(true);
    expect(new IndodaxError(-2015, "x").isAccessBlocked()).toBe(true);
  });

  test("message contains code and msg", () => {
    const e = new IndodaxError(-1003, "too many");
    expect(e.message).toContain("-1003");
    expect(e.message).toContain("too many");
  });
});
