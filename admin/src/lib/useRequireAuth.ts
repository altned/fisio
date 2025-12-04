'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '../store/settings';

const STORAGE_KEY = 'fisioku-admin-settings';

export function useRequireAuth() {
  const router = useRouter();
  const { loggedIn, hydrate } = useSettingsStore();
  const [hydrated, setHydrated] = useState(false);
  const persistedLoggedIn = useRef(false);

  useEffect(() => {
    hydrate();
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as { loggedIn?: boolean };
          persistedLoggedIn.current = !!parsed.loggedIn;
        } catch {
          persistedLoggedIn.current = false;
        }
      }
    }
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!loggedIn && !persistedLoggedIn.current) {
      router.replace('/login');
    }
  }, [hydrated, loggedIn, router]);

  return { ready: hydrated && (loggedIn || persistedLoggedIn.current) };
}
