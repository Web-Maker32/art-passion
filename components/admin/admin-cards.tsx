import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "cn";

/** Shared table container: 1px border token, 12px radius, clipped corners. */
export function TableCard({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("bg-card overflow-hidden rounded-[12px] border", className)}
      {...props}
    />
  );
}

/**
 * Section card with a 16px semibold body-font heading, optional description
 * and header actions. Use flush for edge-to-edge content such as tables.
 */
export function SectionCard({
  title,
  description,
  actions,
  children,
  className,
  contentClassName,
  flush = false,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  flush?: boolean;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className={cn("bg-card rounded-[12px] border", className)}
    >
      <header className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold" id={headingId}>
            {title}
          </h2>
          {description && (
            <p className="text-muted-foreground mt-0.5 text-[13px]">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </header>
      <div className={cn(flush ? "" : "p-4 sm:p-5", contentClassName)}>
        {children}
      </div>
    </section>
  );
}