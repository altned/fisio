import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '@/constants/Storage';

interface OnboardingContextType {
    isLoading: boolean;
    hasCompletedOnboarding: boolean;
    completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

    // Check onboarding status on mount
    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const completed = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
                console.log('[OnboardingContext] Checked status:', completed);
                setHasCompletedOnboarding(completed === 'true');
            } catch (e) {
                console.warn('[OnboardingContext] Failed to check status:', e);
                // Default to completed to avoid blocking users
                setHasCompletedOnboarding(true);
            } finally {
                setIsLoading(false);
            }
        };

        checkOnboarding();
    }, []);

    // Function to complete onboarding - updates BOTH storage AND state
    const completeOnboarding = useCallback(async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
            console.log('[OnboardingContext] Saved completion to storage');
            // Update state IMMEDIATELY so navigation guard sees the new value
            setHasCompletedOnboarding(true);
        } catch (e) {
            console.error('[OnboardingContext] Failed to save:', e);
            // Still update state to allow navigation
            setHasCompletedOnboarding(true);
            throw e;
        }
    }, []);

    return (
        <OnboardingContext.Provider value={{ isLoading, hasCompletedOnboarding, completeOnboarding }}>
            {children}
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
