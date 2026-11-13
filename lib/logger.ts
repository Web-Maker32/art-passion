const events = {
  rate_limit_fallback: "Distributed rate limiting is unavailable; using the in-memory fallback.",
  checkout_failed: "Checkout failed.",
  cart_failed: "A cart operation failed.",
  admin_login_failed: "Admin sign-in failed.",
  notification_failed: "The owner notification could not be sent.",
  notification_disabled: "Owner email notifications are not configured.",
  sitemap_failed: "The sitemap could not be loaded.",
  upload_failed: "An image upload failed.",
  upload_cleanup_failed: "An uploaded image needs manual reconciliation.",
  revalidation_failed: "Saved changes could not refresh the page cache.",
  health_failed: "The database health check failed.",
  payment_proof_failed: "Saving the customer's payment details failed.",
  track_order_failed: "The public order lookup failed.",
  script_failed: "The maintenance command failed. Check its configuration.",
  script_complete: "The maintenance command completed.",
  script_started: "The maintenance command started.",
} as const;

type Event = keyof typeof events;

// Fixed messages only: no error objects, arbitrary metadata, identifiers or PII.
export const logger = {
  warn(event: Event): void { console.warn(events[event]); },
  error(event: Event): void { console.error(events[event]); },
  info(event: Event): void { console.info(events[event]); },
};
