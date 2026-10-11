import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

export const metadata: Metadata = {
  title: "وكيل سلمى التعليمي | Salma Educational Agent",
  description:
    "تطبيق تعليمي ثنائي اللغة (عربية/إنجليزية) لمنهج البكالوريا المصرية — مسار الآداب والفنون. Bilingual educational app for the Egyptian Baccalaureate, Arts and Humanities track.",
  applicationName: "Salma Educational Agent",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- deliberate <link> to avoid build-time font fetches */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-dvh bg-edu-bg text-edu-ink antialiased">
        <Providers>
          <Header />
          <main className="mx-auto max-w-2xl px-4 pt-4">{children}</main>
          <Footer />
        </Providers>
        <WhatsAppFloat />
      </body>
    </html>
  );
}