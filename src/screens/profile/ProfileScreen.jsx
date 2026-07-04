import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { typography } from '../../utils/typography';
import { useAuth } from '../../hooks/useAuth';

const ProfileScreen = ({ navigation }) => {
  const { userProfile, user, logout } = useAuth();

  const userName = userProfile?.fullName || user?.displayName || userProfile?.userName || 'User Profile';
  const userEmail = userProfile?.email || user?.email || 'email@example.com';
  const dietPreference = userProfile?.dietPreference || 'Not Specified';

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
            <Feather name="user" size={40} color="#009933" />
          </View>
          <Text style={styles.nameText}>{userName}</Text>
          <Text style={styles.emailText}>{userEmail}</Text>
          
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{dietPreference.toUpperCase()}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <Feather name="heart" size={20} color="#009933" style={styles.rowIcon} />
            <Text style={styles.rowText}>Medical Conditions & Allergies</Text>
            <Feather name="chevron-right" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <Feather name="users" size={20} color="#009933" style={styles.rowIcon} />
            <Text style={styles.rowText}>Family Members</Text>
            <Feather name="chevron-right" size={20} color="#999999" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
            <Feather name="shield" size={20} color="#009933" style={styles.rowIcon} />
            <Text style={styles.rowText}>Privacy & Security</Text>
            <Feather name="chevron-right" size={20} color="#999999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.logoutButton} 
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color="#E74C3C" style={{ marginRight: 8 }} />
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
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 24,
    color: '#009933',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D2F0DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#A8E3B9',
  },
  nameText: {
    fontFamily: typography.fonts.bold,
    fontSize: 22,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  emailText: {
    fontFamily: typography.fonts.regular,
    fontSize: 14,
    color: '#666666',
    marginBottom: 16,
  },
  badgeContainer: {
    backgroundColor: '#E2F6E8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 12,
    color: '#198754',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 18,
    color: '#1A1A1A',
    marginBottom: 16,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  rowIcon: {
    marginRight: 16,
  },
  rowText: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: 15,
    color: '#333333',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FCEBEA',
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E74C3C',
  },
  logoutText: {
    fontFamily: typography.fonts.bold,
    fontSize: 16,
    color: '#E74C3C',
  },
});

export default ProfileScreen;