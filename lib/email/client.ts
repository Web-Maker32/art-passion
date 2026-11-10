import { Resend } from "resend";

/**
 * The Resend client is only created once a key exists, so importing this module
 * never requires email configuration.
 */
export function createResendClient(apiKey: string): Resend {
  return new Resend(apiKey);
}
