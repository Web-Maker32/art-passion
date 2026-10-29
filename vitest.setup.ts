import "@testing-library/jest-dom/vitest";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.CART_COOKIE_SECRET ??= "test-cart-cookie-secret-not-for-use-outside-tests";
process.env.ORDER_ACCESS_SECRET ??= "test-order-access-secret-not-for-use-outside-tests";
process.env.ADMIN_SESSION_SECRET ??= "test-admin-session-secret-not-for-use-outside-tests";
process.env.WALLET_TRANSFER_DETAILS ??= "Test payment instructions";
process.env.WHATSAPP_NUMBER ??= "923001234567";
