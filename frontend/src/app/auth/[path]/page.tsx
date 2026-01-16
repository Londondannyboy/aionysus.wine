'use client';

import { AuthView } from '@/lib/auth/client';
import { use } from 'react';

export default function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = use(params);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-wine-900/50 rounded-2xl border border-wine-800 backdrop-blur">
        <AuthView path={path} />
      </div>
    </main>
  );
}
