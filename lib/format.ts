const pkrFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(priceInPaisa: number): string {
  return pkrFormatter.format(priceInPaisa / 100);
}
