# Fisioku Mobile Frontend Documentation
## Complete Guide for Building React Native Mobile App

---

## 1. Project Overview

**Fisioku Prime Care** adalah aplikasi on-demand fisioterapi home-visit dengan dua peran utama:
- **Pasien (PATIENT)**: Memesan terapis untuk home visit
- **Terapis (THERAPIST)**: Menerima dan mengelola booking

### Tech Stack
- **Framework**: React Native dengan Expo
- **Routing**: Expo Router (file-based routing)
- **State Management**: Zustand
- **Storage**: AsyncStorage
- **Icons**: @expo/vector-icons (Ionicons)
- **Backend**: REST API (NestJS)

---

## 2. API Base Configuration

```typescript
// lib/api.ts
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.18.207:3000';

// Headers for all requests
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer <token>' // Untuk authenticated requests
}
```

---

## 3. Authentication System

### 3.1 Data Types

```typescript
type UserRole = 'PATIENT' | 'THERAPIST' | 'ADMIN';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isProfileComplete: boolean;
  fcmToken?: string | null;
  createdAt: string;
}

interface AuthResponse {
  accessToken: string;
  user: Partial<User>;
}
```

### 3.2 API Endpoints

#### Login
```
POST /auth/login
Body: { email: string, password: string }
Response: AuthResponse
```

#### Register  
```
POST /auth/register
Body: { 
  email: string, 
  password: string, 
  fullName: string, 
  role?: 'PATIENT' | 'THERAPIST' | 'ADMIN' 
}
Response: AuthResponse
```

#### Google OAuth
```
POST /auth/google
Body: { idToken: string }
Response: AuthResponse
```

### 3.3 Auth Store (Zustand)

```typescript
interface AuthState {
  user: Partial<User> | null;
  token: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  activeRole: UserRole | null;
  
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  setActiveRole: (role: UserRole) => void;
  updateUser: (user: Partial<User>) => void;
}
```

---

## 4. Therapist Management

### 4.1 Data Types

```typescript
type TherapistBidang =
  | 'Fisioterapi Muskuloskeletal'
  | 'Fisioterapi Neuromuskular'
  | 'Fisioterapi Kardiopulmoner'
  | 'Fisioterapi Pediatrik'
  | 'Fisioterapi Geriatrik'
  | 'Fisioterapi Olahraga';

interface Therapist {
  id: string;
  bidang?: TherapistBidang | string | null;
  address?: string | null;
  city?: string | null;
  experienceYears?: number;
  averageRating: string;
  totalReviews: number;
  photoUrl?: string | null;
  bio?: string | null;
  user?: {
    id: string;
    fullName: string;
  };
}
```

### 4.2 API Endpoints

```
GET /therapists
Response: Therapist[]

GET /therapists/:id
Response: Therapist
```

---

## 5. Package Management

### 5.1 Data Types

```typescript
interface Package {
  id: string;
  name: string;
  sessionCount: number;
  totalPrice: string;
}
```

### 5.2 API Endpoints

```
GET /packages
Response: Package[]

GET /packages/promos
Response: Package[] // Untuk promo carousel
```

---

## 6. Booking System

### 6.1 Data Types

```typescript
type BookingStatus = 'PENDING' | 'PAID' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';
type PaymentStatus = 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED' | 'FAILED';
type RefundStatus = 'NONE' | 'PENDING' | 'COMPLETED';
type BookingType = 'REGULAR' | 'INSTANT';

interface Booking {
  id: string;
  user: User;
  therapist: Therapist;
  package?: Package | null;
  lockedAddress: string;
  totalPrice: string;
  adminFeeAmount: string;
  therapistNetTotal: string;
  bookingType: BookingType;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentInstruction?: Record<string, unknown> | null;
  paymentExpiryTime?: string | null;
  refundStatus: RefundStatus;
  therapistRespondBy?: string | null;
  therapistAcceptedAt?: string | null;
  chatLockedAt?: string | null;
  isChatActive?: boolean;
  hasReviewed?: boolean;
  createdAt: string;
  sessions?: Session[];
  // Consent fields
  consentService?: boolean;
  consentDataSharing?: boolean;
  consentTerms?: boolean;
  consentMedicalDisclaimer?: boolean;
}

interface CreateBookingPayload {
  therapistId: string;
  packageId: string;
  address: string;
  scheduledAt: string; // ISO date string
  bookingType: BookingType;
  // Consent fields - all required
  consentService: boolean;
  consentDataSharing: boolean;
  consentTerms: boolean;
  consentMedicalDisclaimer: boolean;
}
```

### 6.2 API Endpoints

#### Create Booking (Patient)
```
POST /bookings
Headers: Authorization: Bearer <token>
Body: CreateBookingPayload
Response: Booking
```

