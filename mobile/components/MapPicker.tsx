/**
 * MapPicker Component - Location selection using OpenStreetMap
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Platform,
} from 'react-native';
import MapView, { Marker, UrlTile, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow } from '@/constants/Theme';

interface MapPickerProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: (location: { latitude: number; longitude: number; address?: string }) => void;
    initialLocation?: { latitude: number; longitude: number };
    title?: string;
}

// Default to Jakarta, Indonesia
const DEFAULT_LOCATION = {
    latitude: -6.2088,
    longitude: 106.8456,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
};

export function MapPicker({
    visible,
    onClose,
    onConfirm,
    initialLocation,
    title = 'Pilih Lokasi',
}: MapPickerProps) {
    const mapRef = useRef<MapView>(null);
    const [region, setRegion] = useState<Region>({
        ...DEFAULT_LOCATION,
        ...(initialLocation || {}),
    });
    const [markerPosition, setMarkerPosition] = useState(
        initialLocation || { latitude: DEFAULT_LOCATION.latitude, longitude: DEFAULT_LOCATION.longitude }
    );
    const [address, setAddress] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);
    // Enable map by default - OSM tiles work without API key
    const [mapError, setMapError] = useState(false);

    // Get current location on mount
    useEffect(() => {
        if (visible && !initialLocation) {
            getCurrentLocation();
        }
    }, [visible, initialLocation]);

    // Reverse geocode when marker position changes
    useEffect(() => {
        if (markerPosition.latitude && markerPosition.longitude) {
            reverseGeocode(markerPosition.latitude, markerPosition.longitude);
        }
    }, [markerPosition]);

    const getCurrentLocation = async () => {
        setIsGettingLocation(true);
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Izin Ditolak', 'Izin lokasi diperlukan untuk mendeteksi posisi Anda');
                return;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const newPosition = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };

            setMarkerPosition(newPosition);
            setRegion({
                ...newPosition,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });

            // Animate map to current location
            mapRef.current?.animateToRegion({
                ...newPosition,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 500);

        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Gagal mendapatkan lokasi saat ini');
        } finally {
            setIsGettingLocation(false);
        }
    };

    // Reverse geocode using Nominatim (OpenStreetMap free service)
    const reverseGeocode = async (latitude: number, longitude: number) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'User-Agent': 'FisiokuApp/1.0',
                    },
                    signal: controller.signal,
                }
            );
            clearTimeout(timeoutId);

            const data = await response.json();
            if (data.display_name) {
                setAddress(data.display_name);
            } else {
                setAddress('Alamat tidak ditemukan');
            }
        } catch {
            // Silently handle network errors - not critical for functionality
            setAddress('Alamat tidak tersedia');
        }
    };

    const handleMapPress = (event: any) => {
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setMarkerPosition({ latitude, longitude });
    };

    const handleConfirm = () => {
        onConfirm({
            latitude: markerPosition.latitude,
            longitude: markerPosition.longitude,
            address: address || undefined,
        });
        onClose();
    };

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#1F2937" />
                    </TouchableOpacity>
                    <Text style={styles.title}>{title}</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Map */}
                <View style={styles.mapContainer}>
                    {mapError ? (
                        <View style={styles.mapErrorContainer}>
                            <Ionicons name="location-outline" size={64} color="#2196F3" />
                            <Text style={styles.mapErrorText}>Pilih Lokasi Anda</Text>
                            <Text style={styles.mapErrorSubtext}>
                                Gunakan lokasi GPS Anda saat ini
                            </Text>
                            <TouchableOpacity
                                style={styles.getLocationButton}
                                onPress={getCurrentLocation}
                                disabled={isGettingLocation}
                            >
                                {isGettingLocation ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Ionicons name="locate" size={20} color="#fff" />
                                        <Text style={styles.getLocationButtonText}>
                                            Gunakan Lokasi Saya
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <MapView
                            ref={mapRef}
                            style={styles.map}
                            initialRegion={region}
                            onPress={handleMapPress}
                            showsUserLocation
                            showsMyLocationButton={false}
                            mapType={Platform.OS === 'android' ? 'none' : 'standard'}
                            onMapReady={() => setMapError(false)}
                        >
                            {/* Stadia Maps Tiles - Free and permissive */}
                            <UrlTile
                                urlTemplate="https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}.png"
                                maximumZ={19}
                                flipY={false}
                            />

                            {/* Selected Location Marker */}
                            <Marker
                                coordinate={markerPosition}
                                draggable
                                onDragEnd={(e) => setMarkerPosition(e.nativeEvent.coordinate)}
                            />
                        </MapView>
                    )}

                    {/* Current Location Button */}
                    {!mapError && (
                        <TouchableOpacity
                            style={styles.currentLocationButton}
                            onPress={getCurrentLocation}
                            disabled={isGettingLocation}
                        >
                            {isGettingLocation ? (
                                <ActivityIndicator size="small" color="#2196F3" />
                            ) : (
                                <Ionicons name="locate" size={24} color="#2196F3" />
                            )}
                        </TouchableOpacity>
                    )}

                    {/* Map Hint */}
                    <View style={styles.mapHint}>
                        <Ionicons name="information-circle" size={16} color="#6B7280" />
                        <Text style={styles.mapHintText}>
                            {mapError ? 'Gunakan lokasi saat ini' : 'Tap atau drag marker untuk memilih lokasi'}
                        </Text>
                    </View>
                </View>

                {/* Address Display */}
                <View style={styles.addressContainer}>
                    <View style={styles.addressIcon}>
                        <Ionicons name="location" size={20} color="#2196F3" />
                    </View>
                    <View style={styles.addressTextContainer}>
                        <Text style={styles.addressLabel}>Alamat Terpilih</Text>
                        <Text style={styles.addressText} numberOfLines={2}>
                            {address || 'Memuat alamat...'}
                        </Text>
                    </View>
                </View>

                {/* Coordinates Display */}
                <View style={styles.coordinatesContainer}>
                    <Text style={styles.coordinatesText}>
                        📍 {markerPosition.latitude.toFixed(6)}, {markerPosition.longitude.toFixed(6)}
                    </Text>
                </View>

                {/* Confirm Button */}
                <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                    disabled={isLoading}
                >
                    <Text style={styles.confirmButtonText}>Konfirmasi Lokasi</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.xl * 2,
        paddingBottom: Spacing.md,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    closeButton: {
        padding: Spacing.sm,
    },
    title: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        color: '#1F2937',
    },
    placeholder: {
        width: 40,
    },
    mapContainer: {
        flex: 1,
        position: 'relative',
    },
    map: {
        flex: 1,
    },
    currentLocationButton: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        backgroundColor: '#fff',
        borderRadius: BorderRadius.full,
        padding: Spacing.md,
        ...Shadow.md,
    },
    mapHint: {
        position: 'absolute',
        bottom: Spacing.md,
        left: Spacing.md,
        right: Spacing.md,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: BorderRadius.md,
        padding: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        ...Shadow.sm,
    },
    mapHintText: {
        fontSize: Typography.fontSize.xs,
        color: '#6B7280',
        marginLeft: Spacing.xs,
    },
    addressContainer: {
        flexDirection: 'row',
        padding: Spacing.md,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    addressIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E3F2FD',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    addressTextContainer: {
        flex: 1,
    },
    addressLabel: {
        fontSize: Typography.fontSize.xs,
        color: '#6B7280',
        marginBottom: 2,
    },
    addressText: {
        fontSize: Typography.fontSize.sm,
        color: '#1F2937',
    },
    coordinatesContainer: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        backgroundColor: '#F3F4F6',
    },
    coordinatesText: {
        fontSize: Typography.fontSize.xs,
        color: '#6B7280',
        textAlign: 'center',
        fontFamily: 'monospace',
    },
    confirmButton: {
        backgroundColor: '#2196F3',
        marginHorizontal: Spacing.md,
        marginVertical: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    mapErrorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
    },
    mapErrorText: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.semibold,
        color: '#6B7280',
        marginTop: Spacing.md,
    },
    mapErrorSubtext: {
        fontSize: Typography.fontSize.sm,
        color: '#9CA3AF',
        marginTop: Spacing.xs,
        textAlign: 'center',
        paddingHorizontal: Spacing.lg,
    },
    getLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#2196F3',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        borderRadius: BorderRadius.lg,
        marginTop: Spacing.xl,
    },
    getLocationButtonText: {
        color: '#fff',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
        marginLeft: Spacing.sm,
    },
});

export default MapPicker;
