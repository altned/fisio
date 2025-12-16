/**
 * Promo Banner Carousel Component
 * Displays promotional package banners on patient dashboard
 */

import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Image,
    TouchableOpacity,
    Dimensions,
    ActivityIndicator,
    Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadow } from '@/constants/Theme';
import api, { API_BASE_URL } from '@/lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;
const BANNER_HEIGHT = BANNER_WIDTH * 9 / 16; // 16:9 aspect ratio
const SCROLL_ANIMATION_DURATION = 800; // Slow motion animation - 800ms

// Helper to get full image URL (handles both relative paths and full URLs)
function getImageUrl(url: string | null): string | null {
    if (!url) return null;
    // If already a full URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // Fix localhost for mobile - replace with API_BASE_URL
        if (url.includes('localhost')) {
            return url.replace(/http:\/\/localhost:\d+/, API_BASE_URL);
        }
        return url;
    }
    // If relative path, prepend API base URL
    return `${API_BASE_URL}${url}`;
}

type PromoPackage = {
    id: string;
    name: string;
    sessionCount: number;
    totalPrice: string;
    promoImageUrl: string | null;
};

export function PromoBannerCarousel() {
    const router = useRouter();
    const colors = Colors.light;
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollX = useRef(new Animated.Value(0)).current;
    const [promos, setPromos] = useState<PromoPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        loadPromos();
    }, []);

    // Smooth animated scroll function
    const smoothScrollTo = (targetX: number) => {
        const startX = activeIndex * (BANNER_WIDTH + Spacing.md);
        const animValue = new Animated.Value(0);

        animValue.addListener(({ value }) => {
            const currentX = startX + (targetX - startX) * value;
            scrollViewRef.current?.scrollTo({ x: currentX, animated: false });
        });

        Animated.timing(animValue, {
            toValue: 1,
            duration: SCROLL_ANIMATION_DURATION,
            useNativeDriver: false,
        }).start(() => {
            animValue.removeAllListeners();
        });
    };

    // Auto-scroll carousel with smooth animation
    useEffect(() => {
        if (promos.length <= 1) return;

        const interval = setInterval(() => {
            const nextIndex = (activeIndex + 1) % promos.length;
            const targetX = nextIndex * (BANNER_WIDTH + Spacing.md);
            smoothScrollTo(targetX);
            setActiveIndex(nextIndex);
        }, 6000); // Wait 6 seconds between slides

        return () => clearInterval(interval);
    }, [activeIndex, promos.length]);

    const loadPromos = async () => {
        try {
            console.log('[PromoBanner] Loading promos...');
            const data = await api.get<PromoPackage[]>('/packages/promos');
            console.log('[PromoBanner] Data received:', JSON.stringify(data));
            setPromos(data || []);
        } catch (err) {
            console.error('[PromoBanner] Failed to load promos:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleScroll = (event: any) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(contentOffsetX / (BANNER_WIDTH + Spacing.md));
        setActiveIndex(index);
    };

    const handleBannerPress = () => {
        // Navigate to booking tab
        router.push('/(tabs)/booking');
    };

    const formatPrice = (price: string) => {
        const num = parseFloat(price);
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(num);
    };

    // Alternating colors for fallback banners
    const bannerColors = [
        '#FF6B35', // Orange
        '#4A69E2', // Blue
        '#F76E11', // Vibrant Orange
        '#0891B2', // Teal
    ];

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.backgroundSecondary }]}>
                <ActivityIndicator size="small" color="#FF6B35" />
            </View>
        );
    }

    if (promos.length === 0) {
        return null; // Don't render if no promos
    }

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled={false}
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={8}
                decelerationRate={0.9}
                snapToInterval={BANNER_WIDTH + Spacing.md}
                snapToAlignment="start"
                contentContainerStyle={styles.scrollContent}
                bounces={true}
                overScrollMode="always"
            >
                {promos.map((promo, index) => (
                    <TouchableOpacity
                        key={promo.id}
                        activeOpacity={0.95}
                        onPress={handleBannerPress}
                        style={styles.bannerContainer}
                    >
                        {getImageUrl(promo.promoImageUrl) ? (
                            <Image
                                source={{ uri: getImageUrl(promo.promoImageUrl)! }}
                                style={styles.bannerImage}
                                resizeMode="cover"
                            />
                        ) : (
                            // Fallback gradient banner with alternating colors
                            <View style={[styles.fallbackBanner, { backgroundColor: bannerColors[index % bannerColors.length] }]}>
                                <View style={styles.fallbackOverlay}>
                                    <Text style={styles.fallbackTitle}>{promo.name}</Text>
                                    <Text style={styles.fallbackPrice}>
                                        {formatPrice(promo.totalPrice)} / {promo.sessionCount} sesi
                                    </Text>
                                    <View style={styles.ctaButton}>
                                        <Text style={styles.fallbackCta}>Pesan Sekarang →</Text>
                                    </View>
                                </View>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Pagination Dots with orange accent */}
            {promos.length > 1 && (
                <View style={styles.pagination}>
                    {promos.map((_, index) => (
                        <View
                            key={index}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: index === activeIndex ? '#FF6B35' : '#E5E7EB',
                                    width: index === activeIndex ? 24 : 8,
                                    transform: [{ scale: index === activeIndex ? 1 : 0.9 }],
                                },
                            ]}
                        />
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.lg,
    },
    loadingContainer: {
        height: BANNER_HEIGHT,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    scrollContent: {
        paddingHorizontal: 0,
    },
    bannerContainer: {
        width: BANNER_WIDTH,
        height: BANNER_HEIGHT,
        marginRight: Spacing.md,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        ...Shadow.md,
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    fallbackBanner: {
        width: '100%',
        height: '100%',
        padding: Spacing.lg,
        justifyContent: 'flex-end',
    },
    fallbackOverlay: {
        // Container for text content on fallback banner
    },
    fallbackTitle: {
        fontSize: Typography.fontSize['2xl'] || 24,
        fontWeight: Typography.fontWeight.bold,
        color: '#fff',
        marginBottom: Spacing.xs,
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    fallbackPrice: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        color: 'rgba(255,255,255,0.95)',
        marginBottom: Spacing.md,
    },
    ctaButton: {
        backgroundColor: 'rgba(255,255,255,0.25)',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full || 999,
        alignSelf: 'flex-start',
    },
    fallbackCta: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.bold,
        color: '#fff',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    dot: {
        height: 8,
        borderRadius: 4,
        marginHorizontal: 4,
    },
});

export default PromoBannerCarousel;
