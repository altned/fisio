/**
 * Onboarding Screen - First-time user introduction to Fisioku Prime Care
 */

import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    Dimensions,
    TouchableOpacity,
    FlatList,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

const ONBOARDING_SLIDES = [
    {
        id: '1',
        image: require('@/assets/images/onboarding/slide1.png'),
        title: 'Fisioterapi di Rumah Anda',
        subtitle: 'Terapis profesional datang langsung ke rumah untuk memberikan perawatan terbaik dengan kenyamanan maksimal.',
    },
    {
        id: '2',
        image: require('@/assets/images/onboarding/slide2.png'),
        title: 'Booking dengan Mudah',
        subtitle: 'Pilih terapis, jadwal, dan lokasi sesuai kebutuhan Anda. Bayar online dengan aman dan praktis.',
    },
    {
        id: '3',
        image: require('@/assets/images/onboarding/slide3.png'),
        title: 'Terapis Bersertifikat',
        subtitle: 'Tim terapis kami terlatih dan bersertifikat. Kesehatan Anda adalah prioritas utama kami.',
    },
];

const ONBOARDING_COMPLETED_KEY = '@fisioku_onboarding_completed';

export default function OnboardingScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const scrollX = useRef(new Animated.Value(0)).current;

    const handleNext = () => {
        if (currentIndex < ONBOARDING_SLIDES.length - 1) {
            flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
        } else {
            completeOnboarding();
        }
    };

    const handleSkip = () => {
        completeOnboarding();
    };

    const completeOnboarding = async () => {
        try {
            await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
            // Small delay to ensure AsyncStorage is saved before navigation
            setTimeout(() => {
                router.replace('/(auth)/login');
            }, 100);
        } catch (e) {
            console.warn('Failed to save onboarding status:', e);
            router.replace('/(auth)/login');
        }
    };

    const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
        if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);
        }
    }).current;

    const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

    const renderSlide = ({ item }: { item: typeof ONBOARDING_SLIDES[0] }) => (
        <View style={styles.slide}>
            <View style={styles.imageContainer}>
                <Image source={item.image} style={styles.image} resizeMode="cover" />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
            </View>
        </View>
    );

    const renderDots = () => (
        <View style={styles.dotsContainer}>
            {ONBOARDING_SLIDES.map((_, index) => {
                const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
                const dotWidth = scrollX.interpolate({
                    inputRange,
                    outputRange: [8, 24, 8],
                    extrapolate: 'clamp',
                });
                const opacity = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.4, 1, 0.4],
                    extrapolate: 'clamp',
                });
                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.dot,
                            {
                                width: dotWidth,
                                opacity,
                                backgroundColor: colors.primary,
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Skip Button */}
            <View style={styles.header}>
                <TouchableOpacity onPress={handleSkip}>
                    <Text style={[styles.skipText, { color: colors.textSecondary }]}>Lewati</Text>
                </TouchableOpacity>
            </View>

            {/* Slides */}
            <Animated.FlatList
                ref={flatListRef}
                data={ONBOARDING_SLIDES}
                renderItem={renderSlide}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                onScroll={Animated.event(
                    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                    { useNativeDriver: false }
                )}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
            />

            {/* Dots & Button */}
            <View style={styles.footer}>
                {renderDots()}
                <TouchableOpacity
                    style={[styles.button, { backgroundColor: colors.primary }]}
                    onPress={handleNext}
                    activeOpacity={0.8}
                >
                    <Text style={styles.buttonText}>
                        {isLastSlide ? 'Mulai Sekarang' : 'Lanjut'}
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
        paddingVertical: Spacing.md,
        alignItems: 'flex-end',
    },
    skipText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
    },
    slide: {
        width,
        flex: 1,
    },
    imageContainer: {
        flex: 0.6,
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        flex: 0.4,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
        alignItems: 'center',
    },
    title: {
        fontSize: Typography.fontSize.xxl,
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
        paddingBottom: Spacing.xl,
        alignItems: 'center',
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
    button: {
        width: '100%',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
    },
});
