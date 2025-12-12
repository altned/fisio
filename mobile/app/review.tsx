/**
 * Review Screen - Patient leaves rating and optional comment after session
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Alert,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Card } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';

export default function ReviewScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const params = useLocalSearchParams<{
        bookingId: string;
        therapistId: string;
        therapistName: string;
        packageName: string;
    }>();

    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Rating Wajib', 'Silakan pilih rating bintang.');
            return;
        }

        try {
            setIsSubmitting(true);
            await api.post('/reviews', {
                bookingId: params.bookingId,
                therapistId: params.therapistId,
                rating,
                comment: comment.trim() || null,
            });
            Alert.alert(
                'Terima Kasih!',
                'Review Anda telah dikirim.',
                [{ text: 'OK', onPress: () => router.replace('/(tabs)/bookings') }]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Gagal mengirim review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = () => {
        return (
            <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={star <= rating ? 'star' : 'star-outline'}
                            size={48}
                            color={star <= rating ? '#FFD700' : colors.textMuted}
                        />
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    const getRatingText = () => {
        switch (rating) {
            case 1: return 'Sangat Buruk';
            case 2: return 'Buruk';
            case 3: return 'Cukup';
            case 4: return 'Baik';
            case 5: return 'Sangat Baik';
            default: return 'Pilih rating';
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <Stack.Screen options={{ title: 'Beri Review' }} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Therapist Info */}
                <Card style={styles.infoCard}>
                    <View style={styles.therapistInfo}>
                        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="person" size={32} color={colors.primary} />
                        </View>
                        <View style={styles.therapistText}>
                            <Text style={[styles.therapistName, { color: colors.text }]}>
                                {params.therapistName}
                            </Text>
                            <Text style={[styles.packageName, { color: colors.textSecondary }]}>
                                {params.packageName}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Rating Section */}
                <View style={styles.ratingSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Bagaimana pengalaman Anda?
                    </Text>
                    {renderStars()}
                    <Text style={[
                        styles.ratingText,
                        { color: rating > 0 ? colors.primary : colors.textMuted }
                    ]}>
                        {getRatingText()}
                    </Text>
                </View>

                {/* Comment Section */}
                <View style={styles.commentSection}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Komentar <Text style={{ color: colors.textMuted }}>(opsional)</Text>
                    </Text>
                    <TextInput
                        style={[
                            styles.commentInput,
                            {
                                backgroundColor: colors.card,
                                color: colors.text,
                                borderColor: colors.border,
                            }
                        ]}
                        placeholder="Ceritakan pengalaman Anda dengan terapis ini..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        value={comment}
                        onChangeText={setComment}
                    />
                </View>
            </ScrollView>

            {/* Footer Button */}
            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <Button
                    title={isSubmitting ? 'Mengirim...' : 'Kirim Review'}
                    onPress={handleSubmit}
                    disabled={isSubmitting || rating === 0}
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
        padding: Spacing.lg,
    },
    infoCard: {
        marginBottom: Spacing.xl,
    },
    therapistInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    therapistText: {
        marginLeft: Spacing.md,
    },
    therapistName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
    },
    packageName: {
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
    ratingSection: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    starsContainer: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginVertical: Spacing.md,
    },
    ratingText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
    },
    commentSection: {
        marginBottom: Spacing.lg,
    },
    commentInput: {
        minHeight: 100,
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.md,
    },
    footer: {
        padding: Spacing.lg,
        borderTopWidth: 1,
    },
});
