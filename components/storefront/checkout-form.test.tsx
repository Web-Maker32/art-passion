import type { ReactNode } from "react";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { processCheckout, navigate } = vi.hoisted(() => ({
  processCheckout: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@/actions/checkout", () => ({ processCheckout }));
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
  } & Record<string, unknown>) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { CheckoutForm } from "@/components/storefront/checkout-form";

const idempotencyKey = "cd984417-bdb2-4e04-8c5e-9ac9c949d6d1";

function renderForm() {
  return render(
    <CheckoutForm
      idempotencyKey={idempotencyKey}
      whatsappHref="https://wa.me/923001234567"
      navigate={navigate}
    />,
  );
}

async function fillRequiredFields(
  user: ReturnType<typeof userEvent.setup>,
) {
  await user.type(screen.getByLabelText(/full name/i), "Test Customer");
  await user.type(screen.getByLabelText(/mobile number/i), "03001234567");
  await user.type(
    screen.getByLabelText(/delivery address/i),
    "House 1, Street 2",
  );
  await user.type(screen.getByLabelText(/city/i), "Lahore");
  await user.type(screen.getByLabelText(/province/i), "Punjab");
  await user.click(screen.getByRole("checkbox"));
}

describe("CheckoutForm", () => {
  beforeEach(() => {
    processCheckout.mockReset();
    navigate.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits only once when the button is double-clicked", async () => {
    let resolveCheckout: (value: unknown) => void = () => undefined;
    processCheckout.mockReturnValue(
      new Promise((resolve) => {
        resolveCheckout = resolve;
      }),
    );

    const user = userEvent.setup();
    renderForm();
    await fillRequiredFields(user);

    await user.dblClick(
      screen.getByRole("button", { name: /place order/i }),
    );

    expect(processCheckout).toHaveBeenCalledTimes(1);

    const rawToken = "a".repeat(64);
    await act(async () => {
      resolveCheckout({
        success: true,
        orderNumber: "AP-2026-0001",
        accessToken: rawToken,
      });
    });

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith(
        `/order/AP-2026-0001?token=${rawToken}`,
      ),
    );
  });

  it("redirects to the plain order URL for a duplicate submission", async () => {
    processCheckout.mockResolvedValue({
      success: false,
      message: "This checkout was already submitted.",
      orderNumber: "AP-2026-0001",
    });

    const user = userEvent.setup();
    renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith("/order/AP-2026-0001"),
    );
  });

  it("shows server field errors without navigating", async () => {
    processCheckout.mockResolvedValue({
      success: false,
      message: "Check the highlighted fields and try again.",
      fieldErrors: { city: "Enter your city." },
    });

    const user = userEvent.setup();
    renderForm();
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: /place order/i }));

    expect(await screen.findByText("Enter your city.")).toBeInTheDocument();
    expect(
      screen.getByText("Check the highlighted fields and try again."),
    ).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });
});
