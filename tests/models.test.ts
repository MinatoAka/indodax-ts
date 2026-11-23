import { describe, test, expect } from "vitest";
import { TickerResponse } from "../src/models";

describe("models", () => {
  test("TickerResponse helpers convert string to float", () => {
    const t = new TickerResponse({
      buy: "27000000",
      sell: "27100000",
      last: "27050000",
      high: "28000000",
      low: "26000000",
      serverTime: 123,
    });
    expect(t.getLastPrice()).toBe(27050000);
    expect(t.getHighestBid()).toBe(27000000);
    expect(t.getLowestAsk()).toBe(27100000);
    expect(t.getDayHigh()).toBe(28000000);
    expect(t.getDayLow()).toBe(26000000);
  });
});
