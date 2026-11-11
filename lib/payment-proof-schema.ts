import { z } from "zod";

/**
 * Shared between the public payment-proof form and the server action, so the
 * client and the server validate the customer's input with identical rules.
 */

export const paymentProofSavedMessage =
  "We received your payment details. We will confirm your order soon.";

const orderNumberSchema = z.string().trim().max(64).regex(/^AP-\d{4}-\d{4,}$/, {
  message: "Unknown order number.",
});

// Easypaisa transaction IDs are letters and digits only.
const transactionIdPattern = /^[A-Za-z0-9]{6,40}$/;

export const paymentProofSchema = z
  .object({
    orderNumber: orderNumberSchema,
    token: z.string().trim().max(200).optional().or(z.literal("")),
    transactionId: z
      .string()
      .trim()
      .regex(transactionIdPattern, {
        message:
          "Enter the 6 to 40 character transaction ID, letters and digits only.",
      }),
    note: z
      .string()
      .trim()
      .max(200, "Keep the note to 200 characters or fewer.")
      .optional()
      .or(z.literal("")),
  })
  .strict();

export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
