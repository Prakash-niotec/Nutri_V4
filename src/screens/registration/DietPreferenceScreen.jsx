import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { typography } from '../../utils/typography';
import { updateUserProfile } from '../../services/firebase/userService';

const DietPreferenceScreen = ({ navigation, route }) => {
  const { userId, userName, email } = route?.params || {};
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
            <Feather name="chevron-left" size={32} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NutriLens</Text>
          <View style={{ width: 32 }} /> {/* Placeholder for balance */}
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
                  style={[
                    styles.card,
                    isSelected && styles.cardSelected,
                  ]}
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
                    style={[
                      styles.selectButton,
                      isSelected && styles.selectButtonActive
                    ]}
                    onPress={() => setSelectedDiet(diet.id)}
                  >
                    <Text style={[
                      styles.selectButtonText,
                      isSelected && styles.selectButtonTextActive
                    ]}>
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
                  await updateUserProfile(userId, {
                    dietPreference: selectedDiet,
                    updatedAt: new Date().toISOString()
                  });
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
    backgroundColor: '#EEF5EE', // Light greenish tint matching the image
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 20 : 10,
    marginBottom: 30,
  },
  backButton: {
    padding: 4,
    marginLeft: -10,
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: 20,
    color: '#2ECC71',
    letterSpacing: 0.5,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 10,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: 24,
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 15,
    color: '#4A4A4A',
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.4)', // Slightly transparent to blend with background
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#212121',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 220,
  },
  cardSelected: {
    borderColor: '#2ECC71',
    borderWidth: 2,
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  imagePlaceholder: {
    width: 70,
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 15,
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
    fontSize: 13,
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  divider: {
    width: '80%',
    height: 1,
    backgroundColor: '#A0A0A0',
    marginBottom: 8,
  },
  cardDescription: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 2,
  },
  selectButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 8,
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  selectButtonActive: {
    backgroundColor: '#009933',
  },
  selectButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: 13,
    color: '#000',
  },
  selectButtonTextActive: {
    color: '#FFF',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
    paddingTop: 10,
  },
  nextButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#A0E4B0',
  },
  nextButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: 18,
    color: '#000000',
  },
});

export default DietPreferenceScreen;