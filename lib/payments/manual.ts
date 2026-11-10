import "server-only";

import { siteConfig } from "@/lib/site-config";
import type { PaymentProvider } from "@/lib/payments/provider";

export const manualEasypaisaProvider: PaymentProvider = {
  method: "WALLET_TRANSFER",
  getInstructions: () => `Easypaisa: ${siteConfig.easypaisaNumber} | Account title: ${siteConfig.easypaisaAccountName}`,
};