#### Get My Bookings (Patient/Therapist)
```
GET /bookings/my
Headers: Authorization: Bearer <token>
Response: Booking[]
```

#### Get Booking Detail
```
GET /bookings/:id
Headers: Authorization: Bearer <token>
Response: Booking
```

#### Accept Booking (Therapist)
```
POST /bookings/accept
Headers: Authorization: Bearer <token>
Body: { bookingId: string, therapistId: string }
Response: Booking
```

#### Decline Booking (Therapist)
```
POST /bookings/decline
Headers: Authorization: Bearer <token>
Body: { bookingId: string, therapistId: string }
Response: Booking
```

---

## 7. Session Management

### 7.1 Data Types

```typescript
type SessionStatus =
  | 'PENDING_SCHEDULING'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'FORFEITED'
  | 'EXPIRED'
  | 'CANCELLED';

interface Session {
  id: string;
  bookingId: string;
  therapistId: string;
  sequenceOrder: number;
  scheduledAt?: string | null;
  status: SessionStatus;
  isPayoutDistributed: boolean;
}
```

### 7.2 API Endpoints

#### Get Busy Slots
```
GET /sessions/busy-slots/:therapistId?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
Headers: Authorization: Bearer <token>
Response: { busySlots: string[] } // Array of ISO datetime strings
```

#### Complete Session (Therapist)
```
POST /sessions/:id/complete
Headers: Authorization: Bearer <token>
Body: { notes?: string }
Response: Session
```

#### Cancel Session (Patient/Therapist)
```
POST /sessions/:id/cancel
Headers: Authorization: Bearer <token>
Response: Session
```

#### Schedule Pending Session (Patient/Admin)
```
POST /sessions/:id/schedule
Headers: Authorization: Bearer <token>
Body: { scheduledAt: string } // ISO date string
Response: Session
```

---

## 8. Payment System (Midtrans)

### 8.1 Data Types

```typescript
type PaymentChannel =
  | 'VA_BCA'
  | 'VA_BNI'
  | 'VA_BRI'
  | 'VA_MANDIRI'
  | 'VA_PERMATA'
  | 'QRIS'
  | 'GOPAY'
  | 'SHOPEEPAY';

interface PaymentInitiateResult {
  bookingId: string;
  orderId: string;
  channel: PaymentChannel;
  status: PaymentStatus;
  amount: string;
  instruction?: Record<string, unknown> | null;
  redirectUrl?: string | null;
  token?: string | null;
  expiryTime?: string | null;
}
```

### 8.2 API Endpoints

#### Initiate Payment (Patient)
```
POST /payment/initiate
Headers: Authorization: Bearer <token>
Body: { bookingId: string, channel: PaymentChannel }
Response: PaymentInitiateResult
```

**Note**: Payment status berubah otomatis via Midtrans webhook. Mobile app harus polling atau menggunakan push notification untuk update status.

---

## 9. Wallet System (Therapist)

### 9.1 Data Types

```typescript
interface Wallet {
  id: string;
  therapistId: string;
  balance: string;
}

interface WalletStats {
  monthIncome: string;
}

interface WalletTransaction {
  id: string;
  walletId: string;
  amount: string;
  type: 'CREDIT' | 'DEBIT';
  category: 'SESSION_FEE' | 'FORFEIT_COMPENSATION' | 'WITHDRAWAL' | 'TOPUP' | 'ADJUSTMENT';
  adminNote?: string | null;
  createdAt: string;
}
```

### 9.2 API Endpoints

#### Get My Wallet (Therapist)
```
GET /wallets/my
Headers: Authorization: Bearer <token>
Response: Wallet
```

#### Get Transactions
```
GET /wallets/:id/transactions?page=1&limit=20
Headers: Authorization: Bearer <token>
Response: { data: WalletTransaction[], page: number, limit: number, total: number }
```

#### Get Monthly Stats
```
GET /wallets/:id/stats/monthly
Headers: Authorization: Bearer <token>
Response: WalletStats
```

---

## 10. Review System

### 10.1 Data Types

```typescript
interface Review {
  id: string;
  bookingId: string;
  therapistId: string;
  rating: number; // 1-5
  createdAt: string;
}
```

### 10.2 API Endpoints

#### Submit Review (Patient)
```
POST /reviews
Headers: Authorization: Bearer <token>
Body: { bookingId: string, therapistId: string, rating: number, comment?: string }
Response: Review
```

---

## 11. Screen Architecture

### 11.1 App Structure (Expo Router)

