import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  StatusBar
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';

const HomeScreen = ({ navigation }) => {
  const { userProfile, user } = useAuth();

  // Get user name from profile or auth object, fallback to 'Jessica' for mockup presentation
  const userName = userProfile?.fullName || user?.displayName || userProfile?.userName || 'Jessica';

  // Extract first name for greeting
  const firstName = userName.split(' ')[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF5EE" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.headerTitle}>NutriLens</Text>
          <TouchableOpacity style={styles.notificationButton} activeOpacity={0.7}>
            <Feather name="bell" size={24} color="#212121" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* User Greeting Card */}
          <View style={styles.greetingCard}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../../assets/images/prof.png')}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            </View>
            <View style={styles.greetingTextContainer}>
              <Text style={styles.greetingTitle}>Hi, {firstName}!</Text>
              <Text style={styles.greetingSubtitle}>Track your nutrition today!</Text>
            </View>
          </View>

          {/* Scan Mode Cards */}
          <View style={styles.scanCardsRow}>
            {/* Veg / Fruits Card */}
            <TouchableOpacity
              style={styles.scanCard}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('Scan')}
            >
              <View style={styles.scanCardImageBox}>
                <Image
                  source={require('../../assets/images/vegi.png')}
                  style={styles.scanCardImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.scanCardTitle}>Veg / Fruits</Text>
            </TouchableOpacity>

            {/* Packed Food Card */}
            <TouchableOpacity
              style={styles.scanCard}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('Scan')}
            >
              <View style={styles.scanCardImageBox}>
                <Image
                  source={require('../../assets/images/pack.png')}
                  style={[styles.scanCardImage, { width: 85, height: 70 }]}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.scanCardTitle}>Packed Food</Text>
            </TouchableOpacity>
          </View>

          {/* Health Level Indicator Card */}
          <View style={styles.healthCard}>
            <View style={styles.healthCardHeader}>
              <Text style={styles.healthCardTitle}>Health Level</Text>
              <View style={styles.optimalBadge}>
                <Text style={styles.optimalBadgeText}>80% Optimal</Text>
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '80%' }]} />
            </View>

            {/* Labels */}
            <View style={styles.healthCardFooter}>
              <Text style={styles.footerLabel}>IMPROVING</Text>
              <Text style={styles.footerLabel}>DAILY GOAL</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF5EE',
  },
  container: {
    flex: 1,
    backgroundColor: '#EEF5EE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 15 : 10,
    paddingBottom: 15,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  logoIcon: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 22,
    color: '#009933',
  },
  notificationButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  greetingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#D2F0DA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#A8E3B9',
  },
  avatarImage: {
    width: 95,
    height: 95,
    marginTop: 10,
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 24,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  greetingSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 15,
    color: '#555555',
  },
  scanCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 20,
  },
  scanCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  scanCardImageBox: {
    width: '100%',
    height: 110,
    backgroundColor: '#F7F9F7',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  scanCardImage: {
    width: 80,
    height: 80,
  },
  scanCardTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 18,
    color: '#1A1A1A',
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  healthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  healthCardTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 20,
    color: '#1A1A1A',
  },
  optimalBadge: {
    backgroundColor: '#E2F6E8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  optimalBadgeText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 13,
    color: '#198754',
  },
  progressBarTrack: {
    height: 24,
    backgroundColor: '#E2EFE3',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: 12,
  },
  healthCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontFamily: typography.fonts.bold,
    fontSize: 11,
    color: '#666666',
    letterSpacing: 0.5,
  },
});

export default HomeScreen;