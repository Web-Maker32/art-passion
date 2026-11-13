"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CopyButton({
  text,
  label = "Copy",
}: {
  text: string;
  label?: string;
}) {
  const [message, setMessage] = useState("");
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(text);
            setMessage("Copied.");
          } catch {
            setMessage("Copy unavailable. Select and copy the text manually.");
          }
        }}
      >
        <Copy aria-hidden="true" className="size-4" />
        {label}
      </Button>
      <span role="status" className="text-muted-foreground text-sm">
        {message}
      </span>
    </span>
  );
}
