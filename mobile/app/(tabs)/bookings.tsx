/**
 * Bookings List Screen - Shows user's bookings with payment status
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Card, Badge, getBookingStatusVariant, getPaymentStatusVariant } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Booking } from '@/types';

export default function BookingsScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { activeRole } = useAuthStore();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const title = activeRole === 'THERAPIST' ? 'Jadwal Sesi' : 'Pesanan Saya';

    const fetchBookings = useCallback(async () => {
        try {
            // For patient, we use a different endpoint (user's bookings)
            // For now, get from admin endpoint or user-specific endpoint
            const data = await api.get<Booking[]>('/bookings/my');
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
            // Fallback to empty array - endpoint might not exist yet
            setBookings([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings();
    }, [fetchBookings]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchBookings();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(price));
    };

    const handleBookingPress = (booking: Booking) => {
        // If payment is pending, go to payment screen
        if (booking.paymentStatus === 'PENDING' && booking.status === 'PENDING') {
            router.push({
                pathname: '/(tabs)/booking/step4-payment',
                params: {
                    bookingId: booking.id,
                    totalPrice: booking.totalPrice,
                    therapistName: booking.therapist?.user?.fullName || 'Terapis',
                    packageName: booking.package?.name || 'Paket',
                },
            });
        }
        // TODO: Navigate to booking detail screen
    };

    const renderItem = ({ item }: { item: Booking }) => {
        const firstSession = item.sessions?.[0];
        const scheduledAt = firstSession?.scheduledAt;

        return (
            <TouchableOpacity onPress={() => handleBookingPress(item)} activeOpacity={0.7}>
                <Card style={styles.card}>
                    {/* Header with status badges */}
                    <View style={styles.cardHeader}>
                        <View style={styles.badgeRow}>
                            <Badge
                                label={item.status}
                                variant={getBookingStatusVariant(item.status)}
                                size="sm"
                            />
                            <Badge
                                label={item.paymentStatus}
                                variant={getPaymentStatusVariant(item.paymentStatus)}
                                size="sm"
                            />
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </View>

                    {/* Package & Therapist */}
                    <Text style={[styles.packageName, { color: colors.text }]}>
                        {item.package?.name || 'Paket'}
                    </Text>
                    <Text style={[styles.therapistName, { color: colors.textSecondary }]}>
                        Terapis: {item.therapist?.user?.fullName || '-'}
                    </Text>

                    {/* Schedule */}
                    {scheduledAt && (
                        <View style={styles.scheduleRow}>
                            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                            <Text style={[styles.scheduleText, { color: colors.textSecondary }]}>
                                {formatDate(scheduledAt)}
                            </Text>
                        </View>
                    )}

                    {/* Address preview */}
                    <View style={styles.addressRow}>
                        <Ionicons name="location-outline" size={16} color={colors.textMuted} />
                        <Text
                            style={[styles.addressText, { color: colors.textMuted }]}
                            numberOfLines={1}
                        >
                            {item.lockedAddress}
                        </Text>
                    </View>

                    {/* Footer with price */}
                    <View style={styles.cardFooter}>
                        <Text style={[styles.price, { color: colors.primary }]}>
                            {formatPrice(item.totalPrice)}
                        </Text>
                        {item.paymentStatus === 'PENDING' && (
                            <Text style={[styles.pendingHint, { color: colors.warning }]}>
                                Tap untuk bayar
                            </Text>
                        )}
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Card>
                <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={64} color={colors.textMuted} />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>Belum Ada Pesanan</Text>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {activeRole === 'THERAPIST'
                            ? 'Anda belum memiliki booking saat ini'
                            : 'Buat booking pertama Anda untuk memulai'}
                    </Text>
                </View>
            </Card>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={bookings}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[colors.primary]}
                        />
                    }
                    ListEmptyComponent={renderEmpty}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    card: {
        padding: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    packageName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 2,
    },
    therapistName: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.sm,
    },
    scheduleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.xs,
    },
    scheduleText: {
        fontSize: Typography.fontSize.sm,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    addressText: {
        fontSize: Typography.fontSize.sm,
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.md,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: '#EEEEEE',
    },
    price: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    pendingHint: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    emptyContainer: {
        flex: 1,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    emptyTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginTop: Spacing.md,
    },
    emptyText: {
        fontSize: Typography.fontSize.sm,
        textAlign: 'center',
        marginTop: Spacing.xs,
    },
});
