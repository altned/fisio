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
            <Stack.Screen
                name="step3-schedule"
                options={{
                    title: 'Jadwal & Alamat',
                }}
            />
            <Stack.Screen
                name="step3b-consent"
                options={{
                    title: 'Persetujuan',
                }}
            />
            <Stack.Screen
                name="step4-payment"
                options={{
                    title: 'Pembayaran',
                    headerBackVisible: false, // Prevent going back during payment
                }}
            />

            <Stack.Screen
                name="step5-success"
                options={{
                    title: 'Sukses',
                    headerShown: false, // Full screen success
                }}
            />
        </Stack>
    );
}
