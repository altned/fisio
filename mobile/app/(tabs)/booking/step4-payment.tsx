/**
 * Step 4: Payment Channel Selection + Instruction Display + Polling
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Clipboard,
    Linking,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Card, Badge } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { PaymentInitiateResult, Booking, PaymentChannel, PaymentStatus } from '@/types';

// Local payment logos
const PAYMENT_LOGOS = {
    BCA: require('@/assets/images/payment/bca.png'),
    BNI: require('@/assets/images/payment/bni.png'),
    BRI: require('@/assets/images/payment/bri.png'),
    MANDIRI: require('@/assets/images/payment/mandiri.png'),
    PERMATA: require('@/assets/images/payment/permata.png'),
    QRIS: require('@/assets/images/payment/qris.png'),
    GOPAY: require('@/assets/images/payment/gopay.png'),
    SHOPEEPAY: require('@/assets/images/payment/shopeepay.png'),
};

// Payment channel configuration with local logo assets
const PAYMENT_CHANNELS: {
    id: PaymentChannel;
    label: string;
    shortName: string;
    color: string;
    logo: any;
    type: 'va' | 'qr' | 'ewallet'
}[] = [
        {
            id: 'VA_BCA',
            label: 'BCA Virtual Account',
            shortName: 'BCA',
            color: '#003D79',
            logo: PAYMENT_LOGOS.BCA,
            type: 'va'
        },
        {
            id: 'VA_BNI',
            label: 'BNI Virtual Account',
            shortName: 'BNI',
            color: '#F15A22',
            logo: PAYMENT_LOGOS.BNI,
            type: 'va'
        },
        {
            id: 'VA_BRI',
            label: 'BRI Virtual Account',
            shortName: 'BRI',
            color: '#00529C',
            logo: PAYMENT_LOGOS.BRI,
            type: 'va'
        },
        {
            id: 'VA_MANDIRI',
            label: 'Mandiri Virtual Account',
            shortName: 'MDR',
            color: '#003366',
            logo: PAYMENT_LOGOS.MANDIRI,
            type: 'va'
        },
        {
            id: 'VA_PERMATA',
            label: 'Permata Virtual Account',
            shortName: 'PMT',
            color: '#6B2D5B',
            logo: PAYMENT_LOGOS.PERMATA,
            type: 'va'
        },
        {
            id: 'QRIS',
            label: 'QRIS (Semua E-Wallet)',
            shortName: 'QRIS',
            color: '#E31837',
            logo: PAYMENT_LOGOS.QRIS,
            type: 'qr'
        },
        {
            id: 'GOPAY',
            label: 'GoPay',
            shortName: 'GPay',
            color: '#00AED6',
            logo: PAYMENT_LOGOS.GOPAY,
            type: 'ewallet'
        },
        {
            id: 'SHOPEEPAY',
            label: 'ShopeePay',
            shortName: 'SPay',
            color: '#EE4D2D',
            logo: PAYMENT_LOGOS.SHOPEEPAY,
            type: 'ewallet'
        },
    ];

// Map frontend channel to backend channel format
function mapChannelToBackend(channel: PaymentChannel): string {
    const mapping: Record<string, string> = {
        'VA_BCA': 'BCA_VA',
        'VA_BNI': 'BNI_VA',
        'VA_BRI': 'BRI_VA',
        'VA_MANDIRI': 'MANDIRI_VA',
        'VA_PERMATA': 'PERMATA_VA',
        'QRIS': 'QRIS',
        'GOPAY': 'GOPAY',
        'SHOPEEPAY': 'SHOPEEPAY',
    };
    return mapping[channel] || channel;
}

// Countdown timer component
function CountdownTimer({ expiryTime }: { expiryTime: string }) {
    const colors = Colors.light;
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const calculateTimeLeft = () => {
            const expiry = new Date(expiryTime).getTime();
            const now = Date.now();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft('Expired');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            if (hours > 0) {
                setTimeLeft(`${hours}j ${minutes}m ${seconds}d`);
            } else {
                setTimeLeft(`${minutes}m ${seconds}d`);
            }
        };

        calculateTimeLeft();
        const interval = setInterval(calculateTimeLeft, 1000);
        return () => clearInterval(interval);
    }, [expiryTime]);

    const isExpiring = timeLeft.includes('m') && !timeLeft.includes('j');

    return (
        <View style={[styles.countdown, isExpiring && { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="time-outline" size={20} color={isExpiring ? colors.warning : colors.primary} />
            <Text style={[styles.countdownText, { color: isExpiring ? colors.warning : colors.primary }]}>
                {timeLeft === 'Expired' ? 'Pembayaran Kedaluwarsa' : `Bayar dalam ${timeLeft}`}
            </Text>
        </View>
    );
}

export default function PaymentScreen() {
    const colors = Colors.light;
    const router = useRouter();
    const params = useLocalSearchParams<{
        bookingId: string;
        totalPrice: string;
        therapistName: string;
        packageName: string;
    }>();

    const [selectedChannel, setSelectedChannel] = useState<PaymentChannel | null>(null);
    const [loading, setLoading] = useState(false);
    const [paymentResult, setPaymentResult] = useState<PaymentInitiateResult | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const formatPrice = (price: string) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(Number(price));
    };

    // Poll booking status
    const pollStatus = useCallback(async () => {
        try {
            const booking = await api.get<Booking>(`/bookings/${params.bookingId}`);
            setPaymentStatus(booking.paymentStatus);

            if (booking.paymentStatus === 'PAID') {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                }
                // Navigate to success
                router.replace({
                    pathname: '/(tabs)/booking/step5-success',
                    params: {
                        bookingId: params.bookingId,
                        therapistName: params.therapistName,
                        packageName: params.packageName,
                    },
                });
            } else if (booking.paymentStatus === 'EXPIRED' || booking.paymentStatus === 'CANCELLED') {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                }
                Alert.alert('Pembayaran Gagal', 'Pembayaran telah kedaluwarsa atau dibatalkan', [
                    { text: 'OK', onPress: () => router.replace('/(tabs)') },
                ]);
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }, [params.bookingId, params.therapistName, params.packageName, router]);

    // Start polling when payment initiated
    useEffect(() => {
        if (paymentResult && paymentStatus === 'PENDING') {
            pollingRef.current = setInterval(pollStatus, 5000);
            return () => {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                }
            };
        }
    }, [paymentResult, paymentStatus, pollStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, []);

    const handleInitiatePayment = async () => {
        if (!selectedChannel) {
            Alert.alert('Error', 'Pilih metode pembayaran');
            return;
        }

        setLoading(true);
        try {
            const result = await api.post<PaymentInitiateResult>('/payment/initiate', {
                bookingId: params.bookingId,
                channel: mapChannelToBackend(selectedChannel),
            });
            setPaymentResult(result);
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Gagal menginisiasi pembayaran');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyVA = (vaNumber: string) => {
        Clipboard.setString(vaNumber);
        Alert.alert('Tersalin!', 'Nomor Virtual Account telah disalin');
    };

    const handleOpenDeeplink = (url: string) => {
        Linking.openURL(url).catch(() => {
            Alert.alert('Error', 'Tidak dapat membuka aplikasi pembayaran');
        });
    };

    // Render VA instruction
    const renderVAInstruction = () => {
        if (!paymentResult?.instruction) return null;

        const instruction = paymentResult.instruction as {
            type?: string;
            bank?: string;
            account?: string;
            va_number?: string;
        };

        const vaNumber = instruction.account || instruction.va_number || '';
        const bank = instruction.bank || selectedChannel?.replace('VA_', '') || '';

        return (
            <Card style={styles.instructionCard}>
                <Text style={[styles.instructionTitle, { color: colors.text }]}>
                    Transfer ke Virtual Account
                </Text>
                <Text style={[styles.bankName, { color: colors.primary }]}>{bank.toUpperCase()}</Text>

                <View style={styles.vaContainer}>
                    <Text style={[styles.vaNumber, { color: colors.text }]}>{vaNumber}</Text>
                    <TouchableOpacity onPress={() => handleCopyVA(vaNumber)} style={styles.copyButton}>
                        <Ionicons name="copy-outline" size={20} color={colors.primary} />
                        <Text style={[styles.copyText, { color: colors.primary }]}>Salin</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.instructionSteps}>
                    <Text style={[styles.stepTitle, { color: colors.text }]}>Cara Pembayaran:</Text>
                    <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                        1. Buka aplikasi mobile banking / ATM{'\n'}
                        2. Pilih menu Transfer → Virtual Account{'\n'}
                        3. Masukkan nomor VA di atas{'\n'}
                        4. Konfirmasi nominal: {formatPrice(params.totalPrice)}{'\n'}
                        5. Selesaikan pembayaran
                    </Text>
                </View>
            </Card>
        );
    };

    // Render QRIS instruction  
    const renderQRISInstruction = () => {
        if (!paymentResult?.instruction) return null;

        const instruction = paymentResult.instruction as {
            actions?: Array<{ url?: string; name?: string }>;
            qr_string?: string;
        };

        const qrUrl = instruction.actions?.find(a => a.name === 'generate-qr-code')?.url;

        return (
            <Card style={styles.instructionCard}>
                <Text style={[styles.instructionTitle, { color: colors.text }]}>
                    Scan QR Code
                </Text>

                {qrUrl ? (
                    <View style={styles.qrContainer}>
                        <Text style={[styles.qrPlaceholder, { color: colors.textSecondary }]}>
                            📱 Buka aplikasi e-wallet untuk scan QR
                        </Text>
                        <Button
                            title="Lihat QR Code"
                            onPress={() => handleOpenDeeplink(qrUrl)}
                            variant="outline"
                            style={{ marginTop: Spacing.md }}
                        />
                    </View>
                ) : (
                    <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                        QR Code sedang diproses...
                    </Text>
                )}

                <View style={styles.instructionSteps}>
                    <Text style={[styles.stepTitle, { color: colors.text }]}>Cara Pembayaran:</Text>
                    <Text style={[styles.stepText, { color: colors.textSecondary }]}>
                        1. Buka aplikasi e-wallet (GoPay, OVO, Dana, dll){'\n'}
                        2. Pilih menu Scan / Pay{'\n'}
                        3. Scan QR Code di atas{'\n'}
                        4. Konfirmasi pembayaran
                    </Text>
                </View>
            </Card>
        );
    };

    // Render e-wallet instruction (deeplink)
    const renderEwalletInstruction = () => {
        if (!paymentResult?.instruction) return null;

        const instruction = paymentResult.instruction as {
            actions?: Array<{ url?: string; name?: string }>;
        };

        const deeplinkUrl = instruction.actions?.find(a =>
            a.name === 'deeplink-redirect' || a.name === 'generate-qr-code'
        )?.url || paymentResult.redirectUrl;

        return (
            <Card style={styles.instructionCard}>
                <Text style={[styles.instructionTitle, { color: colors.text }]}>
                    Bayar dengan {selectedChannel}
                </Text>

                <View style={styles.ewalletContainer}>
                    <Text style={[styles.ewalletAmount, { color: colors.primary }]}>
                        {formatPrice(params.totalPrice)}
                    </Text>

                    {deeplinkUrl ? (
                        <Button
                            title={`Buka ${selectedChannel}`}
                            onPress={() => handleOpenDeeplink(deeplinkUrl)}
                            style={{ marginTop: Spacing.lg }}
                        />
                    ) : (
                        <Text style={[styles.stepText, { color: colors.textSecondary, marginTop: Spacing.md }]}>
                            Memproses pembayaran...
                        </Text>
                    )}
                </View>
            </Card>
        );
    };

    // Render instruction based on channel type
    const renderInstruction = () => {
        if (!paymentResult) return null;

        const channelConfig = PAYMENT_CHANNELS.find(c => c.id === selectedChannel);
        if (!channelConfig) return null;

        switch (channelConfig.type) {
            case 'va':
                return renderVAInstruction();
            case 'qr':
                return renderQRISInstruction();
            case 'ewallet':
                return renderEwalletInstruction();
            default:
                return null;
        }
    };

    // Handle back navigation - go to booking detail, not home
    const handleBack = () => {
        router.replace({
            pathname: '/(tabs)/booking-detail',
            params: { bookingId: params.bookingId },
        });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
            <Stack.Screen
                options={{
                    title: 'Pembayaran',
                    headerLeft: () => (
                        <TouchableOpacity onPress={handleBack} style={{ padding: 8 }}>
                            <Ionicons name="arrow-back" size={24} color={colors.text} />
                        </TouchableOpacity>
                    ),
                }}
            />

            {/* Enhanced Header */}
            <View style={[styles.enhancedHeader, { backgroundColor: colors.primary }]}>
                <View style={styles.headerContent}>
                    <View style={styles.headerIconContainer}>
                        <Ionicons name="card-outline" size={24} color="#fff" />
                    </View>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitleText}>Pembayaran</Text>
                        <Text style={styles.headerSubtitleText}>
                            {params.packageName} • {params.therapistName}
                        </Text>
                    </View>
                </View>
                <Text style={styles.headerAmount}>{formatPrice(params.totalPrice)}</Text>
            </View>

            {/* Progress Indicator */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressStep, styles.progressDone]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressStep, styles.progressDone]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressStep, styles.progressDone]}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
                <View style={[styles.progressLine, styles.progressLineDone]} />
                <View style={[styles.progressStep, styles.progressActive, { backgroundColor: colors.primary }]}>
                    <Text style={styles.progressNumber}>4</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Payment result or channel selection */}
                {paymentResult ? (
                    <>
                        {/* Countdown */}
                        {paymentResult.expiryTime && (
                            <CountdownTimer expiryTime={paymentResult.expiryTime} />
                        )}

                        {/* Status */}
                        <View style={styles.statusRow}>
                            <Badge
                                label={paymentStatus === 'PENDING' ? 'Menunggu Pembayaran' : paymentStatus}
                                variant={paymentStatus === 'PENDING' ? 'warning' : 'info'}
                            />
                            {paymentStatus === 'PENDING' && (
                                <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: Spacing.sm }} />
                            )}
                        </View>

                        {/* Instruction */}
                        {renderInstruction()}

                        {/* Refresh button */}
                        <Button
                            title="Cek Status Pembayaran"
                            variant="outline"
                            onPress={pollStatus}
                            style={{ marginTop: Spacing.lg }}
                        />
                    </>
                ) : (
                    <>
                        {/* Channel selection */}
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>Pilih Metode Pembayaran</Text>

                        {/* Virtual Account */}
                        <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>Virtual Account</Text>
                        {PAYMENT_CHANNELS.filter(c => c.type === 'va').map(channel => (
                            <TouchableOpacity
                                key={channel.id}
                                style={[
                                    styles.channelItem,
                                    { borderColor: selectedChannel === channel.id ? colors.primary : colors.border },
                                    selectedChannel === channel.id && { backgroundColor: colors.primaryLight },
                                ]}
                                onPress={() => setSelectedChannel(channel.id)}
                            >
                                <View style={styles.channelLogoContainer}>
                                    <Image
                                        source={channel.logo}
                                        style={styles.channelLogo}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={[styles.channelLabel, { color: colors.text }]}>{channel.label}</Text>
                                {selectedChannel === channel.id && (
                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}

                        {/* E-Wallet & QRIS */}
                        <Text style={[styles.groupTitle, { color: colors.textSecondary, marginTop: Spacing.lg }]}>
                            E-Wallet & QRIS
                        </Text>
                        {PAYMENT_CHANNELS.filter(c => c.type !== 'va').map(channel => (
                            <TouchableOpacity
                                key={channel.id}
                                style={[
                                    styles.channelItem,
                                    { borderColor: selectedChannel === channel.id ? colors.primary : colors.border },
                                    selectedChannel === channel.id && { backgroundColor: colors.primaryLight },
                                ]}
                                onPress={() => setSelectedChannel(channel.id)}
                            >
                                <View style={styles.channelLogoContainer}>
                                    <Image
                                        source={channel.logo}
                                        style={styles.channelLogo}
                                        resizeMode="contain"
                                    />
                                </View>
                                <Text style={[styles.channelLabel, { color: colors.text }]}>{channel.label}</Text>
                                {selectedChannel === channel.id && (
                                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </>
                )}
            </ScrollView>

            {/* Footer - only show before payment initiated */}
            {!paymentResult && (
                <View style={[styles.footer, { borderTopColor: colors.border }]}>
                    <Button
                        title={loading ? 'Memproses...' : 'Bayar Sekarang'}
                        onPress={handleInitiatePayment}
                        disabled={loading || !selectedChannel}
                        fullWidth
                    />
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    // Enhanced Header styles
    enhancedHeader: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
    },
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
    headerTitleText: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        color: '#fff',
    },
    headerSubtitleText: {
        fontSize: Typography.fontSize.sm,
        color: 'rgba(255,255,255,0.9)',
        marginTop: 2,
    },
    headerAmount: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        color: '#fff',
        textAlign: 'center',
        marginTop: Spacing.sm,
    },
    // Progress indicator styles
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
    },
    progressStep: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressDone: {
        backgroundColor: '#10B981',
    },
    progressActive: {
        backgroundColor: '#2196F3',
    },
    progressNumber: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.bold,
        color: '#fff',
    },
    progressLine: {
        width: 40,
        height: 2,
        backgroundColor: '#E5E7EB',
    },
    progressLineDone: {
        backgroundColor: '#10B981',
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: 100,
    },
    header: {
        marginBottom: Spacing.xl,
    },
    title: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
        marginTop: Spacing.xs,
    },
    amount: {
        fontSize: Typography.fontSize['3xl'],
        fontWeight: Typography.fontWeight.bold,
        marginTop: Spacing.sm,
    },
    sectionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.md,
    },
    groupTitle: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: Spacing.sm,
        marginTop: Spacing.sm,
    },
    channelItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    channelBadge: {
        width: 48,
        height: 28,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    channelBadgeText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    channelLogoContainer: {
        width: 56,
        height: 36,
        borderRadius: 6,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    channelLogo: {
        width: 48,
        height: 28,
    },
    channelLabel: {
        flex: 1,
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
    },
    countdown: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E3F2FD',
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.lg,
    },
    countdownText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginLeft: Spacing.sm,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    instructionCard: {
        padding: Spacing.lg,
    },
    instructionTitle: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    bankName: {
        fontSize: Typography.fontSize.xl,
        fontWeight: Typography.fontWeight.bold,
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    vaContainer: {
        backgroundColor: '#F5F5F5',
        padding: Spacing.lg,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    vaNumber: {
        fontSize: Typography.fontSize['2xl'],
        fontWeight: Typography.fontWeight.bold,
        letterSpacing: 2,
        marginBottom: Spacing.sm,
    },
    copyButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    copyText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginLeft: 4,
    },
    instructionSteps: {
        marginTop: Spacing.md,
    },
    stepTitle: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginBottom: Spacing.sm,
    },
    stepText: {
        fontSize: Typography.fontSize.sm,
        lineHeight: 22,
    },
    qrContainer: {
        alignItems: 'center',
        padding: Spacing.xl,
        backgroundColor: '#F5F5F5',
        borderRadius: BorderRadius.lg,
        marginBottom: Spacing.lg,
    },
    qrPlaceholder: {
        fontSize: Typography.fontSize.md,
        textAlign: 'center',
    },
    ewalletContainer: {
        alignItems: 'center',
        padding: Spacing.xl,
    },
    ewalletAmount: {
        fontSize: Typography.fontSize['3xl'],
        fontWeight: Typography.fontWeight.bold,
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
});
