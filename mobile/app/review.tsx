/**
 * Review Screen - Submit rating and comment after session completion
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Card, StarRating } from '@/components/ui';
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
            Alert.alert('Rating Diperlukan', 'Silakan berikan rating minimal 1 bintang');
            return;
        }

        if (!params.bookingId || !params.therapistId) {
            Alert.alert('Error', 'Data booking tidak lengkap');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.submitReview(
                params.bookingId,
                params.therapistId,
                rating,
                comment.trim() || undefined
            );
            Alert.alert(
                'Terima Kasih!',
                'Review Anda telah berhasil dikirim.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (err: any) {
            Alert.alert('Gagal', err.message || 'Gagal mengirim review');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <Stack.Screen
                options={{
                    title: 'Berikan Review',
                    headerStyle: { backgroundColor: colors.card },
                    headerTitleStyle: { color: colors.text },
                }}
            />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="star" size={40} color={colors.primary} />
                        </View>
                        <Text style={[styles.title, { color: colors.text }]}>
                            Bagaimana pengalaman Anda?
                        </Text>
                        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                            Review Anda membantu terapis dan pasien lainnya
                        </Text>
                    </View>

                    {/* Therapist Info */}
                    <Card style={styles.therapistCard}>
                        <View style={styles.therapistRow}>
                            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                                <Ionicons name="person" size={24} color={colors.primary} />
                            </View>
                            <View>
                                <Text style={[styles.therapistName, { color: colors.text }]}>
                                    {params.therapistName || 'Terapis'}
                                </Text>
                                <Text style={[styles.packageName, { color: colors.textSecondary }]}>
                                    {params.packageName || 'Paket Fisioterapi'}
                                </Text>
                            </View>
                        </View>
                    </Card>

                    {/* Rating */}
                    <Card style={styles.ratingCard}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Rating
                        </Text>
                        <StarRating
                            rating={rating}
                            onRatingChange={setRating}
                            size={40}
                            editable={!isSubmitting}
                        />
                    </Card>

                    {/* Comment */}
                    <Card style={styles.commentCard}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Komentar (Opsional)
                        </Text>
                        <TextInput
                            style={[
                                styles.textInput,
                                {
                                    backgroundColor: colors.background,
                                    color: colors.text,
                                    borderColor: colors.border,
                                },
                            ]}
                            placeholder="Ceritakan pengalaman Anda dengan terapis ini..."
                            placeholderTextColor={colors.textMuted}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                            value={comment}
                            onChangeText={setComment}
                            editable={!isSubmitting}
                        />
                    </Card>
                </ScrollView>

                {/* Submit Button */}
                <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <Button
                        title={isSubmitting ? 'Mengirim...' : 'Kirim Review'}
                        onPress={handleSubmit}
                        variant="primary"
                        disabled={isSubmitting || rating === 0}
                        fullWidth
                    />
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: Spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        textAlign: 'center',
    },
    therapistCard: {
        marginBottom: Spacing.md,
    },
    therapistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    therapistName: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    packageName: {
        fontSize: Typography.fontSize.sm,
        marginTop: 2,
    },
    ratingCard: {
        marginBottom: Spacing.md,
        alignItems: 'center',
        paddingVertical: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    commentCard: {
        marginBottom: Spacing.md,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.md,
        minHeight: 120,
    },
    footer: {
        padding: Spacing.md,
        borderTopWidth: 1,
    },
});
