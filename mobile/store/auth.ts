/**
 * Fisioku Auth Store (Zustand)
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole, AuthResponse } from '../types';
import api from '../lib/api';

interface AuthState {
    user: Partial<User> | null;
    token: string | null;
    refreshToken: string | null;
    isLoggedIn: boolean;
    isLoading: boolean;
    activeRole: UserRole | null;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    register: (data: { email: string; password: string; fullName: string; role?: UserRole }) => Promise<void>;
    logout: () => Promise<void>;
    setActiveRole: (role: UserRole) => void;
    updateUser: (user: Partial<User>) => void;
    hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            refreshToken: null,
            isLoggedIn: false,
            isLoading: false,
            activeRole: null,

            login: async (email: string, password: string) => {
                set({ isLoading: true });
                try {
                    const response = await api.post<AuthResponse>('/auth/login', { email, password }, { skipAuth: true });

                    await api.setToken(response.accessToken);
                    await api.setRefreshToken(response.refreshToken);

                    const role = response.user.role || 'PATIENT';

                    set({
                        user: response.user,
                        token: response.accessToken,
                        refreshToken: response.refreshToken,
                        isLoggedIn: true,
                        activeRole: role,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            loginWithGoogle: async (idToken: string) => {
                set({ isLoading: true });
                try {
                    const response = await api.post<AuthResponse>('/auth/google', { idToken }, { skipAuth: true });

                    await api.setToken(response.accessToken);
                    await api.setRefreshToken(response.refreshToken);

                    const role = response.user.role || 'PATIENT';

                    set({
                        user: response.user,
                        token: response.accessToken,
                        refreshToken: response.refreshToken,
                        isLoggedIn: true,
                        activeRole: role,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            register: async (data) => {
                set({ isLoading: true });
                try {
                    const response = await api.post<AuthResponse>('/auth/register', data, { skipAuth: true });

                    await api.setToken(response.accessToken);
                    await api.setRefreshToken(response.refreshToken);

                    const role = response.user.role || data.role || 'PATIENT';

                    set({
                        user: response.user,
                        token: response.accessToken,
                        refreshToken: response.refreshToken,
                        isLoggedIn: true,
                        activeRole: role,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            logout: async () => {
                // Call logout API to invalidate refresh token on server
                try {
                    await api.post('/auth/logout', {});
                } catch (e) {
                    // Ignore errors - still clear local tokens
                }
                await api.setToken(null);
                await api.setRefreshToken(null);
                set({
                    user: null,
                    token: null,
                    refreshToken: null,
                    isLoggedIn: false,
                    activeRole: null,
                });
            },

            setActiveRole: (role: UserRole) => {
                set({ activeRole: role });
            },

            updateUser: (userData: Partial<User>) => {
                const current = get().user;
                set({ user: { ...current, ...userData } });
            },

            hydrate: async () => {
                // Token will be loaded by API client
                // This is for re-hydrating user state if needed
            },
        }),
        {
            name: 'fisioku-auth',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                refreshToken: state.refreshToken,
                isLoggedIn: state.isLoggedIn,
                activeRole: state.activeRole,
            }),
        }
    )
);

export default useAuthStore;
