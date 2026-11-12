"use client"

import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { ChevronDownIcon } from "lucide-react"
import { cn } from "cn"

function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      className={cn("w-full", className)}
      data-slot="accordion"
      {...props}
    />
  )
}

function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      className={cn(
        "border-border/60 relative border-b transition-colors duration-interaction ease-out last:border-b-0 motion-reduce:transition-none",
        "data-[open]:bg-foreground/[0.04]",
        "before:bg-gold-text dark:before:bg-gold-light before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:opacity-0 before:transition-opacity before:duration-interaction data-[open]:before:opacity-100 motion-reduce:before:transition-none",
        className
      )}
      data-slot="accordion-item"
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex min-h-14 w-full flex-1 items-center justify-between gap-4 px-5 py-4 text-left font-semibold transition-colors duration-interaction ease-out sm:px-6",
          "hover-fine:hover:bg-foreground/[0.06] active:bg-foreground/10",
          "focus-visible:outline-ring focus-visible:outline-2 motion-reduce:transition-none",
          "[&[data-panel-open]>svg]:rotate-180",
          className
        )}
        data-slot="accordion-trigger"
        {...props}
      >
        {children}
        <ChevronDownIcon
          aria-hidden="true"
          className="text-gold-text dark:text-gold-light size-5 shrink-0 transition-transform duration-interaction ease-interaction motion-reduce:transition-none"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      className={cn(
        "text-muted-foreground px-5 pb-5 text-base leading-7 sm:px-6",
        className
      )}
      data-slot="accordion-content"
      {...props}
    >
      {children}
    </AccordionPrimitive.Panel>
  )
}

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
}
