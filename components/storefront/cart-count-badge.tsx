"use client";

export function CartCountBadge({
  label,
}: {
  label: string;
}) {
  return (
    <span
      aria-hidden="true"
      className="cart-count-pop bg-gold text-header-teal absolute -top-0.5 -right-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.65rem] font-bold"
    >
      {label}
    </span>
  );
}
