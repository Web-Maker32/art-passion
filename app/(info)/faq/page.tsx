import { CtaLink } from "@/components/content/cta";
import { PageSection, PageShell } from "@/components/content/PageShell";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faqItems } from "@/lib/content/faq";
import { contentMetadata } from "@/lib/content/metadata";
import { buildFaqJsonLd } from "@/lib/seo/json-ld";
import { JsonLd } from "@/components/seo/JsonLd";

export const metadata = contentMetadata({
  title: "Frequently asked questions",
  description:
    "Answers about placing an order, paying by Easypaisa, delivery costs, handmade differences, custom requests and checking the progress and status of your order.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <PageShell
      intro="Short answers to the questions that come up most often. If yours is not here, please ask."
      title="Frequently asked questions"
    >
      <JsonLd data={buildFaqJsonLd(faqItems)} />
      <Accordion className="border-silver bg-card rounded-2xl border px-5 sm:px-6">
        {faqItems.map((item, index) => (
          <AccordionItem key={item.question} value={`faq-${index}`}>
            <AccordionTrigger>{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <PageSection heading="Still need help?">
        <p>
          Send a message with your question, and your order number if you have
          one. A real person replies, usually the same person who made the item.
        </p>
        <div className="flex flex-wrap gap-3">
          <CtaLink href="/contact">Contact us</CtaLink>
          <CtaLink href="/payment-info" variant="outline">
            How payment works
          </CtaLink>
        </div>
      </PageSection>
    </PageShell>
  );
}
