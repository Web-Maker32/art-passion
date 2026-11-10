"use client";
import { ErrorPanel } from "@/components/error-panel";

export default function ErrorPage({ retry }: { error: unknown; retry: () => void }) {
  return <ErrorPanel retry={retry} />;
}
