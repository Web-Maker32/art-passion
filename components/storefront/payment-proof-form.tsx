"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reportPaymentProof } from "@/actions/payment-proof";
import { paymentProofSavedMessage } from "@/lib/payment-proof-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const textareaClassName =
  "min-h-20 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 dark:bg-input/30";

type PaymentProofFormProps = {
  orderNumber: string;
  token: string;
  canEdit: boolean;
  hasReported: boolean;
  initialTransactionId: string | null;
  initialNote: string | null;
};

export function PaymentProofForm({
  orderNumber,
  token,
  canEdit,
  hasReported,
  initialTransactionId,
  initialNote,
}: PaymentProofFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!hasReported);
  const [reported, setReported] = useState(hasReported);
  const [transactionId, setTransactionId] = useState(initialTransactionId ?? "");
  const [note, setNote] = useState(initialNote ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rootError, setRootError] = useState<string | null>(null);

  if (!canEdit && !reported) return null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending) return;
    setRootError(null);
    setFieldErrors({});

    startTransition(async () => {
      try {
        const result = await reportPaymentProof({
          orderNumber,
          token,
          transactionId,
          note,
        });

        if (result.success) {
          setReported(true);
          setEditing(false);
          router.refresh();
          return;
        }

        setFieldErrors(result.fieldErrors ?? {});
        setRootError(result.message);
      } catch {
        setRootError(
          "We could not save your payment details. Check your connection and try again.",
        );
      }
    });
  }

  if (!editing) {
    return (
      <div className="border-silver bg-secondary/40 mt-4 rounded-lg border p-4">
        <p className="text-sm font-medium" role="status">
          {paymentProofSavedMessage}
        </p>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Transaction ID</dt>
            <dd className="font-semibold">{transactionId}</dd>
          </div>
          {note.trim() && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Note</dt>
              <dd className="text-right">{note.trim()}</dd>
            </div>
          )}
        </dl>
        {canEdit && (
          <Button
            className="mt-3"
            onClick={() => setEditing(true)}
            size="sm"
            type="button"
            variant="outline"
          >
            Update payment details
          </Button>
        )}
      </div>
    );
  }

  return (
    <form className="mt-4 space-y-4" noValidate onSubmit={submit}>
      {reported && (
        <p className="text-muted-foreground text-sm" role="status">
          {paymentProofSavedMessage}
        </p>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="transaction-id">
          Easypaisa transaction ID *
        </label>
        <Input
          aria-describedby={fieldErrors.transactionId ? "transaction-id-error" : undefined}
          aria-invalid={Boolean(fieldErrors.transactionId)}
          autoComplete="off"
          id="transaction-id"
          maxLength={40}
          onChange={(event) => setTransactionId(event.target.value)}
          placeholder="e.g. 12345678901"
          value={transactionId}
        />
        {fieldErrors.transactionId && (
          <p className="text-destructive mt-1 text-sm" id="transaction-id-error">
            {fieldErrors.transactionId}
          </p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="payment-note">
          Note <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          aria-describedby={fieldErrors.note ? "payment-note-error" : undefined}
          aria-invalid={Boolean(fieldErrors.note)}
          className={textareaClassName}
          id="payment-note"
          maxLength={200}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Anything we should know about your payment"
          value={note}
        />
        {fieldErrors.note && (
          <p className="text-destructive mt-1 text-sm" id="payment-note-error">
            {fieldErrors.note}
          </p>
        )}
      </div>

      {rootError && (
        <p className="text-destructive text-sm" role="alert">
          {rootError}
        </p>
      )}

      <Button className="min-h-11 w-full" disabled={isPending} type="submit">
        {isPending ? "Sending…" : "Submit payment details"}
      </Button>
    </form>
  );
}
