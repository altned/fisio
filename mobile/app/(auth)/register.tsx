/**
 * Register Screen
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import {
    GoogleSignin,
    GoogleSigninButton,
    statusCodes,
} from '@react-native-google-signin/google-signin';

// Google OAuth Client IDs from Google Cloud Console
const GOOGLE_WEB_CLIENT_ID = '7503304584-c2j42psehfnj9d9ojsgmts1gcmud3d1j.apps.googleusercontent.com';

// Configure Google Sign-In
GoogleSignin.configure({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    offlineAccess: true,
});

export default function RegisterScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { register, loginWithGoogle, isLoading } = useAuthStore();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGoogleSignIn = async () => {
        try {
            setGoogleLoading(true);
            setError(null);

            // Check if Google Play Services are available
            await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

            // Sign in with Google
            const userInfo = await GoogleSignin.signIn();

            // Get the ID token
            const idToken = userInfo.data?.idToken;

            if (idToken) {
                await loginWithGoogle(idToken);
                // Navigation handled by _layout.tsx
            } else {
                setError('Gagal mendapatkan token dari Google');
            }
        } catch (err: any) {
            console.error('Google Sign-In error:', err);

            if (err.code === statusCodes.SIGN_IN_CANCELLED) {
                // User cancelled the sign-in
                console.log('User cancelled Google Sign-In');
            } else if (err.code === statusCodes.IN_PROGRESS) {
                setError('Sign-in sedang dalam proses');
            } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                setError('Google Play Services tidak tersedia');
            } else {
                setError(err.message || 'Daftar dengan Google gagal');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

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
            // Register directly as PATIENT (therapists register via admin dashboard)
            await register({ fullName, email, password, role: 'PATIENT' });
            // Navigation handled by _layout.tsx after successful registration
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

                        {/* Google Sign-In Button - Official */}
                        <GoogleSigninButton
                            style={styles.googleSigninButton}
                            size={GoogleSigninButton.Size.Wide}
                            color={GoogleSigninButton.Color.Light}
                            onPress={handleGoogleSignIn}
                            disabled={googleLoading}
                        />

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>atau</Text>
                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                        </View>

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
    googleSigninButton: {
        width: '100%',
        height: 48,
        alignSelf: 'center',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: Spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: Spacing.md,
        fontSize: Typography.fontSize.sm,
    },
    button: {
        marginTop: Spacing.sm,
    },
});
