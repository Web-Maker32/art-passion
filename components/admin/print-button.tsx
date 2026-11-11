"use client";

import { Button } from "@/components/ui/button";

/**
 * Opens the browser print dialog for the packing slip. The slip itself is
 * plain markup, so no PDF library is needed.
 */
export function PrintButton() {
  return (
    <Button onClick={() => window.print()} type="button">
      Print
    </Button>
  );
}
