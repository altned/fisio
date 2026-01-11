/**
 * SwapTherapistModal - Modal for swapping therapist on pending sessions
 * Allows patient to select a different therapist for their session
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
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import api from '@/lib/api';

interface Therapist {
    id: string;
    user: {
        fullName: string;
        avatarUrl?: string;
    };
    specialization?: string;
    rating?: number;
    totalReviews?: number;
}

interface SwapTherapistModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
    sessionId: string;
    currentTherapistId?: string;
}

export function SwapTherapistModal({
    visible,
    onClose,
    onSuccess,
    sessionId,
    currentTherapistId,
}: SwapTherapistModalProps) {
    const colors = Colors.light;

    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch available therapists when modal opens
    useEffect(() => {
        if (visible) {
            fetchTherapists();
        }
    }, [visible]);

    const fetchTherapists = async () => {
        setIsLoading(true);
        try {
            const response = await api.get<Therapist[]>('/therapists');
            // Filter out current therapist
            const available = (response || []).filter(t => t.id !== currentTherapistId);
            setTherapists(available);
        } catch (err) {
            console.error('Failed to fetch therapists:', err);
            Alert.alert('Error', 'Gagal memuat daftar terapis');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirm = async () => {
        if (!selectedTherapist) {
            Alert.alert('Error', 'Pilih terapis terlebih dahulu');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post(`/sessions/${sessionId}/swap-therapist`, {
                therapistId: selectedTherapist,
            });
            Alert.alert('Berhasil', 'Terapis berhasil diganti');
            onSuccess();
            onClose();
        } catch (err: any) {
            Alert.alert('Gagal', err.message || 'Gagal mengganti terapis');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setSelectedTherapist(null);
        onClose();
    };

    const renderTherapistCard = (therapist: Therapist) => {
        const isSelected = selectedTherapist === therapist.id;

        return (
            <TouchableOpacity
                key={therapist.id}
                style={[
                    styles.therapistCard,
                    { borderColor: isSelected ? colors.primary : colors.border },
                    isSelected && { backgroundColor: colors.primaryLight },
                ]}
                onPress={() => setSelectedTherapist(therapist.id)}
            >
                <View style={styles.therapistAvatar}>
                    {therapist.user.avatarUrl ? (
                        <Image
                            source={{ uri: therapist.user.avatarUrl }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="person" size={24} color={colors.primary} />
                        </View>
                    )}
                </View>
                <View style={styles.therapistInfo}>
                    <Text style={[styles.therapistName, { color: colors.text }]}>
                        {therapist.user.fullName}
                    </Text>
                    {therapist.specialization && (
                        <Text style={[styles.therapistSpecialization, { color: colors.textSecondary }]}>
                            {therapist.specialization}
                        </Text>
                    )}
                    {therapist.rating !== undefined && (
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={14} color={colors.warning} />
                            <Text style={[styles.ratingText, { color: colors.textSecondary }]}>
                                {therapist.rating.toFixed(1)} ({therapist.totalReviews || 0} ulasan)
                            </Text>
                        </View>
                    )}
                </View>
                {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                )}
            </TouchableOpacity>
        );
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
                            Ganti Terapis
                        </Text>
                        <TouchableOpacity onPress={handleClose}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                        Pilih terapis baru untuk sesi Anda
                    </Text>

                    <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                        {isLoading ? (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                    Memuat daftar terapis...
                                </Text>
                            </View>
                        ) : therapists.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="people-outline" size={48} color={colors.textMuted} />
                                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                    Tidak ada terapis lain tersedia saat ini
                                </Text>
                            </View>
                        ) : (
                            therapists.map(renderTherapistCard)
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
                                !selectedTherapist && { opacity: 0.5 },
                            ]}
                            onPress={handleConfirm}
                            disabled={!selectedTherapist || isSubmitting}
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
        marginBottom: Spacing.xs,
    },
    modalTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    modalSubtitle: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.md,
    },
    scrollContent: {
        maxHeight: 400,
    },
    loadingContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    loadingText: {
        fontSize: Typography.fontSize.sm,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: Typography.fontSize.sm,
        textAlign: 'center',
    },
    therapistCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 2,
        marginBottom: Spacing.sm,
    },
    therapistAvatar: {
        marginRight: Spacing.md,
    },
    avatarImage: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    therapistInfo: {
        flex: 1,
    },
    therapistName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    therapistSpecialization: {
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: 4,
    },
    ratingText: {
        fontSize: Typography.fontSize.xs,
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

export default SwapTherapistModal;
