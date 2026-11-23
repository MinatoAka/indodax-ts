export class IndodaxError extends Error {
  code: number;
  msg: string;

  constructor(code: number, msg: string) {
    super(`indodax api error (code ${code}): ${msg}`);
    this.name = "IndodaxError";
    this.code = code;
    this.msg = msg;
  }

  isRateLimit(): boolean { return this.code === -1003; }
  isInvalidCredentials(): boolean { return this.code === -1002 || this.code === -2014; }
  isInvalidTimestamp(): boolean { return this.code === -1021; }
  isInvalidSignature(): boolean { return this.code === -1022; }
  isInsufficientBalance(): boolean { return this.code === -4026; }
  isOrderNotFound(): boolean { return this.code === -2013 || this.code === 1112; }
  isMarketSuspended(): boolean { return this.code === -1016; }
  isOrderRejected(): boolean { return this.code === -2010; }
  isAccessBlocked(): boolean { return this.code === -2015; }
}
