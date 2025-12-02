import { create } from 'zustand';

type SettingsState = {
  apiBaseUrl: string;
  adminToken: string;
  setApiBaseUrl: (url: string) => void;
  setAdminToken: (token: string) => void;
  hydrate: () => void;
};

const STORAGE_KEY = 'fisioku-admin-settings';

export const useSettingsStore = create<SettingsState>((set, get) => ({
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  adminToken: process.env.NEXT_PUBLIC_ADMIN_TOKEN || '',
  setApiBaseUrl: (url: string) => {
    set({ apiBaseUrl: url });
    persist({ ...get(), apiBaseUrl: url });
  },
  setAdminToken: (token: string) => {
    set({ adminToken: token });
    persist({ ...get(), adminToken: token });
  },
  hydrate: () => {
    const data = load();
    if (data) set(data);
  },
}));

function persist(state: Pick<SettingsState, 'apiBaseUrl' | 'adminToken'>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function load(): Pick<SettingsState, 'apiBaseUrl' | 'adminToken'> | null {
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
