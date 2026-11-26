"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";

function fallbackCopyText(text: string): boolean {
  if (typeof document === "undefined") return false;
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    document.body.removeChild(textarea);
  }
  return copied;
}

export function CopyNumberButton({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  async function handleCopy() {
    let ok = false;
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(value);
        ok = true;
      } catch {
        ok = fallbackCopyText(value);
      }
    } else {
      ok = fallbackCopyText(value);
    }

    if (ok) {
      setCopied(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setCopied(false);
      }, 2000);
    }
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Button
        aria-label="Copy Easypaisa number"
        className="min-h-11"
        onClick={handleCopy}
        size="sm"
        type="button"
        variant="outline"
      >
        {copied ? (
          <Check aria-hidden="true" className="text-success size-4" />
        ) : (
          <Copy aria-hidden="true" className="size-4" />
        )}
        Copy number
      </Button>
      <span
        aria-live="polite"
        className="text-muted-foreground min-w-14 text-xs font-medium"
      >
        {copied ? "Copied" : ""}
      </span>
    </span>
  );
}
