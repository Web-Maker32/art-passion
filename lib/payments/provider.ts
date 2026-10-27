export interface PaymentProvider {
  readonly method: "WALLET_TRANSFER";
  getInstructions(): string;
}