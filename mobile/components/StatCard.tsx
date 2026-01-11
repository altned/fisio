/**
 * Stats Card Component
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow } from '@/constants/Theme';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    iconBgColor: string;
    onPress?: () => void;
}

export function StatCard({
    title,
    value,
    icon,
    iconColor,
    iconBgColor,
    onPress,
}: StatCardProps) {
    const content = (
        <>
            <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
                <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.title}>{title}</Text>
        </>
    );

    if (onPress) {
        return (
            <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.7}>
                {content}
            </TouchableOpacity>
        );
    }

    return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        ...Shadow.sm,
        marginHorizontal: Spacing.xs,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    value: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: '#1F2937',
        marginBottom: 2,
    },
    title: {
        fontSize: Typography.fontSize.xs,
        color: '#6B7280',
        textAlign: 'center',
    },
});

export default StatCard;
