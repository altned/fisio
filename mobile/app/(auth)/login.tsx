/**
 * Login Screen
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { login, isLoading } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Email dan password wajib diisi');
            return;
        }

        setError(null);

        try {
            await login(email, password);
            // Navigation will be handled by _layout.tsx
        } catch (err: any) {
            setError(err.message || 'Login gagal');
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
                    {/* Logo & Header */}
                    <View style={styles.header}>
                        <View style={[styles.logoContainer, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="medical" size={48} color={colors.primary} />
                        </View>
                        <Text style={[styles.title, { color: colors.text }]}>Fisioku</Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Layanan Fisioterapi Home Visit
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
                            placeholder="Masukkan password"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            leftIcon="lock-closed-outline"
                        />

                        <Button
                            title="Masuk"
                            onPress={handleLogin}
                            loading={isLoading}
                            fullWidth
                            style={styles.loginButton}
                        />

                        {/* Register Link */}
                        <View style={styles.registerContainer}>
                            <Text style={[styles.registerText, { color: colors.textSecondary }]}>
                                Belum punya akun?{' '}
                            </Text>
                            <Link href="/(auth)/register" asChild>
                                <TouchableOpacity>
                                    <Text style={[styles.registerLink, { color: colors.primary }]}>
                                        Daftar Sekarang
                                    </Text>
                                </TouchableOpacity>
                            </Link>
                        </View>
                    </View>

                    {/* Demo Credentials */}
                    <View style={[styles.demoBox, { backgroundColor: colors.infoLight }]}>
                        <Text style={[styles.demoTitle, { color: colors.info }]}>Demo Credentials</Text>
                        <Text style={[styles.demoText, { color: colors.textSecondary }]}>
                            Patient: patient@example.com / patient123
                        </Text>
                        <Text style={[styles.demoText, { color: colors.textSecondary }]}>
                            Therapist: therapist@example.com / therapist123
                        </Text>
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
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    logoContainer: {
        width: 100,
        height: 100,
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.fontSize['3xl'],
        fontWeight: Typography.fontWeight.bold,
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        marginTop: Spacing.xs,
    },
    form: {
        marginBottom: Spacing.xl,
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
    loginButton: {
        marginTop: Spacing.sm,
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: Spacing.lg,
    },
    registerText: {
        fontSize: Typography.fontSize.md,
    },
    registerLink: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    demoBox: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    demoTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.xs,
    },
    demoText: {
        fontSize: Typography.fontSize.xs,
    },
});
