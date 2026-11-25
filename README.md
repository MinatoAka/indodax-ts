<div align="center">

# 🦖 indodax-ts

**Standalone TypeScript SDK for Official Indodax Trade API v2**

Indodax TypeScript SDK untuk data publik, informasi akun, penempatan order market, dan riwayat transaksi.

[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Test](https://github.com/MinatoAka/indodax-ts/actions/workflows/test.yml/badge.svg)](https://github.com/MinatoAka/indodax-ts/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Support via Saweria](https://img.shields.io/badge/Saweria-Support%20me-orange)](https://saweria.co/AKaAturDompet)

</div>

---


## Instalasi

```bash
npm install git+https://github.com/MinatoAka/indodax-ts.git
```

## Struktur file
```text
indodax-ts/
├── src/
│   ├── index.ts              # export doang
│   ├── client.ts             # Client extends PrivateAPI + _checkStatus
│   ├── public.ts             # getTicker, getPairs
│   ├── private.ts            # getBalances, submitOrder, placeMarketBuy/Sell, tradeHistory
│   ├── http.ts               # MyHTTPClient, retry GET, rate limit
│   ├── crypto.ts             # buildQuery + signSha256
│   ├── models.ts             # interface + TickerResponse + TradeHistoryRequest
│   └── exceptions.ts         # IndodaxError
├── tests/
│   ├── client.test.ts        # ticker, balances, buy/sell, tradeHistory
│   ├── crypto.test.ts
│   ├── exceptions.test.ts
│   ├── http.test.ts
│   └── models.test.ts
├── package.json
├── tsconfig.json
├── vitest.config.mts
└── README.md
```

## Penggunaan

### Setup Client
Request `POST` tidak dilakukan retry demi mencegah eksekusi order berulang.

```typescript
import { Client } from "indodax-ts";

// 1. Public, tanpa key - buat cek harga live
const pub = new Client("", "");

// 2. Private - buat cek saldo + order
const client = new Client("API_KEY_LU", "SECRET_LU");

// 3. Dengan opsi - 
const client2 = new Client("API_KEY_LU", "SECRET_LU", {
  retries: 3,      // default 3, cuma buat GET
  rateLimit: 5,   // default 5 req/detik = 300 req/menit
  timeout: 15,    // default 15 detik
  userAgent: "indodax-ts/1.0",
});
```

### Ticker dan Pairs

```typescript
import { Client } from "indodax-ts";

const pub = new Client("", "");

async function cekHarga() {
  const t = await pub.getTicker("ETHIDR");
  console.log("Pair :", t.symbol);
  console.log("Harga:", t.price);

  // Jika butuh dalam bentuk angka (float) untuk kalkulasi
  const priceFloat = parseFloat(t.price);
  console.log("Float:", priceFloat);

async function listPair() {
  const pairs = await pub.getPairs();
  // pairs: [{ id: "ETHIDR", minQty: 10000 }, ...]

  for (const p of pairs) {
    console.log(p.id, "min:", p.minQty);
  }

  // Cari 1 pair
  const eth = pairs.find((p) => p.id === "ETHIDR");
  console.log("ETHIDR min:", eth?.minQty);
}
listPair();
```

### Saldo

```typescript
import { Client } from "indodax-ts";

const client = new Client("API_KEY_LU", "SECRET_LU");

async function cekSaldo() {
  const bal = await client.getBalances("ETHIDR");
  console.log("IDR:", bal.idr);           // number, udah parseFloat
  console.log("ETH:", bal.asset);         // number
  console.log("ETH raw:", bal.assetRaw);  // string mentah, "0.001234" - anti float error

  if (bal.idr < 27000000) {
    console.log("IDR kurang buat buy 27jt");
  }
}
cekSaldo();
```

### Order Market

```typescript
import { Client } from "indodax-ts";

const client = new Client("API_KEY_LU", "SECRET_LU");

async function beli() {
  // Beli ETH senilai 27jt IDR
  // Di dalam lib: quoteOrderQty = String(27000000) -> "27000000"
  // Harus IDR bulat, nggak boleh 27000000.50 - bakal di-throw "quoteOrderQty must be a whole IDR amount"
  const order = await client.placeMarketBuy("ETHIDR", 27000000);
  console.log("orderId:", order.orderId);
  console.log("symbol:", order.symbol);
  console.log("side:", order.side);
  console.log("type:", order.type);
}
beli();

async function jual() {
  const bal = await client.getBalances("ETHIDR");

  // Pakai assetRaw dari getBalances
  const order = await client.placeMarketSell("ETHIDR", bal.assetRaw);
  console.log("orderId:", order.orderId);
}
jual();
```

### Riwayat Transaksi

```typescript
import { Client } from "indodax-ts";

const client = new Client("API_KEY_LU", "SECRET_LU");

async function riwayat() {
  // Semua trade ETHIDR
  const trades = await client.tradeHistory({ symbol: "ETHIDR", orderId: "ethidr-market-3568" });

```

## Penanganan Error

```typescript
import { IndodaxError } from "indodax-ts";

try {
  await client.placeMarketBuy("ETHIDR", 27000000);
} catch (error) {
  if (error instanceof IndodaxError) {
    console.error(error.code, error.message);
  } else {
    throw error;
  }
}
```

## Pengembangan

```bash
npm install
npm test
npm run build
```

## 🕵️ Reference

* [Standalone Library Go Indodax API](https://github.com/MinatoAka/indodax-go)
* [Indodax Official Api Docs](https://github.com/btcid/indodax-official-api-docs)


## 🤝 Support & Exchange

If this library helps you build profitable bots, consider supporting the development!

* 👉 [Daftar Akun Indodax](https://indodax.com/deeplink?page=register&id=AkaKen) (Referral)
* 👉 [Traktir Kopi](https://saweria.co/AKaAturDompet) ☕
