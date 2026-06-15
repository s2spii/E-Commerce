'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Redirects unauthenticated visitors to the login page (preserving the intended
 * destination via a `redirect` query param). Returns the auth state so callers
 * can render a spinner while the session is being resolved.
 */
export function useRequireAuth() {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !profile) {
      router.replace(`/connexion?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [loading, profile, router, pathname]);

  return { profile, loading };
}
