/**
 * Step 5: Payment Success / Booking Confirmation
 */

import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Card } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function SuccessScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const params = useLocalSearchParams<{
        bookingId: string;
        therapistName: string;
        packageName: string;
    }>();

    const handleGoHome = () => {
        router.replace('/(tabs)');
    };

    const handleViewBooking = () => {
        // Navigate to specific booking detail instead of bookings list
        router.replace({
            pathname: '/(tabs)/booking-detail',
            params: { bookingId: params.bookingId },
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Success Icon */}
                <View style={[styles.iconContainer, { backgroundColor: colors.successLight || '#E8F5E9' }]}>
                    <Ionicons name="checkmark-circle" size={80} color={colors.success} />
                </View>

                {/* Success Message */}
                <Text style={[styles.title, { color: colors.text }]}>
                    Pembayaran Berhasil! 🎉
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Booking Anda telah dikonfirmasi
                </Text>

                {/* Booking Summary */}
                <Card style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Paket</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{params.packageName}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Terapis</Text>
                        <Text style={[styles.summaryValue, { color: colors.text }]}>{params.therapistName}</Text>
                    </View>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Booking ID</Text>
                        <Text style={[styles.summaryValueSmall, { color: colors.textMuted }]}>
                            {params.bookingId?.slice(0, 8)}...
                        </Text>
                    </View>
                </Card>

                {/* Next Steps */}
                <Card style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                        <Ionicons name="information-circle" size={24} color={colors.primary} />
                        <Text style={[styles.infoTitle, { color: colors.text }]}>Langkah Selanjutnya</Text>
                    </View>
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Terapis akan segera mengkonfirmasi booking Anda. Anda akan menerima notifikasi
                        setelah terapis menerima pesanan.
                    </Text>
                    <View style={styles.infoItem}>
                        <Ionicons name="timer-outline" size={18} color={colors.textMuted} />
                        <Text style={[styles.infoItemText, { color: colors.textSecondary }]}>
                            Konfirmasi dalam 30 menit (regular) / 5 menit (instant)
                        </Text>
                    </View>
                </Card>
            </ScrollView>

            {/* Footer Buttons - Fixed at bottom */}
            <View style={[styles.footer, { backgroundColor: colors.background }]}>
                <Button
                    title="Lihat Booking Saya"
                    onPress={handleViewBooking}
                    variant="outline"
                    style={{ marginBottom: Spacing.sm }}
                    fullWidth
                />
                <Button
                    title="Kembali ke Beranda"
                    onPress={handleGoHome}
                    fullWidth
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: Spacing.xl,
        alignItems: 'center',
        paddingTop: Spacing.xl * 2,
        paddingBottom: 180, // Space for fixed footer buttons
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        textAlign: 'center',
        marginBottom: Spacing.xl,
    },
    summaryCard: {
        width: '100%',
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    summaryLabel: {
        fontSize: Typography.fontSize.sm,
    },
    summaryValue: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    summaryValueSmall: {
        fontSize: Typography.fontSize.sm,
        fontFamily: 'monospace',
    },
    divider: {
        height: 1,
    },
    infoCard: {
        width: '100%',
        padding: Spacing.lg,
        backgroundColor: '#E3F2FD',
        marginBottom: Spacing.lg,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    infoTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginLeft: Spacing.sm,
    },
    infoText: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoItemText: {
        fontSize: Typography.fontSize.sm,
        marginLeft: Spacing.sm,
    },
    footer: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl,
    },
});
