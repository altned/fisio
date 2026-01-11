/**
 * Step 1: Therapist Selection with Filter
 * Enhanced UI with premium card design and more informative therapist data
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
    Image,
    ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Card, Badge, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
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
    const { user } = useAuthStore();
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [showProfileGuard, setShowProfileGuard] = useState(false);

    // Filter state
    const [selectedBidang, setSelectedBidang] = useState<string | null>(null);
    const [selectedCity, setSelectedCity] = useState<string | null>(null);

    // Check profile completeness on mount
    useEffect(() => {
        if (user && !user.isProfileComplete) {
            setShowProfileGuard(true);
        }
    }, [user]);

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
        // Double-check profile is complete before proceeding
        if (!user?.isProfileComplete) {
            setShowProfileGuard(true);
            return;
        }
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

    const handleGoToProfile = () => {
        setShowProfileGuard(false);
        router.push('/profile-edit');
    };

    const renderItem = ({ item }: { item: Therapist }) => {
        const cityDisplay = item.city || item.address?.split(',').pop()?.trim() || '-';
        const hasPhoto = item.photoUrl && item.photoUrl.length > 0;
        const bioPreview = item.bio ? (item.bio.length > 80 ? item.bio.substring(0, 80) + '...' : item.bio) : null;

        return (
            <TouchableOpacity
                onPress={() => handleSelectTherapist(item)}
                activeOpacity={0.85}
                style={styles.therapistCardWrapper}
            >
                <View style={[styles.therapistCard, { backgroundColor: colors.card }]}>
                    {/* Top Section with Photo and Basic Info */}
                    <View style={styles.cardTopSection}>
                        {/* Photo/Avatar */}
                        <View style={styles.photoContainer}>
                            {hasPhoto ? (
                                <Image
                                    source={{ uri: item.photoUrl! }}
                                    style={styles.therapistPhoto}
                                />
                            ) : (
                                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="person" size={36} color={colors.primary} />
                                </View>
                            )}
                            {/* Verified Badge */}
                            {item.strNumber && (
                                <View style={[styles.verifiedBadge, { backgroundColor: '#10B981' }]}>
                                    <Ionicons name="checkmark" size={10} color="#fff" />
                                </View>
                            )}
                        </View>

                        {/* Basic Info */}
                        <View style={styles.basicInfo}>
                            <Text style={[styles.therapistName, { color: colors.text }]} numberOfLines={1}>
                                {item.user?.fullName || 'Fisioterapis'}
                            </Text>

                            {/* Specialty Badge */}
                            {item.bidang && (
                                <View style={[styles.specialtyBadge, { backgroundColor: colors.primaryLight }]}>
                                    <Ionicons name="medical" size={12} color={colors.primary} />
                                    <Text style={[styles.specialtyText, { color: colors.primary }]}>
                                        {item.bidang.replace('Fisioterapi ', '')}
                                    </Text>
                                </View>
                            )}

                            {/* Rating and Experience Row */}
                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Ionicons name="star" size={14} color="#F59E0B" />
                                    <Text style={[styles.statText, { color: colors.text }]}>
                                        {item.averageRating || '0.0'}
                                    </Text>
                                    <Text style={[styles.statSubtext, { color: colors.textMuted }]}>
                                        ({item.totalReviews || 0})
                                    </Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Ionicons name="time-outline" size={14} color={colors.primary} />
                                    <Text style={[styles.statText, { color: colors.text }]}>
                                        {item.experienceYears || 0} tahun
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* Bio Preview */}
                    {bioPreview && (
                        <View style={styles.bioSection}>
                            <Text style={[styles.bioText, { color: colors.textSecondary }]} numberOfLines={2}>
                                "{bioPreview}"
                            </Text>
                        </View>
                    )}

                    {/* Bottom Section with Location and Action */}
                    <View style={[styles.cardBottomSection, { borderTopColor: colors.border }]}>
                        <View style={styles.locationInfo}>
                            <Ionicons name="location" size={16} color={colors.primary} />
                            <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                                {cityDisplay}
                            </Text>
                        </View>
                        <View style={[styles.selectButton, { backgroundColor: colors.primary }]}>
                            <Text style={styles.selectButtonText}>Pilih</Text>
                            <Ionicons name="arrow-forward" size={14} color="#fff" />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Enhanced Header */}
            <View style={[styles.header, { backgroundColor: colors.primary }]}>
                <View style={styles.headerContent}>
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="medical" size={24} color="#fff" />
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Pilih Terapis</Text>
                        <Text style={styles.headerSubtitle}>
                            {filteredTherapists.length} fisioterapis profesional tersedia
                        </Text>
                    </View>
                </View>
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

            {/* Profile Guard Modal */}
            <Modal
                visible={showProfileGuard}
                animationType="fade"
                transparent
                onRequestClose={() => setShowProfileGuard(false)}
            >
                <View style={styles.profileGuardOverlay}>
                    <View style={[styles.profileGuardContent, { backgroundColor: colors.card }]}>
                        <View style={[styles.profileGuardIcon, { backgroundColor: '#FEF3C7' }]}>
                            <Ionicons name="person-circle-outline" size={48} color="#F59E0B" />
                        </View>
                        <Text style={[styles.profileGuardTitle, { color: colors.text }]}>
                            Lengkapi Profil Dulu
                        </Text>
                        <Text style={[styles.profileGuardMessage, { color: colors.textSecondary }]}>
                            Untuk melakukan booking, Anda perlu melengkapi data profil terlebih dahulu (nama, alamat, dll).
                        </Text>
                        <View style={styles.profileGuardButtons}>
                            <TouchableOpacity
                                style={[styles.profileGuardBtnSecondary, { borderColor: colors.border }]}
                                onPress={() => setShowProfileGuard(false)}
                            >
                                <Text style={{ color: colors.text }}>Nanti Saja</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.profileGuardBtnPrimary, { backgroundColor: colors.primary }]}
                                onPress={handleGoToProfile}
                            >
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Lengkapi Profil</Text>
                            </TouchableOpacity>
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
        paddingTop: Spacing.md,
        gap: Spacing.lg,
    },
    // Enhanced Header Styles
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    headerIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    headerTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: '#fff',
    },
    headerSubtitle: {
        fontSize: Typography.fontSize.sm,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    // Premium Therapist Card Styles
    therapistCardWrapper: {
        marginBottom: 0,
    },
    therapistCard: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
    },
    cardTopSection: {
        flexDirection: 'row',
        padding: Spacing.md,
        gap: Spacing.md,
    },
    photoContainer: {
        position: 'relative',
    },
    therapistPhoto: {
        width: 72,
        height: 72,
        borderRadius: 36,
    },
    avatarPlaceholder: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    basicInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    therapistName: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: 4,
    },
    specialtyBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        gap: 4,
        marginBottom: 8,
    },
    specialtyText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    statSubtext: {
        fontSize: Typography.fontSize.xs,
    },
    statDivider: {
        width: 1,
        height: 12,
        backgroundColor: '#E5E7EB',
    },
    bioSection: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
    },
    bioText: {
        fontSize: Typography.fontSize.sm,
        fontStyle: 'italic',
        lineHeight: 18,
    },
    cardBottomSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderTopWidth: 1,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 4,
    },
    locationText: {
        fontSize: Typography.fontSize.sm,
        flex: 1,
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    selectButtonText: {
        color: '#fff',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    // Legacy styles kept for compatibility
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
    // Profile Guard Modal styles
    profileGuardOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileGuardContent: {
        width: '85%',
        borderRadius: BorderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    profileGuardIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    profileGuardTitle: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    profileGuardMessage: {
        fontSize: Typography.fontSize.md,
        textAlign: 'center',
        marginBottom: Spacing.lg,
        lineHeight: 22,
    },
    profileGuardButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
        width: '100%',
    },
    profileGuardBtnSecondary: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        alignItems: 'center',
    },
    profileGuardBtnPrimary: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
});
