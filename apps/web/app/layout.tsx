import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ExtractBench",
  description:
    "Evaluation harness measuring structured extraction accuracy across 18 real-world procurement documents.",
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
