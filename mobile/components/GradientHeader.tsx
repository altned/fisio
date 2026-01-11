/**
 * Gradient Header Component for Dashboard
 */

import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';

interface GradientHeaderProps {
    title: string;
    subtitle: string;
    userName?: string;
    userPhoto?: string | null;
    variant?: 'patient' | 'therapist';
}

export function GradientHeader({
    title,
    subtitle,
    userName,
    userPhoto,
    variant = 'patient',
}: GradientHeaderProps) {
    const router = useRouter();

    // Healthcare color gradients
    const patientColors = ['#2196F3', '#1976D2', '#0D47A1'] as const;
    const therapistColors = ['#00BCD4', '#0097A7', '#006064'] as const;

    return (
        <LinearGradient
            colors={variant === 'patient' ? patientColors : therapistColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.container}
        >
            <View style={styles.content}>
                <View style={styles.textContainer}>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                    <Text style={styles.title}>{title}</Text>
                </View>
                <TouchableOpacity
                    style={styles.avatarContainer}
                    onPress={() => router.push('/(tabs)/profile')}
                >
                    {userPhoto ? (
                        <Image source={{ uri: userPhoto }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={28} color="#fff" />
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {/* Decorative circles */}
            <View style={[styles.circle, styles.circle1]} />
            <View style={[styles.circle, styles.circle2]} />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.xl * 2,
        paddingHorizontal: Spacing.lg,
        borderBottomLeftRadius: BorderRadius.xl * 2,
        borderBottomRightRadius: BorderRadius.xl * 2,
        overflow: 'hidden',
        position: 'relative',
    },
    content: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10,
    },
    textContainer: {
        flex: 1,
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: '#fff',
    },
    avatarContainer: {
        marginLeft: Spacing.md,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.5)',
    },
    // Decorative elements
    circle: {
        position: 'absolute',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 1000,
    },
    circle1: {
        width: 150,
        height: 150,
        top: -50,
        right: -30,
    },
    circle2: {
        width: 100,
        height: 100,
        bottom: -30,
        left: 50,
    },
});

export default GradientHeader;
