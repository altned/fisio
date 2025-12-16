/**
 * Booking Detail Screen - For viewing booking details and managing sessions
 * Accessed from bookings list by both patient and therapist
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Card, Badge, getBookingStatusVariant, Button } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Booking, Session } from '@/types';

// Format currency
function formatCurrency(amount: string | number): string {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(num);
}

// Format date
function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// Get session status info
function getSessionStatusInfo(status: string): { label: string; color: string; icon: string } {
    const colors = Colors.light;
    switch (status) {
        case 'SCHEDULED':
            return { label: 'Terjadwal', color: colors.info, icon: 'calendar' };
        case 'COMPLETED':
            return { label: 'Selesai', color: colors.success, icon: 'checkmark-circle' };
        case 'PENDING_SCHEDULING':
            return { label: 'Menunggu Jadwal', color: colors.warning, icon: 'time' };
        case 'FORFEITED':
            return { label: 'Hangus', color: colors.error, icon: 'close-circle' };
        case 'EXPIRED':
            return { label: 'Kadaluarsa', color: colors.textMuted, icon: 'alert-circle' };
        case 'CANCELLED':
            return { label: 'Dibatalkan', color: colors.error, icon: 'close-circle' };
        default:
            return { label: status, color: colors.textSecondary, icon: 'help-circle' };
    }
}

// Session Card Component
function SessionCard({
    session,
    isTherapist,
    hasReviewed,
    onComplete,
    onCancel,
    onReview,
    isLoading,
}: {
    session: Session;
    isTherapist: boolean;
    hasReviewed: boolean;
    onComplete: () => void;
    onCancel: () => void;
    onReview: () => void;
    isLoading: boolean;
}) {
    const colors = Colors.light;
    const statusInfo = getSessionStatusInfo(session.status);
    const isScheduled = session.status === 'SCHEDULED';
    const isCompleted = session.status === 'COMPLETED';
    const canComplete = isTherapist && isScheduled;
    const canCancel = !isTherapist && isScheduled; // Patient can cancel scheduled sessions
    const canReview = !isTherapist && isCompleted && !hasReviewed; // Patient can review completed sessions if not reviewed yet

    return (
        <View style={[styles.sessionCard, { borderColor: colors.border }]}>
            <View style={styles.sessionHeader}>
                <View style={[styles.sessionNumber, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.sessionNumberText, { color: colors.primary }]}>
                        {session.sequenceOrder}
                    </Text>
                </View>
                <View style={styles.sessionInfo}>
                    <Text style={[styles.sessionLabel, { color: colors.textSecondary }]}>
                        Sesi ke-{session.sequenceOrder}
                    </Text>
                    <View style={styles.sessionStatusRow}>
                        <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
                        <Text style={[styles.sessionStatus, { color: statusInfo.color }]}>
                            {statusInfo.label}
                        </Text>
                    </View>
                </View>
                {session.isPayoutDistributed && (
                    <View style={[styles.payoutBadge, { backgroundColor: colors.successLight }]}>
                        <Ionicons name="wallet" size={12} color={colors.success} />
                        <Text style={[styles.payoutBadgeText, { color: colors.success }]}>Paid</Text>
                    </View>
                )}
            </View>

            {session.scheduledAt && (
                <View style={styles.sessionSchedule}>
                    <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.sessionScheduleText, { color: colors.text }]}>
                        {formatDate(session.scheduledAt)}
                    </Text>
                </View>
            )}

            {/* Action Buttons */}
            {(canComplete || canCancel || canReview) && (
                <View style={styles.sessionActions}>
                    {canComplete && (
                        <TouchableOpacity
                            style={[styles.sessionActionButton, { backgroundColor: colors.success }]}
                            onPress={onComplete}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="checkmark" size={18} color="#fff" />
                                    <Text style={styles.sessionActionButtonText}>Selesaikan</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    {canCancel && (
                        <TouchableOpacity
                            style={[styles.sessionActionButton, { backgroundColor: colors.error }]}
                            onPress={onCancel}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <>
                                    <Ionicons name="close" size={18} color="#fff" />
                                    <Text style={styles.sessionActionButtonText}>Batalkan</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}
                    {canReview && (
                        <TouchableOpacity
                            style={[styles.sessionActionButton, { backgroundColor: colors.primary }]}
                            onPress={onReview}
                            disabled={isLoading}
                        >
                            <Ionicons name="star" size={18} color="#fff" />
                            <Text style={styles.sessionActionButtonText}>Beri Review</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </View>
    );
}


export default function BookingDetailScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const params = useLocalSearchParams<{ bookingId: string }>();
    const { activeRole } = useAuthStore();
    const isTherapist = activeRole === 'THERAPIST';

    const [booking, setBooking] = useState<Booking | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Fetch booking detail
    const fetchBooking = useCallback(async () => {
        if (!params.bookingId) {
            setError('Booking ID tidak ditemukan');
            setIsLoading(false);
            return;
        }

        try {
            setError(null);
            const data = await api.getBookingDetail<Booking>(params.bookingId);
            setBooking(data);
        } catch (err: any) {
            console.error('Failed to fetch booking:', err);
            setError(err.message || 'Gagal memuat detail booking');
        } finally {
            setIsLoading(false);
        }
    }, [params.bookingId]);

    useEffect(() => {
        fetchBooking();
    }, [fetchBooking]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchBooking();
        setRefreshing(false);
    }, [fetchBooking]);

    // Handle complete session - navigate to notes screen
    const handleCompleteSession = (session: Session) => {
        router.push({
            pathname: '/session-complete',
            params: {
                sessionId: session.id,
                bookingId: params.bookingId,
                patientName: booking?.user?.fullName || 'Pasien',
                packageName: booking?.package?.name || 'Paket',
            },
        });
    };

    // Handle cancel session with confirmation
    const handleCancelSession = (session: Session) => {
        const scheduledAt = session.scheduledAt ? new Date(session.scheduledAt) : null;
        const now = new Date();
        const hoursUntil = scheduledAt ? (scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60) : 0;

        const isForfeit = hoursUntil < 1;
        const confirmMessage = isForfeit
            ? 'Pembatalan kurang dari 1 jam sebelum sesi akan menyebabkan sesi HANGUS dan terapis tetap mendapat bayaran. Lanjutkan?'
            : 'Apakah Anda yakin ingin membatalkan sesi ini? Jadwal akan dikembalikan ke status pending.';

        Alert.alert(
            'Batalkan Sesi',
            confirmMessage,
            [
                { text: 'Tidak', style: 'cancel' },
                {
                    text: isForfeit ? 'Ya, Batalkan (Hangus)' : 'Ya, Batalkan',
                    style: 'destructive',
                    onPress: async () => {
                        setLoadingSessionId(session.id);
                        try {
                            await api.cancelSession(session.id);
                            Alert.alert('Berhasil', isForfeit
                                ? 'Sesi telah dibatalkan dan dihanguskan.'
                                : 'Sesi berhasil dibatalkan.');
                            await fetchBooking(); // Refresh data
                        } catch (err: any) {
                            Alert.alert('Gagal', err.message || 'Gagal membatalkan sesi');
                        } finally {
                            setLoadingSessionId(null);
                        }
                    },
                },
            ],
        );
    };

    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <Stack.Screen options={{ title: 'Detail Booking' }} />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                        Memuat detail...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !booking) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
                <Stack.Screen options={{ title: 'Detail Booking' }} />
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{error || 'Booking tidak ditemukan'}</Text>
                    <Button title="Kembali" onPress={() => router.back()} variant="outline" />
                </View>
            </SafeAreaView>
        );
    }

    const displayName = isTherapist
        ? booking.user?.fullName || 'Pasien'
        : booking.therapist?.user?.fullName || 'Terapis';
    const displayLabel = isTherapist ? 'Pasien' : 'Terapis';
    const displayPrice = isTherapist ? booking.therapistNetTotal : booking.totalPrice;

    // Sort sessions by sequence order
    const sortedSessions = [...(booking.sessions || [])].sort(
        (a, b) => a.sequenceOrder - b.sequenceOrder
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ title: 'Detail Booking' }} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                }
            >
                {/* Status Badge */}
                <View style={styles.statusSection}>
                    <Badge
                        label={booking.status}
                        variant={getBookingStatusVariant(booking.status)}
                        size="md"
                    />
                    {booking.bookingType === 'INSTANT' && (
                        <Badge label="INSTANT" variant="warning" size="sm" />
                    )}
                </View>

                {/* Package & Person Info */}
                <Card style={styles.infoCard}>
                    <Text style={[styles.packageName, { color: colors.text }]}>
                        {booking.package?.name || 'Paket'}
                    </Text>
                    <View style={styles.personRow}>
                        <View style={[styles.personAvatar, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="person" size={20} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.personLabel, { color: colors.textSecondary }]}>{displayLabel}</Text>
                            <Text style={[styles.personName, { color: colors.text }]}>{displayName}</Text>
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Address */}
                    <View style={styles.infoRow}>
                        <Ionicons name="location" size={20} color={colors.primary} />
                        <View style={styles.infoContent}>
                            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Alamat</Text>
                            <Text style={[styles.infoValue, { color: colors.text }]}>{booking.lockedAddress}</Text>
                            {isTherapist && booking.lockedAddress && (
                                <TouchableOpacity
                                    style={[styles.navigateButton, { backgroundColor: colors.primaryLight }]}
                                    onPress={() => {
                                        const encodedAddress = encodeURIComponent(booking.lockedAddress);
                                        const url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
                                        Linking.openURL(url).catch(() => {
                                            Alert.alert('Error', 'Tidak dapat membuka Google Maps');
                                        });
                                    }}
                                >
                                    <Ionicons name="navigate" size={16} color={colors.primary} />
                                    <Text style={[styles.navigateButtonText, { color: colors.primary }]}>Navigasi ke Lokasi</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    <View style={[styles.divider, { backgroundColor: colors.border }]} />

                    {/* Price */}
                    <View style={styles.priceRow}>
                        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>
                            {isTherapist ? 'Pendapatan Anda' : 'Total Harga'}
                        </Text>
                        <Text style={[styles.priceValue, { color: isTherapist ? colors.success : colors.primary }]}>
                            {formatCurrency(displayPrice)}
                        </Text>
                    </View>

                    {/* Pay Button - Show for PENDING bookings (patient only) */}
                    {!isTherapist && booking.status === 'PENDING' && (
                        <>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <TouchableOpacity
                                style={[styles.chatButton, { backgroundColor: colors.warning }]}
                                onPress={() => router.push({
                                    pathname: '/(tabs)/booking/step4-payment',
                                    params: {
                                        bookingId: booking.id,
                                        totalPrice: booking.totalPrice,
                                        therapistName: booking.therapist?.user?.fullName || 'Terapis',
                                        packageName: booking.package?.name || 'Paket',
                                    },
                                })}
                            >
                                <Ionicons name="card" size={20} color="#fff" />
                                <Text style={styles.chatButtonText}>Bayar Sekarang</Text>
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Chat Button - Show for PAID/COMPLETED bookings */}
                    {(booking.status === 'PAID' || booking.status === 'COMPLETED') && (
                        <>
                            <View style={[styles.divider, { backgroundColor: colors.border }]} />
                            <TouchableOpacity
                                style={[styles.chatButton, { backgroundColor: booking.isChatActive ? colors.primary : colors.textMuted }]}
                                onPress={() => router.push(`/chat/${booking.id}`)}
                                disabled={!booking.isChatActive}
                            >
                                <Ionicons name="chatbubbles" size={20} color="#fff" />
                                <Text style={styles.chatButtonText}>
                                    {booking.isChatActive ? 'Buka Chat' : 'Chat Ditutup'}
                                </Text>
                            </TouchableOpacity>
                        </>
                    )}
                </Card>

                {/* Sessions */}
                <View style={styles.sessionsSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Daftar Sesi ({sortedSessions.length})
                    </Text>
                    {sortedSessions.map(session => (
                        <SessionCard
                            key={session.id}
                            session={session}
                            isTherapist={isTherapist}
                            hasReviewed={booking.hasReviewed || false}
                            onComplete={() => handleCompleteSession(session)}
                            onCancel={() => handleCancelSession(session)}
                            onReview={() => router.push({
                                pathname: '/review',
                                params: {
                                    bookingId: booking.id,
                                    therapistId: booking.therapist?.id || '',
                                    therapistName: booking.therapist?.user?.fullName || 'Terapis',
                                }
                            })}
                            isLoading={loadingSessionId === session.id}
                        />
                    ))}
                </View>

                {/* Created Date */}
                <Text style={[styles.createdAt, { color: colors.textMuted }]}>
                    Dibuat: {formatDate(booking.createdAt)}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: Spacing.md,
        fontSize: Typography.fontSize.md,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    errorText: {
        fontSize: Typography.fontSize.md,
        textAlign: 'center',
    },
    statusSection: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginBottom: Spacing.lg,
    },
    infoCard: {
        marginBottom: Spacing.lg,
    },
    packageName: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.md,
    },
    personRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    personAvatar: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    personLabel: {
        fontSize: Typography.fontSize.xs,
    },
    personName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    divider: {
        height: 1,
        marginVertical: Spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: Typography.fontSize.xs,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: Typography.fontSize.sm,
    },
    navigateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.sm,
        gap: 4,
        alignSelf: 'flex-start',
    },
    navigateButtonText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: Typography.fontSize.sm,
    },
    priceValue: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    sessionsSection: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.md,
    },
    sessionCard: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    sessionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sessionNumber: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm,
    },
    sessionNumberText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
    },
    sessionInfo: {
        flex: 1,
    },
    sessionLabel: {
        fontSize: Typography.fontSize.xs,
    },
    sessionStatusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sessionStatus: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    payoutBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    payoutBadgeText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    sessionSchedule: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    sessionScheduleText: {
        fontSize: Typography.fontSize.sm,
    },
    sessionActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    sessionActionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    sessionActionButtonText: {
        color: '#fff',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    completeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
    completeButtonText: {
        color: '#fff',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.md,
    },
    chatButtonText: {
        color: '#fff',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    createdAt: {
        fontSize: Typography.fontSize.xs,
        textAlign: 'center',
    },
});
