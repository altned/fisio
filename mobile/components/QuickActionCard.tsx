/**
 * Quick Action Card Component
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';

interface QuickActionCardProps {
    title: string;
    subtitle: string;
    icon: keyof typeof Ionicons.glyphMap;
    colors: readonly [string, string, ...string[]];
    onPress: () => void;
}

export function QuickActionCard({
    title,
    subtitle,
    icon,
    colors,
    onPress,
}: QuickActionCardProps) {
    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
            <LinearGradient
                colors={colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.container}
            >
                <View style={styles.iconContainer}>
                    <Ionicons name={icon} size={32} color="#fff" />
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.lg,
        borderRadius: BorderRadius.xl,
        marginBottom: Spacing.md,
        overflow: 'hidden',
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        color: '#fff',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
        color: 'rgba(255,255,255,0.8)',
    },
});

export default QuickActionCard;
