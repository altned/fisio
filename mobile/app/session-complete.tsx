/**
 * Session Complete Screen - Therapist adds notes when completing a session
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    ScrollView,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Card } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

export default function SessionCompleteScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const params = useLocalSearchParams<{
        sessionId: string;
        bookingId: string;
        patientName: string;
        packageName: string;
    }>();

    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!notes.trim()) {
            Alert.alert('Catatan Wajib', 'Silakan isi catatan sesi sebelum menyelesaikan.');
            return;
        }

        try {
            setIsSubmitting(true);
            await api.post(`/sessions/${params.sessionId}/complete`, { notes: notes.trim() });
            Alert.alert(
                'Sesi Selesai',
                'Sesi berhasil diselesaikan dan catatan telah disimpan.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Gagal menyelesaikan sesi');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ title: 'Selesaikan Sesi' }} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Session Info */}
                <Card style={styles.infoCard}>
                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={20} color={colors.primary} />
                        <View style={styles.infoText}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Pasien</Text>
                            <Text style={[styles.value, { color: colors.text }]}>{params.patientName}</Text>
                        </View>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="medical-outline" size={20} color={colors.primary} />
                        <View style={styles.infoText}>
                            <Text style={[styles.label, { color: colors.textSecondary }]}>Paket</Text>
                            <Text style={[styles.value, { color: colors.text }]}>{params.packageName}</Text>
                        </View>
                    </View>
                </Card>

                {/* Notes Input */}
                <View style={styles.notesSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Catatan Sesi <Text style={{ color: colors.error }}>*</Text>
                    </Text>
                    <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
                        Tuliskan catatan mengenai sesi yang telah dilakukan
                    </Text>
                    <TextInput
                        style={[
                            styles.notesInput,
                            {
                                backgroundColor: colors.card,
                                color: colors.text,
                                borderColor: notes.trim() ? colors.primary : colors.border,
                            }
                        ]}
                        placeholder="Contoh: Pasien menunjukkan perkembangan pada..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        value={notes}
                        onChangeText={setNotes}
                    />
                    <Text style={[styles.charCount, { color: colors.textMuted }]}>
                        {notes.length} karakter
                    </Text>
                </View>

                {/* Warning */}
                <View style={[styles.warning, { backgroundColor: '#FFF3E0' }]}>
                    <Ionicons name="information-circle" size={20} color="#F57C00" />
                    <Text style={[styles.warningText, { color: '#E65100' }]}>
                        Setelah menyelesaikan sesi, catatan tidak dapat diubah.
                    </Text>
                </View>
            </ScrollView>

            {/* Footer Button */}
            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <Button
                    title={isSubmitting ? 'Memproses...' : 'Selesaikan Sesi'}
                    onPress={handleSubmit}
                    disabled={isSubmitting || !notes.trim()}
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
    content: {
        padding: Spacing.lg,
    },
    infoCard: {
        marginBottom: Spacing.lg,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    infoText: {
        marginLeft: Spacing.md,
    },
    label: {
        fontSize: Typography.fontSize.xs,
    },
    value: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    notesSection: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.xs,
    },
    sectionHint: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.md,
    },
    notesInput: {
        minHeight: 150,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.md,
    },
    charCount: {
        fontSize: Typography.fontSize.xs,
        textAlign: 'right',
        marginTop: Spacing.xs,
    },
    warning: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        gap: Spacing.sm,
    },
    warningText: {
        flex: 1,
        fontSize: Typography.fontSize.sm,
    },
    footer: {
        padding: Spacing.lg,
        borderTopWidth: 1,
    },
});
