import { create } from 'zustand';

type SettingsState = {
  adminToken: string;
  loggedIn: boolean;
  setAdminToken: (token: string) => void;
  setLoggedIn: (loggedIn: boolean) => void;
  logout: () => void;
  hydrate: () => void;
};

const STORAGE_KEY = 'fisioku-admin-settings';

// Use .env for API base URL - no manual input needed
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  adminToken: '',
  loggedIn: false,
  setAdminToken: (token: string) => {
    set({ adminToken: token });
    persist({ ...get(), adminToken: token });
  },
  setLoggedIn: (loggedIn: boolean) => {
    set({ loggedIn });
    persist({ ...get(), loggedIn });
  },
  logout: () => {
    set({ loggedIn: false, adminToken: '' });
    persist({ adminToken: '', loggedIn: false });
  },
  hydrate: () => {
    const data = load();
    if (data) set(data);
  },
}));

type Persisted = Pick<SettingsState, 'adminToken' | 'loggedIn'>;

function persist(state: Persisted) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load(): Persisted | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load settings from storage', err);
    return null;
  }
}

