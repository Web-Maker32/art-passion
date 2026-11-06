import { PageSection, PageShell } from "@/components/content/PageShell";
import { contentMetadata } from "@/lib/content/metadata";
import { siteConfig } from "@/lib/site-config";

export const metadata = contentMetadata({
  title: "About Art Passion",
  description:
    "The story behind Art Passion, a one-person handmade shop making felt play sets, creative kits and thoughtful gifts in Pakistan.",
});

export default function AboutPage() {
  return (
    <PageShell
      intro={`${siteConfig.storeName} is a small, one-person shop in ${siteConfig.country}, making thoughtful pieces for play, making and gifting.`}
      title="A little about us"
    >
      <PageSection heading="How it started">
        <p>
          Art Passion began with a simple love of making things by hand: cutting
          felt, choosing colours, stitching small details, and putting together
          little kits that invite someone to sit down and create.
        </p>
        <p>
          It is still run by one person, from choosing the materials to packing
          the final parcel. That means every order is handled with care, and
          every piece gets a proper look before it is sent on its way.
        </p>
      </PageSection>

      <PageSection heading="How the pieces are made">
        <p>
          The felt play sets are cut and stitched by hand. The coloring and
          painting kits are assembled and checked piece by piece. Gift sets are
          packed with the same attention, so they arrive ready to give.
        </p>
        <p>
          Because everything is handmade in small batches, no two pieces are
          exactly alike. Small differences in stitching, colour or finish are
          normal, and they are part of what makes a handmade item feel personal.
        </p>
      </PageSection>

      <PageSection heading="Why we keep it small">
        <p>
          Keeping the shop small means there is time to think about the details:
          soft materials, safe finishes, clear instructions, and packaging that
          protects the piece on its way to you.
        </p>
        <p>
          It also means questions are answered by the person who made the item.
          If you are unsure about an age range, a custom idea or a gift, you can
          ask directly and get a real answer.
        </p>
      </PageSection>

      <PageSection heading="Made with care, in Pakistan">
        <p>
          Art Passion is proudly based in {siteConfig.country}. Thank you for
          supporting a small handmade business and the time that goes into each
          piece.
        </p>
      </PageSection>
    </PageShell>
  );
}
