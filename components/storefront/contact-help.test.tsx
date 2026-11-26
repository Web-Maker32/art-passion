import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ContactHelp } from "@/components/storefront/contact-help";

describe("ContactHelp", () => {
  afterEach(() => {
    cleanup();
  });
  it("hides empty contact values and renders nothing when both are empty", () => {
    const { container } = render(
      <ContactHelp
        contactEmail=""
        message="Hi, I have a question"
        whatsappNumber=""
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("hides empty email while building a normalised wa.me link", () => {
    render(
      <ContactHelp
        contactEmail=""
        message="Hi, I have a question about Test Account"
        whatsappNumber="0300-0000000"
      />,
    );

    const whatsappLink = screen.getByRole("link", {
      name: /whatsapp/i,
    });
    expect(whatsappLink).toHaveAttribute(
      "href",
      "https://wa.me/923000000000?text=Hi%2C%20I%20have%20a%20question%20about%20Test%20Account",
    );
    expect(whatsappLink).toHaveAttribute("target", "_blank");
    expect(whatsappLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByRole("link", { name: /email/i })).toBeNull();
  });

  it("hides empty WhatsApp while rendering the email link", () => {
    render(
      <ContactHelp
        contactEmail="hello@example.test"
        message="Hi"
        whatsappNumber=""
      />,
    );

    const emailLink = screen.getByRole("link", { name: /email/i });
    expect(emailLink).toHaveAttribute("href", "mailto:hello@example.test");
    expect(emailLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.queryByRole("link", { name: /whatsapp/i })).toBeNull();
  });
});
