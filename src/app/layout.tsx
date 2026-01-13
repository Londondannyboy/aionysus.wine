import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NeonAuthUIProvider, UserButton } from "@neondatabase/auth/react";
import { authClient } from "@/lib/auth/client";
import { Providers } from "@/components/providers";
import "./globals.css";
import "@copilotkit/react-ui/styles.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Relocation Quest - AI Relocation Advisor",
  description: "Your voice-first AI guide to moving abroad. Explore destinations, visas, costs, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-stone-950 text-white`}
      >
        <NeonAuthUIProvider
          authClient={authClient!}
          redirectTo="/account/settings"
          emailOTP
        >
          <header className="fixed top-0 left-0 right-0 h-14 bg-stone-950/90 backdrop-blur-sm border-b border-stone-800 z-[9999] flex items-center justify-end px-4">
            <UserButton size="icon" />
          </header>
          <div className="pt-14">
            <Providers>
              {children}
            </Providers>
          </div>
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
