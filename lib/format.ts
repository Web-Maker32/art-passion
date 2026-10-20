const pkrFormatter = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(priceInRupees: number): string {
  return pkrFormatter.format(priceInRupees);
}
