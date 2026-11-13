import type { Metadata } from "next";
import { io } from "next/cache";
import { PageShell } from "@/components/content/PageShell";
import { TrackOrderForm } from "@/components/storefront/track-order-form";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Track my order",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export const instant = false;

export default async function TrackOrderPage() {
  await io();
  return (
    <PageShell
      title="Track my order"
      intro="Find your latest order status using your order number and the phone number you entered at checkout."
    >
      <TrackOrderForm whatsappNumber={siteConfig.whatsappNumber} />
    </PageShell>
  );
}
