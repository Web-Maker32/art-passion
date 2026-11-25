// Canonical stored format: +923XXXXXXXXX.
export function normalizePakistaniPhone(value: string): string | null {
  const input = value.trim();
  if (!input || !/^[+\d\s().-]+$/.test(input)) return null;

  let digits = input.replace(/\D/g, "");
  // 00 is the international dial prefix (0092 = +92); strip it so both
  // notations normalize to the same stored number.
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (/^03\d{9}$/.test(digits)) {
    return `+92${digits.slice(1)}`;
  }
  if (/^923\d{9}$/.test(digits)) {
    return `+${digits}`;
  }
  return null;
}
