import { describe, test, expect } from "vitest";
import { buildQuery, signSha256 } from "../src/crypto";

describe("crypto", () => {
  test("buildQuery sorts keys and encodes", () => {
    expect(buildQuery({ b: "2", a: "1" })).toBe("a=1&b=2");
    expect(buildQuery({ symbol: "ETHIDR", side: "BUY" })).toBe("side=BUY&symbol=ETHIDR");
  });

  test("signSha256 matches node crypto", async () => {
    const crypto = await import("node:crypto");
    const expected = crypto.createHmac("sha256", "secret").update("hello", "utf-8").digest("hex");
    expect(signSha256("hello", "secret")).toBe(expected);
    expect(signSha256("hello", "secret")).toHaveLength(64);
  });
});
