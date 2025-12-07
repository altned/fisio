/**
 * Profile Screen
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { user, activeRole, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert(
            'Keluar',
            'Yakin ingin keluar dari akun?',
            [
                { text: 'Batal', style: 'cancel' },
                {
                    text: 'Keluar',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/login');
                    },
                },
            ]
        );
    };

    const roleLabel = activeRole === 'THERAPIST' ? 'Fisioterapis' : 'Pasien';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="person" size={48} color={colors.primary} />
                    </View>
                    <Text style={[styles.name, { color: colors.text }]}>{user?.fullName || 'User'}</Text>
                    <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
                    <View style={[styles.roleBadge, { backgroundColor: colors.primaryLight }]}>
                        <Text style={[styles.roleText, { color: colors.primary }]}>{roleLabel}</Text>
                    </View>
                </View>

                {/* Menu Items */}
                <Card style={styles.menuCard}>
                    <MenuItem
                        icon="person-outline"
                        label="Edit Profil"
                        onPress={() => { }}
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <MenuItem
                        icon="notifications-outline"
                        label="Notifikasi"
                        onPress={() => { }}
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <MenuItem
                        icon="help-circle-outline"
                        label="Bantuan"
                        onPress={() => { }}
                        colors={colors}
                    />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <MenuItem
                        icon="document-text-outline"
                        label="Syarat & Ketentuan"
                        onPress={() => { }}
                        colors={colors}
                    />
                </Card>

                {/* Logout */}
                <Button
                    title="Keluar"
                    onPress={handleLogout}
                    variant="outline"
                    fullWidth
                    style={{ marginTop: Spacing.lg }}
                />

                {/* Version */}
                <Text style={[styles.version, { color: colors.textMuted }]}>
                    Fisioku v1.0.0
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function MenuItem({
    icon,
    label,
    onPress,
    colors
}: {
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
    onPress: () => void;
    colors: typeof Colors.light;
}) {
    return (
        <View style={styles.menuItem}>
            <Ionicons name={icon} size={22} color={colors.textSecondary} />
            <Text style={[styles.menuLabel, { color: colors.text }]}>{label}</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    name: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    email: {
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
    },
    roleBadge: {
        marginTop: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
    },
    roleText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    menuCard: {
        padding: 0,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
    },
    menuLabel: {
        flex: 1,
        marginLeft: Spacing.md,
        fontSize: Typography.fontSize.md,
    },
    divider: {
        height: 1,
        marginHorizontal: Spacing.md,
    },
    version: {
        textAlign: 'center',
        marginTop: Spacing.xl,
        fontSize: Typography.fontSize.sm,
    },
});
