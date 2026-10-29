"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { adminLogin } from "@/actions/admin-login";
import { adminLoginSchema } from "@/lib/admin-order-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export function AdminLoginForm() {
  const [isPending, startTransition] = useTransition();
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

  const submit = handleSubmit((values) => {
    clearErrors();
    startTransition(async () => {
      try {
        const result = await adminLogin(values);
        // On success the server action redirects, so `result` may be undefined.
        if (!result || result.success) return;

        for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
          setError(field as keyof AdminLoginFormValues, { message });
        }
        setError("root", { message: result.message });
      } catch (error) {
        console.error("Admin sign-in failed.", error);
        setError("root", { message: "Invalid email or password." });
      }
    });
  });

  return (
    <form className="space-y-5" noValidate onSubmit={submit}>
      <div className="space-y-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          autoComplete="username"
          id="admin-email"
          inputMode="email"
          type="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-destructive text-sm">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="admin-password">Password</Label>
        <Input
          autoComplete="current-password"
          id="admin-password"
          type="password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        )}
      </div>

      {errors.root && (
        <p className="text-destructive text-sm" role="alert">
          {errors.root.message}
        </p>
      )}

      <Button className="h-9 w-full" disabled={isPending} type="submit">
        {isPending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
