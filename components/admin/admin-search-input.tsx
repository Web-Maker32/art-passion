"use client";

import { useId, useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "cn";
import { adminControlClass } from "@/components/admin/admin-controls";
import { Button } from "@/components/ui/button";

/**
 * Search input with a magnifier and a clear button. The value still lives in
 * a named native input, so GET filter forms submit exactly as before.
 */
export function AdminSearchInput({
  name,
  defaultValue = "",
  placeholder = "Search",
  maxLength,
  id,
  className,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
  id?: string;
  className?: string;
}) {
  const autoId = useId();
  const [value, setValue] = useState(defaultValue);

  return (
    <span className={cn("relative block", className)}>
      <Search
        aria-hidden="true"
        className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
      />
      <input
        autoComplete="off"
        className={cn(
          adminControlClass,
          "pr-11 pl-9 [&::-webkit-search-cancel-button]:appearance-none",
        )}
        id={id ?? autoId}
        maxLength={maxLength}
        name={name}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {value !== "" && (
        <span className="absolute inset-y-0 right-0 flex items-center">
          <Button
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground size-11 sm:size-9"
            onClick={() => setValue("")}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </span>
      )}
    </span>
  );
}