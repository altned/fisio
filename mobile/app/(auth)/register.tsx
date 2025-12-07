/**
 * Register Screen
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { register, isLoading } = useAuthStore();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleRegister = async () => {
        // Validation
        if (!fullName || !email || !password || !confirmPassword) {
            setError('Semua field wajib diisi');
            return;
        }

        if (password !== confirmPassword) {
            setError('Password tidak cocok');
            return;
        }

        if (password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        setError(null);

        try {
            // Navigate to role selection first
            router.push({
                pathname: '/(auth)/role-select',
                params: { fullName, email, password },
            });
        } catch (err: any) {
            setError(err.message || 'Registrasi gagal');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={[styles.title, { color: colors.text }]}>Buat Akun</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Daftar untuk mulai menggunakan Fisioku
                        </Text>
                    </View>

                    {/* Form */}
                    <View style={styles.form}>
                        {error && (
                            <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
                                <Ionicons name="alert-circle" size={20} color={colors.error} />
                                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                            </View>
                        )}

                        <Input
                            label="Nama Lengkap"
                            placeholder="Masukkan nama lengkap"
                            value={fullName}
                            onChangeText={setFullName}
                            autoCapitalize="words"
                            leftIcon="person-outline"
                        />

                        <Input
                            label="Email"
                            placeholder="nama@email.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            leftIcon="mail-outline"
                        />

                        <Input
                            label="Password"
                            placeholder="Minimal 6 karakter"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            leftIcon="lock-closed-outline"
                        />

                        <Input
                            label="Konfirmasi Password"
                            placeholder="Ulangi password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            leftIcon="lock-closed-outline"
                        />

                        <Button
                            title="Lanjutkan"
                            onPress={handleRegister}
                            loading={isLoading}
                            fullWidth
                            style={styles.button}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: Spacing.lg,
    },
    header: {
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        marginTop: Spacing.xs,
    },
    form: {
        flex: 1,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    errorText: {
        marginLeft: Spacing.sm,
        fontSize: Typography.fontSize.sm,
        flex: 1,
    },
    button: {
        marginTop: Spacing.sm,
    },
});
