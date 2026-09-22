import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    template: "%s | RenewIt",
    default: "RenewIt — Never Miss a Renewal",
  },
  description:
    "Track and manage all your renewal dates in one place. Get automated email reminders before your driving license, insurance, subscriptions, and more expire.",
  keywords: ["renewal reminder", "expiry tracker", "driving license", "insurance renewal", "Nepal"],
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
