import { FloatingSidebar } from "@/components/layout/FloatingSidebar";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hookified - Zapier for Blockchain",
  description: "Automate blockchain workflows with Hookified",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <FloatingSidebar />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
