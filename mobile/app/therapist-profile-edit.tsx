/**
 * Therapist Profile Edit Screen
 * Allows therapists to update their professional profile including
 * STR credentials, education, certifications, bio, and personal info
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useAuthStore } from '@/store/auth';
import { MapPicker } from '@/components/MapPicker';
import { Gender } from '@/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const BIDANG_OPTIONS = [
    'Fisioterapi Muskuloskeletal',
    'Fisioterapi Neuromuskular',
    'Fisioterapi Kardiopulmoner',
    'Fisioterapi Pediatrik',
    'Fisioterapi Geriatrik',
    'Fisioterapi Olahraga',
];

export default function TherapistProfileEditScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { token } = useAuthStore();

    // Loading states
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Basic profile
    const [bidang, setBidang] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [bio, setBio] = useState('');
    const [experienceYears, setExperienceYears] = useState('');

    // STR credentials
    const [strNumber, setStrNumber] = useState('');
    const [strExpiryDate, setStrExpiryDate] = useState<Date | null>(null);
    const [showStrDatePicker, setShowStrDatePicker] = useState(false);

    // Extended profile
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [gender, setGender] = useState<Gender | null>(null);
    const [education, setEducation] = useState('');
    const [certifications, setCertifications] = useState('');
    const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);

    // Location
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [showMapPicker, setShowMapPicker] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/therapists/profile`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setBidang(data.bidang || '');
                setPhone(data.phone || '');
                setAddress(data.address || '');
                setCity(data.city || '');
                setBio(data.bio || '');
                setExperienceYears(data.experienceYears?.toString() || '');
                setStrNumber(data.strNumber || '');
                setStrExpiryDate(data.strExpiryDate ? new Date(data.strExpiryDate) : null);
                setBirthDate(data.birthDate ? new Date(data.birthDate) : null);
                setGender(data.gender || null);
                setEducation(data.education || '');
                setCertifications(data.certifications || '');
                setLatitude(data.latitude || null);
                setLongitude(data.longitude || null);
            }
        } catch (error) {
            console.error('Failed to fetch therapist profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload: Record<string, any> = {};

            // Basic profile
            if (bidang) payload.bidang = bidang;
            if (phone) payload.phone = phone;
            if (address) payload.address = address;
            if (city) payload.city = city;
            if (bio) payload.bio = bio;
            if (experienceYears && !isNaN(parseInt(experienceYears))) {
                payload.experienceYears = parseInt(experienceYears);
            }

            // STR credentials
            if (strNumber) payload.strNumber = strNumber;
            if (strExpiryDate) payload.strExpiryDate = strExpiryDate.toISOString().split('T')[0];

            // Extended profile
            if (birthDate) payload.birthDate = birthDate.toISOString().split('T')[0];
            if (gender) payload.gender = gender;
            if (education) payload.education = education;
            if (certifications) payload.certifications = certifications;

            // Location
            if (latitude !== null) payload.latitude = latitude;
            if (longitude !== null) payload.longitude = longitude;

            const response = await fetch(`${API_BASE_URL}/therapists/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Gagal menyimpan profil');
            }

            Alert.alert('Berhasil', 'Profil berhasil diperbarui', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profil Terapis</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Bidang Keahlian */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Bidang Keahlian</Text>
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Spesialisasi</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={styles.chipGroup}>
                            {BIDANG_OPTIONS.map((option) => (
                                <TouchableOpacity
                                    key={option}
                                    style={[
                                        styles.chip,
                                        { borderColor: bidang === option ? colors.primary : colors.border },
                                        bidang === option && { backgroundColor: colors.primaryLight }
                                    ]}
                                    onPress={() => setBidang(option)}
                                >
                                    <Text style={[
                                        styles.chipText,
                                        { color: bidang === option ? colors.primary : colors.text }
                                    ]}>
                                        {option.replace('Fisioterapi ', '')}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                </View>

                <View style={styles.divider} />

                {/* STR Credentials */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Kredensial STR</Text>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Nomor STR</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        value={strNumber}
                        onChangeText={setStrNumber}
                        placeholder="Masukkan nomor STR"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Masa Berlaku STR</Text>
                    <TouchableOpacity
                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                        onPress={() => setShowStrDatePicker(true)}
                    >
                        <Text style={{ color: strExpiryDate ? colors.text : colors.textMuted }}>
                            {strExpiryDate ? formatDate(strExpiryDate) : 'Pilih tanggal'}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {showStrDatePicker && (
                    <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.datePickerHeader}>
                            <TouchableOpacity onPress={() => setShowStrDatePicker(false)}>
                                <Text style={{ color: colors.error }}>Batal</Text>
                            </TouchableOpacity>
                            <Text style={[styles.datePickerTitle, { color: colors.text }]}>Masa Berlaku STR</Text>
                            <TouchableOpacity onPress={() => setShowStrDatePicker(false)}>
                                <Text style={{ color: colors.primary }}>Selesai</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.datePickerInputs}>
                            <TextInput
                                style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="DD"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                                maxLength={2}
                                value={strExpiryDate ? strExpiryDate.getDate().toString() : ''}
                                onChangeText={(text) => {
                                    const day = parseInt(text) || 1;
                                    const current = strExpiryDate || new Date();
                                    setStrExpiryDate(new Date(current.getFullYear(), current.getMonth(), Math.min(day, 31)));
                                }}
                            />
                            <TextInput
                                style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="MM"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                                maxLength={2}
                                value={strExpiryDate ? (strExpiryDate.getMonth() + 1).toString() : ''}
                                onChangeText={(text) => {
                                    const month = (parseInt(text) || 1) - 1;
                                    const current = strExpiryDate || new Date();
                                    setStrExpiryDate(new Date(current.getFullYear(), Math.min(month, 11), current.getDate()));
                                }}
                            />
                            <TextInput
                                style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, width: 80 }]}
                                placeholder="YYYY"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                                maxLength={4}
                                value={strExpiryDate ? strExpiryDate.getFullYear().toString() : ''}
                                onChangeText={(text) => {
                                    const year = parseInt(text) || new Date().getFullYear();
                                    const current = strExpiryDate || new Date();
                                    setStrExpiryDate(new Date(year, current.getMonth(), current.getDate()));
                                }}
                            />
                        </View>
                    </View>
                )}

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Pengalaman (Tahun)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        value={experienceYears}
                        onChangeText={setExperienceYears}
                        placeholder="5"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="number-pad"
                        maxLength={2}
                    />
                </View>

                <View style={styles.divider} />

                {/* Education & Certifications */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Pendidikan & Sertifikasi</Text>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Pendidikan Terakhir</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        value={education}
                        onChangeText={setEducation}
                        placeholder="Contoh: S1 Fisioterapi Universitas Indonesia"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Sertifikasi Tambahan</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        value={certifications}
                        onChangeText={setCertifications}
                        placeholder="Contoh: Certified Manual Therapist, Sports Rehab Specialist"
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                    <Text style={[styles.hint, { color: colors.textMuted }]}>
                        Pisahkan dengan koma untuk beberapa sertifikasi
                    </Text>
                </View>

                <View style={styles.divider} />

                {/* Personal Info */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Data Pribadi</Text>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Tanggal Lahir</Text>
                    <TouchableOpacity
                        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}
                        onPress={() => setShowBirthDatePicker(true)}
                    >
                        <Text style={{ color: birthDate ? colors.text : colors.textMuted }}>
                            {birthDate ? formatDate(birthDate) : 'Pilih tanggal lahir'}
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {showBirthDatePicker && (
                    <View style={[styles.datePickerContainer, { backgroundColor: colors.card }]}>
                        <View style={styles.datePickerHeader}>
                            <TouchableOpacity onPress={() => setShowBirthDatePicker(false)}>
                                <Text style={{ color: colors.error }}>Batal</Text>
                            </TouchableOpacity>
                            <Text style={[styles.datePickerTitle, { color: colors.text }]}>Tanggal Lahir</Text>
                            <TouchableOpacity onPress={() => setShowBirthDatePicker(false)}>
                                <Text style={{ color: colors.primary }}>Selesai</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.datePickerInputs}>
                            <TextInput
                                style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="DD"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                                maxLength={2}
                                value={birthDate ? birthDate.getDate().toString() : ''}
                                onChangeText={(text) => {
                                    const day = parseInt(text) || 1;
                                    const current = birthDate || new Date(1990, 0, 1);
                                    setBirthDate(new Date(current.getFullYear(), current.getMonth(), Math.min(day, 31)));
                                }}
                            />
                            <TextInput
                                style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                placeholder="MM"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                                maxLength={2}
                                value={birthDate ? (birthDate.getMonth() + 1).toString() : ''}
                                onChangeText={(text) => {
                                    const month = (parseInt(text) || 1) - 1;
                                    const current = birthDate || new Date(1990, 0, 1);
                                    setBirthDate(new Date(current.getFullYear(), Math.min(month, 11), current.getDate()));
                                }}
                            />
                            <TextInput
                                style={[styles.dateInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border, width: 80 }]}
                                placeholder="YYYY"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                                maxLength={4}
                                value={birthDate ? birthDate.getFullYear().toString() : ''}
                                onChangeText={(text) => {
                                    const year = parseInt(text) || 1990;
                                    const current = birthDate || new Date(1990, 0, 1);
                                    setBirthDate(new Date(year, current.getMonth(), current.getDate()));
                                }}
                            />
                        </View>
                    </View>
                )}

                {/* Gender */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Jenis Kelamin</Text>
                    <View style={styles.radioGroup}>
                        <TouchableOpacity
                            style={[
                                styles.radioOption,
                                { borderColor: gender === 'MALE' ? colors.primary : colors.border },
                                gender === 'MALE' && { backgroundColor: colors.primaryLight }
                            ]}
                            onPress={() => setGender('MALE')}
                        >
                            <Ionicons
                                name={gender === 'MALE' ? 'radio-button-on' : 'radio-button-off'}
                                size={20}
                                color={gender === 'MALE' ? colors.primary : colors.textMuted}
                            />
                            <Text style={[styles.radioText, { color: gender === 'MALE' ? colors.primary : colors.text }]}>
                                Laki-laki
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.radioOption,
                                { borderColor: gender === 'FEMALE' ? colors.primary : colors.border },
                                gender === 'FEMALE' && { backgroundColor: colors.primaryLight }
                            ]}
                            onPress={() => setGender('FEMALE')}
                        >
                            <Ionicons
                                name={gender === 'FEMALE' ? 'radio-button-on' : 'radio-button-off'}
                                size={20}
                                color={gender === 'FEMALE' ? colors.primary : colors.textMuted}
                            />
                            <Text style={[styles.radioText, { color: gender === 'FEMALE' ? colors.primary : colors.text }]}>
                                Perempuan
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Contact & Location */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Kontak & Lokasi</Text>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Nomor HP</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="08123456789"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Kota</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Jakarta Selatan"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Alamat Praktik</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Alamat lengkap praktik"
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                {/* Location Picker */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Titik Lokasi</Text>
                    <TouchableOpacity
                        style={[styles.locationButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => setShowMapPicker(true)}
                    >
                        <View style={styles.locationIconContainer}>
                            <Ionicons name="location" size={20} color="#2196F3" />
                        </View>
                        <View style={styles.locationTextContainer}>
                            {latitude && longitude ? (
                                <>
                                    <Text style={[styles.locationLabel, { color: colors.text }]}>
                                        Lokasi Tersimpan
                                    </Text>
                                    <Text style={[styles.locationCoords, { color: colors.textMuted }]}>
                                        📍 {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
                                    </Text>
                                </>
                            ) : (
                                <Text style={[styles.locationPlaceholder, { color: colors.textMuted }]}>
                                    Tap untuk pilih lokasi di peta
                                </Text>
                            )}
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                <MapPicker
                    visible={showMapPicker}
                    onClose={() => setShowMapPicker(false)}
                    onConfirm={(location) => {
                        setLatitude(location.latitude);
                        setLongitude(location.longitude);
                        if (location.address && !address.trim()) {
                            setAddress(location.address);
                        }
                    }}
                    initialLocation={latitude && longitude ? { latitude: Number(latitude), longitude: Number(longitude) } : undefined}
                    title="Pilih Lokasi Praktik"
                />

                <View style={styles.divider} />

                {/* Bio */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Tentang Anda</Text>

                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border, minHeight: 100 }]}
                        value={bio}
                        onChangeText={setBio}
                        placeholder="Ceritakan tentang pengalaman dan keahlian Anda..."
                        placeholderTextColor={colors.textMuted}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />
                    <Text style={[styles.hint, { color: colors.textMuted }]}>
                        Bio akan ditampilkan di profil publik Anda
                    </Text>
                </View>

                {/* Save Button */}
                <TouchableOpacity
                    style={[styles.saveButton, { backgroundColor: colors.primary }]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="checkmark" size={20} color="#fff" />
                            <Text style={styles.saveButtonText}>Simpan Profil</Text>
                        </>
                    )}
                </TouchableOpacity>

                <View style={{ height: Spacing.xl }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    formGroup: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: Spacing.xs,
    },
    input: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        fontSize: Typography.fontSize.md,
    },
    textArea: {
        minHeight: 80,
    },
    hint: {
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing.xs,
    },
    divider: {
        height: 1,
        backgroundColor: '#E5E7EB',
        marginVertical: Spacing.lg,
    },
    chipGroup: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    chip: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    chipText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    datePickerContainer: {
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.md,
    },
    datePickerHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    datePickerTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    datePickerInputs: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    dateInput: {
        width: 60,
        height: 48,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        textAlign: 'center',
        fontSize: Typography.fontSize.md,
    },
    radioGroup: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    radioOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        gap: Spacing.sm,
    },
    radioText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
    },
    locationIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    locationTextContainer: {
        flex: 1,
    },
    locationLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    locationCoords: {
        fontSize: Typography.fontSize.xs,
        marginTop: 2,
    },
    locationPlaceholder: {
        fontSize: Typography.fontSize.sm,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.lg,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
});
