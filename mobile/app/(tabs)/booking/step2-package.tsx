/**
 * Step 2: Package Selection
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
import { Card, Badge } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Package } from '@/types';

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
        // Navigate to schedule & address step
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

    const renderItem = ({ item }: { item: Package }) => (
        <TouchableOpacity
            onPress={() => handleSelectPackage(item)}
            activeOpacity={0.7}
        >
            <Card style={styles.card} shadow>
                <View style={styles.header}>
                    <Text style={[styles.packageName, { color: colors.text }]}>{item.name}</Text>
                    {item.sessionCount > 1 && (
                        <Badge label="HEMAT" variant="success" size="sm" />
                    )}
                </View>

                <View style={styles.details}>
                    <View style={styles.detailItem}>
                        <Ionicons name="medical" size={20} color={colors.primary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            {item.sessionCount} Sesi Terapi
                        </Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Ionicons name="time" size={20} color={colors.primary} />
                        <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                            90 Menit / Sesi
                        </Text>
                    </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.footer}>
                    <View>
                        <Text style={[styles.priceLabel, { color: colors.textMuted }]}>Total Harga</Text>
                        <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(item.totalPrice)}</Text>
                    </View>
                    <Ionicons name="arrow-forward-circle" size={32} color={colors.primary} />
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.subHeader}>
                <Text style={[styles.selectedTherapist, { color: colors.textSecondary }]}>
                    Terapis: <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{params.therapistName}</Text>
                </Text>
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
                    ListHeaderComponent={
                        <Text style={[styles.listTitle, { color: colors.text }]}>Pilih Paket Layanan</Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    subHeader: {
        padding: Spacing.md,
        backgroundColor: 'rgba(33, 150, 243, 0.1)',
    },
    selectedTherapist: {
        fontSize: Typography.fontSize.sm,
        textAlign: 'center',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    listTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.sm,
    },
    card: {
        padding: 0,
    },
    header: {
        padding: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    packageName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    details: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
        gap: Spacing.sm,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    detailText: {
        fontSize: Typography.fontSize.md,
    },
    divider: {
        height: 1,
    },
    footer: {
        padding: Spacing.md,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FAFAFA',
        borderBottomLeftRadius: BorderRadius.lg,
        borderBottomRightRadius: BorderRadius.lg,
    },
    priceLabel: {
        fontSize: Typography.fontSize.xs,
    },
    price: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
});
