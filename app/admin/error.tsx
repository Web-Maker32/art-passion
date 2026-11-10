"use client";
import { ErrorPanel } from "@/components/error-panel";

export default function AdminError({ retry }: { error: unknown; retry: () => void }) {
  return <ErrorPanel retry={retry} admin />;
}
