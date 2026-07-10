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
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { typography } from '../../utils/typography';
import { colors } from '../../utils/colors';
import { useAuth } from '../../hooks/useAuth';
import { wp, hp, fs, STATUS_BAR_HEIGHT } from '../../utils/responsive';

const HomeScreen = ({ navigation }) => {
  const { userProfile, user } = useAuth();

  const userName = userProfile?.fullName || user?.displayName || userProfile?.userName || 'Jessica';
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
            <Feather name="bell" size={fs(22)} color="#212121" />
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
            <TouchableOpacity
              style={styles.scanCard}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('ScanTab')}
            >
              <View style={styles.scanCardImageBox}>
                <Image
                  source={require('../../assets/images/veg_fruits.png')}
                  style={styles.scanCardImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.scanCardTitle}>Veg / Fruits</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scanCard}
              activeOpacity={0.8}
              onPress={() => navigation?.navigate('ScanTab')}
            >
              <View style={styles.scanCardImageBox}>
                <Image
                  source={require('../../assets/images/packed_food.png')}
                  style={styles.scanCardImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.scanCardTitle}>Packed Food</Text>
            </TouchableOpacity>
          </View>

          {/* Health Level Card */}
          <View style={styles.healthCard}>
            <View style={styles.healthCardHeader}>
              <Text style={styles.healthCardTitle}>Health Level</Text>
              <View style={styles.optimalBadge}>
                <Text style={styles.optimalBadgeText}>80% Optimal</Text>
              </View>
            </View>
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: '80%' }]} />
            </View>
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
    paddingHorizontal: wp(5),
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + hp(1) : hp(1),
    paddingBottom: hp(1.5),
  },
  logoContainer: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
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
    width: wp(6),
    height: wp(6),
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(22),
    color: '#009933',
  },
  notificationButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(12),
  },
  greetingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(6),
    padding: wp(4),
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    width: wp(17),
    height: wp(17),
    borderRadius: wp(8.5),
    backgroundColor: '#D2F0DA',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: wp(4),
    borderWidth: 2,
    borderColor: '#A8E3B9',
  },
  avatarImage: {
    width: wp(21),
    height: wp(21),
    marginTop: hp(1),
  },
  greetingTextContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(22),
    color: '#1A1A1A',
    marginBottom: hp(0.3),
  },
  greetingSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: fs(14),
    color: '#555555',
  },
  scanCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(3.5),
    marginBottom: hp(2),
  },
  scanCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: wp(6),
    padding: wp(3.5),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  scanCardImageBox: {
    width: '100%',
    height: hp(14),
    backgroundColor: '#F7F9F7',
    borderRadius: wp(4),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(1.2),
    overflow: 'hidden',
  },
  scanCardImage: {
    width: wp(22),
    height: wp(22),
  },
  scanCardTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(16),
    color: '#1A1A1A',
  },
  healthCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(6),
    padding: wp(5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: hp(2),
  },
  healthCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(1.8),
  },
  healthCardTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(18),
    color: '#1A1A1A',
  },
  optimalBadge: {
    backgroundColor: '#E2F6E8',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.7),
    borderRadius: wp(3.5),
  },
  optimalBadgeText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: fs(12),
    color: '#198754',
  },
  progressBarTrack: {
    height: hp(2.8),
    backgroundColor: '#E2EFE3',
    borderRadius: wp(3),
    overflow: 'hidden',
    marginBottom: hp(1.2),
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2ECC71',
    borderRadius: wp(3),
  },
  healthCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(11),
    color: '#666666',
    letterSpacing: 0.5,
  },
});

export default HomeScreen;