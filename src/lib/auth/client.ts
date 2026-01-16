'use client';

import { createAuthClient } from '@neondatabase/auth/next';

export const authClient = createAuthClient();

// Re-export UI components from @neondatabase/auth
export { NeonAuthUIProvider, AuthView, UserButton, SignedIn, SignedOut } from '@neondatabase/auth/react/ui';

// Also export legacy hooks for backward compatibility
export {
  useAuthData,
  useAuthenticate,
} from '@neondatabase/neon-js/auth/react';
