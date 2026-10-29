---
kind: business_term
name: Business Glossary
category: business_term
scope:
    - '**'
---

### made-to-order
- Definition：A product flag indicating the item is produced only after purchase and should not deduct stock at checkout; when cancelling such an order, stock is not restored.
- Aliases：madeToOrder

### paymentReference
- Definition：Admin-entered identifier for the customer's off-platform Easypaisa wallet transfer, recorded when marking an order PAID.

### OrderEvent
- Definition：Audit trail table recording every status change (and other events) on an order, including from/to status, optional note, and timestamp; used to reconstruct the order history shown in the admin detail view.

### stockRestoredAt
- Definition：Timestamp guard on an order ensuring its stock is restored exactly once when cancelled, even if the cancel action is invoked multiple times.

### WALLET_TRANSFER
- Definition：The sole `PaymentMethod` enum value: the customer pays by transferring funds to the shop's Easypaisa wallet and then notifies the seller; there is no integrated payment gateway.
