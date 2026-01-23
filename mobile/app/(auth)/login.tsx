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

export default function LoginScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { login, loginWithGoogle, isLoading } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [googleLoading, setGoogleLoading] = useState(false);

    const handleGooglePress = async () => {
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
                setError(err.message || 'Login dengan Google gagal');
            }
        } finally {
            setGoogleLoading(false);
        }
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
                        <Text style={[styles.welcomeText, { color: colors.text }]}>
                            Selamat Datang!
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Masuk untuk menikmati layanan fisioterapi profesional di rumah
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

                        <View style={styles.forgotPasswordContainer}>
                            <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                                <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
                                    Lupa Password?
                                </Text>
                            </TouchableOpacity>
                        </View>

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

                        {/* Google Sign-In Button - Official */}
                        <GoogleSigninButton
                            style={styles.googleSigninButton}
                            size={GoogleSigninButton.Size.Wide}
                            color={GoogleSigninButton.Color.Light}
                            onPress={handleGooglePress}
                            disabled={googleLoading}
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
        paddingTop: Spacing.lg,
    },
    logo: {
        width: 280,
        height: 110,
        marginBottom: Spacing.md,
    },
    welcomeText: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
        textAlign: 'center',
        paddingHorizontal: Spacing.lg,
        lineHeight: 20,
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
    googleSigninButton: {
        width: '100%',
        height: 48,
        alignSelf: 'center',
    },
    // Forgot password styles
    forgotPasswordContainer: {
        alignItems: 'flex-end',
        marginTop: Spacing.xs,
        marginBottom: Spacing.md,
    },
    forgotPasswordText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
});
