import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { NeonAuthUIProvider } from '@/lib/auth/client';
import { authClient } from '@/lib/auth/client';
import { HeaderClient } from '@/components/HeaderClient';

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
          <HeaderClient />
          <div className="pt-14">
            <Providers>{children}</Providers>
          </div>
        </NeonAuthUIProvider>
      </body>
    </html>
  );
}
