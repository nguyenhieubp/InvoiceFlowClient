import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vita Hub",
  description: "Vita Hub",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <nav className="bg-gray-800 text-white p-4">
          <div className="container mx-auto flex gap-6">
            <Link href="/" className="font-bold text-xl">
              Vita Hub
            </Link>
            <Link href="/sales" className="hover:text-gray-300">
              Đơn hàng
            </Link>
            <Link href="/invoices" className="hover:text-gray-300">
              Hóa đơn
            </Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}

