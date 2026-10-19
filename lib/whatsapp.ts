type WhatsAppLinkOptions = {
  number: string | undefined;
  message: string;
};

export function buildWhatsAppLink({
  number,
  message,
}: WhatsAppLinkOptions): string | null {
  let normalizedNumber = number?.replace(/\D/g, "");

  if (!normalizedNumber) {
    return null;
  }

  if (normalizedNumber.length === 11 && normalizedNumber.startsWith("0")) {
    normalizedNumber = `92${normalizedNumber.slice(1)}`;
  }

  return `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(message)}`;
}
