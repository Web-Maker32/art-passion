import { describe, expect, it } from "vitest";
import { faqItems } from "@/lib/content/faq";

describe("faqItems", () => {
  it("contains 8 to 10 questions", () => {
    expect(faqItems.length).toBeGreaterThanOrEqual(8);
    expect(faqItems.length).toBeLessThanOrEqual(10);
  });

  it("has a non-empty question and answer for every item", () => {
    for (const item of faqItems) {
      expect(item.question.trim().length).toBeGreaterThan(0);
      expect(item.answer.trim().length).toBeGreaterThan(0);
    }
  });

  it("uses questions, not statements, and does not repeat them", () => {
    const questions = faqItems.map((item) => item.question.trim());
    expect(new Set(questions).size).toBe(questions.length);

    for (const question of questions) {
      expect(question.endsWith("?")).toBe(true);
    }
  });
});
