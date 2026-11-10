"use client";
import "./globals.css";
import { ErrorPanel } from "@/components/error-panel";

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en" style={{ colorScheme: "light dark" }}>
      <head><title>Something went wrong | Art Passion</title><meta name="robots" content="noindex" /></head>
      <body style={{ margin: 0, minHeight: "100vh", fontFamily: "system-ui, sans-serif", background: "Canvas", color: "CanvasText" }}>
        <ErrorPanel retry={retry} />
      </body>
    </html>
  );
}
