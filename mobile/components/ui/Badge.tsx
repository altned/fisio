/**
 * Fisioku Badge Component
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { BookingStatus, PaymentStatus, SessionStatus } from '@/types';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
    label: string;
    variant?: BadgeVariant;
    size?: BadgeSize;
    style?: ViewStyle;
}

// Status to variant mapping
export function getBookingStatusVariant(status: BookingStatus): BadgeVariant {
    switch (status) {
        case 'PENDING': return 'warning';
        case 'PAID': return 'info';
        case 'COMPLETED': return 'success';
        case 'CANCELLED': return 'error';
        default: return 'default';
    }
}

export function getPaymentStatusVariant(status: PaymentStatus): BadgeVariant {
    switch (status) {
        case 'PENDING': return 'warning';
        case 'PAID': return 'success';
        case 'EXPIRED': return 'default';
        case 'CANCELLED':
        case 'FAILED': return 'error';
        default: return 'default';
    }
}

export function getSessionStatusVariant(status: SessionStatus): BadgeVariant {
    switch (status) {
        case 'PENDING_SCHEDULING': return 'warning';
        case 'SCHEDULED': return 'info';
        case 'COMPLETED': return 'success';
        case 'FORFEITED': return 'error';
        case 'EXPIRED':
        case 'CANCELLED': return 'default';
        default: return 'default';
    }
}

export function Badge({ label, variant = 'default', size = 'sm', style }: BadgeProps) {
    const colors = Colors.light;

    const getColors = () => {
        switch (variant) {
            case 'success':
                return { bg: colors.successLight, text: colors.success };
            case 'warning':
                return { bg: colors.warningLight, text: colors.warning };
            case 'error':
                return { bg: colors.errorLight, text: colors.error };
            case 'info':
                return { bg: colors.infoLight, text: colors.info };
            case 'primary':
                return { bg: colors.primaryLight, text: colors.primary };
            default:
                return { bg: colors.backgroundSecondary, text: colors.textSecondary };
        }
    };

    const { bg, text } = getColors();

    return (
        <View
            style={[
                styles.badge,
                {
                    backgroundColor: bg,
                    paddingVertical: size === 'sm' ? 2 : Spacing.xs,
                    paddingHorizontal: size === 'sm' ? Spacing.xs : Spacing.sm,
                },
                style,
            ]}
        >
            <Text
                style={[
                    styles.text,
                    {
                        color: text,
                        fontSize: size === 'sm' ? Typography.fontSize.xs : Typography.fontSize.sm,
                    },
                ]}
            >
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        borderRadius: BorderRadius.sm,
        alignSelf: 'flex-start',
    },
    text: {
        fontWeight: Typography.fontWeight.medium,
        textTransform: 'uppercase',
    },
});

export default Badge;
