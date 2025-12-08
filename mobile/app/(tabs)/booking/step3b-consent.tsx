/**
 * Step 3b: Consent Screen
 * Patient must agree to all consent items before proceeding to payment
 */

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Modal,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Card } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Booking } from '@/types';

// Legal document content (simplified for mobile display)
const TERMS_CONTENT = `
Syarat dan Ketentuan Layanan Fisio

1. Layanan
Fisio menyediakan layanan fisioterapi home visit oleh terapis profesional. Setiap sesi terapi berdurasi 90 menit.

2. Pembayaran
Pembayaran dilakukan di muka sebelum layanan diberikan.

3. Pembatalan
- Pembatalan >24 jam: refund 100%
- Pembatalan <24 jam: refund 50%
- Tidak hadir tanpa pemberitahuan: tidak ada refund

4. Tanggung Jawab
Anda wajib menyediakan lingkungan aman dan memberikan informasi kesehatan yang akurat.

5. Batasan
Fisio adalah platform penghubung dan bukan penyedia langsung layanan kesehatan.
`;

const PRIVACY_CONTENT = `
Kebijakan Privasi Fisio

1. Data yang Dikumpulkan
- Nama, telepon, email
- Alamat untuk home visit
- Informasi kesehatan yang relevan

2. Penggunaan Data
Data Anda digunakan untuk memproses booking dan menghubungkan Anda dengan terapis.

3. Berbagi Data
- Nama, telepon, dan alamat akan dibagikan ke terapis yang Anda pilih
- Informasi pembayaran ke penyedia payment gateway

4. Hak Anda
Anda dapat meminta akses, koreksi, atau penghapusan data Anda.
`;

const MEDICAL_CONTENT = `
Disclaimer Medis

PENTING:

1. Layanan fisioterapi BUKAN pengganti diagnosa atau perawatan dokter.

2. Untuk kondisi medis serius, WAJIB konsultasi ke dokter terlebih dahulu.

3. Kondisi yang memerlukan rujukan dokter:
   - Nyeri dada atau sesak napas
   - Demam tinggi
   - Mati rasa atau kelemahan mendadak
   - Patah tulang

4. Beritahu terapis tentang:
   - Riwayat penyakit
   - Obat yang dikonsumsi
   - Alergi
   - Kehamilan (jika ada)

5. Kondisi darurat: hubungi 118/119 atau IGD terdekat.
`;

interface ConsentItemProps {
    checked: boolean;
    onToggle: () => void;
    title: string;
    description: string;
    linkText?: string;
    onLinkPress?: () => void;
}

