/**
 * Star Rating Component
 * Interactive star rating input for reviews
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Spacing, Typography } from '@/constants/Theme';

interface StarRatingProps {
    rating: number;
    onRatingChange?: (rating: number) => void;
    size?: number;
    editable?: boolean;
    showLabel?: boolean;
}

const RATING_LABELS = ['Sangat Buruk', 'Buruk', 'Cukup', 'Baik', 'Sangat Baik'];

export function StarRating({
    rating,
    onRatingChange,
    size = 32,
    editable = true,
    showLabel = true,
}: StarRatingProps) {
    const colors = Colors.light;

    const handlePress = (star: number) => {
        if (editable && onRatingChange) {
            onRatingChange(star);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => handlePress(star)}
                        disabled={!editable}
                        style={styles.starButton}
                        activeOpacity={editable ? 0.7 : 1}
                    >
                        <Ionicons
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={size}
                            color={star <= rating ? '#FFD700' : colors.border}
                        />
                    </TouchableOpacity>
                ))}
            </View>
            {showLabel && rating > 0 && (
                <Text style={[styles.label, { color: colors.textSecondary }]}>
                    {RATING_LABELS[rating - 1]}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        gap: Spacing.sm,
    },
    starsRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    starButton: {
        padding: Spacing.xs,
    },
    label: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
    },
});
