/**
 * Wallet Screen - Therapist Only
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Card, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';

export default function WalletScreen() {
  const colors = Colors.light;
  const { user } = useAuthStore();

  const balance = '2500000'; // Dummy
  const formatMoney = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(Number(amount));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Dompet Saya</Text>
        </View>

        {/* Balance Card */}
        <Card style={[styles.balanceCard, { backgroundColor: colors.primary }]}>
          <View>
            <Text style={styles.balanceLabel}>Saldo Aktif</Text>
            <Text style={styles.balanceValue}>{formatMoney(balance)}</Text>
          </View>
          <View style={styles.balanceActions}>
            <View style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="arrow-down" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>Tarik</Text>
            </View>
            <View style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="time" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>Riwayat</Text>
            </View>
          </View>
        </Card>

        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistik Bulan Ini</Text>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.success }]}>+ 3.5jt</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pemasukan</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.text }]}>12</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sesi Selesai</Text>
            </Card>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaksi Terakhir</Text>
          <Card>
            <View style={styles.emptyState}>
              <Text style={{ color: colors.textSecondary }}>Belum ada transaksi</Text>
            </View>
          </Card>
        </View>
      </ScrollView>
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
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
  },
  balanceCard: {
    marginBottom: Spacing.xl,
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
  },
  balanceValue: {
    color: '#fff',
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.lg,
  },
  balanceActions: {
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  actionItem: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  actionText: {
    color: '#fff',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
  },
  emptyState: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
});
