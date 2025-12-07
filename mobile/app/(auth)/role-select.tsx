/**
 * Role Selection Screen
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadow } from '@/constants/Theme';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { UserRole } from '@/types';
import { Ionicons } from '@expo/vector-icons';

type RoleOption = {
    role: UserRole;
    title: string;
    description: string;
    icon: keyof typeof Ionicons.glyphMap;
};

const roleOptions: RoleOption[] = [
    {
        role: 'PATIENT',
        title: 'Pasien',
        description: 'Saya ingin memesan layanan fisioterapi home visit',
        icon: 'person',
    },
    {
        role: 'THERAPIST',
        title: 'Terapis',
        description: 'Saya adalah fisioterapis dan ingin menerima booking',
        icon: 'medkit',
    },
];

export default function RoleSelectScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const params = useLocalSearchParams<{ fullName: string; email: string; password: string }>();
    const { register, isLoading } = useAuthStore();

    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleContinue = async () => {
        if (!selectedRole) {
            setError('Pilih peran Anda');
            return;
        }

        setError(null);

        try {
            await register({
                fullName: params.fullName,
                email: params.email,
                password: params.password,
                role: selectedRole,
            });
            // Navigation will be handled by _layout.tsx
        } catch (err: any) {
            setError(err.message || 'Registrasi gagal');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>Pilih Peran Anda</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Bagaimana Anda akan menggunakan Fisioku?
                    </Text>
                </View>

                {/* Error */}
                {error && (
                    <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
                        <Ionicons name="alert-circle" size={20} color={colors.error} />
                        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                    </View>
                )}

                {/* Role Options */}
                <View style={styles.optionsContainer}>
                    {roleOptions.map((option) => {
                        const isSelected = selectedRole === option.role;
                        return (
                            <TouchableOpacity
                                key={option.role}
                                onPress={() => setSelectedRole(option.role)}
                                activeOpacity={0.7}
                                style={[
                                    styles.optionCard,
                                    {
                                        backgroundColor: colors.card,
                                        borderColor: isSelected ? colors.primary : colors.border,
                                        borderWidth: isSelected ? 2 : 1,
                                    },
                                    isSelected && Shadow.md,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.iconContainer,
                                        {
                                            backgroundColor: isSelected ? colors.primaryLight : colors.backgroundSecondary,
                                        },
                                    ]}
                                >
                                    <Ionicons
                                        name={option.icon}
                                        size={32}
                                        color={isSelected ? colors.primary : colors.textSecondary}
                                    />
                                </View>
                                <View style={styles.optionContent}>
                                    <Text
                                        style={[
                                            styles.optionTitle,
                                            { color: isSelected ? colors.primary : colors.text },
                                        ]}
                                    >
                                        {option.title}
                                    </Text>
                                    <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                                        {option.description}
                                    </Text>
                                </View>
                                {isSelected && (
                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Button */}
                <Button
                    title="Daftar"
                    onPress={handleContinue}
                    loading={isLoading}
                    disabled={!selectedRole}
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
        flex: 1,
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
    optionsContainer: {
        flex: 1,
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.xs,
    },
    optionDescription: {
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    },
});
