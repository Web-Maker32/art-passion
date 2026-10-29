---
kind: external_dependency
name: Cloudinary — image hosting
slug: cloudinary
category: external_dependency
category_hints:
    - vendor_identity
scope:
    - '**'
---

Image asset host for product photos. Credentials split between server (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) and client (`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`). Used to serve product images referenced from the seeded catalog.