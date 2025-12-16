/**
 * Step 1: Therapist Selection with Filter
 */

import React, { useEffect, useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    RefreshControl,
    TouchableOpacity,
    Modal,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Card, Badge, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Therapist, TherapistBidang } from '@/types';

const BIDANG_OPTIONS: TherapistBidang[] = [
    'Fisioterapi Muskuloskeletal',
    'Fisioterapi Neuromuskular',
    'Fisioterapi Kardiopulmoner',
    'Fisioterapi Pediatrik',
    'Fisioterapi Geriatrik',
    'Fisioterapi Olahraga',
];

export default function TherapistSelectionScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showFilter, setShowFilter] = useState(false);

    // Filter state
    const [selectedBidang, setSelectedBidang] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);

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

    // Get unique cities from therapists
    const cities = useMemo(() => {
        const citySet = new Set<string>();
        therapists.forEach(t => {
            if (t.city) citySet.add(t.city);
            // Extract city from address if no city field
            else if (t.address) {
                const parts = t.address.split(',');
                if (parts.length > 0) {
                    const lastPart = parts[parts.length - 1].trim();
                    if (lastPart) citySet.add(lastPart);
                }
            }
        });
        return Array.from(citySet).sort();
    }, [therapists]);

    // Filtered therapists
    const filteredTherapists = useMemo(() => {
        return therapists.filter(t => {
            if (selectedBidang && t.bidang !== selectedBidang) return false;
            if (selectedCity) {
                const therapistCity = t.city || (t.address?.split(',').pop()?.trim());
                if (therapistCity !== selectedCity) return false;
            }
            return true;
        });
    }, [therapists, selectedBidang, selectedCity]);

    const handleSelectTherapist = (therapist: Therapist) => {
        router.push({
            pathname: '/(tabs)/booking/step2-package',
            params: { therapistId: therapist.id, therapistName: therapist.user?.fullName },
        });
    };

    const clearFilters = () => {
        setSelectedBidang(null);
        setSelectedCity(null);
    };

    const activeFilterCount = (selectedBidang ? 1 : 0) + (selectedCity ? 1 : 0);

    const renderItem = ({ item }: { item: Therapist }) => {
        const cityDisplay = item.city || item.address?.split(',').pop()?.trim() || '-';

        return (
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

                            {/* Bidang/Specialty */}
                            {item.bidang && (
                                <View style={styles.tagRow}>
                                    <Badge
                                        label={item.bidang}
                                        variant="primary"
                                        size="sm"
                                    />
                                </View>
                            )}

                            {/* City Location */}
                            <View style={styles.locationRow}>
                                <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                                <Text style={[styles.location, { color: colors.textSecondary }]}>
                                    {cityDisplay}
                                </Text>
                            </View>

                            {/* Rating */}
                            <View style={styles.ratingContainer}>
                                <Ionicons name="star" size={14} color="#FFC107" />
                                <Text style={[styles.rating, { color: colors.textSecondary }]}>
                                    {item.averageRating} ({item.totalReviews} ulasan)
                                </Text>
                                {Number(item.experienceYears) > 0 && (
                                    <Text style={[styles.experience, { color: colors.textMuted }]}>
                                        • {item.experienceYears} thn
                                    </Text>
                                )}
                            </View>
                        </View>
                        <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                    </View>
                </Card>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Pilih Terapis</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Tersedia {filteredTherapists.length} fisioterapis profesional
                </Text>
            </View>

            {/* Filter Button */}
            <View style={styles.filterBar}>
                <TouchableOpacity
                    style={[
                        styles.filterButton,
                        {
                            backgroundColor: activeFilterCount > 0 ? colors.primary : colors.card,
                            borderColor: colors.border,
                        }
                    ]}
                    onPress={() => setShowFilter(true)}
                >
                    <Ionicons
                        name="filter"
                        size={18}
                        color={activeFilterCount > 0 ? '#fff' : colors.text}
                    />
                    <Text style={[
                        styles.filterButtonText,
                        { color: activeFilterCount > 0 ? '#fff' : colors.text }
                    ]}>
                        {activeFilterCount > 0 ? `Filter (${activeFilterCount})` : 'Filter'}
                    </Text>
                </TouchableOpacity>

                {activeFilterCount > 0 && (
                    <TouchableOpacity onPress={clearFilters} style={styles.clearButton}>
                        <Text style={[styles.clearText, { color: colors.primary }]}>Reset</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredTherapists}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
                    }
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="search-outline" size={48} color={colors.textMuted} />
                            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                                {activeFilterCount > 0
                                    ? 'Tidak ada terapis dengan filter ini'
                                    : 'Belum ada terapis tersedia'}
                            </Text>
                            {activeFilterCount > 0 && (
                                <Button
                                    title="Reset Filter"
                                    onPress={clearFilters}
                                    variant="outline"
                                    size="sm"
                                    style={{ marginTop: Spacing.md }}
                                />
                            )}
                        </View>
                    }
                />
            )}

            {/* Filter Modal */}
            <Modal
                visible={showFilter}
                animationType="slide"
                transparent
                onRequestClose={() => setShowFilter(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>Filter Terapis</Text>
                            <TouchableOpacity onPress={() => setShowFilter(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            {/* Bidang Filter */}
                            <Text style={[styles.filterLabel, { color: colors.text }]}>Bidang Keahlian</Text>
                            <View style={styles.filterOptions}>
                                <TouchableOpacity
                                    style={[
                                        styles.filterOption,
                                        {
                                            backgroundColor: !selectedBidang ? colors.primary : colors.background,
                                            borderColor: colors.border,
                                        }
                                    ]}
                                    onPress={() => setSelectedBidang(null)}
                                >
                                    <Text style={{ color: !selectedBidang ? '#fff' : colors.text }}>Semua</Text>
                                </TouchableOpacity>
                                {BIDANG_OPTIONS.map(bidang => (
                                    <TouchableOpacity
                                        key={bidang}
                                        style={[
                                            styles.filterOption,
                                            {
                                                backgroundColor: selectedBidang === bidang ? colors.primary : colors.background,
                                                borderColor: colors.border,
                                            }
                                        ]}
                                        onPress={() => setSelectedBidang(bidang)}
                                    >
                                        <Text style={{
                                            color: selectedBidang === bidang ? '#fff' : colors.text,
                                            fontSize: Typography.fontSize.sm,
                                        }}>
                                            {bidang.replace('Fisioterapi ', '')}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* City Filter */}
                            {cities.length > 0 && (
                                <>
                                    <Text style={[styles.filterLabel, { color: colors.text, marginTop: Spacing.lg }]}>
                                        Lokasi Kota
                                    </Text>
                                    <View style={styles.filterOptions}>
                                        <TouchableOpacity
                                            style={[
                                                styles.filterOption,
                                                {
                                                    backgroundColor: !selectedCity ? colors.primary : colors.background,
                                                    borderColor: colors.border,
                                                }
                                            ]}
                                            onPress={() => setSelectedCity(null)}
                                        >
                                            <Text style={{ color: !selectedCity ? '#fff' : colors.text }}>Semua</Text>
                                        </TouchableOpacity>
                                        {cities.map(city => (
                                            <TouchableOpacity
                                                key={city}
                                                style={[
                                                    styles.filterOption,
                                                    {
                                                        backgroundColor: selectedCity === city ? colors.primary : colors.background,
                                                        borderColor: colors.border,
                                                    }
                                                ]}
                                                onPress={() => setSelectedCity(city)}
                                            >
                                                <Text style={{ color: selectedCity === city ? '#fff' : colors.text }}>
                                                    {city}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
                            <Button
                                title={`Tampilkan ${filteredTherapists.length} Terapis`}
                                onPress={() => setShowFilter(false)}
                                fullWidth
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
    },
    subtitle: {
        fontSize: Typography.fontSize.md,
        marginTop: Spacing.xs,
    },
    filterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        gap: Spacing.sm,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    filterButtonText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    clearButton: {
        paddingHorizontal: Spacing.sm,
    },
    clearText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: Spacing.lg,
        paddingTop: 0,
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
        marginBottom: 2,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    location: {
        fontSize: Typography.fontSize.sm,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    rating: {
        fontSize: Typography.fontSize.sm,
    },
    experience: {
        fontSize: Typography.fontSize.sm,
    },
    empty: {
        alignItems: 'center',
        padding: Spacing.xl,
        gap: Spacing.md,
    },
    emptyText: {
        fontSize: Typography.fontSize.md,
        textAlign: 'center',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        maxHeight: '80%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
    },
    modalBody: {
        padding: Spacing.lg,
    },
    filterLabel: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.sm,
    },
    filterOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    filterOption: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    modalFooter: {
        padding: Spacing.lg,
        borderTopWidth: 1,
    },
});
