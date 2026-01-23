/**
 * Forgot Password Screen - Request OTP and reset password
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/lib/api';

type Step = 'email' | 'otp' | 'success';

export default function ForgotPasswordScreen() {
    const colors = Colors.light;
    const router = useRouter();

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [devOtp, setDevOtp] = useState<string | null>(null); // For development mode
    const [resendCooldown, setResendCooldown] = useState(0); // Cooldown in seconds
    const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cooldown timer effect
    useEffect(() => {
        if (resendCooldown > 0) {
            cooldownRef.current = setTimeout(() => {
                setResendCooldown(prev => prev - 1);
            }, 1000);
        }
        return () => {
            if (cooldownRef.current) {
                clearTimeout(cooldownRef.current);
            }
        };
    }, [resendCooldown]);

    // Start cooldown when OTP is sent
    const startCooldown = () => {
        setResendCooldown(60); // 60 seconds cooldown
    };

    const handleRequestOtp = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Email wajib diisi');
            return;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            Alert.alert('Error', 'Email tidak valid');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Gagal mengirim OTP');
            }

            // In dev mode, OTP is returned in response
            if (data.otp) {
                setDevOtp(data.otp);
                Alert.alert(
                    'Development Mode',
                    `OTP Anda: ${data.otp}\n\n(Di production, OTP akan dikirim via email)`,
                    [{ text: 'OK' }]
                );
            }

            setStep('otp');
            startCooldown(); // Start resend cooldown
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp.trim()) {
            Alert.alert('Error', 'Kode OTP wajib diisi');
            return;
        }

        if (otp.length !== 6) {
            Alert.alert('Error', 'Kode OTP harus 6 digit');
            return;
        }

        if (!newPassword.trim()) {
            Alert.alert('Error', 'Password baru wajib diisi');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password minimal 6 karakter');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Konfirmasi password tidak cocok');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim().toLowerCase(),
                    otp: otp.trim(),
                    newPassword,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Gagal reset password');
            }

            setStep('success');
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    const goToLogin = () => {
        router.replace('/login');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.content}>
                        {/* Step: Email Input */}
                        {step === 'email' && (
                            <>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="lock-closed-outline" size={64} color={colors.primary} />
                                </View>
                                <Text style={[styles.title, { color: colors.text }]}>Lupa Password?</Text>
                                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                    Masukkan email untuk menerima kode OTP reset password.
                                </Text>

                                <View style={styles.form}>
                                    <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: colors.card,
                                            color: colors.text,
                                            borderColor: colors.border,
                                        }]}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="Masukkan email"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>

                                <Button
                                    title={loading ? 'Mengirim...' : 'Kirim Kode OTP'}
                                    onPress={handleRequestOtp}
                                    disabled={loading}
                                    fullWidth
                                    style={{ marginTop: Spacing.lg }}
                                />
                            </>
                        )}

                        {/* Step: OTP and New Password */}
                        {step === 'otp' && (
                            <>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="key-outline" size={64} color={colors.primary} />
                                </View>
                                <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
                                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                    Masukkan kode OTP yang dikirim ke {email}
                                </Text>

                                {/* Dev mode OTP hint */}
                                {devOtp && (
                                    <View style={[styles.devHint, { backgroundColor: colors.primaryLight }]}>
                                        <Text style={[styles.devHintText, { color: colors.primary }]}>
                                            🔧 Dev: OTP = {devOtp}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.form}>
                                    <Text style={[styles.label, { color: colors.text }]}>Kode OTP</Text>
                                    <TextInput
                                        style={[styles.input, styles.otpInput, {
                                            backgroundColor: colors.card,
                                            color: colors.text,
                                            borderColor: colors.border,
                                        }]}
                                        value={otp}
                                        onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                                        placeholder="000000"
                                        placeholderTextColor={colors.textMuted}
                                        keyboardType="number-pad"
                                        maxLength={6}
                                        textAlign="center"
                                    />

                                    <Text style={[styles.label, { color: colors.text, marginTop: Spacing.md }]}>
                                        Password Baru
                                    </Text>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: colors.card,
                                            color: colors.text,
                                            borderColor: colors.border,
                                        }]}
                                        value={newPassword}
                                        onChangeText={setNewPassword}
                                        placeholder="Minimal 6 karakter"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry
                                    />

                                    <Text style={[styles.label, { color: colors.text, marginTop: Spacing.md }]}>
                                        Konfirmasi Password
                                    </Text>
                                    <TextInput
                                        style={[styles.input, {
                                            backgroundColor: colors.card,
                                            color: colors.text,
                                            borderColor: colors.border,
                                        }]}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        placeholder="Ulangi password baru"
                                        placeholderTextColor={colors.textMuted}
                                        secureTextEntry
                                    />
                                </View>

                                <Button
                                    title={loading ? 'Menyimpan...' : 'Reset Password'}
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                    fullWidth
                                    style={{ marginTop: Spacing.lg }}
                                />

                                {/* Resend OTP */}
                                <TouchableOpacity
                                    onPress={handleRequestOtp}
                                    disabled={resendCooldown > 0 || loading}
                                    style={[styles.resendLink, resendCooldown > 0 && { opacity: 0.5 }]}
                                >
                                    <Ionicons name="refresh-outline" size={16} color={colors.primary} />
                                    <Text style={[styles.resendText, { color: colors.primary }]}>
                                        {resendCooldown > 0
                                            ? `Kirim ulang OTP (${resendCooldown}s)`
                                            : 'Kirim ulang OTP'
                                        }
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => setStep('email')}
                                    style={styles.backLink}
                                >
                                    <Text style={[styles.backLinkText, { color: colors.textSecondary }]}>
                                        ← Kembali ke input email
                                    </Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* Step: Success */}
                        {step === 'success' && (
                            <>
                                <View style={styles.iconContainer}>
                                    <Ionicons name="checkmark-circle" size={80} color="#10B981" />
                                </View>
                                <Text style={[styles.title, { color: colors.text }]}>Password Diubah!</Text>
                                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                                    Password Anda berhasil diubah. Silakan login dengan password baru.
                                </Text>

                                <Button
                                    title="Login Sekarang"
                                    onPress={goToLogin}
                                    fullWidth
                                    style={{ marginTop: Spacing.xl }}
                                />
                            </>
                        )}
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
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        padding: Spacing.xs,
    },
    content: {
        flex: 1,
        paddingHorizontal: Spacing.xl,
        paddingTop: Spacing.xl,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    form: {
        width: '100%',
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
    otpInput: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        letterSpacing: 8,
    },
    backLink: {
        marginTop: Spacing.lg,
        alignItems: 'center',
    },
    backLinkText: {
        fontSize: Typography.fontSize.sm,
    },
    devHint: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.md,
    },
    devHintText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        textAlign: 'center',
    },
    resendLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.lg,
        gap: Spacing.xs,
    },
    resendText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
});
