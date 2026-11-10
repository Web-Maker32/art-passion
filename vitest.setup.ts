import "@testing-library/jest-dom/vitest";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.CART_COOKIE_SECRET ??= "test-cart-cookie-secret-not-for-use-outside-tests";
process.env.ORDER_ACCESS_SECRET ??= "test-order-access-secret-not-for-use-outside-tests";
process.env.ADMIN_SESSION_SECRET ??= "test-admin-session-secret-not-for-use-outside-tests";
process.env.WHATSAPP_NUMBER ??= "923001234567";
process.env.CLOUDINARY_CLOUD_NAME ??= "test-cloud";
process.env.CLOUDINARY_API_KEY ??= "test-api-key";
process.env.CLOUDINARY_API_SECRET ??= "test-api-secret-not-a-real-secret";
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ??= "test-cloud";
process.env.EASYPAISA_ACCOUNT_NAME ??= "Test Account";
process.env.EASYPAISA_NUMBER ??= "0300-0000000";