```
app/
├── _layout.tsx              # Root layout with auth redirect
├── +html.tsx                # HTML customization
├── +not-found.tsx           # 404 page
├── modal.tsx                # Modal screen
├── onboarding.tsx           # Onboarding flow
├── profile-edit.tsx         # Profile edit screen
├── review.tsx               # Review submission screen
├── session-complete.tsx     # Session completion screen
├── chat/
│   └── [bookingId].tsx      # Chat screen
├── (auth)/
│   ├── _layout.tsx          # Auth layout
│   ├── login.tsx            # Login screen
│   ├── register.tsx         # Register screen
│   └── role-select.tsx      # Role selection (if user has multiple)
└── (tabs)/
    ├── _layout.tsx          # Tab layout
    ├── index.tsx            # Home (Patient: Dashboard, Therapist: Inbox)
    ├── bookings.tsx         # Bookings list
    ├── booking-detail.tsx   # Booking detail
    ├── profile.tsx          # Profile screen
    ├── wallet.tsx           # Wallet screen (Therapist only)
    └── booking/
        ├── _layout.tsx      # Booking flow layout
        ├── index.tsx        # Step 1: Select therapist
        ├── step2-package.tsx # Step 2: Select package
        ├── step3-schedule.tsx # Step 3: Select date/time
        ├── step3b-consent.tsx # Step 3b: Consent form
        ├── step4-payment.tsx  # Step 4: Payment
        └── step5-success.tsx  # Step 5: Success
```

### 11.2 Patient Screens

| Screen | Deskripsi |
|--------|-----------|
| Home Dashboard | Promo carousel, quick booking CTA, sesi mendatang |
| Therapist Selection | List terapis dengan rating dan bidang keahlian |
| Package Selection | Pilih paket (1 sesi / 4 sesi) |
| Schedule Selection | Kalender + time slot picker (90 menit, :00/:30) |
| Consent Form | Persetujuan layanan, data sharing, terms, medical disclaimer |
| Payment | Pilih channel pembayaran + instruksi VA/QRIS/e-wallet |
| Booking Success | Konfirmasi booking berhasil |
| My Bookings | List booking dengan status |
| Booking Detail | Detail booking + sesi + opsi review |

### 11.3 Therapist Screens

| Screen | Deskripsi |
|--------|-----------|
| Inbox | Booking menunggu respon dengan SLA timer + jadwal hari ini |
| My Schedule | Daftar sesi yang sudah diterima |
| Booking Detail | Detail pasien + alamat + aksi complete session |
| Wallet | Saldo, pendapatan bulanan, riwayat transaksi |
| Session Complete | Form completion dengan notes |

---

## 12. UI Component Library

### 12.1 Available Components

```typescript
// components/ui/index.ts exports:
export { Button } from './Button';
export { Input } from './Input';
export { Card } from './Card';
// ... other components
```

### 12.2 Button Component

```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

// Usage
<Button 
  title="Booking Sekarang" 
  onPress={() => router.push('/(tabs)/booking')} 
  fullWidth 
/>
```

### 12.3 Input Component

```typescript
interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  secureTextEntry?: boolean;
  leftIcon?: string; // Ionicons name
  error?: string;
}

// Usage
<Input
  label="Email"
  placeholder="nama@email.com"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  autoCapitalize="none"
  leftIcon="mail-outline"
/>
```

---

## 13. Design Tokens

### 13.1 Colors

```typescript
// constants/Colors.ts
export const Colors = {
  light: {
    primary: '#2563EB',       // Blue
    primaryLight: '#EFF6FF',
    secondary: '#10B981',     // Green
    success: '#22C55E',
    successLight: '#DCFCE7',
    warning: '#F59E0B',
    warningLight: '#FEF3C7',
    error: '#EF4444',
    errorLight: '#FEE2E2',
    info: '#3B82F6',
    infoLight: '#DBEAFE',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    border: '#E2E8F0',
  }
};
```

### 13.2 Typography

```typescript
// constants/Theme.ts
export const Typography = {
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
```

### 13.3 Spacing

```typescript
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
};
```

### 13.4 Border Radius

```typescript
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
```

---

## 14. Business Rules (Critical)

### 14.1 Slot System
- Durasi sesi: **90 menit** (60 terapi + 30 travel)
- Slot tersedia pada menit **:00** atau **:30** (08:00, 09:30, 11:00, dst.)
- **Instant booking**: Lead time > 1 jam dari sekarang
- Gunakan `GET /sessions/busy-slots` untuk cek slot yang sudah terpakai

### 14.2 Acceptance SLA
- **INSTANT**: Terapis harus respon dalam **5 menit**
- **REGULAR**: Terapis harus respon dalam **30 menit**
- Timer ditampilkan dengan countdown di inbox terapis
- Auto-cancel + refund jika timeout

