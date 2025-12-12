/**
 * Wallet Screen - Therapist Only
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Card } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/auth';
import api from '@/lib/api';
import { Wallet, WalletStats, WalletTransaction, PaginatedResponse } from '@/types';

// Format currency
function formatMoney(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Get category label and color
function getCategoryInfo(category: string | null, type: string): { label: string; color: string } {
  const colors = Colors.light;

  if (type === 'DEBIT') {
    return { label: 'Penarikan', color: colors.error };
  }

  switch (category) {
    case 'SESSION_FEE':
      return { label: 'Payout Sesi', color: colors.success };
    case 'FORFEIT_COMPENSATION':
      return { label: 'Kompensasi Forfeit', color: colors.warning };
    case 'TOPUP':
      return { label: 'Top Up', color: colors.info };
    case 'ADJUSTMENT':
      return { label: 'Penyesuaian', color: colors.textSecondary };
    default:
      return { label: 'Transaksi', color: colors.textSecondary };
  }
}

// Transaction Item Component
function TransactionItem({ transaction }: { transaction: WalletTransaction }) {
  const colors = Colors.light;
  const isCredit = transaction.type === 'CREDIT';
  const { label, color } = getCategoryInfo(transaction.category, transaction.type);

  return (
    <View style={[styles.transactionItem, { borderBottomColor: colors.border }]}>
      <View style={[styles.transactionIcon, { backgroundColor: isCredit ? colors.successLight : colors.errorLight }]}>
        <Ionicons
          name={isCredit ? 'arrow-down' : 'arrow-up'}
          size={20}
          color={isCredit ? colors.success : colors.error}
        />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={[styles.transactionLabel, { color: colors.text }]}>{label}</Text>
        <Text style={[styles.transactionDate, { color: colors.textSecondary }]}>
          {formatDate(transaction.createdAt)}
        </Text>
        {transaction.adminNote && (
          <Text style={[styles.transactionNote, { color: colors.textMuted }]} numberOfLines={1}>
            {transaction.adminNote}
          </Text>
        )}
      </View>
      <Text style={[styles.transactionAmount, { color }]}>
        {isCredit ? '+' : '-'}{formatMoney(transaction.amount)}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const colors = Colors.light;
  const { user } = useAuthStore();

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [monthlyStats, setMonthlyStats] = useState<WalletStats | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch wallet data
  const fetchWalletData = useCallback(async () => {
    try {
      setError(null);

      // Get wallet
      const walletData = await api.getMyWallet<Wallet>();
      setWallet(walletData);

      if (walletData?.id) {
        // Get monthly stats
        const stats = await api.getWalletMonthlyStats<WalletStats>(walletData.id);
        setMonthlyStats(stats);

        // Get transactions
        const txResponse = await api.getWalletTransactions<PaginatedResponse<WalletTransaction>>(
          walletData.id,
          1,
          10
        );
        setTransactions(txResponse.data || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch wallet:', err);
      setError(err.message || 'Gagal memuat data wallet');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  }, [fetchWalletData]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Memuat wallet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchWalletData}
          >
            <Text style={styles.retryButtonText}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Dompet Saya</Text>
        </View>

        {/* Balance Card */}
        <Card style={{ ...styles.balanceCard, backgroundColor: colors.primary }}>
          <View>
            <Text style={styles.balanceLabel}>Saldo Aktif</Text>
            <Text style={styles.balanceValue}>
              {formatMoney(wallet?.balance || '0')}
            </Text>
          </View>
          <View style={styles.balanceActions}>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="arrow-down" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>Tarik</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem}>
              <View style={styles.actionIcon}>
                <Ionicons name="time" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionText}>Riwayat</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Monthly Stats */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Statistik Bulan Ini</Text>
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {formatMoney(monthlyStats?.monthIncome || '0')}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pemasukan</Text>
            </Card>
            <Card style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {transactions.filter(t => t.category === 'SESSION_FEE').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Sesi Dibayar</Text>
            </Card>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaksi Terakhir</Text>
            {transactions.length > 0 && (
              <TouchableOpacity>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Lihat Semua</Text>
              </TouchableOpacity>
            )}
          </View>

          <Card style={styles.transactionsCard}>
            {transactions.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="wallet-outline" size={48} color={colors.textMuted} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Belum ada transaksi
                </Text>
              </View>
            ) : (
              transactions.map((tx, index) => (
                <TransactionItem key={tx.id || index} transaction={tx} />
              ))
            )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    marginTop: Spacing.md,
    fontSize: Typography.fontSize.md,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: Typography.fontWeight.semibold,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  seeAllText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
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
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
  },
  transactionsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  emptyState: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionLabel: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  transactionDate: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  transactionNote: {
    fontSize: Typography.fontSize.xs,
    fontStyle: 'italic',
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.bold,
  },
});
