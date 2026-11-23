import * as crypto from "node:crypto";

// Mengurutkan key secara alfabet dan meng-encode-nya.
export function buildQuery(params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  return keys
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");
}

// Membuat signature HMAC-SHA256.
export function signSha256(payload: string, secretKey: string): string {
  return crypto
    .createHmac("sha256", secretKey)
    .update(payload, "utf-8")
    .digest("hex");
}
