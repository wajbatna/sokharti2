import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CartProvider, LocationProvider, ToastProvider } from "@/components/providers";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "سخرتي SAKHRTI — كلشي لي بغيتي... حتى لباب دارك",
    template: "%s | سخرتي SAKHRTI",
  },
  description:
    "سخرتي منصة التوصيل المغربية: اطلب من المطاعم، البقالة، الصيدليات والمتاجر واستلم طلبك حتى لباب دارك فأقل من 30 دقيقة.",
  keywords: ["توصيل", "مطاعم", "برشيد", "المغرب", "سخرتي", "SAKHRTI", "delivery", "food"],
  openGraph: {
    type: "website",
    locale: "ar_MA",
    title: "سخرتي SAKHRTI — منصة التوصيل المغربية",
    description: "كلشي لي بغيتي... حتى لباب دارك",
    siteName: "سخرتي",
  },
  twitter: { card: "summary_large_image", title: "سخرتي SAKHRTI", description: "كلشي لي بغيتي... حتى لباب دارك" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#FF6B35",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#F7F7F7] text-[#111827] antialiased">
        <ToastProvider>
          <LocationProvider>
            <CartProvider>{children}</CartProvider>
          </LocationProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
