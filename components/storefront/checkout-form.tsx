"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTransition } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleAlert,
  MapPin,
  MessageCircle,
  NotebookPen,
  ShoppingBag,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";
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

type FieldConfig = {
  name: FormField;
  label: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  optional?: boolean;
  helper?: string;
  wide?: boolean;
};

const contactFields: FieldConfig[] = [
  { name: "fullName", label: "Full name", autoComplete: "name", required: true },
  {
    name: "mobileNumber",
    label: "Mobile number",
    type: "tel",
    autoComplete: "tel",
    required: true,
    helper: "We'll confirm your order on this number.",
  },
  { name: "email", label: "Email address", type: "email", autoComplete: "email", optional: true, wide: true },
];

const addressFields: FieldConfig[] = [
  {
    name: "deliveryAddress",
    label: "Delivery address",
    autoComplete: "street-address",
    required: true,
    helper: "Include house, street and area.",
    wide: true,
  },
  { name: "city", label: "City", autoComplete: "address-level2", required: true },
  { name: "province", label: "Province", autoComplete: "address-level1", required: true },
  { name: "postalCode", label: "Postal code", autoComplete: "postal-code", optional: true },
];

export function CheckoutForm({
  idempotencyKey,
  whatsappHref,
  navigate = (url) => window.location.replace(url),
}: {
  idempotencyKey: string;
  whatsappHref: string | null;
  navigate?: (url: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const {
    register,
    control,
    handleSubmit,
    setError,
    clearErrors,
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

  const submit = handleSubmit((values, event) => {
    const formElement = event?.target;
    if (!(formElement instanceof HTMLFormElement)) return;
    if (formElement.dataset.submitting === "true") return;
    formElement.dataset.submitting = "true";
    clearErrors();

    startTransition(async () => {
      try {
        const result = await processCheckout(values);

        if (result.success) {
          navigate(
            `/order/${encodeURIComponent(result.orderNumber)}?token=${encodeURIComponent(result.accessToken)}`,
          );
          return;
        }

        if (result.orderNumber) {
          navigate(`/order/${encodeURIComponent(result.orderNumber)}`);
          return;
        }

        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(field as keyof CheckoutFormInput, { message });
        }
        setError("root", { message: result.message });
        delete formElement.dataset.submitting;
      } catch {
        setError("root", {
          message: "We could not place your order. Check your connection and try again.",
        });
        delete formElement.dataset.submitting;
      }
    });
  });

  function renderField({ name, label, type = "text", autoComplete, required, optional, helper, wide }: FieldConfig) {
    const error = errors[name];
    const multiline = name === "deliveryAddress";
    const describedBy =
      [helper ? `${name}-helper` : null, error ? `${name}-error` : null]
        .filter(Boolean)
        .join(" ") || undefined;
    return (
      <div className={wide ? "sm:col-span-2" : undefined} key={name}>
        <label className="mb-1.5 block text-sm font-medium" htmlFor={name}>
          {label}{required ? " *" : optional ? <span className="text-muted-foreground"> (optional)</span> : null}
        </label>
        {multiline ? (
          <textarea
            autoComplete={autoComplete}
            className="min-h-24 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground dark:bg-input/30"
            id={name}
            maxLength={500}
            {...register(name)}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
          />
        ) : (
          <Input
            autoComplete={autoComplete}
            className="min-h-11 rounded-lg px-3"
            id={name}
            inputMode={name === "mobileNumber" ? "tel" : undefined}
            placeholder={name === "mobileNumber" ? "03XX XXXXXXX" : undefined}
            type={type}
            {...register(name)}
            aria-describedby={describedBy}
            aria-invalid={Boolean(error)}
          />
        )}
        {helper && (
          <p className="text-muted-foreground mt-1.5 text-xs" id={`${name}-helper`}>
            {helper}
          </p>
        )}
        {error?.message && (
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-destructive" id={`${name}-error`}>
            <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span>{error.message}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
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

      {errors.root?.message && (
        <div
          className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium"
          role="alert"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p>{errors.root.message}</p>
        </div>
      )}

      <FormSection icon={User} id="contact-heading" title="Contact details">
        <div className="grid gap-4 sm:grid-cols-2">
          {contactFields.map(renderField)}
        </div>
      </FormSection>

      <FormSection icon={MapPin} id="address-heading" title="Delivery details">
        <div className="grid gap-4 sm:grid-cols-2">
          {addressFields.map(renderField)}
        </div>
      </FormSection>

      <FormSection icon={NotebookPen} id="notes-heading" title="Notes (optional)">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="giftNote">
              Gift note
            </label>
            <textarea
              className="min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors dark:bg-input/30"
              id="giftNote"
              maxLength={200}
              {...register("giftNote")}
              aria-describedby={errors.giftNote ? "giftNote-error" : undefined}
              aria-invalid={Boolean(errors.giftNote)}
            />
            {errors.giftNote?.message && (
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-destructive" id="giftNote-error">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                <span>{errors.giftNote.message}</span>
              </p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium" htmlFor="orderNotes">
              Order notes
            </label>
            <textarea
              className="min-h-20 w-full resize-y rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors dark:bg-input/30"
              id="orderNotes"
              maxLength={500}
              {...register("orderNotes")}
              aria-describedby={errors.orderNotes ? "orderNotes-error" : undefined}
              aria-invalid={Boolean(errors.orderNotes)}
            />
            {errors.orderNotes?.message && (
              <p className="mt-1.5 flex items-start gap-1.5 text-sm text-destructive" id="orderNotes-error">
                <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
                <span>{errors.orderNotes.message}</span>
              </p>
            )}
          </div>
        </div>
      </FormSection>

      <FormSection icon={Wallet} id="payment-heading" title="Easypaisa wallet transfer">
        <p className="text-muted-foreground text-sm leading-6">
          Easypaisa wallet transfer is the only online payment method. After placing your order, you will see the account details. Send the payment screenshot on WhatsApp with your order number. Your order stays pending until payment is checked by hand.
        </p>
        {whatsappHref ? (
          <a
            className="border-brand text-foreground lift-sm press hover-fine:hover:bg-brand/5 focus-visible:outline-ring mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-center font-semibold focus-visible:outline-2 focus-visible:outline-offset-2"
            href={whatsappHref}
            rel="noopener noreferrer"
            target="_blank"
          >
            <MessageCircle aria-hidden="true" className="size-5 shrink-0 text-brand" />
            Prefer cash on delivery? Order on WhatsApp
          </a>
        ) : (
          <p className="text-muted-foreground mt-4 text-sm">
            WhatsApp ordering is currently unavailable.
          </p>
        )}
      </FormSection>

      <div className="border-silver bg-card rounded-2xl border p-5 shadow-soft sm:p-6">
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
          <p className="mt-1.5 flex items-start gap-1.5 text-sm text-destructive" id="terms-error" role="alert">
            <CircleAlert aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
            <span>{errors.termsAccepted.message}</span>
          </p>
        )}
        <Button
          aria-busy={isPending}
          className="mt-5 w-full"
          disabled={isPending}
          size="lg"
          type="submit"
        >
          <ShoppingBag aria-hidden="true" className="size-4" />
          {isPending ? "Placing your order..." : "Place order"}
        </Button>
        <p className="text-muted-foreground mt-3 text-center text-xs">
          You will see the Easypaisa account details on the next step.
        </p>
      </div>
    </form>
  );
}

function FormSection({
  icon: Icon,
  id,
  title,
  children,
}: {
  icon: LucideIcon;
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="border-silver bg-card rounded-2xl border p-5 shadow-soft sm:p-6"
    >
      <div className="flex items-center gap-2.5">
        <span className="bg-gold/20 text-gold-text dark:text-gold-light inline-flex size-9 shrink-0 items-center justify-center rounded-xl">
          <Icon aria-hidden="true" className="size-4.5" />
        </span>
        <h2 className="font-heading text-card-foreground text-lg font-semibold" id={id}>
          {title}
        </h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}