/**
 * Step 3: Schedule & Address Selection
 * Navigates to consent screen before booking is created
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Card, Input } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

// Generate time slots (90 min each, starting :00 or :30)
function generateTimeSlots(): string[] {
    const slots: string[] = [];
    for (let hour = 8; hour <= 20; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        if (hour < 20) {
            slots.push(`${hour.toString().padStart(2, '0')}:30`);
        }
    }
    return slots;
}

// Check if slot is valid (>1h lead time for today)
function isSlotAvailable(date: Date, time: string, isInstant: boolean): boolean {
    const [hours, minutes] = time.split(':').map(Number);
    const slotDate = new Date(date);
    slotDate.setHours(hours, minutes, 0, 0);

    const now = new Date();
    const diffMs = slotDate.getTime() - now.getTime();
    const diffMinutes = diffMs / (1000 * 60);

    // For instant booking (today), need >60 min lead time
    if (isInstant) {
        return diffMinutes > 60;
    }

    // For future dates, slot must be in the future
    return diffMinutes > 0;
}

// Format date for display
function formatDate(date: Date): string {
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// Generate next 14 days for date selection
function generateDates(): Date[] {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        date.setHours(0, 0, 0, 0);
        dates.push(date);
    }
    return dates;
}

export default function ScheduleScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const params = useLocalSearchParams<{
        therapistId: string;
        therapistName: string;
        packageId: string;
        packageName: string;
        totalPrice: string;
        sessionCount: string;
    }>();

    const [address, setAddress] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date>(generateDates()[0]);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [busySlots, setBusySlots] = useState<string[]>([]);

    const allTimeSlots = useMemo(() => generateTimeSlots(), []);
    const availableDates = useMemo(() => generateDates(), []);

    // Fetch busy slots when date changes
    useEffect(() => {
        const fetchBusySlots = async () => {
            try {
                const startDate = new Date(selectedDate);
                startDate.setHours(0, 0, 0, 0);
                const endDate = new Date(selectedDate);
                endDate.setHours(23, 59, 59, 999);

                const slots = await api.get<string[]>(
                    `/sessions/busy-slots/${params.therapistId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
                );
                setBusySlots(slots || []);
            } catch (error) {
                console.error('Failed to fetch busy slots:', error);
                setBusySlots([]);
            }
        };

        if (params.therapistId) {
            fetchBusySlots();
        }
    }, [selectedDate, params.therapistId]);

    // Check if a time slot is booked by therapist
    const isSlotBusy = (time: string): boolean => {
        const [hours, minutes] = time.split(':').map(Number);
        const slotDate = new Date(selectedDate);
        slotDate.setHours(hours, minutes, 0, 0);

        return busySlots.some(busySlot => {
            const busyDate = new Date(busySlot);
            return Math.abs(busyDate.getTime() - slotDate.getTime()) < 90 * 60 * 1000; // Within 90 min
        });
    };

    const isToday = useMemo(() => {
        const today = new Date();
        return (
            selectedDate.getDate() === today.getDate() &&
            selectedDate.getMonth() === today.getMonth() &&
            selectedDate.getFullYear() === today.getFullYear()
        );
    }, [selectedDate]);

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(price));
    };

    const handleContinue = () => {
        if (!address.trim()) {
            Alert.alert('Error', 'Alamat lengkap wajib diisi');
            return;
        }
        if (!selectedTime) {
            Alert.alert('Error', 'Pilih waktu terlebih dahulu');
            return;
        }

        // Build scheduledAt datetime
        const [hours, minutes] = selectedTime.split(':').map(Number);
        const scheduledAt = new Date(selectedDate);
        scheduledAt.setHours(hours, minutes, 0, 0);

        // Navigate to consent screen (booking will be created there after consent)
        router.push({
            pathname: '/(tabs)/booking/step3b-consent',
            params: {
                therapistId: params.therapistId,
                therapistName: params.therapistName,
                packageId: params.packageId,
                packageName: params.packageName,
                totalPrice: params.totalPrice,
                sessionCount: params.sessionCount,
                address: address.trim(),
                scheduledAt: scheduledAt.toISOString(),
                bookingType: isToday ? 'INSTANT' : 'REGULAR',
            },
        });
    };


    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Summary */}
                <Card style={styles.summaryCard}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pesanan Anda</Text>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>{params.packageName}</Text>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                            Terapis: {params.therapistName}
                        </Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                            {params.sessionCount} sesi × 90 menit
                        </Text>
                    </View>
                    <Text style={[styles.summaryPrice, { color: colors.primary }]}>
                        {formatPrice(params.totalPrice)}
                    </Text>
                </Card>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Alamat Lengkap</Text>
                    <Input
                        placeholder="Masukkan alamat lengkap untuk home visit..."
                        value={address}
                        onChangeText={setAddress}
                        multiline
                        numberOfLines={3}
                        style={styles.addressInput}
                    />
                    <View style={styles.addressActions}>
                        <Text style={[styles.hint, { color: colors.textMuted, flex: 1 }]}>
                            Alamat ini akan dikunci untuk semua sesi dalam paket
                        </Text>
                        {address.trim().length > 10 && (
                            <TouchableOpacity
                                style={[styles.mapButton, { backgroundColor: colors.primaryLight }]}
                                onPress={() => {
                                    const encodedAddress = encodeURIComponent(address.trim());
                                    const url = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
                                    Linking.openURL(url).catch(() => {
                                        Alert.alert('Error', 'Tidak dapat membuka Google Maps');
                                    });
                                }}
                            >
                                <Ionicons name="location" size={16} color={colors.primary} />
                                <Text style={[styles.mapButtonText, { color: colors.primary }]}>Cek di Maps</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Date Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Pilih Tanggal</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                        {availableDates.map((date, idx) => {
                            const isSelected =
                                date.getDate() === selectedDate.getDate() &&
                                date.getMonth() === selectedDate.getMonth();
                            const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
                            const dayNum = date.getDate();

                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[
                                        styles.dateItem,
                                        isSelected && { backgroundColor: colors.primary },
                                    ]}
                                    onPress={() => {
                                        setSelectedDate(date);
                                        setSelectedTime(null);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.dateDayName,
                                            { color: isSelected ? '#fff' : colors.textSecondary },
                                        ]}
                                    >
                                        {idx === 0 ? 'Hari Ini' : dayName}
                                    </Text>
                                    <Text
                                        style={[
                                            styles.dateDayNum,
                                            { color: isSelected ? '#fff' : colors.text },
                                        ]}
                                    >
                                        {dayNum}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>

                {/* Time Selection */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Pilih Waktu</Text>
                    {isToday && (
                        <Text style={[styles.hint, { color: colors.warning, marginBottom: Spacing.sm }]}>
                            ⚡ Booking instant: minimal 1 jam dari sekarang
                        </Text>
                    )}
                    <View style={styles.timeGrid}>
                        {allTimeSlots.map((time) => {
                            const leadTimeAvailable = isSlotAvailable(selectedDate, time, isToday);
                            const booked = isSlotBusy(time);
                            const available = leadTimeAvailable && !booked;
                            const isSelected = selectedTime === time;

                            return (
                                <TouchableOpacity
                                    key={time}
                                    style={[
                                        styles.timeItem,
                                        { borderColor: colors.border },
                                        !available && styles.timeItemDisabled,
                                        booked && { backgroundColor: '#FEE2E2', borderColor: '#FECACA' },
                                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                                    ]}
                                    onPress={() => available && setSelectedTime(time)}
                                    disabled={!available}
                                >
                                    <Text
                                        style={[
                                            styles.timeText,
                                            { color: available ? colors.text : colors.textMuted },
                                            booked && { color: '#DC2626' },
                                            isSelected && { color: '#fff' },
                                        ]}
                                    >
                                        {booked ? `${time} ❌` : time}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <View>
                    <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Total</Text>
                    <Text style={[styles.footerPrice, { color: colors.primary }]}>
                        {formatPrice(params.totalPrice)}
                    </Text>
                </View>
                <Button
                    title="Lanjutkan"
                    onPress={handleContinue}
                    disabled={!address.trim() || !selectedTime}
                    style={{ flex: 1, marginLeft: Spacing.md }}
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
        padding: Spacing.lg,
        paddingBottom: 120,
    },
    summaryCard: {
        marginBottom: Spacing.lg,
    },
    summaryLabel: {
        fontSize: Typography.fontSize.xs,
        marginBottom: Spacing.xs,
    },
    summaryTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    summaryRow: {
        marginTop: Spacing.xs,
    },
    summaryText: {
        fontSize: Typography.fontSize.sm,
    },
    summaryPrice: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginTop: Spacing.sm,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    addressInput: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    hint: {
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing.xs,
    },
    addressActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
        gap: Spacing.sm,
    },
    mapButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.md,
        gap: 4,
    },
    mapButtonText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    dateScroll: {
        marginHorizontal: -Spacing.lg,
        paddingHorizontal: Spacing.lg,
    },
    dateItem: {
        width: 72,
        paddingVertical: Spacing.md,
        alignItems: 'center',
        borderRadius: BorderRadius.lg,
        marginRight: Spacing.sm,
        backgroundColor: '#F5F5F5',
    },
    dateDayName: {
        fontSize: Typography.fontSize.xs,
        marginBottom: 4,
    },
    dateDayNum: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    timeItem: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        minWidth: 70,
        alignItems: 'center',
    },
    timeItemDisabled: {
        opacity: 0.4,
    },
    timeText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: Spacing.lg,
        borderTopWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    footerLabel: {
        fontSize: Typography.fontSize.xs,
    },
    footerPrice: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
});
