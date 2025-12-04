import { create } from 'zustand';

type SettingsState = {
  apiBaseUrl: string;
  adminToken: string;
  loggedIn: boolean;
  setApiBaseUrl: (url: string) => void;
  setAdminToken: (token: string) => void;
  setLoggedIn: (loggedIn: boolean) => void;
  logout: () => void;
  hydrate: () => void;
};

const STORAGE_KEY = 'fisioku-admin-settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  adminToken: process.env.NEXT_PUBLIC_ADMIN_TOKEN || '',
  loggedIn: false,
  setApiBaseUrl: (url: string) => {
    set({ apiBaseUrl: url });
    persist({ ...get(), apiBaseUrl: url });
  },
  setAdminToken: (token: string) => {
    set({ adminToken: token });
    persist({ ...get(), adminToken: token });
  },
  setLoggedIn: (loggedIn: boolean) => {
    set({ loggedIn });
    persist({ ...get(), loggedIn });
  },
  logout: () => {
    set({ loggedIn: false, adminToken: '', apiBaseUrl: '' });
    persist({ apiBaseUrl: '', adminToken: '', loggedIn: false });
  },
  hydrate: () => {
    const data = load();
    if (data) set(data);
  },
}));

type Persisted = Pick<SettingsState, 'apiBaseUrl' | 'adminToken' | 'loggedIn'>;

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
