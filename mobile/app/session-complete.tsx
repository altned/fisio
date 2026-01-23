/**
 * Session Complete Screen - Therapist adds notes and photo when completing a session
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Card } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
    const [photoUri, setPhotoUri] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const takePhoto = async () => {
        // Request camera permission
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Kamera', 'Izin menggunakan kamera diperlukan untuk mengambil foto.');
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            mediaTypes: 'images',
            allowsEditing: true,
            quality: 0.7,
            aspect: [4, 3],
        });

        if (!result.canceled && result.assets[0]) {
            setPhotoUri(result.assets[0].uri);
        }
    };

    const removePhoto = () => {
        Alert.alert(
            'Hapus Foto',
            'Apakah Anda yakin ingin menghapus foto?',
            [
                { text: 'Batal', style: 'cancel' },
                { text: 'Hapus', style: 'destructive', onPress: () => setPhotoUri(null) },
            ]
        );
    };

    const uploadPhoto = async (): Promise<string | null> => {
        if (!photoUri) return null;

        setIsUploading(true);
        try {
            const formData = new FormData();
            const filename = photoUri.split('/').pop() || 'photo.jpg';
            formData.append('file', {
                uri: photoUri,
                type: 'image/jpeg',
                name: filename,
            } as any);

            const response = await api.upload<{ url?: string; relativePath?: string }>('/upload/session-photo', formData);
            return response.url || response.relativePath || null;
        } catch (error) {
            console.error('Photo upload failed:', error);
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!notes.trim()) {
            Alert.alert('Catatan Wajib', 'Silakan isi catatan sesi sebelum menyelesaikan.');
            return;
        }

        try {
            setIsSubmitting(true);

            // Upload photo first if exists
            let photoUrl: string | null = null;
            if (photoUri) {
                photoUrl = await uploadPhoto();
            }

            await api.post(`/sessions/${params.sessionId}/complete`, {
                notes: notes.trim(),
                photoUrl: photoUrl || undefined,
            });

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
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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

                {/* Photo Documentation */}
                <View style={styles.photoSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Dokumentasi Foto
                    </Text>
                    <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>
                        Ambil foto di lokasi sebagai bukti sesi (opsional)
                    </Text>

                    {photoUri ? (
                        <View style={styles.photoPreview}>
                            <Image source={{ uri: photoUri }} style={styles.photoImage} />
                            <TouchableOpacity
                                style={[styles.removePhotoBtn, { backgroundColor: colors.error }]}
                                onPress={removePhoto}
                            >
                                <Ionicons name="close" size={20} color="#fff" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={[styles.takePhotoBtn, { borderColor: colors.primary }]}
                            onPress={takePhoto}
                        >
                            <Ionicons name="camera" size={32} color={colors.primary} />
                            <Text style={[styles.takePhotoText, { color: colors.primary }]}>
                                Ambil Foto
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>

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
                        Setelah menyelesaikan sesi, catatan dan foto tidak dapat diubah.
                    </Text>
                </View>
            </ScrollView>

            {/* Footer Button */}
            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <Button
                    title={isSubmitting || isUploading ? 'Memproses...' : 'Selesaikan Sesi'}
                    onPress={handleSubmit}
                    disabled={isSubmitting || isUploading || !notes.trim()}
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
    photoSection: {
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
    takePhotoBtn: {
        height: 120,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    takePhotoText: {
        marginTop: Spacing.sm,
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
    },
    photoPreview: {
        position: 'relative',
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    photoImage: {
        width: '100%',
        height: 200,
        borderRadius: BorderRadius.md,
    },
    removePhotoBtn: {
        position: 'absolute',
        top: Spacing.sm,
        right: Spacing.sm,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    notesSection: {
        marginBottom: Spacing.lg,
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
