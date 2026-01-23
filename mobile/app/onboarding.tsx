/**
 * Onboarding Screen - Simple state-based slides
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Dimensions,
    Image,
    TouchableOpacity,
    ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

interface OnboardingSlide {
    id: string;
    title: string;
    subtitle: string;
    image: ImageSourcePropType;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
    {
        id: '1',
        title: 'Fisioterapi di Rumah',
        subtitle: 'Layanan fisioterapi profesional langsung ke rumah Anda. Tidak perlu repot ke klinik.',
        image: require('@/assets/images/onboarding/slide1.jpg'),
    },
    {
        id: '2',
        title: 'Booking Mudah',
        subtitle: 'Pilih terapis, jadwal, dan lokasi. Semudah memesan ojek online!',
        image: require('@/assets/images/onboarding/slide2.jpg'),
    },
    {
        id: '3',
        title: 'Terapis Bersertifikat',
        subtitle: 'Semua terapis kami memiliki STR aktif dan pengalaman minimal 2 tahun.',
        image: require('@/assets/images/onboarding/slide3.jpg'),
    },
];

export default function OnboardingScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { completeOnboarding: contextCompleteOnboarding } = useOnboarding();

    const [currentIndex, setCurrentIndex] = useState(0);
    const [isCompleting, setIsCompleting] = useState(false);
    const isNavigatingRef = useRef(false);

    const handleNext = () => {
        if (isCompleting) return;

        if (currentIndex < ONBOARDING_SLIDES.length - 1) {
            setCurrentIndex(currentIndex + 1);
        } else {
            finishOnboarding();
        }
    };

    const handleSkip = () => {
        if (isCompleting) return;
        finishOnboarding();
    };

    const finishOnboarding = async () => {
        // Prevent double navigation
        if (isNavigatingRef.current) return;
        isNavigatingRef.current = true;
        setIsCompleting(true);

        try {
            // This updates BOTH AsyncStorage AND shared context state
            await contextCompleteOnboarding();
            console.log('[Onboarding] Completion saved, navigating...');

            // Navigation guard in _layout will now see hasCompletedOnboarding=true
            // and redirect us to login automatically
            router.replace('/(auth)/login');
        } catch (e) {
            console.error('[Onboarding] Failed:', e);
            // Context already updated state even on error, so navigation should work
            router.replace('/(auth)/login');
        }
    };

    const currentSlide = ONBOARDING_SLIDES[currentIndex];
    const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Skip Button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={[styles.skipText, { color: colors.textSecondary }]}>Lewati</Text>
                </TouchableOpacity>
            </View>

            {/* Current Slide */}
            <View style={styles.slideContainer}>
                <View style={styles.imageContainer}>
                    <Image source={currentSlide.image} style={styles.image} resizeMode="cover" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={[styles.title, { color: colors.text }]}>{currentSlide.title}</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{currentSlide.subtitle}</Text>
                </View>
            </View>

            {/* Dots & Button */}
            <View style={styles.footer}>
                {/* Dots */}
                <View style={styles.dotsContainer}>
                    {ONBOARDING_SLIDES.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: index === currentIndex ? colors.primary : colors.border,
                                    width: index === currentIndex ? 24 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>

                <TouchableOpacity
                    style={[
                        styles.button,
                        { backgroundColor: colors.primary },
                        isCompleting && { opacity: 0.6 }
                    ]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                    disabled={isCompleting}
                >
                    <Text style={styles.buttonText}>
                        {isCompleting ? 'Memuat...' : isLastSlide ? 'Mulai Sekarang' : 'Lanjut'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        alignItems: 'flex-end',
    },
    skipText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
    },
    slideContainer: {
        flex: 1,
    },
    imageContainer: {
        height: height * 0.45,
        width: width,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xl * 2,
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: Spacing.xl,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    button: {
        width: '100%',
        paddingVertical: Spacing.md + 4,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
});
