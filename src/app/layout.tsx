import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";

const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazir",
});

export const metadata: Metadata = {
  title: "سایت | فروشگاه آنلاین",
  description: "یک فروشگاه مدرن و سریع با Next.js 15",
};

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
      <body className="min-h-full flex flex-col font-vazir">
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
