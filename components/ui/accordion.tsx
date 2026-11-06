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
      className={cn("border-border border-b last:border-b-0", className)}
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
          "group focus-visible:outline-ring flex min-h-12 flex-1 items-center justify-between gap-4 rounded-md py-4 text-left font-semibold transition-colors hover-fine:hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 [&[data-panel-open]>svg]:rotate-180",
          className
        )}
        data-slot="accordion-trigger"
        {...props}
      >
        {children}
        <ChevronDownIcon
          aria-hidden="true"
          className="text-muted-foreground size-5 shrink-0 transition-transform duration-interaction ease-interaction motion-reduce:transition-none"
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
        "text-muted-foreground pb-4 text-sm leading-7",
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
