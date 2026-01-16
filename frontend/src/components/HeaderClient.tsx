'use client';

import { authClient, UserButton } from '@/lib/auth/client';
import { VoiceWidget } from './VoiceInput';
import Link from 'next/link';
import { useEffect } from 'react';

export function HeaderClient() {
  const { useSession } = authClient;
  const { data: session, isPending } = useSession();

  const user = session?.user;
  const userContext = user ? {
    id: user.id,
    name: user.name || user.email?.split('@')[0],
    email: user.email,
  } : undefined;

  // Debug: log session state
  useEffect(() => {
    console.log('[Header] Session state:', { isPending, hasUser: !!user, userName: user?.name, userId: user?.id });
  }, [isPending, user]);

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
        <VoiceWidget variant="inline" size="md" user={userContext} />
        <UserButton size="icon" />
      </nav>
    </header>
  );
}
