/**
 * Home Screen - Patient: Dashboard, Therapist: Inbox
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const colors = Colors.light;
  const router = useRouter();
  const { user, activeRole, isLoggedIn } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // TODO: Fetch data
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Patient Home
  if (activeRole === 'PATIENT') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>Selamat datang,</Text>
              <Text style={[styles.name, { color: colors.text }]}>{user?.fullName || 'Pasien'}</Text>
            </View>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
          </View>

          {/* Quick Action */}
          <Card style={styles.quickAction}>
            <View style={styles.quickActionContent}>
              <View style={[styles.quickActionIcon, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="medical" size={32} color={colors.primary} />
              </View>
              <View style={styles.quickActionText}>
                <Text style={[styles.quickActionTitle, { color: colors.text }]}>
                  Butuh Fisioterapi?
                </Text>
                <Text style={[styles.quickActionSubtitle, { color: colors.textSecondary }]}>
                  Pesan terapis untuk home visit
                </Text>
              </View>
            </View>
            <Button
              title="Booking Sekarang"
              onPress={() => router.push('/(tabs)/booking')}
              fullWidth
              style={{ marginTop: Spacing.md }}
            />
          </Card>

          {/* Upcoming Sessions */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Sesi Mendatang</Text>
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Belum ada sesi terjadwal
                </Text>
              </View>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Therapist Home (Inbox)
  if (activeRole === 'THERAPIST') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.greeting, { color: colors.textSecondary }]}>Inbox</Text>
              <Text style={[styles.name, { color: colors.text }]}>{user?.fullName || 'Terapis'}</Text>
            </View>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
          </View>

          {/* Pending Bookings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Menunggu Respon</Text>
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="mail-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Tidak ada booking menunggu
                </Text>
              </View>
            </Card>
          </View>

          {/* Today's Schedule */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Jadwal Hari Ini</Text>
            <Card>
              <View style={styles.emptyState}>
                <Ionicons name="today-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Tidak ada sesi hari ini
                </Text>
              </View>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Default state (not logged in - should redirect)
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.centerContent}>
        <Ionicons name="medical" size={64} color={colors.primary} />
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>Fisioku</Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
          Layanan Fisioterapi Home Visit
        </Text>
        <Button
          title="Masuk"
          onPress={() => router.replace('/(auth)/login')}
          style={{ marginTop: Spacing.lg }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    fontSize: Typography.fontSize.sm,
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAction: {
    marginBottom: Spacing.lg,
  },
  quickActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickActionIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  quickActionSubtitle: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  welcomeTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginTop: Spacing.md,
  },
  welcomeSubtitle: {
    fontSize: Typography.fontSize.md,
    marginTop: Spacing.xs,
  },
});
