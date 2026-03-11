import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bangalore Event Radar",
  description:
    "Premium event discovery UI for Bangalore with AI recommendations, split map browsing, and startup-grade motion.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>{children}</body>
    </html>
  );
}
