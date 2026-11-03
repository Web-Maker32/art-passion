import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required to connect to Neon"),
  SHIPPING_FLAT_RATE: z.coerce.number().default(350),
  FREE_SHIPPING_THRESHOLD: z.coerce.number().default(5000),
  CART_COOKIE_SECRET: z.string().min(32, "CART_COOKIE_SECRET must be at least 32 characters"),
  ORDER_ACCESS_SECRET: z.string().min(32, "ORDER_ACCESS_SECRET must be at least 32 characters"),
  ADMIN_SESSION_SECRET: z.string().min(32, "ADMIN_SESSION_SECRET must be at least 32 characters"),
  WALLET_TRANSFER_DETAILS: z.string().min(1, "Wallet transfer details are required"),
  WHATSAPP_NUMBER: z.string().min(10, "Valid WhatsApp number is required"),
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required for image uploads"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required for image uploads"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required for image uploads"),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SHIPPING_FLAT_RATE: process.env.SHIPPING_FLAT_RATE,
  FREE_SHIPPING_THRESHOLD: process.env.FREE_SHIPPING_THRESHOLD,
  CART_COOKIE_SECRET: process.env.CART_COOKIE_SECRET,
  ORDER_ACCESS_SECRET: process.env.ORDER_ACCESS_SECRET,
  ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
  WALLET_TRANSFER_DETAILS: process.env.WALLET_TRANSFER_DETAILS,
  WHATSAPP_NUMBER: process.env.WHATSAPP_NUMBER,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
});