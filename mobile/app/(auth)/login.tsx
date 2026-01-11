/**
 * Login Screen
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableOpacity,
    Image,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client IDs
const GOOGLE_WEB_CLIENT_ID = '7503304584-c2j42psehfnj9d9ojsgmts1gcmud3d1j.apps.googleusercontent.com';
const GOOGLE_ANDROID_CLIENT_ID = '7503304584-n1st5g1mk278lt54d92p12c4rlns7r21.apps.googleusercontent.com';

export default function LoginScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { login, loginWithGoogle, isLoading } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Google OAuth config - expoClientId needed for Expo Go
    const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
        expoClientId: GOOGLE_WEB_CLIENT_ID,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    });

    // Handle Google OAuth response
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            handleGoogleLogin(id_token);
        } else if (response?.type === 'error') {
            setError('Google login gagal');
            setGoogleLoading(false);
        }
    }, [response]);

    const handleGoogleLogin = async (idToken: string) => {
        try {
            setGoogleLoading(true);
            setError(null);
            await loginWithGoogle(idToken);
            // Navigation handled by _layout.tsx
        } catch (err: any) {
            console.error('Google login error:', err);
            setError(err.message || 'Login dengan Google gagal');
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleGooglePress = () => {
        setGoogleLoading(true);
        setError(null);
        promptAsync();
    };

    const handleLogin = async () => {
        console.log('=== LOGIN ATTEMPT ===');
        console.log('Email:', email);
        console.log('Password:', password ? '******' : '(empty)');

        if (!email || !password) {
            setError('Email dan password wajib diisi');
            return;
        }

        setError(null);

        try {
            console.log('Calling login API...');
            await login(email, password);
            console.log('Login successful!');
            // Navigation will be handled by _layout.tsx
        } catch (err: any) {
            console.error('Login failed:', err);
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
                        <Image
                            source={require('@/assets/images/logo.png')}
                            style={styles.logo}
                            resizeMode="contain"
                        />
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

                        {/* Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                            <Text style={[styles.dividerText, { color: colors.textSecondary }]}>atau</Text>
                            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                        </View>

                        {/* Google Sign-In Button */}
                        <TouchableOpacity
                            style={[styles.googleButton, { borderColor: colors.border }]}
                            onPress={handleGooglePress}
                            disabled={!request || googleLoading}
                            activeOpacity={0.7}
                        >
                            {googleLoading ? (
                                <Text style={[styles.googleButtonText, { color: colors.text }]}>Loading...</Text>
                            ) : (
                                <>
                                    <View style={styles.googleIcon}>
                                        <Text style={{ fontSize: 18 }}>🔵</Text>
                                    </View>
                                    <Text style={[styles.googleButtonText, { color: colors.text }]}>
                                        Masuk dengan Google
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

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
        paddingTop: Spacing.xl,
    },
    logo: {
        width: 220,
        height: 90,
        marginBottom: Spacing.lg,
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        marginTop: Spacing.xs,
        textAlign: 'center',
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
    // Divider styles
    dividerContainer: {
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
    // Google button styles
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        backgroundColor: '#fff',
    },
    googleIcon: {
        marginRight: Spacing.sm,
    },
    googleButtonText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
    },
});
