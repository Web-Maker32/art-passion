"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ScrollReveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (
      !element ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      !("IntersectionObserver" in window)
    ) {
      return;
    }

    if (element.getBoundingClientRect().top <= window.innerHeight) return;

    element.classList.add("scroll-reveal-pending");
    const reveal = () => {
      element.classList.remove("scroll-reveal-pending");
      element.classList.add("scroll-reveal-enter");
      observer.disconnect();
      window.removeEventListener("scroll", revealIfPassed);
    };
    const revealIfPassed = () => {
      if (element.getBoundingClientRect().bottom <= 0) reveal();
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    window.addEventListener("scroll", revealIfPassed, { passive: true });
    observer.observe(element);
    return () => {
      observer?.disconnect();
      window.removeEventListener("scroll", revealIfPassed);
    };
  }, []);

  return (
    <div className={className} data-scroll-reveal="" ref={elementRef}>
      {children}
    </div>
  );
}
