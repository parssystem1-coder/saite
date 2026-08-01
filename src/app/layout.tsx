import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Providers from "@/components/providers";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: {
    default: "سایت | فروشگاه هوشمند نسل آینده",
    template: "%s | سایت"
  },
  description: "تجربه خرید سه بعدی و هوشمند با استفاده از جدیدترین تکنولوژی‌های روز دنیا و هوش مصنوعی.",
  keywords: ["فروشگاه آنلاین", "خرید هوشمند", "تکنولوژی ۳ بعدی", "هوش مصنوعی", "محصولات دیجیتال"],
  authors: [{ name: "ParsSystem1 Coder" }],
  creator: "ParsSystem1 Coder",
  publisher: "Saite AI Shop",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

import { AIParticles } from "@/components/ui/ai-particles";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazir.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-vazir bg-[#0a0a0c] text-white">
        <Providers>
          <AIParticles />
          <Header />
          <main className="flex-1 pt-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
