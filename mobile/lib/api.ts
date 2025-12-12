/**
 * Fisioku API Client
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.207:3000';
const STORAGE_KEY_TOKEN = '@fisioku_token';

interface RequestOptions {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    skipAuth?: boolean;
}

interface ApiError {
    message: string;
    statusCode: number;
}

class ApiClient {
    private token: string | null = null;
    private baseUrl: string;

    constructor(baseUrl: string = API_BASE_URL) {
        this.baseUrl = baseUrl;
        this.loadToken();
    }

    private async loadToken() {
        // Skip loading token during SSR (server-side rendering)
        if (typeof window === 'undefined') {
            return;
        }
        try {
            this.token = await AsyncStorage.getItem(STORAGE_KEY_TOKEN);
        } catch (e) {
            console.warn('Failed to load token:', e);
        }
    }

    async setToken(token: string | null) {
        this.token = token;
        // Skip AsyncStorage operations during SSR
        if (typeof window === 'undefined') {
            return;
        }
        try {
            if (token) {
                await AsyncStorage.setItem(STORAGE_KEY_TOKEN, token);
            } else {
                await AsyncStorage.removeItem(STORAGE_KEY_TOKEN);
            }
        } catch (e) {
            console.warn('Failed to save token:', e);
        }
    }

    getToken() {
        return this.token;
    }

    setBaseUrl(url: string) {
        this.baseUrl = url;
    }

    async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
        const { method = 'GET', body, headers = {}, skipAuth = false } = options;

        const url = `${this.baseUrl}${endpoint}`;

        const requestHeaders: Record<string, string> = {
            'Content-Type': 'application/json',
            ...headers,
        };

        if (!skipAuth && this.token) {
            requestHeaders['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            const response = await fetch(url, {
                method,
                headers: requestHeaders,
                body: body ? JSON.stringify(body) : undefined,
            });

            const data = await response.json();

            if (!response.ok) {
                const error: ApiError = {
                    message: data.message || 'Terjadi kesalahan',
                    statusCode: response.status,
                };

                // Handle specific status codes
                if (response.status === 401) {
                    // Token expired or invalid
                    await this.setToken(null);
                    error.message = 'Sesi berakhir, silakan login kembali';
                } else if (response.status === 403) {
                    error.message = 'Anda tidak memiliki akses';
                } else if (response.status === 429) {
                    error.message = 'Terlalu banyak permintaan, coba lagi nanti';
                }

                throw error;
            }

            return data as T;
        } catch (error) {
            if ((error as ApiError).statusCode) {
                throw error;
            }

            throw {
                message: 'Gagal terhubung ke server',
                statusCode: 0,
            } as ApiError;
        }
    }

    // Convenience methods
    get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
        return this.request<T>(endpoint, { ...options, method: 'GET' });
    }

    post<T>(endpoint: string, body?: Record<string, unknown>, options?: Omit<RequestOptions, 'method'>) {
        return this.request<T>(endpoint, { ...options, method: 'POST', body });
    }

    patch<T>(endpoint: string, body?: Record<string, unknown>, options?: Omit<RequestOptions, 'method'>) {
        return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
    }

    delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>) {
        return this.request<T>(endpoint, { ...options, method: 'DELETE' });
    }

    // =========================================
    // Therapist-specific API methods
    // =========================================

    /**
     * Get bookings for authenticated user (works for both patient and therapist)
     */
    getMyBookings<T>() {
        return this.get<T>('/bookings/my');
    }

    /**
     * Accept a booking (therapist only)
     */
    acceptBooking<T>(bookingId: string, therapistId: string) {
        return this.post<T>('/bookings/accept', { bookingId, therapistId });
    }

    /**
     * Decline a booking (therapist only)
     */
    declineBooking<T>(bookingId: string, therapistId: string) {
        return this.post<T>('/bookings/decline', { bookingId, therapistId });
    }

    /**
     * Get booking detail
     */
    getBookingDetail<T>(bookingId: string) {
        return this.get<T>(`/bookings/${bookingId}`);
    }

    /**
     * Complete a session (therapist only)
     */
    completeSession<T>(sessionId: string, notes?: string) {
        return this.post<T>(`/sessions/${sessionId}/complete`, { notes });
    }

    /**
     * Cancel a session (patient/therapist)
     * If <1hr before session: FORFEITED (therapist still paid)
     * If >1hr before session: restored to PENDING_SCHEDULING
     */
    cancelSession<T>(sessionId: string) {
        return this.post<T>(`/sessions/${sessionId}/cancel`);
    }

    /**
     * Get wallet for authenticated therapist
     */
    getMyWallet<T>() {
        return this.get<T>('/wallets/my');
    }

    /**
     * Get wallet transactions
     */
    getWalletTransactions<T>(walletId: string, page = 1, limit = 20) {
        return this.get<T>(`/wallets/${walletId}/transactions?page=${page}&limit=${limit}`);
    }

    /**
     * Get wallet monthly stats
     */
    getWalletMonthlyStats<T>(walletId: string) {
        return this.get<T>(`/wallets/${walletId}/stats/monthly`);
    }
}

// Singleton instance
export const api = new ApiClient();

export default api;

