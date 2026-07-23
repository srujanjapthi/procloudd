export interface SetupResult {
  secret: string;
  qrCodeDataUrl: string;
}

export interface EnableResult {
  recoveryCodes: string[];
}
