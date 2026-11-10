import Link from "next/link";
import { PageSection, PageShell } from "@/components/content/PageShell";
import { legalLastUpdated, legalReviewNote } from "@/lib/content/legal";
import { contentMetadata } from "@/lib/content/metadata";
import { deliveryInfoLine, siteConfig } from "@/lib/site-config";

export const metadata = contentMetadata({
  title: "Terms",
  description:
    "The basics of ordering handmade pieces from Art Passion: prices in Pakistani rupees, Easypaisa payment, delivery, returns, exchanges and handmade variations.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <PageShell
      intro="These terms explain the basics of browsing and ordering from the shop."
      lastUpdated={legalLastUpdated}
      title="Terms"
    >
      <p className="border-silver rounded-lg border border-dashed p-4 text-sm">
        {legalReviewNote}
      </p>

      <PageSection heading="About these terms">
        <p>
          By placing an order with {siteConfig.storeName} you agree to the points
          below. If anything is unclear, please ask before ordering rather than
          after.
        </p>
      </PageSection>

      <PageSection heading="Products and handmade variations">
        <p>
          Every piece is made by hand, in small batches. Small differences in
          colour, stitching, shape or finish are normal and are not faults. We
          try to show colours accurately, but screens can vary.
        </p>
        <p>
          Recommended ages and safety notes are shown on each product page.
          Please read them before buying, especially for young children.
        </p>
      </PageSection>

      <PageSection heading="Prices and payment">
        <p>
          All prices are in Pakistani rupees, and the total is shown before you
          place an order. Online orders are paid by Easypaisa wallet transfer.
        </p>
        <p>
          Cash on delivery is not a checkout option. It can only be arranged in
          advance by messaging us on WhatsApp.
        </p>
      </PageSection>

      <PageSection heading="Placing an order">
        <p>
          An order is accepted once it has been placed at checkout and the
          payment has been confirmed. If an item becomes unavailable, we will
          contact you to agree on a replacement or a refund.
        </p>
        <p>
          Please check your delivery details before submitting the order. If you
          spot a mistake, message us with the order number as soon as possible.
        </p>
      </PageSection>

      <PageSection heading="Delivery">
        <p>{deliveryInfoLine}.</p>
        <p>
          Delivery timing depends on where you live and on the courier. Full
          details are on the{" "}
          <Link
            className="text-foreground underline underline-offset-4"
            href="/shipping-and-returns"
          >
            shipping and returns page
          </Link>
          .
        </p>
      </PageSection>

      <PageSection heading="Returns and exchanges">
        <p>
          Returns, exchanges and damaged orders are handled as described on the
          shipping and returns page. Please contact us before sending anything
          back so it can be matched to your order.
        </p>
      </PageSection>

      <PageSection heading="Custom and personalised items">
        <p>
          {"TODO(owner): state whether custom or personalised items can be cancelled, returned or exchanged, and what happens if a customer-supplied spelling or detail is wrong."}
        </p>
      </PageSection>

      <PageSection heading="Designs and photographs">
        <p>
          The designs, product photographs and wording on this site belong to{" "}
          {siteConfig.storeName}. Please do not copy them for resale or use them
          as your own without asking first.
        </p>
      </PageSection>

      <PageSection heading="Questions">
        <p>
          If a term here does not match what you were told, please{" "}
          <Link className="text-foreground underline underline-offset-4" href="/contact">
            contact us
          </Link>{" "}
          and we will sort it out.
        </p>
      </PageSection>

      <PageSection heading="Changes to these terms">
        <p>
          These terms may be updated as the shop changes. The date at the top of
          the page shows when they were last reviewed.
        </p>
      </PageSection>
    </PageShell>
  );
}
