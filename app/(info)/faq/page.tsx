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

export const metadata = contentMetadata({
  title: "Frequently asked questions",
  description:
    "Answers about ordering, Easypaisa payment, delivery, handmade differences, custom orders and order status at Art Passion.",
});

export default function FaqPage() {
  return (
    <PageShell
      intro="Short answers to the questions that come up most often. If yours is not here, please ask."
      title="Frequently asked questions"
    >
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
