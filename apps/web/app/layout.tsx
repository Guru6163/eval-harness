import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ExtractBench — Extraction evaluation harness",
  description:
    "Measure structured extraction accuracy across synthetic procurement documents—quotes, RFQs, and purchase orders.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} bg-cream text-ink antialiased`}>
        {children}
      </body>
    </html>
  );
}
