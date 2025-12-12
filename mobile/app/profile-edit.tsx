/**
 * Edit Profile Screen
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/lib/api';

export default function EditProfileScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { user, token, updateUser } = useAuthStore();

    const [fullName, setFullName] = useState(user?.fullName || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Nama lengkap wajib diisi');
            return;
        }

        if (password && password !== confirmPassword) {
            Alert.alert('Error', 'Password tidak cocok');
            return;
        }

        if (password && password.length < 6) {
            Alert.alert('Error', 'Password minimal 6 karakter');
            return;
        }

        setLoading(true);

        try {
            const payload: { fullName?: string; password?: string } = {};

            if (fullName.trim() !== user?.fullName) {
                payload.fullName = fullName.trim();
            }

            if (password) {
                payload.password = password;
            }

            if (Object.keys(payload).length === 0) {
                Alert.alert('Info', 'Tidak ada perubahan');
                setLoading(false);
                return;
            }

            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Gagal update profil');
            }

            const updatedUser = await response.json();

            // Update local user state
            updateUser({
                fullName: updatedUser.fullName,
                isProfileComplete: updatedUser.isProfileComplete,
            });

            Alert.alert('Berhasil', 'Profil berhasil diperbarui', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
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
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled, {
                            backgroundColor: colors.cardBackground,
                            color: colors.textMuted,
                            borderColor: colors.border
                        }]}
                        value={user?.email}
                        editable={false}
                    />
                    <Text style={[styles.hint, { color: colors.textMuted }]}>
                        Email tidak dapat diubah
                    </Text>
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Nama Lengkap</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.cardBackground,
                            color: colors.text,
                            borderColor: colors.border
                        }]}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Masukkan nama lengkap"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <View style={styles.divider} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Ubah Password (Opsional)
                </Text>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Password Baru</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.cardBackground,
                            color: colors.text,
                            borderColor: colors.border
                        }]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Minimal 6 karakter"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Konfirmasi Password</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.cardBackground,
                            color: colors.text,
                            borderColor: colors.border
                        }]}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Ulangi password baru"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                    />
                </View>

                <Button
                    title={loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    onPress={handleSave}
                    disabled={loading}
                    fullWidth
                    style={{ marginTop: Spacing.lg }}
                />
            </ScrollView>
        </SafeAreaView>
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
    formGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: Spacing.xs,
    },
    input: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        fontSize: Typography.fontSize.md,
    },
    inputDisabled: {
        opacity: 0.7,
    },
    hint: {
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing.xs,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
});
