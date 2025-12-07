/**
 * Fisioku Design System - Colors
 * Healthcare Professional Theme with Light Blue dominant
 */

// Primary Colors - Light Blue Healthcare
const primary = {
  50: '#E3F2FD',
  100: '#BBDEFB',
  200: '#90CAF9',
  300: '#64B5F6',
  400: '#42A5F5',
  500: '#2196F3', // Main primary
  600: '#1E88E5',
  700: '#1976D2',
  800: '#1565C0',
  900: '#0D47A1',
};

// Neutral Colors
const neutral = {
  50: '#FAFAFA',
  100: '#F5F5F5',
  200: '#EEEEEE',
  300: '#E0E0E0',
  400: '#BDBDBD',
  500: '#9E9E9E',
  600: '#757575',
  700: '#616161',
  800: '#424242',
  900: '#212121',
};

// Status Colors
const status = {
  success: '#4CAF50',
  successLight: '#E8F5E9',
  warning: '#FF9800',
  warningLight: '#FFF3E0',
  error: '#F44336',
  errorLight: '#FFEBEE',
  info: '#2196F3',
  infoLight: '#E3F2FD',
};

// Booking Status Colors
const bookingStatus = {
  pending: '#FF9800',
  paid: '#2196F3',
  completed: '#4CAF50',
  cancelled: '#F44336',
};

// Payment Status Colors
const paymentStatus = {
  pending: '#FF9800',
  paid: '#4CAF50',
  expired: '#9E9E9E',
  cancelled: '#F44336',
};

export const Colors = {
  // Light Theme (Primary)
  light: {
    // Base
    text: neutral[900],
    textSecondary: neutral[600],
    textMuted: neutral[500],
    background: '#FFFFFF',
    backgroundSecondary: neutral[50],

    // Primary
    primary: primary[500],
    primaryLight: primary[100],
    primaryDark: primary[700],

    // Components
    tint: primary[500],
    tabIconDefault: neutral[400],
    tabIconSelected: primary[500],
    border: neutral[200],
    borderLight: neutral[100],
    card: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.08)',

    // Input
    inputBackground: neutral[50],
    inputBorder: neutral[300],
    inputPlaceholder: neutral[400],

    // Status
    ...status,
    bookingStatus,
    paymentStatus,
  },

  // Dark Theme
  dark: {
    // Base
    text: '#FFFFFF',
    textSecondary: neutral[300],
    textMuted: neutral[400],
    background: neutral[900],
    backgroundSecondary: neutral[800],

    // Primary
    primary: primary[400],
    primaryLight: primary[900],
    primaryDark: primary[200],

    // Components
    tint: primary[400],
    tabIconDefault: neutral[600],
    tabIconSelected: primary[400],
    border: neutral[700],
    borderLight: neutral[800],
    card: neutral[800],
    cardShadow: 'rgba(0, 0, 0, 0.3)',

    // Input
    inputBackground: neutral[800],
    inputBorder: neutral[600],
    inputPlaceholder: neutral[500],

    // Status
    ...status,
    bookingStatus,
    paymentStatus,
  },
};

export default Colors;
