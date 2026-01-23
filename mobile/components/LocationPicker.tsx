import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Platform,
    Dimensions,
} from 'react-native';
import MapView, { UrlTile, Region } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';

const { width, height } = Dimensions.get('window');

interface LocationPickerProps {
    initialLatitude?: number;
    initialLongitude?: number;
    onLocationSelect: (location: {
        latitude: number;
        longitude: number;
        address: string;
    }) => void;
    onCancel?: () => void;
}

// Default to Jakarta if no initial location
const DEFAULT_LATITUDE = -6.2088;
const DEFAULT_LONGITUDE = 106.8456;
const DEFAULT_DELTA = 0.01;

export default function LocationPicker({
    initialLatitude = DEFAULT_LATITUDE,
    initialLongitude = DEFAULT_LONGITUDE,
    onLocationSelect,
    onCancel,
}: LocationPickerProps) {
    const colors = Colors.light;
    const mapRef = useRef<MapView>(null);

    const [region, setRegion] = useState<Region>({
        latitude: initialLatitude,
        longitude: initialLongitude,
        latitudeDelta: DEFAULT_DELTA,
        longitudeDelta: DEFAULT_DELTA,
    });

    const [address, setAddress] = useState<string>('Mengambil alamat...');
    const [isLoadingAddress, setIsLoadingAddress] = useState(false);

    // Fetch address when region changes
    const fetchAddress = async (latitude: number, longitude: number) => {
        setIsLoadingAddress(true);
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'FisiokuApp/1.0', // REQUIRED by Nominatim
                        'Accept-Language': 'id', // Indonesian language
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Geocoding failed');
            }

            const data = await response.json();

            if (data.display_name) {
                // Format address to be more readable
                const formattedAddress = formatAddress(data);
                setAddress(formattedAddress);
            } else {
                setAddress('Alamat tidak ditemukan');
            }
        } catch (error) {
            console.error('[LocationPicker] Geocoding error:', error);
            setAddress('Gagal mengambil alamat');
        } finally {
            setIsLoadingAddress(false);
        }
    };

    // Format Nominatim response to readable address
    const formatAddress = (data: any): string => {
        const addr = data.address;
        const parts: string[] = [];

        // Build address from parts
        if (addr.road) parts.push(addr.road);
        if (addr.neighbourhood) parts.push(addr.neighbourhood);
        if (addr.suburb) parts.push(addr.suburb);
        if (addr.city || addr.town || addr.village) {
            parts.push(addr.city || addr.town || addr.village);
        }
        if (addr.state) parts.push(addr.state);

        return parts.length > 0 ? parts.join(', ') : data.display_name;
    };

    // Handle region change complete (user stopped dragging)
    const handleRegionChangeComplete = (newRegion: Region) => {
        setRegion(newRegion);
        fetchAddress(newRegion.latitude, newRegion.longitude);
    };

    // Initial fetch
    useEffect(() => {
        fetchAddress(initialLatitude, initialLongitude);
    }, []);

    // Handle location selection
    const handleSelectLocation = () => {
        onLocationSelect({
            latitude: region.latitude,
            longitude: region.longitude,
            address: address,
        });
    };

    // Center to current location
    const handleCenterToUser = async () => {
        // You can add expo-location here for current location
        // For now, just animate to initial position
        mapRef.current?.animateToRegion({
            latitude: initialLatitude,
            longitude: initialLongitude,
            latitudeDelta: DEFAULT_DELTA,
            longitudeDelta: DEFAULT_DELTA,
        });
    };

    return (
        <View style={styles.container}>
            {/* Map */}
            <MapView
                ref={mapRef}
                style={styles.map}
                initialRegion={region}
                onRegionChangeComplete={handleRegionChangeComplete}
                mapType={Platform.OS === 'android' ? 'none' : 'standard'}
                showsUserLocation={true}
                showsMyLocationButton={false}
            >
                {/* OpenStreetMap Tiles */}
                <UrlTile
                    urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    maximumZ={19}
                    flipY={false}
                    tileSize={256}
                />
            </MapView>

            {/* Fixed Center Pin */}
            <View style={styles.pinContainer}>
                <Ionicons name="location" size={48} color={colors.primary} />
                <View style={styles.pinShadow} />
            </View>

            {/* Cancel Button (Top Left) */}
            {onCancel && (
                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            )}

            {/* Center to User Button (Top Right) */}
            <TouchableOpacity style={styles.locationButton} onPress={handleCenterToUser}>
                <Ionicons name="locate" size={24} color={colors.primary} />
            </TouchableOpacity>

            {/* Bottom Card */}
            <View style={styles.bottomCard}>
                <View style={styles.addressContainer}>
                    <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                    <View style={styles.addressTextContainer}>
                        {isLoadingAddress ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={[styles.addressText, { color: colors.text }]} numberOfLines={2}>
                                {address}
                            </Text>
                        )}
                    </View>
                </View>

                <View style={styles.coordinatesContainer}>
                    <Text style={[styles.coordinatesText, { color: colors.textSecondary }]}>
                        {region.latitude.toFixed(6)}, {region.longitude.toFixed(6)}
                    </Text>
                </View>

                <TouchableOpacity
                    style={[styles.selectButton, { backgroundColor: colors.primary }]}
                    onPress={handleSelectLocation}
                    disabled={isLoadingAddress}
                >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={styles.selectButtonText}>Pilih Lokasi Ini</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    pinContainer: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        marginLeft: -24,
        marginTop: -48,
        alignItems: 'center',
        zIndex: 10,
    },
    pinShadow: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.3)',
        marginTop: -4,
    },
    cancelButton: {
        position: 'absolute',
        top: 50,
        left: 16,
        backgroundColor: '#fff',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
    },
    locationButton: {
        position: 'absolute',
        top: 50,
        right: 16,
        backgroundColor: '#fff',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 10,
    },
    bottomCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        padding: Spacing.lg,
        paddingBottom: Spacing.xl + 20, // Extra padding for bottom safe area
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    addressTextContainer: {
        flex: 1,
        marginLeft: Spacing.sm,
        minHeight: 40,
        justifyContent: 'center',
    },
    addressText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.medium,
        lineHeight: 22,
    },
    coordinatesContainer: {
        marginBottom: Spacing.md,
        paddingLeft: 28, // Align with address text
    },
    coordinatesText: {
        fontSize: Typography.fontSize.sm,
        fontFamily: 'SpaceMono',
    },
    selectButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    selectButtonText: {
        color: '#fff',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
});