function ConsentItem({ checked, onToggle, title, description, linkText, onLinkPress }: ConsentItemProps) {
    const colors = Colors.light;

    return (
        <TouchableOpacity style={styles.consentItem} onPress={onToggle} activeOpacity={0.7}>
            <View style={[
                styles.checkbox,
                { borderColor: checked ? colors.primary : colors.border },
                checked && { backgroundColor: colors.primary },
            ]}>
                {checked && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <View style={styles.consentContent}>
                <Text style={[styles.consentTitle, { color: colors.text }]}>{title}</Text>
                <Text style={[styles.consentDescription, { color: colors.textSecondary }]}>
                    {description}
                </Text>
                {linkText && onLinkPress && (
                    <TouchableOpacity onPress={onLinkPress}>
                        <Text style={[styles.linkText, { color: colors.primary }]}>{linkText}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
}

export default function ConsentScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const params = useLocalSearchParams<{
        therapistId: string;
        therapistName: string;
        packageId: string;
        packageName: string;
        totalPrice: string;
        sessionCount: string;
        address: string;
        scheduledAt: string;
        bookingType: string;
    }>();

    const [consentService, setConsentService] = useState(false);
    const [consentDataSharing, setConsentDataSharing] = useState(false);
    const [consentTerms, setConsentTerms] = useState(false);
    const [consentMedicalDisclaimer, setConsentMedicalDisclaimer] = useState(false);
    const [loading, setLoading] = useState(false);

    // Modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalContent, setModalContent] = useState('');

    const allConsented = consentService && consentDataSharing && consentTerms && consentMedicalDisclaimer;

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(price));
    };

    const showDocument = (title: string, content: string) => {
        setModalTitle(title);
        setModalContent(content);
        setModalVisible(true);
    };

    const handleCreateBooking = async () => {
        if (!allConsented) {
            Alert.alert('Error', 'Anda harus menyetujui semua ketentuan untuk melanjutkan');
            return;
        }

        setLoading(true);
        try {
            const booking = await api.post<Booking>('/bookings', {
                therapistId: params.therapistId,
                packageId: params.packageId,
                address: params.address,
                scheduledAt: params.scheduledAt,
                bookingType: params.bookingType,
                // Consent fields
                consentService,
                consentDataSharing,
                consentTerms,
                consentMedicalDisclaimer,
            });

            // Navigate to payment screen
            router.push({
                pathname: '/(tabs)/booking/step4-payment',
                params: {
                    bookingId: booking.id,
                    totalPrice: params.totalPrice,
                    therapistName: params.therapistName,
                    packageName: params.packageName,
                },
            });
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Gagal membuat booking');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="shield-checkmark-outline" size={48} color={colors.primary} />
                    <Text style={[styles.title, { color: colors.text }]}>Persetujuan & Ketentuan</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Sebelum melanjutkan pembayaran, mohon baca dan setujui ketentuan berikut
                    </Text>
                </View>

                {/* Summary Card */}
                <Card style={styles.summaryCard}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Pesanan Anda</Text>
                    <Text style={[styles.summaryTitle, { color: colors.text }]}>{params.packageName}</Text>
                    <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                        Terapis: {params.therapistName}
                    </Text>
                    <Text style={[styles.summaryPrice, { color: colors.primary }]}>
                        {formatPrice(params.totalPrice)}
                    </Text>
                </Card>

                {/* Consent Items */}
                <View style={styles.consentList}>
                    <ConsentItem
                        checked={consentService}
                        onToggle={() => setConsentService(!consentService)}
                        title="Persetujuan Layanan"
                        description="Saya menyetujui untuk menerima layanan fisioterapi home visit dari terapis yang dipilih."
                    />

                    <ConsentItem
                        checked={consentDataSharing}
                        onToggle={() => setConsentDataSharing(!consentDataSharing)}
                        title="Persetujuan Berbagi Data"
                        description="Saya menyetujui alamat dan data kontak saya dibagikan kepada terapis untuk keperluan kunjungan."
                        linkText="Baca Kebijakan Privasi"
                        onLinkPress={() => showDocument('Kebijakan Privasi', PRIVACY_CONTENT)}
                    />

                    <ConsentItem
                        checked={consentTerms}
                        onToggle={() => setConsentTerms(!consentTerms)}
                        title="Syarat & Ketentuan"
                        description="Saya telah membaca dan menyetujui syarat & ketentuan layanan Fisio."
                        linkText="Baca Syarat & Ketentuan"
                        onLinkPress={() => showDocument('Syarat & Ketentuan', TERMS_CONTENT)}
                    />

                    <ConsentItem
                        checked={consentMedicalDisclaimer}
                        onToggle={() => setConsentMedicalDisclaimer(!consentMedicalDisclaimer)}
                        title="Disclaimer Medis"
                        description="Saya memahami bahwa layanan fisioterapi ini bukan pengganti diagnosa atau perawatan dokter."
                        linkText="Baca Disclaimer Medis"
                        onLinkPress={() => showDocument('Disclaimer Medis', MEDICAL_CONTENT)}
                    />
                </View>

                {/* Info Box */}
                <View style={[styles.infoBox, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                    <Text style={[styles.infoText, { color: colors.primary }]}>
                        Persetujuan ini berlaku untuk booking ini saja. Anda akan diminta persetujuan kembali untuk booking berikutnya.
                    </Text>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: colors.border }]}>
                <Button
                    title={loading ? 'Memproses...' : 'Lanjut Bayar'}
                    onPress={handleCreateBooking}
                    disabled={loading || !allConsented}
                    style={{ flex: 1 }}
                />
            </View>

            {/* Document Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>{modalTitle}</Text>
                            <Pressable onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </Pressable>
                        </View>
                        <ScrollView style={styles.modalBody}>
                            <Text style={[styles.modalText, { color: colors.textSecondary }]}>
                                {modalContent}
                            </Text>
                        </ScrollView>
                        <Button
                            title="Tutup"
                            onPress={() => setModalVisible(false)}
                            style={styles.modalButton}
                        />
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
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 120,
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        marginTop: Spacing.md,
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
        textAlign: 'center',
        marginTop: Spacing.xs,
        paddingHorizontal: Spacing.lg,
    },
    summaryCard: {
        marginBottom: Spacing.lg,
    },
    summaryLabel: {
        fontSize: Typography.fontSize.xs,
        marginBottom: Spacing.xs,
    },
    summaryTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    summaryText: {
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
    },
    summaryPrice: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        marginTop: Spacing.sm,
    },
    consentList: {
        gap: Spacing.md,
    },
    consentItem: {
        flexDirection: 'row',
        padding: Spacing.md,
        backgroundColor: '#fff',
        borderRadius: BorderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        marginRight: Spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    consentContent: {
        flex: 1,
    },
    consentTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: 4,
    },
    consentDescription: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 20,
    },
    linkText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginTop: Spacing.xs,
        textDecorationLine: 'underline',
    },
    infoBox: {
        flexDirection: 'row',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginTop: Spacing.lg,
        gap: Spacing.sm,
    },
    infoText: {
        flex: 1,
        fontSize: Typography.fontSize.xs,
        lineHeight: 18,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        padding: Spacing.lg,
        borderTopWidth: 1,
    },
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
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    modalBody: {
        padding: Spacing.lg,
    },
    modalText: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 22,
    },
    modalButton: {
        margin: Spacing.lg,
    },
});
