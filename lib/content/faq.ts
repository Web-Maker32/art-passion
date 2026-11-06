import { deliveryInfoLine } from "@/lib/site-config";

export type FaqItem = {
  question: string;
  answer: string;
};

/**
 * Storefront FAQ copy. Kept here so the page stays presentational and the
 * questions can be tested. Answers avoid inventing facts: anything only the
 * owner knows is marked TODO(owner).
 */
export const faqItems: FaqItem[] = [
  {
    question: "How do I place an order?",
    answer:
      "Choose the items you love, add them to your cart, and continue to checkout. Enter your delivery details and place the order. You will receive an order number, which you can use when contacting us.",
  },
  {
    question: "Which payment methods can you accept?",
    answer:
      "Online orders are paid by Easypaisa wallet transfer. You place the order first, then send the payment and share a screenshot with your order number. Cash on delivery can be arranged separately through WhatsApp and is not offered as a checkout option.",
  },
  {
    question: "How much does delivery cost?",
    answer: `${deliveryInfoLine}. Delivery is added at checkout, and the final total is shown before you place your order.`,
  },
  {
    question: "How long will my order take to arrive?",
    answer:
      "Ready-to-ship items are packed as soon as possible. Made-to-order pieces show their preparation time on the product page. Delivery time after dispatch is TODO(owner): add the usual delivery time for your city and for other cities.",
  },
  {
    question:
      "Why does my handmade item look slightly different from the photos?",
    answer:
      "Every piece is made by hand, so small differences in colour, stitching, shape, or finish are normal and part of what makes it unique. We do our best to show colours accurately, but screens can also vary.",
  },
  {
    question: "Can I request a custom order?",
    answer:
      "We are happy to talk about ideas. Send us a WhatsApp message with what you have in mind, the quantity, and the date you need it by. We will confirm whether it is possible before you order.",
  },
  {
    question: "Do you offer gift wrapping?",
    answer:
      "Gift wrapping is TODO(owner): confirm whether gift wrapping is available, whether it costs extra, and how it should be requested.",
  },
  {
    question: "Are the play sets suitable for young children?",
    answer:
      "Each product page shows a recommended age and a safety note. Please read them before buying, and keep small parts away from children under three. Adult supervision is recommended for craft activities.",
  },
  {
    question: "How can I check my order status?",
    answer:
      "Use the order link shown after checkout. It shows the current status of your order. For a quick update, message us on WhatsApp with your order number.",
  },
  {
    question: "What should I do if something arrives damaged?",
    answer:
      "Please contact us within TODO(owner): add the return or exchange window, and include your order number and clear photos of the item and packaging. We will review it and agree on a fair solution with you.",
  },
];

/**
 * Supporting details reused by the contact page.
 * TODO(owner) values must be replaced before the shop is announced.
 * Payment account details live in `siteConfig` and are read directly there.
 */
export const contactDetails = {
  responseTime:
    "TODO(owner): add the usual WhatsApp and email response time (for example, within one working day).",
};
