import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import LayoutWithSidebar from "@/components/LayoutWithSidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Vita Hub",
  description: "Vita Hub",
  icons: {
    icon: [{ url: "/logo.jpg", sizes: "any" }],
    apple: [{ url: "/logo.jpg", sizes: "any" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <LayoutWithSidebar>{children}</LayoutWithSidebar>
      </body>
    </html>
  );
}
