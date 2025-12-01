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
  icons: {
    icon: "https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/009f3fa2c79f4b35ae518d568753e59c?ik-sanitizeSvg=true",
    apple: "https://images.crunchbase.com/image/upload/c_pad,h_256,w_256,f_auto,q_auto:eco,dpr_1/009f3fa2c79f4b35ae518d568753e59c?ik-sanitizeSvg=true",
  },
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
