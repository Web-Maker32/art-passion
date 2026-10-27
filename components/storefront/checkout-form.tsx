"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { processCheckout } from "@/actions/checkout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  checkoutSchema,
  type CheckoutFormData,
  type CheckoutFormInput,
} from "@/lib/checkout-schema";

type FormField = Exclude<keyof CheckoutFormInput, "termsAccepted" | "honeypot" | "idempotencyKey">;

const textFields: Array<{
  name: FormField;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
}> = [
  { name: "fullName", label: "Full name", autoComplete: "name", required: true },
  { name: "mobileNumber", label: "Mobile number", type: "tel", autoComplete: "tel", required: true },
  { name: "email", label: "Email address", type: "email", autoComplete: "email" },
  { name: "deliveryAddress", label: "Delivery address", autoComplete: "street-address", required: true },
  { name: "city", label: "City", autoComplete: "address-level2", required: true },
  { name: "province", label: "Province", autoComplete: "address-level1", required: true },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code" },
];

export function CheckoutForm({
  idempotencyKey,
  whatsappHref,
}: {
  idempotencyKey: string;
  whatsappHref: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CheckoutFormInput, unknown, CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      mobileNumber: "",
      email: "",
      deliveryAddress: "",
      city: "",
      province: "",
      postalCode: "",
      giftNote: "",
      orderNotes: "",
      termsAccepted: false,
      idempotencyKey,
      honeypot: "",
    },
  });

  const submit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await processCheckout(values);
      if (result.success) {
        router.replace(
          `/order/${encodeURIComponent(result.orderNumber)}?token=${encodeURIComponent(result.accessToken)}`,
        );
        return;
      }

      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        setError(field as keyof CheckoutFormInput, { message });
      }
      setError("root", { message: result.message });
    });
  });

  return (
    <form className="space-y-7" noValidate onSubmit={submit}>
      <input type="hidden" {...register("idempotencyKey")} />
      <div
        aria-hidden="true"
        className="absolute -left-[10000px] size-px overflow-hidden"
      >
        <label htmlFor="checkout-website">Website</label>
        <input
          autoComplete="off"
          id="checkout-website"
          tabIndex={-1}
          {...register("honeypot")}
        />
      </div>

      <section aria-labelledby="customer-details-heading">
        <h2 className="font-heading text-xl font-semibold" id="customer-details-heading">
          Delivery details
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {textFields.map(({ name, label, type = "text", autoComplete, required }) => {
            const error = errors[name];
            const multiline = name === "deliveryAddress";
            return (
              <div className={multiline ? "sm:col-span-2" : undefined} key={name}>
                <label className="mb-1.5 block text-sm font-medium" htmlFor={name}>
                  {label}{required ? " *" : ""}
                </label>
                {multiline ? (
                  <textarea
                    autoComplete={autoComplete}
                    className="min-h-24 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
                    id={name}
                    maxLength={500}
                    {...register(name)}
                    aria-describedby={error ? `${name}-error` : undefined}
                    aria-invalid={Boolean(error)}
                  />
                ) : (
                  <Input
                    autoComplete={autoComplete}
                    className="min-h-11 rounded-md px-3 focus-visible:ring-2 focus-visible:ring-ring/50"
                    id={name}
                    type={type}
                    {...register(name)}
                    aria-describedby={error ? `${name}-error` : undefined}
                    aria-invalid={Boolean(error)}
                  />
                )}
                {error?.message && (
                  <p className="mt-1 text-sm text-destructive" id={`${name}-error`}>
                    {error.message}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="giftNote">
              Gift note <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              className="min-h-20 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
              id="giftNote"
              maxLength={200}
              {...register("giftNote")}
              aria-describedby={errors.giftNote ? "giftNote-error" : undefined}
              aria-invalid={Boolean(errors.giftNote)}
            />
            {errors.giftNote?.message && (
              <p className="mt-1 text-sm text-destructive" id="giftNote-error">
                {errors.giftNote.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="orderNotes">
              Order notes <span className="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              className="min-h-20 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30"
              id="orderNotes"
              maxLength={500}
              {...register("orderNotes")}
              aria-describedby={errors.orderNotes ? "orderNotes-error" : undefined}
              aria-invalid={Boolean(errors.orderNotes)}
            />
            {errors.orderNotes?.message && (
              <p className="mt-1 text-sm text-destructive" id="orderNotes-error">
                {errors.orderNotes.message}
              </p>
            )}
          </div>
        </div>
      </section>

      <section aria-labelledby="payment-heading" className="border-silver border-t pt-5">
        <h2 className="font-heading text-xl font-semibold" id="payment-heading">
          Easypaisa wallet transfer
        </h2>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          After placing your order, you will see the Easypaisa account details. Send the payment screenshot on WhatsApp with your order number. Your order stays pending until payment is checked by hand.
        </p>
        {whatsappHref ? (
          <a
            className="border-brand text-foreground lift-sm press hover-fine:hover:bg-brand/5 focus-visible:outline-ring mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-md border px-4 py-2 text-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            href={whatsappHref}
            rel="noreferrer"
            target="_blank"
          >
            Prefer cash on delivery? Order on WhatsApp
          </a>
        ) : (
          <p className="text-muted-foreground mt-4 text-sm">
            WhatsApp ordering is currently unavailable.
          </p>
        )}
      </section>

      <div className="border-silver border-t pt-5">
        <Controller
          control={control}
          name="termsAccepted"
          render={({ field }) => (
            <div className="flex items-start gap-3">
              <Checkbox
                aria-describedby={errors.termsAccepted ? "terms-error" : undefined}
                aria-invalid={Boolean(errors.termsAccepted)}
                checked={field.value}
                id="termsAccepted"
                name={field.name}
                onBlur={field.onBlur}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                ref={field.ref}
              />
              <label className="text-sm leading-6" htmlFor="termsAccepted">
                I agree to the <Link className="text-brand underline underline-offset-4" href="/terms">Terms</Link> and <Link className="text-brand underline underline-offset-4" href="/returns">Returns policy</Link>.
              </label>
            </div>
          )}
        />
        {errors.termsAccepted?.message && (
          <p className="mt-1 text-sm text-destructive" id="terms-error" role="alert">
            {errors.termsAccepted.message}
          </p>
        )}
      </div>

      {errors.root?.message && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {errors.root.message}
        </p>
      )}

      <Button
        aria-busy={isPending}
        className="min-h-12 w-full text-base"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Placing your order..." : "Place order"}
      </Button>
    </form>
  );
}