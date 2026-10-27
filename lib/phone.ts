// Canonical stored format: +923XXXXXXXXX.
export function normalizePakistaniPhone(value: string): string | null {
  const input = value.trim();
  if (!input || !/^[+\d\s().-]+$/.test(input)) return null;

  const digits = input.replace(/\D/g, "");
  if (/^03\d{9}$/.test(digits)) {
    return `+92${digits.slice(1)}`;
  }
  if (/^923\d{9}$/.test(digits)) {
    return `+${digits}`;
  }
  return null;
}
