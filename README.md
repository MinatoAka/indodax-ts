# indodax-ts

[![Test](https://github.com/MinatoAka/indodax-ts/actions/workflows/test.yml/badge.svg)](https://github.com/MinatoAka/indodax-ts/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Indodax TypeScript SDK untuk data publik, informasi akun, penempatan order market, dan riwayat transaksi.

## Instalasi

```bash
npm install indodax-ts
```

## Penggunaan

```typescript
import { Client } from "indodax-ts";

const client = new Client("YOUR_API_KEY", "YOUR_SECRET_KEY", {
  retries: 3,
  rateLimit: 5,
  timeout: 15,
});
```

### Ticker dan Pasangan

```typescript
const ticker = await client.getTicker("ETHIDR");
console.log(ticker.getLastPrice());

const pairs = await client.getPairs();
console.log(pairs);
```

### Saldo

```typescript
const balances = await client.getBalances("ETHIDR");
console.log(balances.idr);
console.log(balances.assetRaw);
```

### Order Market

```typescript
const buy = await client.placeMarketBuy("ETHIDR", 27000000);
console.log(buy);

const sell = await client.placeMarketSell("ETHIDR", "0.001234");
console.log(sell);
```

### Riwayat Transaksi

```typescript
const trades = await client.tradeHistory({
  symbol: "ETHIDR",
  limit: 100,
  sort: "desc",
});
console.log(trades);
```

## Konfigurasi HTTP

| Opsi | Default | Deskripsi |
|---|---:|---|
| `retries` | `3` | Jumlah retry untuk request aman (`GET`, `HEAD`, dan `OPTIONS`). |
| `rateLimit` | `5` | Maksimum interval distribusi request; dihitung per detik. |
| `timeout` | `15` | Timeout setiap request dalam detik. |
| `userAgent` | `indodax-ts/1.0` | Nilai header User-Agent. |

Request `POST` tidak dilakukan retry demi mencegah eksekusi order berulang.

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

## Lisensi

[MIT](LICENSE)
