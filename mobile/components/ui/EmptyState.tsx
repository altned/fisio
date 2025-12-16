/**
 * Empty State Component
 * Shows illustration and message when there's no data
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button } from './Button';

type EmptyStateVariant = 'bookings' | 'wallet' | 'notifications' | 'search' | 'error' | 'default';

interface EmptyStateProps {
    variant?: EmptyStateVariant;
    title?: string;
    message?: string;
    actionLabel?: string;
    onAction?: () => void;
    style?: ViewStyle;
}

const VARIANTS: Record<EmptyStateVariant, { icon: keyof typeof Ionicons.glyphMap; title: string; message: string }> = {
    bookings: {
        icon: 'calendar-outline',
        title: 'Belum Ada Booking',
        message: 'Anda belum memiliki booking. Mulai booking fisioterapi sekarang!',
    },
    wallet: {
        icon: 'wallet-outline',
        title: 'Belum Ada Transaksi',
        message: 'Riwayat transaksi akan muncul di sini setelah ada pemasukan atau penarikan.',
    },
    notifications: {
        icon: 'notifications-outline',
        title: 'Tidak Ada Notifikasi',
        message: 'Anda akan menerima notifikasi tentang booking dan pembaruan di sini.',
    },
    search: {
        icon: 'search-outline',
        title: 'Tidak Ditemukan',
        message: 'Coba gunakan kata kunci lain atau filter yang berbeda.',
    },
    error: {
        icon: 'cloud-offline-outline',
        title: 'Terjadi Kesalahan',
        message: 'Gagal memuat data. Silakan coba lagi.',
    },
    default: {
        icon: 'file-tray-outline',
        title: 'Tidak Ada Data',
        message: 'Belum ada data untuk ditampilkan.',
    },
};

export function EmptyState({
    variant = 'default',
    title,
    message,
    actionLabel,
    onAction,
    style,
}: EmptyStateProps) {
    const colors = Colors.light;
    const config = VARIANTS[variant];

    const displayTitle = title || config.title;
    const displayMessage = message || config.message;

    return (
        <View style={[styles.container, style]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name={config.icon} size={48} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>{displayTitle}</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>{displayMessage}</Text>
            {actionLabel && onAction && (
                <Button
                    title={actionLabel}
                    onPress={onAction}
                    variant="primary"
                    style={styles.button}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        minHeight: 300,
    },
    iconContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    message: {
        fontSize: Typography.fontSize.md,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 280,
    },
    button: {
        marginTop: Spacing.lg,
    },
});
