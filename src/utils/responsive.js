import { Dimensions, StatusBar, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Responsive helpers based on percentage of screen dimensions
// Works across all Android/iOS screen sizes

export const wp = (percentage) => (percentage / 100) * width;
export const hp = (percentage) => (percentage / 100) * height;

// Font scaling with a max cap to prevent oversized text on tablets
export const fs = (size) => {
    const scale = width / 400;
    return Math.round(size * Math.min(scale, 1.3));
};

// Screen dimensions for direct use
export const SCREEN_WIDTH = width;
export const SCREEN_HEIGHT = height;

// Safe status bar height
export const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 0;

// Tab bar height (matches MainNavigator)
export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 85 : 70;
