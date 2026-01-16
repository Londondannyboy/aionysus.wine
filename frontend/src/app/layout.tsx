import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { NeonAuthUIProvider, UserButton } from '@/lib/auth/client';
import { authClient } from '@/lib/auth/client';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'Aionysus | AI Wine Sommelier',
  description: 'Discover fine wines with AI-powered investment dashboards. Get drinking windows, investment scores, and expert recommendations.',
  keywords: ['wine', 'fine wine', 'wine investment', 'sommelier', 'AI wine'],
  openGraph: {
    title: 'Aionysus | AI Wine Sommelier',
    description: 'Discover fine wines with AI-powered investment dashboards.',
    url: 'https://aionysus.wine',
    siteName: 'Aionysus',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-gradient-to-br from-wine-950 via-wine-900 to-wine-950 text-white antialiased">
        <NeonAuthUIProvider
          authClient={authClient as any}
          redirectTo="/"
          emailOTP
          social={{ providers: ['google'] }}
        >
          <header className="fixed top-0 left-0 right-0 h-14 bg-wine-950/95 backdrop-blur-sm z-[9999] flex items-center justify-between px-6 border-b border-wine-800">
            <a href="/" className="flex items-center gap-2 text-gold-300 font-serif text-lg font-bold">
              <span className="text-2xl">🍷</span>
              <span>Aionysus</span>
            </a>
            <nav className="flex items-center gap-6">
              <a href="/wines" className="text-wine-200 hover:text-gold-300 text-sm font-medium transition-colors">
                Wines
              </a>
              <UserButton size="icon" />
            </nav>
          </header>
          <div className="pt-14">
            <Providers>{children}</Providers>
          </div>
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
