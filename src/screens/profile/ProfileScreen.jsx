import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { typography } from '../../utils/typography';
import { useAuth } from '../../hooks/useAuth';
import { wp, hp, fs, STATUS_BAR_HEIGHT } from '../../utils/responsive';

const ProfileScreen = ({ navigation }) => {
  const { userProfile, user, logout, activeProfile } = useAuth();

  const profileToUse = activeProfile || userProfile;

  const userName = profileToUse?.fullName || profileToUse?.userName || user?.displayName || 'User Profile';
  const userEmail = profileToUse?.email || user?.email || (activeProfile ? 'Family Member' : 'email@example.com');
  const dietPreference = profileToUse?.dietPreference || 'Not Specified';

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Profile</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={fs(36)} color="#009933" />
          </View>
          <Text style={styles.nameText}>{userName}</Text>
          <Text style={styles.emailText}>{userEmail}</Text>

          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{dietPreference.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Settings</Text>

          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7} onPress={() => navigation.navigate('MedicalConditions')}>
            <Feather name="heart" size={fs(18)} color="#009933" style={styles.rowIcon} />
            <Text style={styles.rowText}>Medical Conditions & Allergies</Text>
            <Feather name="chevron-right" size={fs(18)} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7} onPress={() => navigation.navigate('FamilyMembers')}>
            <Feather name="users" size={fs(18)} color="#009933" style={styles.rowIcon} />
            <Text style={styles.rowText}>Family Members</Text>
            <Feather name="chevron-right" size={fs(18)} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <Feather name="shield" size={fs(18)} color="#009933" style={styles.rowIcon} />
            <Text style={styles.rowText}>Privacy & Security</Text>
            <Feather name="chevron-right" size={fs(18)} color="#999999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={fs(18)} color="#E74C3C" style={{ marginRight: wp(2) }} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EEF5EE',
  },
  container: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(12),
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT : 0,
  },
  header: {
    paddingVertical: hp(2.5),
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(22),
    color: '#009933',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(6),
    padding: wp(6),
    alignItems: 'center',
    marginBottom: hp(2.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: '#D2F0DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
    borderWidth: 2,
    borderColor: '#A8E3B9',
  },
  nameText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(20),
    color: '#1A1A1A',
    marginBottom: hp(0.5),
  },
  emailText: {
    fontFamily: typography.fonts.regular,
    fontSize: fs(13),
    color: '#666666',
    marginBottom: hp(2),
  },
  badgeContainer: {
    backgroundColor: '#E2F6E8',
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.7),
    borderRadius: wp(4),
  },
  badgeText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: fs(11),
    color: '#198754',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(6),
    padding: wp(5),
    marginBottom: hp(2.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(16),
    color: '#1A1A1A',
    marginBottom: hp(2),
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: hp(1.7),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowIcon: {
    marginRight: wp(4),
  },
  rowText: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: fs(14),
    color: '#333333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCEBEA',
    paddingVertical: hp(2),
    borderRadius: wp(6),
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  logoutText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(15),
    color: '#E74C3C',
  },
});

export default ProfileScreen;