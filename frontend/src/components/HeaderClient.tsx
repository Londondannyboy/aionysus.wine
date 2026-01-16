'use client';

import { authClient, UserButton, SignedIn, SignedOut } from '@/lib/auth/client';
import { VoiceInput } from './VoiceInput';
import Link from 'next/link';

export function HeaderClient() {
  const { useSession } = authClient;
  const { data: session } = useSession();

  const user = session?.user;
  const firstName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || null;
  const userId = user?.id || null;

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-wine-950/95 backdrop-blur-sm z-[9999] flex items-center justify-between px-6 border-b border-wine-800">
      <Link href="/" className="flex items-center gap-2 text-gold-300 font-serif text-lg font-bold">
        <span className="text-2xl">🍷</span>
        <span>Aionysus</span>
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/wines" className="text-wine-200 hover:text-gold-300 text-sm font-medium transition-colors">
          Wines
        </Link>
        <SignedIn>
          <VoiceInput firstName={firstName} userId={userId} />
        </SignedIn>
        <SignedOut>
          <VoiceInput firstName={null} userId={null} />
        </SignedOut>
        <UserButton size="icon" />
      </nav>
    </header>
  );
}
