import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function AuthLayout() {
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
                headerShadowVisible: false,
            }}
        >
            <Stack.Screen
                name="login"
                options={{
                    title: 'Masuk',
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="register"
                options={{
                    title: 'Daftar',
                    headerBackTitle: 'Kembali',
                }}
            />
            <Stack.Screen
                name="role-select"
                options={{
                    title: 'Pilih Peran',
                    headerBackTitle: 'Kembali',
                }}
            />
        </Stack>
    );
}
