import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "초광속 테크뉴스",
  description: "미국 테크 기사 실시간 수집, 한국어 번역 및 스타트업 관점 3줄 요약",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" data-theme="nord">
      <body className={`${geistSans.variable} antialiased min-h-screen bg-base-100`}>
        {children}
      </body>
    </html>
  );
}
