/**
 * Fisioku Button Component
 */

import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    style?: ViewStyle;
    textStyle?: TextStyle;
}

export function Button({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    style,
    textStyle,
}: ButtonProps) {
    const colors = Colors.light;

    const getBackgroundColor = () => {
        if (disabled) return colors.border;
        switch (variant) {
            case 'primary': return colors.primary;
            case 'secondary': return colors.primaryLight;
            case 'danger': return colors.error;
            case 'outline':
            case 'ghost': return 'transparent';
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.textMuted;
        switch (variant) {
            case 'primary':
            case 'danger': return '#FFFFFF';
            case 'secondary': return colors.primary;
            case 'outline': return colors.primary;
            case 'ghost': return colors.primary;
            default: return '#FFFFFF';
        }
    };

    const getBorderColor = () => {
        if (variant === 'outline') return colors.primary;
        return 'transparent';
    };

    const getPadding = () => {
        switch (size) {
            case 'sm': return { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md };
            case 'lg': return { paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl };
            default: return { paddingVertical: Spacing.sm + 2, paddingHorizontal: Spacing.lg };
        }
    };

    const getFontSize = () => {
        switch (size) {
            case 'sm': return Typography.fontSize.sm;
            case 'lg': return Typography.fontSize.lg;
            default: return Typography.fontSize.md;
        }
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.7}
            style={[
                styles.button,
                {
                    backgroundColor: getBackgroundColor(),
                    borderColor: getBorderColor(),
                    ...getPadding(),
                },
                fullWidth && styles.fullWidth,
                style,
            ]}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} size="small" />
            ) : (
                <>
                    {leftIcon}
                    <Text
                        style={[
                            styles.text,
                            {
                                color: getTextColor(),
                                fontSize: getFontSize(),
                                marginLeft: leftIcon ? Spacing.xs : 0,
                                marginRight: rightIcon ? Spacing.xs : 0,
                            },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                    {rightIcon}
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
        borderWidth: 1.5,
    },
    fullWidth: {
        width: '100%',
    },
    text: {
        fontWeight: Typography.fontWeight.semibold,
        textAlign: 'center',
    },
});

export default Button;