### 14.3 Cancellation Rules
- Cancel **> 1 jam** sebelum sesi: Kuota kembali ke pasien
- Cancel **< 1 jam** atau no-show: Status `FORFEITED`, terapis tetap dapat payout

### 14.4 Payment Flow
1. Patient buat booking → status `PENDING`
2. Patient initiate payment → dapat instruksi VA/QRIS
3. Payment via Midtrans webhook → status jadi `PAID`
4. SLA timer mulai, terapis harus accept/decline
5. Accept → status `SCHEDULED`, chat dibuka

---

## 15. Error Handling

### 15.1 HTTP Status Codes

| Code | Handling |
|------|----------|
| 401 | Token expired → logout + redirect ke login |
| 403 | No access → tampilkan error message |
| 429 | Rate limit → "Terlalu banyak permintaan, coba lagi nanti" |
| 5xx | Server error → "Gagal terhubung ke server" |

### 15.2 API Error Response

```typescript
interface ApiError {
  message: string;
  statusCode: number;
}

// Usage in catch block
catch (error: any) {
  Alert.alert('Error', error.message || 'Terjadi kesalahan');
}
```

---

## 16. Environment Variables

```bash
# .env
EXPO_PUBLIC_API_URL=http://192.168.18.207:3000

# Google OAuth (untuk login)
# Configured in app code, but you need:
# - GOOGLE_WEB_CLIENT_ID
# - GOOGLE_ANDROID_CLIENT_ID
# - GOOGLE_IOS_CLIENT_ID (optional)
```

---

## 17. Dependencies (package.json)

```json
{
  "dependencies": {
    "expo": "~52.0.x",
    "expo-router": "~4.0.x",
    "react-native": "0.76.x",
    "react-native-safe-area-context": "^4.x",
    "@expo/vector-icons": "^14.x",
    "zustand": "^5.x",
    "@react-native-async-storage/async-storage": "^2.x",
    "expo-auth-session": "~6.x",
    "expo-web-browser": "~14.x"
  }
}
```

---

## 18. Sample Implementations

### 18.1 Fetching Bookings

```typescript
const fetchBookings = async () => {
  try {
    const bookings = await api.get<Booking[]>('/bookings/my');
    setBookings(bookings);
  } catch (error: any) {
    Alert.alert('Error', error.message);
  }
};
```

### 18.2 Creating Booking

```typescript
const createBooking = async () => {
  const payload: CreateBookingPayload = {
    therapistId: selectedTherapist.id,
    packageId: selectedPackage.id,
    address: addressInput,
    scheduledAt: selectedSlot.toISOString(),
    bookingType: isInstant ? 'INSTANT' : 'REGULAR',
    consentService: true,
    consentDataSharing: true,
    consentTerms: true,
    consentMedicalDisclaimer: true,
  };
  
  const booking = await api.post<Booking>('/bookings', payload);
  router.push({
    pathname: '/(tabs)/booking/step4-payment',
    params: { bookingId: booking.id }
  });
};
```

### 18.3 Initiating Payment

```typescript
const initiatePayment = async (bookingId: string, channel: PaymentChannel) => {
  const result = await api.post<PaymentInitiateResult>('/payment/initiate', {
    bookingId,
    channel,
  });
  
  // Display payment instructions based on channel
  if (channel.startsWith('VA_')) {
    // Show VA number from result.instruction
  } else if (channel === 'QRIS') {
    // Show QR code
  } else if (channel === 'GOPAY' || channel === 'SHOPEEPAY') {
    // Open redirectUrl or deep link
  }
};
```

---

## 19. Testing Credentials

```
Patient: patient@example.com / patient123
Therapist: therapist@example.com / therapist123
Admin: admin@example.com / admin123
```

---

## 20. Quick Reference Cards

### Patient Flow
```
Login → Home → Select Therapist → Select Package → Select Schedule → Consent → Payment → Success
```

### Therapist Flow
```
Login → Inbox (Accept/Decline) → My Schedule → Complete Session → View Wallet
```

### API Reference Quick List
| Feature | Endpoint | Method |
|---------|----------|--------|
| Login | /auth/login | POST |
| Register | /auth/register | POST |
| Google Auth | /auth/google | POST |
| List Therapists | /therapists | GET |
| List Packages | /packages | GET |
| Create Booking | /bookings | POST |
| My Bookings | /bookings/my | GET |
| Accept Booking | /bookings/accept | POST |
| Decline Booking | /bookings/decline | POST |
| Initiate Payment | /payment/initiate | POST |
| Complete Session | /sessions/:id/complete | POST |
| Busy Slots | /sessions/busy-slots/:therapistId | GET |
| My Wallet | /wallets/my | GET |
| Submit Review | /reviews | POST |
