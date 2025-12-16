/**
 * Skeleton Loading Component
 * Provides placeholder animations while content is loading
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { BorderRadius, Spacing } from '@/constants/Theme';

interface SkeletonProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({
    width = '100%',
    height = 20,
    borderRadius = BorderRadius.sm,
    style
}: SkeletonProps) {
    const colors = Colors.light;
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animation = Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        );
        animation.start();
        return () => animation.stop();
    }, [animatedValue]);

    const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                    backgroundColor: colors.border,
                    opacity,
                },
                style,
            ]}
        />
    );
}

// Preset skeleton for common use cases
export function SkeletonText({ lines = 1, lastLineWidth = '60%' }: { lines?: number; lastLineWidth?: string }) {
    return (
        <View style={styles.textContainer}>
            {Array.from({ length: lines }).map((_, index) => (
                <Skeleton
                    key={index}
                    width={index === lines - 1 ? lastLineWidth : '100%'}
                    height={14}
                    style={index < lines - 1 ? styles.textLine : undefined}
                />
            ))}
        </View>
    );
}

export function SkeletonCard() {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Skeleton width={48} height={48} borderRadius={24} />
                <View style={styles.cardHeaderText}>
                    <Skeleton width="70%" height={16} />
                    <Skeleton width="50%" height={12} style={{ marginTop: Spacing.xs }} />
                </View>
            </View>
            <SkeletonText lines={2} />
            <View style={styles.cardFooter}>
                <Skeleton width="30%" height={12} />
                <Skeleton width="20%" height={12} />
            </View>
        </View>
    );
}

export function SkeletonBookingCard() {
    const colors = Colors.light;
    return (
        <View style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.bookingHeader}>
                <Skeleton width={80} height={24} borderRadius={BorderRadius.full} />
                <Skeleton width={60} height={20} borderRadius={BorderRadius.sm} />
            </View>
            <View style={styles.bookingBody}>
                <Skeleton width="60%" height={18} />
                <Skeleton width="80%" height={14} style={{ marginTop: Spacing.sm }} />
                <Skeleton width="40%" height={14} style={{ marginTop: Spacing.xs }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
    textContainer: {
        gap: Spacing.xs,
    },
    textLine: {
        marginBottom: Spacing.xs,
    },
    card: {
        padding: Spacing.md,
        gap: Spacing.md,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    cardHeaderText: {
        flex: 1,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bookingCard: {
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.md,
    },
    bookingHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    bookingBody: {
        gap: Spacing.xs,
    },
});
