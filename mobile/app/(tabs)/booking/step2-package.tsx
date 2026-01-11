/**
 * Step 2: Package Selection
 * Enhanced with modern premium card design and better visual hierarchy
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Package } from '@/types';

// Modern icon mapping for packages
const getPackageIcon = (sessionCount: number) => {
    if (sessionCount === 1) return 'flash-outline';
    if (sessionCount <= 4) return 'leaf-outline';
    if (sessionCount <= 8) return 'diamond-outline';
    return 'trophy-outline';
};

const getPackageColor = (index: number) => {
    const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899'];
    return colors[index % colors.length];
};

export default function PackageSelectionScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const params = useLocalSearchParams<{ therapistId: string; therapistName: string }>();

    const [packages, setPackages] = useState<Package[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                const data = await api.get<Package[]>('/packages');
                setPackages(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();
    }, []);

    const handleSelectPackage = (pkg: Package) => {
        router.push({
            pathname: '/(tabs)/booking/step3-schedule',
            params: {
                therapistId: params.therapistId,
                therapistName: params.therapistName,
                packageId: pkg.id,
                packageName: pkg.name,
                totalPrice: pkg.totalPrice,
                sessionCount: pkg.sessionCount.toString(),
            },
        });
    };

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(price));
    };

    const getPricePerSession = (totalPrice: string, sessionCount: number) => {
        const total = Number(totalPrice);
        const perSession = total / sessionCount;
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(perSession);
    };

    const renderItem = ({ item, index }: { item: Package; index: number }) => {
        const accentColor = getPackageColor(index);
        const iconName = getPackageIcon(item.sessionCount);
        const isPopular = item.sessionCount === 4; // Paket 4 sesi biasanya populer
        const isBestValue = item.sessionCount >= 8; // Paket 8+ sesi adalah best value

        return (
            <TouchableOpacity
                onPress={() => handleSelectPackage(item)}
                activeOpacity={0.85}
                style={styles.packageCardWrapper}
            >
                <View style={[
                    styles.packageCard,
                    { backgroundColor: colors.card },
                    (isPopular || isBestValue) && styles.featuredCard
                ]}>
                    {/* Featured Badge */}
                    {isPopular && (
                        <View style={[styles.featuredBadge, { backgroundColor: '#6366F1' }]}>
                            <Ionicons name="star" size={10} color="#fff" />
                            <Text style={styles.featuredBadgeText}>POPULER</Text>
                        </View>
                    )}
                    {isBestValue && !isPopular && (
                        <View style={[styles.featuredBadge, { backgroundColor: '#10B981' }]}>
                            <Ionicons name="pricetag" size={10} color="#fff" />
                            <Text style={styles.featuredBadgeText}>BEST VALUE</Text>
                        </View>
                    )}

                    {/* Top Section with Icon and Name */}
                    <View style={styles.cardTop}>
                        <View style={[styles.packageIconContainer, { backgroundColor: accentColor }]}>
                            <Ionicons name={iconName as any} size={28} color="#fff" />
                        </View>
                        <View style={styles.packageInfo}>
                            <Text style={[styles.packageName, { color: colors.text }]}>{item.name}</Text>
                            <View style={styles.sessionBadge}>
                                <Ionicons name="calendar-outline" size={14} color={accentColor} />
                                <Text style={[styles.sessionText, { color: accentColor }]}>
                                    {item.sessionCount} Sesi
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Features */}
                    <View style={styles.featuresContainer}>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                                {item.sessionCount} × Terapi di Rumah
                            </Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                                90 Menit per Sesi
                            </Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                                Konsultasi Gratis via Chat
                            </Text>
                        </View>
                        {item.sessionCount > 1 && (
                            <View style={styles.featureItem}>
                                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                                <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                                    Fleksibel Jadwal
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Price Section */}
                    <View style={[styles.priceSection, { borderTopColor: colors.border }]}>
                        <View style={styles.priceInfo}>
                            {item.sessionCount > 1 && (
                                <Text style={[styles.perSessionPrice, { color: colors.textMuted }]}>
                                    {getPricePerSession(item.totalPrice, item.sessionCount)}/sesi
                                </Text>
                            )}
                            <Text style={[styles.totalPrice, { color: accentColor }]}>
                                {formatPrice(item.totalPrice)}
                            </Text>
                        </View>
                        <View style={[styles.selectBtn, { backgroundColor: accentColor }]}>
                            <Text style={styles.selectBtnText}>Pilih</Text>
                            <Ionicons name="arrow-forward" size={16} color="#fff" />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Enhanced Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerContent}>
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="cube-outline" size={24} color="#fff" />
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Pilih Paket</Text>
                        <Text style={styles.headerSubtitle}>
                            Terapis: {params.therapistName}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressStep, styles.progressDone]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressStep, styles.progressActive, { backgroundColor: colors.primary }]}>
                    <Text style={styles.progressNumber}>2</Text>
                </View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}>
                    <Text style={[styles.progressNumber, { color: colors.textMuted }]}>3</Text>
                </View>
                <View style={styles.progressLine} />
                <View style={styles.progressStep}>
                    <Text style={[styles.progressNumber, { color: colors.textMuted }]}>4</Text>
                </View>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={packages}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    headerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: Typography.fontSize.sm,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        gap: 0,
    },
    progressStep: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDone: {
        backgroundColor: '#10B981',
    },
    progressActive: {
        backgroundColor: '#2196F3',
    },
    progressNumber: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.bold,
        color: '#fff',
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: '#E5E7EB',
    },
    progressLineDone: {
        backgroundColor: '#10B981',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: Spacing.lg,
        gap: Spacing.lg,
    },
    packageCardWrapper: {
        marginBottom: 0,
    },
    packageCard: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 4,
        position: 'relative',
    },
    featuredCard: {
        borderWidth: 2,
        borderColor: '#6366F1',
    },
    featuredBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderBottomLeftRadius: BorderRadius.md,
        gap: 4,
        zIndex: 1,
    },
    featuredBadgeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: Typography.fontWeight.bold,
    },
    cardTop: {
        flexDirection: 'row',
        padding: Spacing.lg,
        gap: Spacing.md,
        alignItems: 'center',
    },
    packageIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    packageInfo: {
        flex: 1,
    },
    packageName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: 4,
    },
    sessionBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sessionText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    featuresContainer: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        gap: Spacing.xs,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    featureText: {
        fontSize: Typography.fontSize.sm,
    },
    priceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
    },
    priceInfo: {
        flex: 1,
    },
    perSessionPrice: {
        fontSize: Typography.fontSize.xs,
        marginBottom: 2,
    },
    totalPrice: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    selectBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        gap: Spacing.xs,
    },
    selectBtnText: {
        color: '#fff',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
});
