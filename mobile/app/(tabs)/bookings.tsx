/**
 * Bookings List Screen
 */

import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing } from '@/constants/Theme';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';

export default function BookingsScreen() {
    const colors = Colors.light;
    const { activeRole } = useAuthStore();

    const title = activeRole === 'THERAPIST' ? 'Jadwal Sesi' : 'Pesanan Saya';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            </View>

            <View style={styles.content}>
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
    content: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
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
