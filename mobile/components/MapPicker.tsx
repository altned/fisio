/**
 * MapPicker Component - Location selection using MapLibre (100% Google-Free)
 * Uses OpenStreetMap raster tiles
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
import MapLibreGL from '@maplibre/maplibre-react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { Typography, Spacing, BorderRadius, Shadow } from '@/constants/Theme';

// Initialize MapLibre without access token (using OSM tiles)
MapLibreGL.setAccessToken(null);

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
};

// OSM Raster Tile Style JSON (Free, no API key needed)
const OSM_STYLE_JSON = {
    version: 8,
    sources: {
        'osm-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap Contributors',
        },
    },
    layers: [
        {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
        },
    ],
};

export function MapPicker({
    visible,
    onClose,
    onConfirm,
    initialLocation,
    title = 'Pilih Lokasi',
}: MapPickerProps) {
    const cameraRef = useRef<MapLibreGL.Camera>(null);
    const [centerCoords, setCenterCoords] = useState<[number, number]>([
        initialLocation?.longitude || DEFAULT_LOCATION.longitude,
        initialLocation?.latitude || DEFAULT_LOCATION.latitude,
    ]);
    const [address, setAddress] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // Get current location on mount
    useEffect(() => {
        if (visible && !initialLocation) {
            getCurrentLocation();
        }
    }, [visible, initialLocation]);

    // Reverse geocode when center coords change
    useEffect(() => {
        if (centerCoords[0] && centerCoords[1]) {
            reverseGeocode(centerCoords[1], centerCoords[0]); // lat, lon
        }
    }, [centerCoords]);

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

            const newCoords: [number, number] = [
                location.coords.longitude,
                location.coords.latitude,
            ];

            setCenterCoords(newCoords);
            cameraRef.current?.setCamera({
                centerCoordinate: newCoords,
                zoomLevel: 16,
                animationDuration: 500,
            });

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

    // Handle map region change
    const handleRegionDidChange = async (feature: any) => {
        if (feature.geometry?.coordinates) {
            const [lng, lat] = feature.geometry.coordinates;
            setCenterCoords([lng, lat]);
        }
    };

    const handleConfirm = () => {
        onConfirm({
            latitude: centerCoords[1],
            longitude: centerCoords[0],
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
                    <MapLibreGL.MapView
                        style={styles.map}
                        styleJSON={JSON.stringify(OSM_STYLE_JSON)}
                        logoEnabled={false}
                        attributionEnabled={true}
                        attributionPosition={{ bottom: 8, left: 8 }}
                        onRegionDidChange={handleRegionDidChange}
                    >
                        <MapLibreGL.Camera
                            ref={cameraRef}
                            defaultSettings={{
                                centerCoordinate: centerCoords,
                                zoomLevel: 15,
                            }}
                        />
                        <MapLibreGL.UserLocation visible={true} />
                    </MapLibreGL.MapView>

                    {/* Fixed Center Pin */}
                    <View style={styles.centerPinContainer}>
                        <Ionicons name="location" size={48} color="#2196F3" />
                        <View style={styles.pinShadow} />
                    </View>

                    {/* Current Location Button */}
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

                    {/* Map Hint */}
                    <View style={styles.mapHint}>
                        <Ionicons name="information-circle" size={16} color="#6B7280" />
                        <Text style={styles.mapHintText}>
                            Geser peta untuk memilih lokasi
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
                        📍 {centerCoords[1].toFixed(6)}, {centerCoords[0].toFixed(6)}
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
    centerPinContainer: {
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
});

export default MapPicker;
