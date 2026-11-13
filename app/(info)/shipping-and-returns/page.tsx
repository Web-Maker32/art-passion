import { MessageCircle } from "lucide-react";
import { CtaLink } from "@/components/content/cta";
import { PageSection, PageShell } from "@/components/content/PageShell";
import { contentMetadata } from "@/lib/content/metadata";
import { siteConfig } from "@/lib/site-config";
import { buildWhatsAppLink } from "@/lib/whatsapp";

export const metadata = contentMetadata({
  title: "Shipping and returns",
  description:
    "How Art Passion packs and posts handmade orders across Pakistan, what delivery costs, how long pieces take to make, and how returns and exchanges are handled.",
  path: "/shipping-and-returns",
});

export default function ShippingAndReturnsPage() {
  const whatsapp = buildWhatsAppLink({
    number: siteConfig.whatsappNumber,
    message: "Hello Art Passion! I have a question about shipping or a return.",
  });

  return (
    <PageShell
      intro="How your parcel gets to you, and what to do if something is not right."
      title="Shipping and returns"
    >
      <PageSection heading="Delivery charges">
        <p>
          Delivery is a flat Rs {siteConfig.deliveryFee} per order anywhere in
          Pakistan. Orders of Rs {siteConfig.freeDeliveryThreshold} or more are
          delivered free.
        </p>
        <p>
          The delivery charge is added automatically at checkout, and the full
          total is shown before you place the order.
        </p>
      </PageSection>

      <PageSection heading="Delivery time">
        <p>
          {"TODO(owner): add the usual delivery time for your city and for other cities, and whether tracking is shared with the customer."}
        </p>
        <p>
          Ready-to-ship items are packed as soon as possible. Made-to-order
          pieces show their preparation time on the product page, so the total
          wait includes both making time and delivery time.
        </p>
      </PageSection>

      <PageSection heading="Track your parcel">
        <p>Check your order status with your order number and checkout phone number. Courier details appear when they are available.</p>
        <CtaLink href="/track-order" variant="outline">Track order</CtaLink>
      </PageSection>

      <PageSection heading="How orders are packed">
        <p>
          Every order is packed by hand. Pieces are wrapped so they do not move
          around in transit, and small parts are kept together so nothing is
          missing when the parcel is opened.
        </p>
        <p>
          If your order is a gift, add a note at checkout. Gift notes are copied
          exactly as written, so please check the spelling.
        </p>
      </PageSection>

      <PageSection heading="Handmade items">
        <p>
          Because everything is made by hand, small differences in colour,
          stitching, shape or finish are normal. These are not faults; they are
          part of what makes each piece individual.
        </p>
      </PageSection>

      <PageSection heading="Returns and exchanges">
        <p>
          {"TODO(owner): add the exact return and exchange window in days, and say whether return delivery is paid by the customer or by the shop."}
        </p>
        <p>
          Items must be unused and in their original packaging. Custom and
          made-to-order pieces are made especially for you, so please ask about
          them before ordering.
        </p>
      </PageSection>

      <PageSection heading="Damaged or incorrect orders">
        <p>
          If something arrives damaged or is not what you ordered, contact us
          with your order number and clear photos of the item and the packaging.
          We will review it and agree on a fair solution.
        </p>
        {whatsapp ? (
          <CtaLink href={whatsapp} variant="outline">
            <MessageCircle aria-hidden="true" className="size-5" />
            Message us on WhatsApp
          </CtaLink>
        ) : (
          <CtaLink href="/contact" variant="outline">
            Contact us
          </CtaLink>
        )}
      </PageSection>

      <PageSection heading="Before you send anything back">
        <p>
          Please contact us first. Unannounced returns cannot be matched to an
          order, and we would rather agree on the next step with you than have a
          parcel arrive without a name on it.
        </p>
      </PageSection>
    </PageShell>
  );
}
