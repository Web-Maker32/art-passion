import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Geist_Mono } from "next/font/google";
import { SiteFooter } from "@/components/storefront/site-footer";
import { SiteHeader } from "@/components/storefront/site-header";
import { WhatsAppFloat } from "@/components/storefront/whatsapp-float";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorantGaramond = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  title: {
    default: "Art Passion | the passion of art",
    template: "%s | Art Passion",
  },
  description:
    "Handmade felt play sets, creative kits, and thoughtful gifts, made with passion in Pakistan.",
  openGraph: {
    title: "Art Passion | the passion of art",
    description:
      "Handmade felt play sets, creative kits, and thoughtful gifts, made with passion in Pakistan.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Art Passion - the passion of art",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Art Passion | the passion of art",
    description:
      "Handmade felt play sets, creative kits, and thoughtful gifts, made with passion in Pakistan.",
    images: {
      url: "/og-image.png",
      alt: "Art Passion - the passion of art",
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${cormorantGaramond.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          className="bg-card text-foreground sr-only rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
          href="#main-content"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main className="flex-1 pb-[88px]" id="main-content">
          {children}
        </main>
        <SiteFooter />
        <WhatsAppFloat />
      </body>
    </html>
  );
}
