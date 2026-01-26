import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NeonAuthUIProvider, UserButton } from "@/lib/auth/client";
import { authClient } from "@/lib/auth/client";
import { Providers } from "@/components/providers";
import { GlobalVicSidebar } from "@/components/GlobalVicSidebar";
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
  metadataBase: new URL('https://aionysus.wine'),
  title: "Aionysus Wine - AI Sommelier & Fine Wine Shop",
  description: "Discover exceptional wines with your AI sommelier. Browse 3,900+ fine wines including Burgundy Grand Cru, Bordeaux First Growths, and rare vintages.",
  applicationName: 'Aionysus Wine',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    title: 'Aionysus Wine',
  },
  openGraph: {
    type: 'website',
    siteName: 'Aionysus Wine',
    locale: 'en_GB',
  },
  alternates: {
    canonical: 'https://aionysus.wine',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* WebSite Schema for Google Site Name */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Aionysus Wine',
              alternateName: ['Aionysus', 'Aionysus.Wine'],
              url: 'https://aionysus.wine',
              description: 'AI-powered wine sommelier and fine wine marketplace featuring 3,900+ exceptional wines.',
              potentialAction: {
                '@type': 'SearchAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://aionysus.wine/wines?q={search_term_string}',
                },
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NeonAuthUIProvider
          authClient={authClient as any}
          redirectTo="/wines"
          emailOTP
          social={{ providers: ['google'] }}
        >
          <header className="fixed top-0 left-0 right-0 h-14 bg-slate-900/95 backdrop-blur-sm z-[9999] flex items-center justify-between px-6 border-b border-slate-800">
            {/* Logo / Brand */}
            <a href="/" className="flex items-center gap-2 text-white font-semibold text-lg">
              <span className="text-2xl">🍷</span>
              <span>Aionysus</span>
            </a>

            {/* Navigation Links */}
            <nav className="flex items-center gap-6">
              <a href="/" className="text-white/90 hover:text-white text-sm font-medium transition-colors">
                Sommelier
              </a>
              <a href="/wines" className="text-white/90 hover:text-white text-sm font-medium transition-colors">
                Browse Wines
              </a>
              <a href="/cart" className="text-white/90 hover:text-white text-sm font-medium transition-colors">
                Cart
              </a>
              <UserButton size="icon" />
            </nav>
          </header>
          <div className="pt-14">
            <div className="bg-amber-50 border-b border-amber-200 py-1.5 px-4 text-center">
              <p className="text-xs text-amber-800">
                <strong>Beta Platform</strong> — Aionysus is in development. Investment data is illustrative only. Not financial advice.
              </p>
            </div>
            <Providers>
              <GlobalVicSidebar>
                {children}
              </GlobalVicSidebar>
            </Providers>
          </div>
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
