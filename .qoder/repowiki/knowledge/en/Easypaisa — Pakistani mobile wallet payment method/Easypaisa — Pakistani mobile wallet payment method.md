---
kind: external_dependency
name: Easypaisa — Pakistani mobile wallet payment method
slug: easypaisa
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

The store's only supported payment channel. Orders are marked PAID after an off-platform wallet transfer; the admin records the transaction reference in `Order.paymentReference`. Cancelling a PAID order requires a manual refund through Easypaisa outside the app, captured in the cancellation note.