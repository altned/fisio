import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function BookingLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.light.background,
                },
                headerTintColor: Colors.light.primary,
                headerTitleStyle: {
                    fontWeight: '600',
                },
                headerBackTitle: 'Kembali',
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    headerShown: false, // Custom header in screen
                }}
            />
            <Stack.Screen
                name="step2-package"
                options={{
                    title: 'Pilih Paket',
                }}
            />
        </Stack>
    );
}
