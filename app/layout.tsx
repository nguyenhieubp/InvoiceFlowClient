import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWithSidebar from "@/components/LayoutWithSidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "InvoiceFlow",
  description: "Invoice management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-sans antialiased`}
      >
        <LayoutWithSidebar>
          {children}
        </LayoutWithSidebar>
      </body>
    </html>
  );
}
