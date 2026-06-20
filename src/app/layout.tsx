import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { ApiKeyBanner } from "@/components/api-key-banner";
import { AIJudgeNotice } from "@/components/ai-judge-notice";

const inter = Inter({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Shift Sage | Plant Maintenance Memory",
  description:
    "Instant, cited fixes from your plant's own maintenance history. Preserve tribal knowledge before it walks out the door.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans min-h-screen`}>
        <AIJudgeNotice />
        <SiteHeader />
        <ApiKeyBanner />
        <main>{children}</main>
      </body>
    </html>
  );
}
