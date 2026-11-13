"use client";

import { useEffect, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CircleAlert, Clock, Eye, EyeOff } from "lucide-react";
import { adminLogin } from "@/actions/admin-login";
import { adminLoginSchema } from "@/lib/admin-order-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

/** Human-friendly wait time for the rate-limit notice (display only). */
function formatWait(seconds: number): string {
  if (seconds >= 60) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
}

export function AdminLoginForm() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  // Count the rate-limit wait down once per second. This only changes the
  // displayed notice; the server still enforces the limit and its delay.
  useEffect(() => {
    if (retryAfter === null || retryAfter <= 0) return;
    const timer = setTimeout(() => setRetryAfter((s) => (s ?? 1) - 1), 1000);
    return () => clearTimeout(timer);
  }, [retryAfter]);

  const submit = handleSubmit((values) => {
    clearErrors();
    setRetryAfter(null);
    startTransition(async () => {
      try {
        const result = await adminLogin(values);
        // On success the server action redirects, so `result` may be undefined.
        if (!result || result.success) return;

        for (const [field, message] of Object.entries(
          result.fieldErrors ?? {},
        )) {
          setError(field as keyof AdminLoginFormValues, { message });
        }
        setError("root", { message: result.message });
        if (result.retryAfterSeconds) setRetryAfter(result.retryAfterSeconds);
      } catch (error) {
        console.error("Admin sign-in failed.", error);
        setError("root", { message: "Invalid email or password." });
      }
    });
  });

  const rateLimited = retryAfter !== null && retryAfter > 0;

  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          autoComplete="username"
          id="admin-email"
          inputMode="email"
          type="email"
          className="h-11"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "admin-email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-destructive text-sm" id="admin-email-error">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-password">Password</Label>
        <div className="relative">
          <Input
            autoComplete="current-password"
            id="admin-password"
            type={showPassword ? "text" : "password"}
            className="h-11 pr-12"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? "admin-password-error" : undefined
            }
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((shown) => !shown)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="text-muted-foreground hover-fine:hover:text-foreground focus-visible:outline-ring absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 motion-reduce:transition-none"
          >
            {showPassword ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-destructive text-sm" id="admin-password-error">
            {errors.password.message}
          </p>
        )}
      </div>

      {errors.root && (
        <div
          className="border-destructive/30 bg-destructive/10 text-destructive flex items-start gap-3 rounded-xl border p-4 text-sm leading-6"
          role="alert"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <p>{errors.root.message}</p>
        </div>
      )}

      {rateLimited && (
        <div
          className="border-warning/40 bg-warning/10 text-foreground flex items-start gap-3 rounded-xl border p-4 text-sm leading-6"
          role="status"
          aria-live="polite"
        >
          <Clock
            aria-hidden="true"
            className="text-warning mt-0.5 size-5 shrink-0"
          />
          <p>
            You can try again in{" "}
            <span className="font-semibold">{formatWait(retryAfter)}</span>.
          </p>
        </div>
      )}

      <Button className="h-11 w-full" disabled={isPending} type="submit">
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
