/**
 * Home Screen - Patient: Dashboard, Therapist: Inbox
 */

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Alert, ActivityIndicator, Image, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadow } from '@/constants/Theme';
import { Button, Card } from '@/components/ui';
import { PromoBannerCarousel } from '@/components/PromoBannerCarousel';
import { GradientHeader } from '@/components/GradientHeader';
import { QuickActionCard } from '@/components/QuickActionCard';
import { StatCard } from '@/components/StatCard';
import { useAuthStore } from '@/store/auth';
import { Ionicons } from '@expo/vector-icons';
import api from '@/lib/api';
import { Booking, Session } from '@/types';

// Helper to format time remaining
function formatTimeRemaining(respondBy: string | null | undefined): string {
  if (!respondBy) return '';
  const now = new Date();
  const deadline = new Date(respondBy);
  const diffMs = deadline.getTime() - now.getTime();

  if (diffMs <= 0) return 'Waktu habis';

  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// Format date for display
function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format currency
function formatCurrency(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
}

// Booking Card Component for Therapist Inbox
function InboxBookingCard({
  booking,
  onAccept,
  onDecline,
  isLoading,
}: {
  booking: Booking;
  onAccept: () => void;
  onDecline: () => void;
  isLoading: boolean;
}) {
  const colors = Colors.light;
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(booking.therapistRespondBy));

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(booking.therapistRespondBy));
    }, 1000);
    return () => clearInterval(interval);
  }, [booking.therapistRespondBy]);

  const isInstant = booking.bookingType === 'INSTANT';
  const firstSession = booking.sessions?.[0];

  return (
    <Card style={styles.bookingCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[
          styles.typeBadge,
          { backgroundColor: isInstant ? colors.warningLight : colors.infoLight }
        ]}>
          <Ionicons
            name={isInstant ? 'flash' : 'calendar'}
            size={12}
            color={isInstant ? colors.warning : colors.info}
          />
          <Text style={[styles.typeBadgeText, { color: isInstant ? colors.warning : colors.info }]}>
            {isInstant ? 'INSTANT' : 'REGULAR'}
          </Text>
        </View>
        <View style={[styles.timerBadge, { backgroundColor: colors.errorLight }]}>
          <Ionicons name="time-outline" size={12} color={colors.error} />
          <Text style={[styles.timerText, { color: colors.error }]}>{timeRemaining}</Text>
        </View>
      </View>

      {/* Patient Info */}
      <View style={styles.patientRow}>
        <View style={[styles.avatarSmall, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="person" size={20} color={colors.primary} />
        </View>
        <View style={styles.patientInfo}>
          <Text style={[styles.patientName, { color: colors.text }]}>
            {booking.user?.fullName || 'Pasien'}
          </Text>
          <Text style={[styles.patientEmail, { color: colors.textSecondary }]}>
            {booking.user?.email}
          </Text>
        </View>
      </View>

      {/* Session Info */}
      <View style={[styles.infoRow, { borderColor: colors.border }]}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {formatDate(firstSession?.scheduledAt)}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text
            style={[styles.infoText, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {booking.lockedAddress}
          </Text>
        </View>
      </View>

      {/* Maps Button - Show if coordinates available */}
      {booking.latitude && booking.longitude && (
        <TouchableOpacity
          style={[styles.mapsButton, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}
          onPress={() => {
            const url = `https://www.google.com/maps/search/?api=1&query=${booking.latitude},${booking.longitude}`;
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Tidak dapat membuka Google Maps');
            });
          }}
        >
          <Ionicons name="navigate-circle" size={20} color={colors.primary} />
          <Text style={[styles.mapsButtonText, { color: colors.primary }]}>Lihat di Maps (Cek Jarak)</Text>
          <Ionicons name="open-outline" size={16} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Price */}
      <View style={styles.priceRow}>
        <Text style={[styles.priceLabel, { color: colors.textSecondary }]}>Pendapatan Anda:</Text>
        <Text style={[styles.priceValue, { color: colors.success }]}>
          {formatCurrency(booking.therapistNetTotal)}
        </Text>
      </View>

      {/* Actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.declineButton, { borderColor: colors.error }]}
          onPress={onDecline}
          disabled={isLoading}
        >
          <Ionicons name="close" size={18} color={colors.error} />
          <Text style={[styles.declineButtonText, { color: colors.error }]}>Tolak</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.acceptButton, { backgroundColor: colors.success }]}
          onPress={onAccept}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color="#fff" />
              <Text style={styles.acceptButtonText}>Terima</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </Card>
  );
}

// Today's Session Card for Therapist
function TodaySessionCard({ session, booking }: { session: Session; booking: Booking }) {
  const colors = Colors.light;
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.sessionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push({ pathname: '/(tabs)/booking-detail', params: { bookingId: booking.id } })}
    >
      <View style={styles.sessionTime}>
        <Text style={[styles.sessionTimeText, { color: colors.primary }]}>
          {new Date(session.scheduledAt!).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
      <View style={styles.sessionInfo}>
        <Text style={[styles.sessionPatient, { color: colors.text }]}>
          {booking.user?.fullName || 'Pasien'}
        </Text>
        <Text style={[styles.sessionAddress, { color: colors.textSecondary }]} numberOfLines={1}>
          {booking.lockedAddress}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = Colors.light;
  const router = useRouter();
  const { user, activeRole, isLoggedIn } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [todaySessions, setTodaySessions] = useState<{ session: Session; booking: Booking }[]>([]);
  const [loadingBookingId, setLoadingBookingId] = useState<string | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [therapistStats, setTherapistStats] = useState({ pending: 0, todaySessions: 0, completedSessions: 0 });

  // Fetch therapist data
  const fetchTherapistData = useCallback(async () => {
    if (activeRole !== 'THERAPIST') return;

    setIsLoadingData(true);
    try {
      const bookings = await api.getMyBookings<Booking[]>();

      // Calculate stats
      let completedSessions = 0;

      // Filter pending bookings (PAID but not accepted, and SLA not expired)
      const now = new Date();
      const pending = bookings.filter(b =>
        b.status === 'PAID' &&
        !b.therapistAcceptedAt &&
        b.therapistRespondBy &&
        new Date(b.therapistRespondBy) > now // Exclude expired SLA
      );
      setPendingBookings(pending);

      // Get today's sessions from accepted bookings
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayList: { session: Session; booking: Booking }[] = [];
      bookings.forEach(booking => {
        if (booking.sessions) {
          booking.sessions.forEach(session => {
            // Count completed sessions
            if (session.status === 'COMPLETED') {
              completedSessions++;
            }
            // Get today's scheduled sessions
            if (booking.status === 'PAID' && booking.therapistAcceptedAt && session.scheduledAt && session.status === 'SCHEDULED') {
              const sessionDate = new Date(session.scheduledAt);
              if (sessionDate >= today && sessionDate < tomorrow) {
                todayList.push({ session, booking });
              }
            }
          });
        }
      });

      // Sort by time
      todayList.sort((a, b) =>
        new Date(a.session.scheduledAt!).getTime() - new Date(b.session.scheduledAt!).getTime()
      );
      setTodaySessions(todayList);

      // Update stats
      setTherapistStats({
        pending: pending.length,
        todaySessions: todayList.length,
        completedSessions
      });

    } catch (error: any) {
      console.error('Failed to fetch therapist data:', error);
    } finally {
      setIsLoadingData(false);
    }
  }, [activeRole]);

  useEffect(() => {
    fetchTherapistData();
  }, [fetchTherapistData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTherapistData();
    setRefreshing(false);
  }, [fetchTherapistData]);

  // Handle accept booking
  const handleAccept = async (booking: Booking, therapistId: string) => {
    Alert.alert(
      'Terima Booking',
      `Terima booking dari ${booking.user?.fullName}?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Terima',
          onPress: async () => {
            setLoadingBookingId(booking.id);
            try {
              await api.acceptBooking(booking.id, therapistId);
              Alert.alert('Berhasil', 'Booking berhasil diterima');
              fetchTherapistData();
            } catch (error: any) {
              Alert.alert('Gagal', error.message || 'Gagal menerima booking');
            } finally {
              setLoadingBookingId(null);
            }
          },
        },
      ]
    );
  };

  // Handle decline booking
  const handleDecline = async (booking: Booking, therapistId: string) => {
    Alert.alert(
      'Tolak Booking',
      `Tolak booking dari ${booking.user?.fullName}? Pembayaran akan direfund.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tolak',
          style: 'destructive',
          onPress: async () => {
            setLoadingBookingId(booking.id);
            try {
              await api.declineBooking(booking.id, therapistId);
              Alert.alert('Ditolak', 'Booking berhasil ditolak');
              fetchTherapistData();
            } catch (error: any) {
              Alert.alert('Gagal', error.message || 'Gagal menolak booking');
            } finally {
              setLoadingBookingId(null);
            }
          },
        },
      ]
    );
  };

  // Patient Home
  const [patientSessions, setPatientSessions] = useState<{ session: Session; booking: Booking }[]>([]);
  const [isPatientLoading, setIsPatientLoading] = useState(false);
  const [patientStats, setPatientStats] = useState({ activeSessions: 0, completedSessions: 0, totalBookings: 0 });

  // Fetch patient upcoming sessions and stats
  const fetchPatientData = useCallback(async () => {
    if (activeRole !== 'PATIENT') return;

    setIsPatientLoading(true);
    try {
      const bookings = await api.get<Booking[]>('/bookings/my');

      // Calculate stats
      let activeSessions = 0;
      let completedSessions = 0;
      const totalBookings = bookings.length;

      // Get all upcoming sessions from accepted bookings
      const now = new Date();
      const upcomingList: { session: Session; booking: Booking }[] = [];

      bookings.forEach(booking => {
        if (booking.sessions) {
          booking.sessions.forEach(session => {
            // Count completed sessions
            if (session.status === 'COMPLETED') {
              completedSessions++;
            }
            // Count active/scheduled sessions
            if (session.status === 'SCHEDULED' && session.scheduledAt) {
              const sessionDate = new Date(session.scheduledAt);
              if (sessionDate >= now) {
                activeSessions++;
                // Only add accepted bookings to upcoming list
                if ((booking.status === 'PAID' || booking.status === 'SCHEDULED') && booking.therapistAcceptedAt) {
                  upcomingList.push({ session, booking });
                }
              }
            }
          });
        }
      });

      // Sort by date
      upcomingList.sort((a, b) =>
        new Date(a.session.scheduledAt!).getTime() - new Date(b.session.scheduledAt!).getTime()
      );

      // Update stats
      setPatientStats({ activeSessions, completedSessions, totalBookings });
      // Take only next 5 sessions
      setPatientSessions(upcomingList.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch patient sessions:', error);
    } finally {
      setIsPatientLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    if (activeRole === 'PATIENT') {
      fetchPatientData();
    }
  }, [activeRole, fetchPatientData]);

  const onPatientRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPatientData();
    setRefreshing(false);
  }, [fetchPatientData]);

  if (activeRole === 'PATIENT') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#F0F4F8' }]} edges={[]}>
        <ScrollView
          contentContainerStyle={styles.scrollContentModern}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onPatientRefresh} colors={[colors.primary]} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Modern Gradient Header */}
          <GradientHeader
            title={user?.fullName || 'Pasien'}
            subtitle="Selamat datang,"
            userPhoto={user?.profilePhotoUrl}
            variant="patient"
          />

          {/* Content with negative margin to overlap header */}
          <View style={styles.contentOverlay}>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <StatCard
                title="Sesi Aktif"
                value={patientStats.activeSessions}
                icon="calendar"
                iconColor="#2196F3"
                iconBgColor="#E3F2FD"
                onPress={() => router.push('/(tabs)/bookings')}
              />
              <StatCard
                title="Selesai"
                value={patientStats.completedSessions}
                icon="checkmark-circle"
                iconColor="#4CAF50"
                iconBgColor="#E8F5E9"
                onPress={() => router.push('/(tabs)/bookings')}
              />
              <StatCard
                title="Total Booking"
                value={patientStats.totalBookings}
                icon="receipt"
                iconColor="#FF9800"
                iconBgColor="#FFF3E0"
                onPress={() => router.push('/(tabs)/bookings')}
              />
            </View>

            {/* Quick Actions */}
            <Text style={styles.sectionTitleModern}>Layanan</Text>
            <QuickActionCard
              title="Booking Fisioterapi"
              subtitle="Pesan terapis ke rumah Anda"
              icon="fitness"
              colors={['#2196F3', '#1976D2']}
              onPress={() => router.push('/(tabs)/booking')}
            />
            <QuickActionCard
              title="Terapis Terdekat"
              subtitle="Lihat fisioterapis di sekitar Anda"
              icon="location"
              colors={['#00BCD4', '#0097A7']}
              onPress={() => router.push('/(tabs)/booking')}
            />

            {/* Promo Banner */}
            <Text style={styles.sectionTitleModern}>Promo Spesial</Text>
            <PromoBannerCarousel />

            {/* Upcoming Sessions */}
            <Text style={styles.sectionTitleModern}>Sesi Mendatang</Text>
            {isPatientLoading ? (
              <Card style={styles.modernCard}>
                <View style={styles.loadingState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              </Card>
            ) : patientSessions.length === 0 ? (
              <Card style={styles.modernCard}>
                <View style={styles.emptyStateModern}>
                  <View style={styles.emptyIconContainer}>
                    <Ionicons name="calendar-outline" size={40} color="#9CA3AF" />
                  </View>
                  <Text style={styles.emptyTitleModern}>Belum Ada Sesi</Text>
                  <Text style={styles.emptySubtitleModern}>
                    Booking fisioterapis untuk memulai sesi pertama Anda
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyActionButton}
                    onPress={() => router.push('/(tabs)/booking')}
                  >
                    <Text style={styles.emptyActionText}>Booking Sekarang</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : (
              <View style={styles.sessionsList}>
                {patientSessions.map(({ session, booking }) => (
                  <TouchableOpacity
                    key={session.id}
                    style={styles.modernSessionCard}
                    onPress={() => router.push({ pathname: '/(tabs)/booking-detail', params: { bookingId: booking.id } })}
                    activeOpacity={0.7}
                  >
                    <LinearGradient
                      colors={['#E3F2FD', '#BBDEFB']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.sessionDateBadge}
                    >
                      <Text style={styles.sessionDateDay}>
                        {new Date(session.scheduledAt!).toLocaleDateString('id-ID', { day: 'numeric' })}
                      </Text>
                      <Text style={styles.sessionDateMonth}>
                        {new Date(session.scheduledAt!).toLocaleDateString('id-ID', { month: 'short' })}
                      </Text>
                    </LinearGradient>
                    <View style={styles.sessionInfoModern}>
                      <Text style={styles.sessionTherapistName}>
                        {booking.therapist?.user?.fullName || 'Terapis'}
                      </Text>
                      <Text style={styles.sessionPackageName}>
                        {booking.package?.name || 'Paket Fisioterapi'}
                      </Text>
                      <View style={styles.sessionTimeRow}>
                        <Ionicons name="time-outline" size={14} color="#6B7280" />
                        <Text style={styles.sessionTimeLabel}>
                          {new Date(session.scheduledAt!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Therapist Home (Inbox)
  if (activeRole === 'THERAPIST') {

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#F0F4F8' }]} edges={[]}>
        <ScrollView
          contentContainerStyle={styles.scrollContentModern}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Modern Gradient Header for Therapist */}
          <GradientHeader
            title={user?.fullName || 'Terapis'}
            subtitle="Selamat datang,"
            userPhoto={user?.profilePhotoUrl}
            variant="therapist"
          />

          {/* Content Overlay */}
          <View style={styles.contentOverlay}>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <StatCard
                title="Menunggu"
                value={therapistStats.pending}
                icon="mail"
                iconColor="#F44336"
                iconBgColor="#FFEBEE"
              />
              <StatCard
                title="Hari Ini"
                value={therapistStats.todaySessions}
                icon="today"
                iconColor="#00BCD4"
                iconBgColor="#E0F7FA"
              />
              <StatCard
                title="Selesai"
                value={therapistStats.completedSessions}
                icon="checkmark-done"
                iconColor="#4CAF50"
                iconBgColor="#E8F5E9"
              />
            </View>

            {/* Pending Bookings */}
            <View style={styles.sectionHeaderModern}>
              <Text style={styles.sectionTitleModern}>Menunggu Respon</Text>
              {pendingBookings.length > 0 && (
                <View style={styles.countBadgeModern}>
                  <Text style={styles.countBadgeTextModern}>{pendingBookings.length}</Text>
                </View>
              )}
            </View>

            {isLoadingData && pendingBookings.length === 0 ? (
              <Card style={styles.modernCard}>
                <View style={styles.loadingState}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Memuat data...
                  </Text>
                </View>
              </Card>
            ) : pendingBookings.length === 0 ? (
              <Card style={styles.modernCard}>
                <View style={styles.emptyStateModern}>
                  <View style={[styles.emptyIconContainer, { backgroundColor: '#E3F2FD' }]}>
                    <Ionicons name="mail-outline" size={40} color="#2196F3" />
                  </View>
                  <Text style={styles.emptyTitleModern}>Tidak Ada Booking Baru</Text>
                  <Text style={styles.emptySubtitleModern}>
                    Booking baru dari pasien akan muncul di sini
                  </Text>
                </View>
              </Card>
            ) : (
              pendingBookings.map(booking => (
                <InboxBookingCard
                  key={booking.id}
                  booking={booking}
                  onAccept={() => handleAccept(booking, booking.therapist?.id || '')}
                  onDecline={() => handleDecline(booking, booking.therapist?.id || '')}
                  isLoading={loadingBookingId === booking.id}
                />
              ))
            )}

            {/* Today's Schedule */}
            <Text style={[styles.sectionTitleModern, { marginTop: Spacing.lg }]}>Jadwal Hari Ini</Text>
            {todaySessions.length === 0 ? (
              <Card style={styles.modernCard}>
                <View style={styles.emptyStateModern}>
                  <View style={[styles.emptyIconContainer, { backgroundColor: '#E0F7FA' }]}>
                    <Ionicons name="today-outline" size={40} color="#00BCD4" />
                  </View>
                  <Text style={styles.emptyTitleModern}>Tidak Ada Sesi Hari Ini</Text>
                  <Text style={styles.emptySubtitleModern}>
                    Nikmati harimu! Sesi selanjutnya akan tampil di sini
                  </Text>
                </View>
              </Card>
            ) : (
              <View style={styles.sessionsList}>
                {todaySessions.map(({ session, booking }) => (
                  <TodaySessionCard
                    key={session.id}
                    session={session}
                    booking={booking}
                  />
                ))}
              </View>
            )}
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
    overflow: 'hidden',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
  },
  countBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  countBadgeText: {
    color: '#fff',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    marginTop: Spacing.sm,
    fontSize: Typography.fontSize.sm,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
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
  // Inbox Booking Card Styles
  bookingCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.semibold,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  timerText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  patientEmail: {
    fontSize: Typography.fontSize.xs,
  },
  infoRow: {
    flexDirection: 'column',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: Spacing.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  infoText: {
    fontSize: Typography.fontSize.sm,
    flex: 1,
  },
  mapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  mapsButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  priceLabel: {
    fontSize: Typography.fontSize.sm,
  },
  priceValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  declineButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  // Today's Sessions Styles
  sessionsList: {
    gap: Spacing.sm,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sessionTime: {
    marginRight: Spacing.md,
  },
  sessionTimeText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  sessionHourText: {
    fontSize: Typography.fontSize.xs,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionPatient: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  sessionAddress: {
    fontSize: Typography.fontSize.sm,
  },
  // Modern Patient Dashboard Styles
  scrollContentModern: {
    paddingBottom: Spacing.xl * 2,
  },
  contentOverlay: {
    marginTop: -Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    marginHorizontal: -Spacing.xs,
  },
  sectionTitleModern: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: '#1F2937',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  modernCard: {
    borderRadius: BorderRadius.xl,
    ...Shadow.md,
  },
  emptyStateModern: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitleModern: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: '#374151',
    marginBottom: Spacing.xs,
  },
  emptySubtitleModern: {
    fontSize: Typography.fontSize.sm,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyActionButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  emptyActionText: {
    color: '#fff',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
  modernSessionCard: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.sm,
  },
  sessionDateBadge: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  sessionDateDay: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: '#1976D2',
  },
  sessionDateMonth: {
    fontSize: Typography.fontSize.xs,
    color: '#1976D2',
    textTransform: 'uppercase',
  },
  sessionInfoModern: {
    flex: 1,
  },
  sessionTherapistName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: '#1F2937',
    marginBottom: 2,
  },
  sessionPackageName: {
    fontSize: Typography.fontSize.sm,
    color: '#6B7280',
    marginBottom: 4,
  },
  sessionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionTimeLabel: {
    fontSize: Typography.fontSize.xs,
    color: '#6B7280',
    marginLeft: 4,
  },
  // Therapist Dashboard Additional Styles
  sectionHeaderModern: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  countBadgeModern: {
    backgroundColor: '#F44336',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  countBadgeTextModern: {
    color: '#fff',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
});
