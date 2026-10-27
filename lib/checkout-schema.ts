import { z } from "zod";
import { normalizePakistaniPhone } from "@/lib/phone";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().default("");

export const checkoutSchema = z
  .object({
    fullName: z.string().trim().min(2, "Enter your full name.").max(100),
    mobileNumber: z
      .string()
      .trim()
      .min(1, "Enter your mobile number.")
      .max(40)
      .transform((value, context) => {
        const normalized = normalizePakistaniPhone(value);
        if (!normalized) {
          context.addIssue({
            code: "custom",
            message: "Enter a valid Pakistani mobile number.",
          });
          return z.NEVER;
        }
        return normalized;
      }),
    email: z
      .string()
      .trim()
      .max(254)
      .refine(
        (value) => value === "" || z.email().safeParse(value).success,
        "Enter a valid email address.",
      )
      .optional()
      .default(""),
    deliveryAddress: z.string().trim().min(5, "Enter your delivery address.").max(500),
    city: z.string().trim().min(2, "Enter your city.").max(100),
    province: z.string().trim().min(2, "Enter your province.").max(100),
    postalCode: optionalText(20),
    giftNote: optionalText(200),
    orderNotes: optionalText(500),
    termsAccepted: z.boolean().refine(Boolean, "Accept the terms and returns policy."),
    idempotencyKey: z.string().uuid("Refresh checkout and try again."),
    honeypot: z.string().max(0, "Invalid submission."),
  })
  .strict();

export type CheckoutFormInput = z.input<typeof checkoutSchema>;
export type CheckoutFormData = z.output<typeof checkoutSchema>;