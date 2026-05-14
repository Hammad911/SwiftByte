import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppProviders } from "@/components/app-providers";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

const geist = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900"
});

export const metadata: Metadata = {
  title: "SwiftBite — Order food online",
  description: "Discover restaurants and track deliveries"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} min-h-screen font-sans antialiased`}>
        <AppProviders>
          <SiteHeader />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
