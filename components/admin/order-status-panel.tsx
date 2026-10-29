"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  cancelOrder,
  markOrderDelivered,
  markOrderPaid,
  shipOrder,
} from "@/actions/admin-orders";
import type { OrderStatus } from "@/generated/prisma/client";
import { allowedNextStatuses } from "@/lib/admin-order-status";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Action = "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

const actionCopy: Record<Action, { title: string; description: string; cta: string }> = {
  PAID: {
    title: "Mark as paid",
    description: "Confirm you received the Easypaisa transfer for this order.",
    cta: "Mark paid",
  },
  SHIPPED: {
    title: "Mark as shipped",
    description: "Record the courier and tracking number for this order.",
    cta: "Mark shipped",
  },
  DELIVERED: {
    title: "Mark as delivered",
    description: "Confirm this order has been delivered to the customer.",
    cta: "Mark delivered",
  },
  CANCELLED: {
    title: "Cancel order",
    description: "Cancel this order. Stock for non-made-to-order items is restored once.",
    cta: "Cancel order",
  },
};

const labels: Record<Action, string> = {
  PAID: "Mark as paid",
  SHIPPED: "Mark as shipped",
  DELIVERED: "Mark as delivered",
  CANCELLED: "Cancel order",
};

export function OrderStatusPanel({
  orderNumber,
  status,
}: {
  orderNumber: string;
  status: OrderStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<Action | null>(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [courierName, setCourierName] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [note, setNote] = useState("");

  const nextStatuses = allowedNextStatuses(status);
  const showRefundWarning = activeAction === "CANCELLED" && status === "PAID";

  function openAction(action: Action) {
    setPaymentReference("");
    setCourierName("");
    setTrackingNumber("");
    setNote("");
    setActiveAction(action);
  }

  function runAction(action: Action) {
    startTransition(async () => {
      let result;
      if (action === "PAID") {
        result = await markOrderPaid({ orderNumber, paymentReference });
      } else if (action === "SHIPPED") {
        result = await shipOrder({ orderNumber, courierName, trackingNumber });
      } else if (action === "DELIVERED") {
        result = await markOrderDelivered({ orderNumber });
      } else {
        result = await cancelOrder({ orderNumber, note });
      }

      if (result.success) {
        toast.success(result.message);
        setActiveAction(null);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  if (nextStatuses.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No further status changes are available for this order.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {nextStatuses.map((next) => {
        const action = next as Action;
        const isDanger = action === "CANCELLED";
        return (
          <Button
            disabled={isPending}
            key={action}
            onClick={() => openAction(action)}
            type="button"
            variant={isDanger ? "destructive" : "default"}
          >
            {labels[action]}
          </Button>
        );
      })}

      <Dialog
        onOpenChange={(open) => {
          if (!open) setActiveAction(null);
        }}
        open={activeAction !== null}
      >
        <DialogContent className="sm:max-w-md">
          {activeAction && (
            <>
              <DialogHeader>
                <DialogTitle>{actionCopy[activeAction].title}</DialogTitle>
                <DialogDescription>
                  {actionCopy[activeAction].description}
                </DialogDescription>
              </DialogHeader>

              {showRefundWarning && (
                <p className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                  This order is already <strong>paid</strong>. Cancelling does not
                  refund the customer automatically — you must send the refund
                  manually via Easypaisa. Use the note below to record the refund
                  reference.
                </p>
              )}

              {activeAction === "PAID" && (
                <div className="space-y-2">
                  <Label htmlFor="payment-reference">
                    Payment reference <span className="text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="payment-reference"
                    onChange={(event) => setPaymentReference(event.target.value)}
                    placeholder="Easypaisa transaction ID"
                    value={paymentReference}
                  />
                </div>
              )}

              {activeAction === "SHIPPED" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="courier-name">
                      Courier <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="courier-name"
                      onChange={(event) => setCourierName(event.target.value)}
                      placeholder="e.g. TCS, Leopards"
                      value={courierName}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tracking-number">
                      Tracking number <span className="text-muted-foreground">(optional)</span>
                    </Label>
                    <Input
                      id="tracking-number"
                      onChange={(event) => setTrackingNumber(event.target.value)}
                      placeholder="Tracking number"
                      value={trackingNumber}
                    />
                  </div>
                </div>
              )}

              {activeAction === "CANCELLED" && (
                <div className="space-y-2">
                  <Label htmlFor="cancel-note">
                    Note <span className="text-muted-foreground">(optional{showRefundWarning ? " — refund reference" : ""})</span>
                  </Label>
                  <Input
                    id="cancel-note"
                    onChange={(event) => setNote(event.target.value)}
                    placeholder={showRefundWarning ? "Easypaisa refund reference" : "Reason for cancellation"}
                    value={note}
                  />
                </div>
              )}

              <DialogFooter>
                <DialogClose render={<Button disabled={isPending} variant="outline" />}>
                  Back
                </DialogClose>
                <Button
                  disabled={isPending}
                  onClick={() => runAction(activeAction)}
                  type="button"
                  variant={activeAction === "CANCELLED" ? "destructive" : "default"}
                >
                  {isPending ? "Working…" : actionCopy[activeAction].cta}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
