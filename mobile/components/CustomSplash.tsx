/**
 * Custom Splash Screen Component
 * This component is used to display a branded splash screen in Expo Go
 * since Expo Go doesn't support custom native splash screens.
 */

import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export function CustomSplash() {
    return (
        <View style={styles.container}>
            <Image
                source={require('@/assets/images/splash.png')}
                style={styles.logo}
                resizeMode="contain"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: width * 0.7,
        height: height * 0.3,
    },
});

export default CustomSplash;
