/**
 * Fisioku Card Component
 */

import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Spacing, BorderRadius, Shadow } from '@/constants/Theme';

interface CardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
    padded?: boolean;
    shadow?: boolean;
}

export function Card({
    children,
    style,
    onPress,
    padded = true,
    shadow = true,
}: CardProps) {
    const colors = Colors.light;

    const cardStyle: ViewStyle = {
        backgroundColor: colors.card,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: colors.borderLight,
        ...(shadow ? Shadow.md : {}),
        ...(padded ? { padding: Spacing.md } : {}),
    };

    if (onPress) {
        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[cardStyle, style]}
            >
                {children}
            </TouchableOpacity>
        );
    }

    return <View style={[cardStyle, style]}>{children}</View>;
}

export default Card;
