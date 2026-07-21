import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { typography } from '../../utils/typography';
import { updateUserProfile } from '../../services/firebase/userService';
import { useAuth } from '../../hooks/useAuth';
import { wp, hp, fs, STATUS_BAR_HEIGHT } from '../../utils/responsive';

const DietPreferenceScreen = ({ navigation, route }) => {
  const { userId, userName, email } = route?.params || {};
  const { userProfile, setUserProfile } = useAuth();
  const [selectedDiet, setSelectedDiet] = useState(null);
  const [loading, setLoading] = useState(false);

  const dietOptions = [
    {
      id: 'non-vegetarian',
      title: 'Non-vegetarian',
      description: 'Eat meat,fish,and eggs',
      image: require('../../assets/images/non-veg.png'),
    },
    {
      id: 'vegetarian',
      title: 'vegetarian',
      description: 'plant-based foods+Dairy',
      image: require('../../assets/images/veg.png'),
    },
    {
      id: 'vegan',
      title: 'Vegan',
      description: 'Only plant-based foods',
      image: require('../../assets/images/vegan.png'),
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backButton}>
            <Feather name="chevron-left" size={fs(28)} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NutriLens</Text>
          <View style={{ width: wp(8) }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Titles */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Select Your Diet Preference</Text>
            <Text style={styles.subtitle}>
              Choose the diet type that best describes your eating habits.
            </Text>
          </View>

          {/* Diet Cards */}
          <View style={styles.cardsRow}>
            {dietOptions.map((diet) => {
              const isSelected = selectedDiet === diet.id;
              return (
                <TouchableOpacity
                  key={diet.id}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDiet(diet.id)}
                >
                  <View style={styles.imagePlaceholder}>
                    <Image source={diet.image} style={styles.dietImage} resizeMode="contain" />
                  </View>

                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{diet.title}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.cardDescription}>{diet.description}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.selectButton, isSelected && styles.selectButtonActive]}
                    onPress={() => setSelectedDiet(diet.id)}
                  >
                    <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextActive]}>
                      {isSelected ? 'Selected' : 'Select'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom Next Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.nextButton, (!selectedDiet || loading) && styles.nextButtonDisabled]}
            activeOpacity={0.8}
            disabled={!selectedDiet || loading}
            onPress={async () => {
              setLoading(true);
              try {
                if (userId) {
                  const updates = {
                    dietPreference: selectedDiet,
                    updatedAt: new Date().toISOString()
                  };
                  await updateUserProfile(userId, updates);
                  setUserProfile({ ...userProfile, ...updates });
                }
              } catch (error) {
                console.error('Error saving diet preference:', error);
              } finally {
                setLoading(false);
                navigation.navigate('MedicalConditionScreen', {
                  userId,
                  userName,
                  email,
                  dietPreference: selectedDiet
                });
              }
            }}
          >
            {loading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text style={styles.nextButtonText}>Next</Text>
            )}
          </TouchableOpacity>
        </View>
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
  },
  scrollContent: {
    paddingHorizontal: wp(5),
    paddingBottom: hp(4),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    marginTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + hp(1) : hp(1),
    marginBottom: hp(3),
  },
  backButton: {
    padding: wp(1),
    marginLeft: -wp(2.5),
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(20),
    color: '#2ECC71',
    letterSpacing: 0.5,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: hp(4),
    paddingHorizontal: wp(2),
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(22),
    color: '#000000',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  subtitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: fs(14),
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: fs(14) * 1.5,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: wp(2.5),
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: wp(3),
    borderWidth: 1,
    borderColor: '#212121',
    padding: wp(2),
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: hp(28),
  },
  cardSelected: {
    borderColor: '#2ECC71',
    borderWidth: 2,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  imagePlaceholder: {
    width: wp(17),
    height: wp(17),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1),
    marginBottom: hp(1.5),
  },
  dietImage: {
    width: '100%',
    height: '100%',
  },
  cardContent: {
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(12),
    color: '#000',
    textAlign: 'center',
    marginBottom: hp(0.8),
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#A0A0A0',
    marginBottom: hp(0.8),
  },
  cardDescription: {
    fontFamily: typography.fonts.medium,
    fontSize: fs(10),
    color: '#666',
    textAlign: 'center',
    lineHeight: fs(10) * 1.5,
    paddingHorizontal: wp(0.5),
  },
  selectButton: {
    backgroundColor: '#2ECC71',
    borderRadius: wp(2),
    paddingVertical: hp(1),
    width: '100%',
    alignItems: 'center',
    marginTop: hp(1),
  },
  selectButtonActive: {
    backgroundColor: '#009933',
  },
  selectButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(12),
    color: '#000',
  },
  selectButtonTextActive: {
    color: '#FFF',
  },
  bottomContainer: {
    paddingHorizontal: wp(6),
    paddingBottom: Platform.OS === 'ios' ? 0 : hp(2.5),
    paddingTop: hp(1),
  },
  nextButton: {
    backgroundColor: '#2ECC71',
    borderRadius: wp(3),
    height: hp(6.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#A0E4B0',
  },
  nextButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(17),
    color: '#000000',
  },
});

export default DietPreferenceScreen;