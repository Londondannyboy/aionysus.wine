'use client';

import { AuthView } from '@/lib/auth/client';
import { use } from 'react';

export default function AuthPage({ params }: { params: Promise<{ path: string }> }) {
  const { path } = use(params);
  const hasNeonAuth = !!(process.env.NEXT_PUBLIC_NEON_AUTH_URL || process.env.NEON_AUTH_BASE_URL);

  if (!hasNeonAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-gold-300 mb-2">Auth Not Configured</h1>
          <p className="text-wine-300">Set NEON_AUTH_BASE_URL to enable authentication.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-6 bg-wine-900/50 rounded-2xl border border-wine-800 backdrop-blur">
        <AuthView path={path} />
      </div>
    </main>
  );
}
