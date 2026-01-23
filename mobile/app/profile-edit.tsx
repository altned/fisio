/**
 * Edit Profile Screen with Photo Upload and Location Picker
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '@/lib/api';
import * as ImagePicker from 'expo-image-picker';
import { MapPicker } from '@/components/MapPicker';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function EditProfileScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const { user, token, updateUser } = useAuthStore();

    const [fullName, setFullName] = useState(user?.fullName || '');
    const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
    const [address, setAddress] = useState(user?.address || '');
    const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.profilePhotoUrl || '');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [showMapPicker, setShowMapPicker] = useState(false);
    const [latitude, setLatitude] = useState<number | null>(user?.latitude || null);
    const [longitude, setLongitude] = useState<number | null>(user?.longitude || null);

    // Extended patient profile fields
    const [birthDate, setBirthDate] = useState<Date | null>(user?.birthDate ? new Date(user.birthDate) : null);
    const [gender, setGender] = useState<'MALE' | 'FEMALE' | null>(user?.gender || null);
    const [bloodType, setBloodType] = useState<string>(user?.bloodType || '');
    const [allergies, setAllergies] = useState(user?.allergies || '');
    const [medicalHistory, setMedicalHistory] = useState(user?.medicalHistory || '');
    const [emergencyContactName, setEmergencyContactName] = useState(user?.emergencyContactName || '');
    const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.emergencyContactPhone || '');
    const [height, setHeight] = useState(user?.height?.toString() || '');
    const [weight, setWeight] = useState(user?.weight?.toString() || '');
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Therapist-specific profile fields
    const [bidang, setBidang] = useState('');
    const [strNumber, setStrNumber] = useState('');
    const [strExpiryDate, setStrExpiryDate] = useState<Date | null>(null);
    const [experienceYears, setExperienceYears] = useState('');
    const [bio, setBio] = useState('');
    const [education, setEducation] = useState('');
    const [certifications, setCertifications] = useState('');
    const [city, setCity] = useState('');
    const [showStrDatePicker, setShowStrDatePicker] = useState(false);

    // Determine if user is therapist
    const isTherapist = user?.role === 'THERAPIST';

    // Fetch latest profile data on mount
    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // Fetch basic user profile
            const response = await fetch(`${API_BASE_URL}/users/profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setFullName(data.fullName || '');
                setPhoneNumber(data.phoneNumber || '');
                setAddress(data.address || '');
                setProfilePhotoUrl(data.profilePhotoUrl || '');
                setLatitude(data.latitude || null);
                setLongitude(data.longitude || null);
                // Extended fields for patient
                setBirthDate(data.birthDate ? new Date(data.birthDate) : null);
                setGender(data.gender || null);
                setBloodType(data.bloodType || null);
                setAllergies(data.allergies || '');
                setMedicalHistory(data.medicalHistory || '');
                setEmergencyContactName(data.emergencyContactName || '');
                setEmergencyContactPhone(data.emergencyContactPhone || '');
                setHeight(data.height?.toString() || '');
                setWeight(data.weight?.toString() || '');
            }

            // Fetch therapist profile if user is therapist
            if (user?.role === 'THERAPIST') {
                const therapistResponse = await fetch(`${API_BASE_URL}/therapists/profile`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (therapistResponse.ok) {
                    const therapistData = await therapistResponse.json();
                    setBidang(therapistData.bidang || '');
                    setStrNumber(therapistData.strNumber || '');
                    setStrExpiryDate(therapistData.strExpiryDate ? new Date(therapistData.strExpiryDate) : null);
                    setExperienceYears(therapistData.experienceYears?.toString() || '');
                    setBio(therapistData.bio || '');
                    setEducation(therapistData.education || '');
                    setCertifications(therapistData.certifications || '');
                    setCity(therapistData.city || '');
                    setAddress(therapistData.address || '');
                    setPhoneNumber(therapistData.phone || '');
                    // Use therapist photo if available
                    if (therapistData.photoUrl) {
                        setProfilePhotoUrl(therapistData.photoUrl);
                    }
                    // Use therapist coordinates
                    if (therapistData.latitude) setLatitude(therapistData.latitude);
                    if (therapistData.longitude) setLongitude(therapistData.longitude);
                    // Use therapist birth date and gender
                    if (therapistData.birthDate) setBirthDate(new Date(therapistData.birthDate));
                    if (therapistData.gender) setGender(therapistData.gender);
                }
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        }
    };

    const handlePickImage = async () => {
        // Request permission
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Izin Diperlukan', 'Kami memerlukan izin untuk mengakses galeri foto.');
            return;
        }

        // Pick image with new API
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'], // New API: use array instead of MediaTypeOptions
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
            exif: false,
        });

        if (!result.canceled && result.assets[0]) {
            const asset = result.assets[0];

            // For now, use base64 data URL
            // In production, you would upload to a file server (e.g., S3, Cloudinary)
            if (asset.base64) {
                const dataUrl = `data:image/jpeg;base64,${asset.base64}`;
                setProfilePhotoUrl(dataUrl);
            } else {
                // Fallback to URI
                setProfilePhotoUrl(asset.uri);
            }
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            Alert.alert('Error', 'Nama lengkap wajib diisi');
            return;
        }

        if (!phoneNumber.trim()) {
            Alert.alert('Error', 'Nomor telepon wajib diisi');
            return;
        }

        if (password && password !== confirmPassword) {
            Alert.alert('Error', 'Password tidak cocok');
            return;
        }

        if (password && password.length < 6) {
            Alert.alert('Error', 'Password minimal 6 karakter');
            return;
        }

        setLoading(true);

        try {
            // Update user profile (for all users)
            const userPayload: any = {};

            if (fullName.trim() !== user?.fullName) {
                userPayload.fullName = fullName.trim();
            }

            if (password) {
                userPayload.password = password;
            }

            // Only update user profile if there are changes
            if (Object.keys(userPayload).length > 0) {
                const userResponse = await fetch(`${API_BASE_URL}/users/profile`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(userPayload),
                });

                if (!userResponse.ok) {
                    const error = await userResponse.json();
                    throw new Error(error.message || 'Gagal update profil');
                }

                const updatedUser = await userResponse.json();
                updateUser({
                    fullName: updatedUser.fullName,
                    isProfileComplete: updatedUser.isProfileComplete,
                });
            }

            // Update therapist profile if user is therapist
            if (isTherapist) {
                const therapistPayload: any = {
                    phone: phoneNumber.trim(),
                    address: address.trim(),
                    city: city.trim(),
                    bidang: bidang.trim(),
                    strNumber: strNumber.trim(),
                    experienceYears: experienceYears ? parseInt(experienceYears) : 0,
                    bio: bio.trim(),
                    education: education.trim(),
                    certifications: certifications.trim(),
                    photoUrl: profilePhotoUrl,
                };

                if (latitude !== null) therapistPayload.latitude = latitude;
                if (longitude !== null) therapistPayload.longitude = longitude;
                if (birthDate) therapistPayload.birthDate = birthDate.toISOString().split('T')[0];
                if (gender) therapistPayload.gender = gender;
                if (strExpiryDate) therapistPayload.strExpiryDate = strExpiryDate.toISOString().split('T')[0];

                const therapistResponse = await fetch(`${API_BASE_URL}/therapists/profile`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(therapistPayload),
                });

                if (!therapistResponse.ok) {
                    const error = await therapistResponse.json();
                    throw new Error(error.message || 'Gagal update profil terapis');
                }
            } else {
                // Update patient profile fields
                const patientPayload: any = {};

                if (phoneNumber.trim() !== user?.phoneNumber) {
                    patientPayload.phoneNumber = phoneNumber.trim();
                }
                if (address.trim() !== user?.address) {
                    patientPayload.address = address.trim();
                }
                if (profilePhotoUrl !== user?.profilePhotoUrl) {
                    patientPayload.profilePhotoUrl = profilePhotoUrl;
                }
                if (latitude !== null) patientPayload.latitude = latitude;
                if (longitude !== null) patientPayload.longitude = longitude;
                if (birthDate) patientPayload.birthDate = birthDate.toISOString().split('T')[0];
                if (gender) patientPayload.gender = gender;
                if (bloodType) patientPayload.bloodType = bloodType;
                if (allergies.trim()) patientPayload.allergies = allergies.trim();
                if (medicalHistory.trim()) patientPayload.medicalHistory = medicalHistory.trim();
                if (emergencyContactName.trim()) patientPayload.emergencyContactName = emergencyContactName.trim();
                if (emergencyContactPhone.trim()) patientPayload.emergencyContactPhone = emergencyContactPhone.trim();
                if (height && !isNaN(parseInt(height))) patientPayload.height = parseInt(height);
                if (weight && !isNaN(parseInt(weight))) patientPayload.weight = parseInt(weight);

                if (Object.keys(patientPayload).length > 0) {
                    const patientResponse = await fetch(`${API_BASE_URL}/users/profile`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify(patientPayload),
                    });

                    if (!patientResponse.ok) {
                        const error = await patientResponse.json();
                        throw new Error(error.message || 'Gagal update profil');
                    }

                    const updatedPatient = await patientResponse.json();
                    updateUser({
                        phoneNumber: updatedPatient.phoneNumber,
                        address: updatedPatient.address,
                        profilePhotoUrl: updatedPatient.profilePhotoUrl,
                        isProfileComplete: updatedPatient.isProfileComplete,
                    });
                }
            }

            Alert.alert('Berhasil', 'Profil berhasil diperbarui', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            Alert.alert('Error', (error as Error).message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Edit Profil</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Photo Section */}
                <View style={styles.photoSection}>
                    <TouchableOpacity
                        style={[styles.photoContainer, { backgroundColor: colors.primaryLight }]}
                        onPress={handlePickImage}
                        disabled={uploadingPhoto}
                    >
                        {profilePhotoUrl ? (
                            <Image
                                source={{ uri: profilePhotoUrl }}
                                style={styles.profilePhoto}
                            />
                        ) : (
                            <Ionicons name="person" size={48} color={colors.primary} />
                        )}
                        <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
                            <Ionicons name="camera" size={16} color="#fff" />
                        </View>
                    </TouchableOpacity>
                    <Text style={[styles.photoHint, { color: colors.textSecondary }]}>
                        Tap untuk ganti foto
                    </Text>
                </View>

                {/* Email - Read only */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                    <TextInput
                        style={[styles.input, styles.inputDisabled, {
                            backgroundColor: colors.card,
                            color: colors.textMuted,
                            borderColor: colors.border
                        }]}
                        value={user?.email}
                        editable={false}
                    />
                    <Text style={[styles.hint, { color: colors.textMuted }]}>
                        Email tidak dapat diubah
                    </Text>
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Data Diri
                </Text>

                {/* Full Name */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Nama Lengkap *</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.border
                        }]}
                        value={fullName}
                        onChangeText={setFullName}
                        placeholder="Masukkan nama lengkap"
                        placeholderTextColor={colors.textMuted}
                    />
                </View>

                {/* Phone Number */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Nomor Telepon *</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.border
                        }]}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholder="Contoh: 08123456789"
                        placeholderTextColor={colors.textMuted}
                        keyboardType="phone-pad"
                    />
                    <Text style={[styles.hint, { color: colors.textMuted }]}>
                        Untuk konfirmasi booking dan notifikasi
                    </Text>
                </View>

                {/* Address */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Alamat</Text>
                    <TextInput
                        style={[styles.input, styles.textArea, {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.border
                        }]}
                        value={address}
                        onChangeText={setAddress}
                        placeholder="Alamat lengkap untuk home visit"
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
                    <Text style={[styles.hint, { color: colors.textMuted }]}>
                        Lokasi digunakan untuk menampilkan terapis terdekat
                    </Text>
                </View>

                {/* Map Picker Modal */}
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
                    title="Pilih Lokasi Anda"
                />

                <View style={styles.divider} />

                {/* THERAPIST FIELDS */}
                {isTherapist && (
                    <>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Data Profesional
                        </Text>

                        {/* Bidang Keahlian */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Bidang Keahlian *</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={bidang}
                                onChangeText={setBidang}
                                placeholder="Contoh: Fisioterapi Muskuloskeletal"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Nomor STR */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Nomor STR</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={strNumber}
                                onChangeText={setStrNumber}
                                placeholder="Surat Tanda Registrasi"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* STR Expiry Date */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Masa Berlaku STR</Text>
                            <TouchableOpacity
                                style={[styles.input, {
                                    backgroundColor: colors.card,
                                    borderColor: colors.border,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }]}
                                onPress={() => setShowStrDatePicker(true)}
                            >
                                <Text style={{ color: strExpiryDate ? colors.text : colors.textMuted }}>
                                    {strExpiryDate
                                        ? strExpiryDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                        : 'Pilih tanggal berlaku'
                                    }
                                </Text>
                                <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>

                        {/* STR Date Picker */}
                        {showStrDatePicker && (
                            <DateTimePicker
                                value={strExpiryDate || new Date()}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                minimumDate={new Date()}
                                onChange={(event, selectedDate) => {
                                    setShowStrDatePicker(Platform.OS === 'ios');
                                    if (selectedDate) {
                                        setStrExpiryDate(selectedDate);
                                    }
                                }}
                            />
                        )}

                        {/* Experience Years */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Pengalaman (tahun)</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={experienceYears}
                                onChangeText={setExperienceYears}
                                placeholder="Contoh: 5"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="number-pad"
                                maxLength={2}
                            />
                        </View>

                        {/* Education */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Pendidikan</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={education}
                                onChangeText={setEducation}
                                placeholder="Contoh: S1 Fisioterapi UI"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Certifications */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Sertifikasi</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={certifications}
                                onChangeText={setCertifications}
                                placeholder="Sertifikasi yang dimiliki (pisahkan dengan koma)"
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={2}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* City */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Kota</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={city}
                                onChangeText={setCity}
                                placeholder="Kota tempat praktik"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Bio */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Bio / Deskripsi</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Ceritakan tentang diri Anda dan layanan yang ditawarkan"
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.divider} />
                    </>
                )}

                {/* PATIENT HEALTH FIELDS - Only for non-therapist */}
                {!isTherapist && (
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Data Kesehatan
                    </Text>
                )}

                {/* Birth Date */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Tanggal Lahir</Text>
                    <TouchableOpacity
                        style={[styles.input, {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }]}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={{ color: birthDate ? colors.text : colors.textMuted }}>
                            {birthDate
                                ? birthDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                                : 'Pilih tanggal lahir'
                            }
                        </Text>
                        <Ionicons name="calendar-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Date Picker - Native */}
                {showDatePicker && (
                    <DateTimePicker
                        value={birthDate || new Date(2000, 0, 1)}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        maximumDate={new Date()}
                        minimumDate={new Date(1920, 0, 1)}
                        onChange={(event, selectedDate) => {
                            setShowDatePicker(Platform.OS === 'ios');
                            if (selectedDate) {
                                setBirthDate(selectedDate);
                            }
                        }}
                    />
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

                {/* Blood Type - Text Input - PATIENT ONLY */}
                {!isTherapist && (
                    <>
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Golongan Darah</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={bloodType || ''}
                                onChangeText={(text) => setBloodType(text as any)}
                                placeholder="Contoh: A+, B-, AB+, O-"
                                placeholderTextColor={colors.textMuted}
                                autoCapitalize="characters"
                                maxLength={5}
                            />
                            <Text style={[styles.hint, { color: colors.textMuted }]}>
                                Masukkan golongan darah lengkap dengan rhesus (A+, B-, dll)
                            </Text>
                        </View>

                        {/* Height & Weight */}
                        <View style={styles.rowGroup}>
                            <View style={[styles.formGroup, { flex: 1, marginRight: Spacing.sm }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Tinggi (cm)</Text>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: colors.card,
                                        color: colors.text,
                                        borderColor: colors.border
                                    }]}
                                    value={height}
                                    onChangeText={setHeight}
                                    placeholder="170"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                />
                            </View>
                            <View style={[styles.formGroup, { flex: 1, marginLeft: Spacing.sm }]}>
                                <Text style={[styles.label, { color: colors.text }]}>Berat (kg)</Text>
                                <TextInput
                                    style={[styles.input, {
                                        backgroundColor: colors.card,
                                        color: colors.text,
                                        borderColor: colors.border
                                    }]}
                                    value={weight}
                                    onChangeText={setWeight}
                                    placeholder="65"
                                    placeholderTextColor={colors.textMuted}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                />
                            </View>
                        </View>

                        {/* Allergies */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Alergi Obat</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={allergies}
                                onChangeText={setAllergies}
                                placeholder="Contoh: Penisilin, Aspirin, dll. Kosongkan jika tidak ada."
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={2}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* Medical History */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Riwayat Penyakit</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={medicalHistory}
                                onChangeText={setMedicalHistory}
                                placeholder="Contoh: Diabetes, Hipertensi, Asma, dll. Kosongkan jika tidak ada."
                                placeholderTextColor={colors.textMuted}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={styles.divider} />

                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Kontak Darurat
                        </Text>

                        {/* Emergency Contact Name */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Nama Kontak Darurat</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={emergencyContactName}
                                onChangeText={setEmergencyContactName}
                                placeholder="Nama keluarga/kerabat"
                                placeholderTextColor={colors.textMuted}
                            />
                        </View>

                        {/* Emergency Contact Phone */}
                        <View style={styles.formGroup}>
                            <Text style={[styles.label, { color: colors.text }]}>Telepon Kontak Darurat</Text>
                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: colors.card,
                                    color: colors.text,
                                    borderColor: colors.border
                                }]}
                                value={emergencyContactPhone}
                                onChangeText={setEmergencyContactPhone}
                                placeholder="08123456789"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="phone-pad"
                            />
                            <Text style={[styles.hint, { color: colors.textMuted }]}>
                                Dihubungi saat kondisi darurat
                            </Text>
                        </View>
                    </>
                )}

                <View style={styles.divider} />

                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Ubah Password (Opsional)
                </Text>

                {/* New Password */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Password Baru</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.border
                        }]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Minimal 6 karakter"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                    />
                </View>

                {/* Confirm Password */}
                <View style={styles.formGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Konfirmasi Password</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.card,
                            color: colors.text,
                            borderColor: colors.border
                        }]}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        placeholder="Ulangi password baru"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                    />
                </View>

                <Button
                    title={loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    onPress={handleSave}
                    disabled={loading}
                    fullWidth
                    style={{ marginTop: Spacing.lg, marginBottom: Spacing.xl }}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
    },
    backButton: {
        padding: Spacing.xs,
    },
    headerTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xl * 2,
    },
    photoSection: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    photoContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    profilePhoto: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
    photoHint: {
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.sm,
    },
    formGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: Spacing.xs,
    },
    input: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        fontSize: Typography.fontSize.md,
    },
    textArea: {
        minHeight: 80,
        paddingTop: Spacing.sm,
    },
    inputDisabled: {
        opacity: 0.7,
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
    sectionTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
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
    // Extended profile field styles
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
    bloodTypeGroup: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    bloodTypeOption: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bloodTypeText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
    },
    rowGroup: {
        flexDirection: 'row',
    },
});

