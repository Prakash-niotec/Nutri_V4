import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { typography } from '../../utils/typography';
import { wp, hp, fs, STATUS_BAR_HEIGHT } from '../../utils/responsive';

const TermsAndConditionsScreen = ({ navigation }) => {
  const [agreed, setAgreed] = useState(false);

  const terms = [
    {
      id: 1,
      title: '1.Acceptance of Terms',
      description: 'By using the NutriLens application,you agree to follow these terms and conditions',
      icon: 'document-outline',
      iconColor: '#2ecc71',
    },
    {
      id: 2,
      title: '2. Health Information',
      description: 'NutriLens provides nutrition guidance based on user inputs.',
      icon: 'heart',
      iconColor: '#e74c3c',
    },
    {
      id: 3,
      title: '3.User Responsibility',
      description: 'Users must provide accurate dietary and health information.',
      icon: 'person',
      iconColor: '#2ecc71',
    },
    {
      id: 4,
      title: '4.Privacy',
      description: 'Personal data will be used to provide recommensations.',
      icon: 'key',
      iconColor: '#2ecc71',
    },
    {
      id: 5,
      title: '5.Updates',
      description: 'NutriLens may updates these terms when necessary.',
      icon: 'document-text',
      iconColor: '#2ecc71',
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={fs(26)} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NutriLens</Text>
          <View style={{ width: wp(7) }} />
        </View>

        <Text style={styles.pageTitle}>Terms & conditions</Text>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.card}>
            {terms.map((item) => (
              <View key={item.id} style={styles.termRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name={item.icon} size={fs(28)} color={item.iconColor} />
                </View>
                <View style={styles.textContainer}>
                  <Text style={styles.termTitle}>{item.title}</Text>
                  <Text style={styles.termDesc}>{item.description}</Text>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.checkboxContainer}
            activeOpacity={0.8}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <Ionicons name="checkmark" size={fs(16)} color="#000" />}
            </View>
            <Text style={styles.checkboxText}>I agree to the Terms & Conditions</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomSection}>
          <TouchableOpacity
            style={[styles.acceptButton, !agreed && styles.acceptButtonDisabled]}
            disabled={!agreed}
            onPress={() => navigation.navigate('SignUpScreen')}
          >
            <Text style={styles.acceptButtonText}>Accept & Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#EBF4EC',
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: hp(1.8),
  },
  backButton: {
    padding: wp(1),
    marginLeft: -wp(1),
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(20),
    color: '#2ecc71',
  },
  pageTitle: {
    fontFamily: typography.fonts.extraBold,
    fontSize: fs(22),
    color: '#000',
    marginTop: hp(1.5),
    marginBottom: hp(2.5),
  },
  scrollContent: {
    paddingBottom: hp(2),
  },
  card: {
    backgroundColor: '#E6EFE6',
    borderRadius: wp(4),
    padding: wp(5),
    marginBottom: hp(3),
  },
  termRow: {
    flexDirection: 'row',
    marginBottom: hp(2.5),
  },
  iconContainer: {
    width: wp(11),
    alignItems: 'flex-start',
    marginRight: wp(2),
  },
  textContainer: {
    flex: 1,
  },
  termTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(15),
    color: '#000',
    marginBottom: hp(0.7),
  },
  termDesc: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(13),
    color: '#000',
    lineHeight: fs(13) * 1.5,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: hp(1),
    paddingHorizontal: wp(1),
  },
  checkbox: {
    width: wp(6),
    height: wp(6),
    borderWidth: 1.5,
    borderColor: '#000',
    backgroundColor: 'transparent',
    marginRight: wp(3),
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: 'transparent',
  },
  checkboxText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(15),
    color: '#000',
  },
  bottomSection: {
    paddingVertical: hp(2.5),
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#2ecc71',
    width: '100%',
    paddingVertical: hp(2),
    borderRadius: wp(7.5),
    alignItems: 'center',
    marginBottom: hp(2),
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(17),
    color: '#000',
  },
  declineButton: {
    paddingVertical: hp(1),
  },
  declineButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(15),
    color: '#e74c3c',
  },
});

export default TermsAndConditionsScreen;