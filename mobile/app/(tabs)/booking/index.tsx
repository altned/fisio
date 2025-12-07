/**
 * Step 1: Therapist Selection
 */

import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Image,
    RefreshControl,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadow } from '@/constants/Theme';
import { Button, Card, Badge } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Therapist } from '@/types';

export default function TherapistSelectionScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchTherapists = async () => {
        try {
            const data = await api.get<Therapist[]>('/therapists');
            setTherapists(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchTherapists();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchTherapists();
    };

    const handleSelectTherapist = (therapist: Therapist) => {
        // Navigate to next step with params
        router.push({
            pathname: '/(tabs)/booking/step2-package',
            params: { therapistId: therapist.id, therapistName: therapist.user?.fullName },
        });
    };

    const renderItem = ({ item }: { item: Therapist }) => (
        <TouchableOpacity
            onPress={() => handleSelectTherapist(item)}
            activeOpacity={0.7}
        >
            <Card style={styles.card} shadow>
                <View style={styles.cardContent}>
                    <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                        <Ionicons name="person" size={32} color={colors.primary} />
                    </View>
                    <View style={styles.info}>
                        <Text style={[styles.name, { color: colors.text }]}>
                            {item.user?.fullName || 'Fisioterapis'}
                        </Text>
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={16} color="#FFC107" />
                            <Text style={[styles.rating, { color: colors.textSecondary }]}>
                                {item.averageRating} ({item.totalReviews} ulasan)
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Pilih Terapis</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Tersedia {therapists.length} fisioterapis profesional
                </Text>
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={therapists}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={{ color: colors.textMuted }}>Belum ada terapis tersedia</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: Spacing.lg,
        paddingBottom: Spacing.md,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        marginTop: Spacing.xs,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    card: {
        padding: Spacing.md,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    info: {
        flex: 1,
    },
    name: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    rating: {
        marginLeft: 4,
        fontSize: Typography.fontSize.sm,
    },
    empty: {
        alignItems: 'center',
        padding: Spacing.xl,
    },
});
