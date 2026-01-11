/**
 * RescheduleModal - Modal for scheduling/rescheduling pending sessions
 * Allows patient to pick a date and time slot for a session
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import api from '@/lib/api';

interface RescheduleModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    sessionId: string;
    therapistId: string;
    therapistName?: string;
}

// Generate time slots from 8:00 to 20:00
const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
});

// Generate dates for next 14 days
function getNextDates(days: number = 14): Date[] {
    const dates: Date[] = [];
    const now = new Date();
    for (let i = 1; i <= days; i++) {
        const date = new Date(now);
        date.setDate(now.getDate() + i);
        date.setHours(0, 0, 0, 0);
        dates.push(date);
    }
    return dates;
}

function formatDateShort(date: Date): string {
    return date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
}

export function RescheduleModal({
    visible,
    onClose,
    onSuccess,
    sessionId,
    therapistId,
    therapistName,
}: RescheduleModalProps) {
    const colors = Colors.light;
    const dates = getNextDates(14);

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [busySlots, setBusySlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch busy slots when date changes
    useEffect(() => {
        if (selectedDate && therapistId) {
            fetchBusySlots();
        }
    }, [selectedDate, therapistId]);

    const fetchBusySlots = async () => {
        if (!selectedDate) return;

        setIsLoadingSlots(true);
        try {
            const startDate = new Date(selectedDate);
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date(selectedDate);
            endDate.setHours(23, 59, 59, 999);

            const response = await api.get<string[]>(
                `/sessions/busy-slots/${therapistId}?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
            );

            // Convert busy slot times to HH:mm format for comparison
            const slots = (response || []).map(slot => {
                const d = new Date(slot);
                return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
            });
            setBusySlots(slots);
        } catch (err) {
            console.error('Failed to fetch busy slots:', err);
            setBusySlots([]);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const isSlotBusy = (time: string): boolean => {
        return busySlots.includes(time);
    };

    const isSlotPast = (time: string): boolean => {
        if (!selectedDate) return false;

        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const slotDate = new Date(selectedDate);
        slotDate.setHours(0, 0, 0, 0);

        // If selected date is today, check if time has passed
        if (slotDate.getTime() === today.getTime()) {
            const [hours, minutes] = time.split(':').map(Number);
            const slotTime = new Date();
            slotTime.setHours(hours, minutes, 0, 0);

            // Must be at least 1 hour in the future
            return slotTime.getTime() < now.getTime() + 60 * 60 * 1000;
        }

        return false;
    };

    const handleConfirm = async () => {
        if (!selectedDate || !selectedTime) {
            Alert.alert('Error', 'Pilih tanggal dan waktu terlebih dahulu');
            return;
        }

        const [hours, minutes] = selectedTime.split(':').map(Number);
        const scheduledAt = new Date(selectedDate);
        scheduledAt.setHours(hours, minutes, 0, 0);

        setIsSubmitting(true);
        try {
            await api.post(`/sessions/${sessionId}/schedule`, {
                scheduledAt: scheduledAt.toISOString(),
            });
            Alert.alert('Berhasil', 'Jadwal sesi berhasil ditentukan');
            onSuccess();
            onClose();
        } catch (err: any) {
            Alert.alert('Gagal', err.message || 'Gagal menjadwalkan sesi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedDate(null);
        setSelectedTime(null);
        setBusySlots([]);
        onClose();
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            Jadwalkan Sesi
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    {therapistName && (
                        <Text style={[styles.therapistName, { color: colors.textSecondary }]}>
                            Terapis: {therapistName}
                        </Text>
                    )}

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {/* Date Selection */}
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Pilih Tanggal
                        </Text>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.dateRow}
                        >
                            {dates.map((date, index) => {
                                const isSelected = selectedDate?.toDateString() === date.toDateString();
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.dateChip,
                                            { borderColor: colors.border },
                                            isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                                        ]}
                                        onPress={() => {
                                            setSelectedDate(date);
                                            setSelectedTime(null);
                                        }}
                                    >
                                        <Text style={[
                                            styles.dateChipText,
                                            { color: isSelected ? '#fff' : colors.text }
                                        ]}>
                                            {formatDateShort(date)}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Time Selection */}
                        {selectedDate && (
                            <>
                                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: Spacing.lg }]}>
                                    Pilih Waktu
                                </Text>

                                {isLoadingSlots ? (
                                    <View style={styles.loadingContainer}>
                                        <ActivityIndicator size="small" color={colors.primary} />
                                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                            Memuat slot tersedia...
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.timeGrid}>
                                        {TIME_SLOTS.map((time, index) => {
                                            const isBusy = isSlotBusy(time);
                                            const isPast = isSlotPast(time);
                                            const isDisabled = isBusy || isPast;
                                            const isSelected = selectedTime === time;

                                            return (
                                                <TouchableOpacity
                                                    key={index}
                                                    style={[
                                                        styles.timeSlot,
                                                        { borderColor: colors.border },
                                                        isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                                                        isDisabled && { backgroundColor: colors.border, opacity: 0.5 },
                                                    ]}
                                                    onPress={() => !isDisabled && setSelectedTime(time)}
                                                    disabled={isDisabled}
                                                >
                                                    <Text style={[
                                                        styles.timeSlotText,
                                                        { color: isSelected ? '#fff' : isDisabled ? colors.textMuted : colors.text }
                                                    ]}>
                                                        {time}
                                                    </Text>
                                                    {isBusy && (
                                                        <Text style={[styles.busyLabel, { color: colors.error }]}>
                                                            Sibuk
                                                        </Text>
                                                    )}
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                )}
                            </>
                        )}
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.modalActions}>
                        <TouchableOpacity
                            style={[styles.modalButton, styles.modalButtonSecondary, { borderColor: colors.border }]}
                            onPress={handleClose}
                        >
                            <Text style={[styles.modalButtonText, { color: colors.text }]}>Batal</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.modalButton,
                                { backgroundColor: colors.primary },
                                (!selectedDate || !selectedTime) && { opacity: 0.5 },
                            ]}
                            onPress={handleConfirm}
                            disabled={!selectedDate || !selectedTime || isSubmitting}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                                    Konfirmasi
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    modalTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    therapistName: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.md,
    },
    scrollContent: {
        maxHeight: 400,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.sm,
    },
    dateRow: {
        flexDirection: 'row',
    },
    dateChip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        marginRight: Spacing.sm,
    },
    dateChipText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    loadingText: {
        fontSize: Typography.fontSize.sm,
    },
    timeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    timeSlot: {
        width: '22%',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.xs,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
    },
    timeSlotText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    busyLabel: {
        fontSize: Typography.fontSize.xs,
        marginTop: 2,
    },
    modalActions: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.lg,
    },
    modalButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonSecondary: {
        borderWidth: 1,
    },
    modalButtonText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
});

export default RescheduleModal;
