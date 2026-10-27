import "server-only";

import { env } from "@/lib/env";
import type { PaymentProvider } from "@/lib/payments/provider";

export const manualEasypaisaProvider: PaymentProvider = {
  method: "WALLET_TRANSFER",
  getInstructions: () => env.WALLET_TRANSFER_DETAILS,
};