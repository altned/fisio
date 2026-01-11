/**
 * Notification Settings Screen
 * Handles Expo Go limitations gracefully
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    Alert,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing } from '@/constants/Theme';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/lib/api';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

export default function NotificationSettingsScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { user, token, updateUser } = useAuthStore();

    const [isEnabled, setIsEnabled] = useState(!!user?.fcmToken);
    const [loading, setLoading] = useState(false);

    const updateFcmToken = async (fcmToken: string | null) => {
        try {
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ fcmToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to update notification settings');
            }

            updateUser({ fcmToken });
            return true;
        } catch (error) {
            console.error('Failed to update FCM token:', error);
            throw error;
        }
    };

    const handleToggle = async (value: boolean) => {
        if (isExpoGo) {
            Alert.alert(
                'Expo Go Tidak Didukung',
                'Push notifications tidak tersedia di Expo Go sejak SDK 53. Untuk menggunakan fitur ini, aplikasi perlu di-build sebagai development build atau production build.',
                [{ text: 'OK' }]
            );
            return;
        }

        setLoading(true);

        try {
            if (value) {
                // Dynamic import to avoid crash in Expo Go
                const Notifications = await import('expo-notifications');
                const Device = await import('expo-device');

                if (!Device.isDevice) {
                    Alert.alert(
                        'Perangkat Tidak Didukung',
                        'Push notifications hanya tersedia di perangkat fisik.'
                    );
                    setLoading(false);
                    return;
                }

                // Configure notification handler
                Notifications.setNotificationHandler({
                    handleNotification: async () => ({
                        shouldShowAlert: true,
                        shouldPlaySound: true,
                        shouldSetBadge: true,
                    }),
                });

                // Request permission
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }

                if (finalStatus !== 'granted') {
                    Alert.alert(
                        'Izin Ditolak',
                        'Anda perlu mengizinkan notifikasi di pengaturan perangkat.'
                    );
                    setLoading(false);
                    return;
                }

                // Get push token
                const pushToken = await Notifications.getExpoPushTokenAsync();
                await updateFcmToken(pushToken.data);
                setIsEnabled(true);
                Alert.alert('Berhasil', 'Notifikasi berhasil diaktifkan.');
            } else {
                await updateFcmToken(null);
                setIsEnabled(false);
                Alert.alert('Berhasil', 'Notifikasi berhasil dinonaktifkan.');
            }
        } catch (error) {
            console.error('Notification error:', error);
            Alert.alert('Error', 'Gagal mengubah pengaturan notifikasi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Pengaturan Notifikasi</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Expo Go Warning */}
                {isExpoGo && (
                    <Card style={[styles.warningCard, { backgroundColor: colors.warningLight }]}>
                        <View style={styles.warningRow}>
                            <Ionicons name="warning" size={24} color={colors.warning} />
                            <View style={styles.warningTextContainer}>
                                <Text style={[styles.warningTitle, { color: colors.warning }]}>
                                    Expo Go Mode
                                </Text>
                                <Text style={[styles.warningText, { color: colors.text }]}>
                                    Push notifications tidak tersedia di Expo Go sejak SDK 53.
                                    Fitur ini akan berfungsi penuh setelah aplikasi di-build.
                                </Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Main Toggle */}
                <Card style={styles.toggleCard}>
                    <View style={styles.toggleRow}>
                        <View style={styles.toggleInfo}>
                            <Ionicons name="notifications" size={24} color={isExpoGo ? colors.textMuted : colors.primary} />
                            <View style={styles.toggleText}>
                                <Text style={[styles.toggleTitle, { color: colors.text }]}>
                                    Push Notifications
                                </Text>
                                <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>
                                    Terima pemberitahuan penting
                                </Text>
                            </View>
                        </View>
                        <Switch
                            value={isEnabled}
                            onValueChange={handleToggle}
                            disabled={loading || isExpoGo}
                            trackColor={{ false: colors.border, true: colors.primaryLight }}
                            thumbColor={isEnabled ? colors.primary : '#f4f3f4'}
                        />
                    </View>
                </Card>

                {/* Notification Types Info */}
                <Card style={styles.infoCard}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Anda akan menerima notifikasi untuk:
                    </Text>

                    <NotificationItem
                        icon="calendar-outline"
                        title="Booking Baru"
                        description="Saat ada booking baru (untuk terapis)"
                        colors={colors}
                    />
                    <NotificationItem
                        icon="checkmark-circle-outline"
                        title="Booking Diterima"
                        description="Saat terapis menerima booking Anda"
                        colors={colors}
                    />
                    <NotificationItem
                        icon="close-circle-outline"
                        title="Booking Ditolak"
                        description="Saat terapis menolak booking Anda"
                        colors={colors}
                    />
                    <NotificationItem
                        icon="time-outline"
                        title="Pengingat Sesi"
                        description="Pengingat sebelum sesi dimulai"
                        colors={colors}
                    />
                    <NotificationItem
                        icon="wallet-outline"
                        title="Pembayaran"
                        description="Update status pembayaran dan payout"
                        colors={colors}
                    />
                </Card>

                {/* Status Info */}
                <Card style={styles.statusCard}>
                    <View style={styles.statusRow}>
                        <Ionicons
                            name={isEnabled ? "checkmark-circle" : "close-circle"}
                            size={20}
                            color={isEnabled ? colors.success : colors.textMuted}
                        />
                        <Text style={[styles.statusText, { color: colors.textSecondary }]}>
                            Status: {isEnabled ? 'Aktif' : 'Nonaktif'}
                        </Text>
                    </View>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

function NotificationItem({
    icon,
    title,
    description,
    colors,
}: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    description: string;
    colors: typeof Colors.light;
}) {
    return (
        <View style={styles.notificationItem}>
            <Ionicons name={icon} size={20} color={colors.textSecondary} />
            <View style={styles.notificationItemText}>
                <Text style={[styles.notificationItemTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.notificationItemDesc, { color: colors.textSecondary }]}>
                    {description}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    warningCard: {
        marginBottom: Spacing.md,
        padding: Spacing.md,
    },
    warningRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    warningTextContainer: {
        flex: 1,
        marginLeft: Spacing.sm,
    },
    warningTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 4,
    },
    warningText: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
    },
    toggleCard: {
        marginBottom: Spacing.md,
    },
    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    toggleText: {
        marginLeft: Spacing.md,
        flex: 1,
    },
    toggleTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    toggleSubtitle: {
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
    infoCard: {
        marginBottom: Spacing.md,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    notificationItemText: {
        marginLeft: Spacing.sm,
        flex: 1,
    },
    notificationItemTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    notificationItemDesc: {
        fontSize: Typography.fontSize.xs,
        marginTop: 2,
    },
    statusCard: {
        padding: Spacing.md,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusText: {
        marginLeft: Spacing.sm,
        fontSize: Typography.fontSize.sm,
    },
});
