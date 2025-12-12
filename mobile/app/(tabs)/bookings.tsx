/**
 * Bookings List Screen - Shows user's bookings grouped by status
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SectionList,
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

interface BookingSection {
    title: string;
    data: Booking[];
    key: string;
}

export default function BookingsScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { activeRole } = useAuthStore();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const isTherapistRole = activeRole === 'THERAPIST';
    const title = isTherapistRole ? 'Jadwal Sesi' : 'Pesanan';

    const fetchBookings = useCallback(async () => {
        try {
            const data = await api.get<Booking[]>('/bookings/my');
            setBookings(data);
        } catch (error) {
            console.error('Failed to fetch bookings:', error);
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

    // Group bookings by status
    const getSections = useCallback((): BookingSection[] => {
        const active: Booking[] = [];
        const pending: Booking[] = [];
        const completed: Booking[] = [];
        const cancelled: Booking[] = [];

        bookings.forEach(booking => {
            if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
                cancelled.push(booking);
            } else if (booking.status === 'COMPLETED') {
                completed.push(booking);
            } else if (booking.paymentStatus === 'PENDING') {
                pending.push(booking);
            } else {
                active.push(booking);
            }
        });

        const sections: BookingSection[] = [];

        if (active.length > 0) {
            sections.push({ title: '🟢 Aktif', data: active, key: 'active' });
        }
        if (pending.length > 0) {
            sections.push({ title: '⏳ Menunggu Pembayaran', data: pending, key: 'pending' });
        }
        if (completed.length > 0) {
            sections.push({ title: '✅ Selesai', data: completed, key: 'completed' });
        }
        if (cancelled.length > 0) {
            sections.push({ title: '❌ Dibatalkan', data: cancelled, key: 'cancelled' });
        }

        return sections;
    }, [bookings]);

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
        // Always go to booking detail first - detail page handles payment navigation
        router.push({
            pathname: '/(tabs)/booking-detail',
            params: { bookingId: booking.id },
        });
    };

    const renderItem = ({ item }: { item: Booking }) => {
        const firstSession = item.sessions?.[0];
        const scheduledAt = firstSession?.scheduledAt;
        const displayPrice = isTherapistRole ? item.therapistNetTotal : item.totalPrice;
        const priceLabel = isTherapistRole ? 'Pendapatan' : 'Total';

        const displayName = isTherapistRole
            ? item.user?.fullName || 'Pasien'
            : item.therapist?.user?.fullName || 'Terapis';
        const displayLabel = isTherapistRole ? 'Pasien' : 'Terapis';

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
                            {!isTherapistRole && item.paymentStatus !== 'PAID' && (
                                <Badge
                                    label={item.paymentStatus}
                                    variant={getPaymentStatusVariant(item.paymentStatus)}
                                    size="sm"
                                />
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </View>

                    {/* Package & Person */}
                    <Text style={[styles.packageName, { color: colors.text }]}>
                        {item.package?.name || 'Paket'}
                    </Text>
                    <Text style={[styles.therapistName, { color: colors.textSecondary }]}>
                        {displayLabel}: {displayName}
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

                    {/* Footer with price */}
                    <View style={styles.cardFooter}>
                        <View>
                            <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>{priceLabel}</Text>
                            <Text style={[styles.price, { color: isTherapistRole ? colors.success : colors.primary }]}>
                                {formatPrice(displayPrice)}
                            </Text>
                        </View>
                        {!isTherapistRole && item.paymentStatus === 'PENDING' && (
                            <Text style={[styles.pendingHint, { color: colors.warning }]}>
                                Tap untuk bayar
                            </Text>
                        )}
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section }: { section: BookingSection }) => (
        <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
            <Text style={[styles.sectionCount, { color: colors.textMuted }]}>
                {section.data.length} pesanan
            </Text>
        </View>
    );

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
                {/* Status Filter */}
                <View style={[styles.filterContainer, { borderColor: colors.border, backgroundColor: colors.card }]}>
                    <TouchableOpacity
                        style={[styles.filterButton, statusFilter === 'all' && { backgroundColor: colors.primary }]}
                        onPress={() => setStatusFilter('all')}
                    >
                        <Text style={[styles.filterText, statusFilter === 'all' && { color: '#fff' }]}>Semua</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, statusFilter === 'pending' && { backgroundColor: colors.warning }]}
                        onPress={() => setStatusFilter('pending')}
                    >
                        <Text style={[styles.filterText, statusFilter === 'pending' && { color: '#fff' }]}>Pending</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, statusFilter === 'active' && { backgroundColor: colors.success }]}
                        onPress={() => setStatusFilter('active')}
                    >
                        <Text style={[styles.filterText, statusFilter === 'active' && { color: '#fff' }]}>Aktif</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterButton, statusFilter === 'done' && { backgroundColor: colors.textMuted }]}
                        onPress={() => setStatusFilter('done')}
                    >
                        <Text style={[styles.filterText, statusFilter === 'done' && { color: '#fff' }]}>Selesai</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <SectionList
                    sections={getSections().filter(section => {
                        if (statusFilter === 'all') return true;
                        if (statusFilter === 'pending') return section.key === 'pending';
                        if (statusFilter === 'active') return section.key === 'active';
                        if (statusFilter === 'done') return section.key === 'completed' || section.key === 'cancelled';
                        return true;
                    })}
                    renderItem={renderItem}
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    stickySectionHeadersEnabled={false}
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
    filterContainer: {
        flexDirection: 'row',
        marginTop: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    filterButton: {
        flex: 1,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        alignItems: 'center',
    },
    filterText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
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
    priceLabel: {
        fontSize: Typography.fontSize.xs,
        marginBottom: 2,
    },
    pendingHint: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        marginTop: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    sectionCount: {
        fontSize: Typography.fontSize.xs,
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
