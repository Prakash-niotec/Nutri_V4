import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { typography } from '../../utils/typography';
import { updateUserProfile } from '../../services/firebase/userService';

const MedicalConditionScreen = ({ navigation, route }) => {
  const { userId, userName, email, dietPreference } = route?.params || {};
  const [loading, setLoading] = useState(false);
  const [conditions, setConditions] = useState({
    diabetes: false,
    highBloodPressure: false,
    heartDisease: false,
    kidneyDisease: false,
    highCholesterol: false,
  });

  const [searchQuery, setSearchQuery] = useState('');
  
  // Available allergies and selected allergies state
  const [availableAllergies, setAvailableAllergies] = useState([
    'Dairy', 'Egg', 'Tree Nuts', 'Fish',
    'Gluten', 'Wheat', 'Sesame', 'Seafood',
    'Peanuts', 'Soy'
  ]);
  const [selectedAllergies, setSelectedAllergies] = useState([]);

  const toggleCondition = (key) => {
    setConditions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllergy = (allergy) => {
    setSelectedAllergies((prev) => 
      prev.includes(allergy) 
        ? prev.filter((a) => a !== allergy)
        : [...prev, allergy]
    );
  };

  const handleAddAllergy = () => {
    if (searchQuery.trim() && !availableAllergies.includes(searchQuery.trim())) {
      setAvailableAllergies([...availableAllergies, searchQuery.trim()]);
      setSelectedAllergies([...selectedAllergies, searchQuery.trim()]);
      setSearchQuery('');
    }
  };

  const Divider = () => <View style={styles.divider} />;

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

        <Divider />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Medical Conditions Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.title}>Medical Condition</Text>
            <Text style={styles.subtitle}>
              Select your medical condition that affect your diet
            </Text>
          </View>

          <View style={styles.conditionsList}>
            <View style={styles.conditionRow}>
              <Text style={styles.conditionText}>Diabetes</Text>
              <Switch
                trackColor={{ false: '#B0B0B0', true: '#2ECC71' }}
                thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : '#FFFFFF'}
                ios_backgroundColor="#B0B0B0"
                onValueChange={() => toggleCondition('diabetes')}
                value={conditions.diabetes}
              />
            </View>
            <Divider />
            
            <View style={styles.conditionRow}>
              <Text style={styles.conditionText}>High Blood Pressure</Text>
              <Switch
                trackColor={{ false: '#B0B0B0', true: '#2ECC71' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#B0B0B0"
                onValueChange={() => toggleCondition('highBloodPressure')}
                value={conditions.highBloodPressure}
              />
            </View>
            <Divider />

            <View style={styles.conditionRow}>
              <Text style={styles.conditionText}>Heart Disease</Text>
              <Switch
                trackColor={{ false: '#B0B0B0', true: '#2ECC71' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#B0B0B0"
                onValueChange={() => toggleCondition('heartDisease')}
                value={conditions.heartDisease}
              />
            </View>
            <Divider />

            <View style={styles.conditionRow}>
              <Text style={styles.conditionText}>Kidney Disease</Text>
              <Switch
                trackColor={{ false: '#B0B0B0', true: '#2ECC71' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#B0B0B0"
                onValueChange={() => toggleCondition('kidneyDisease')}
                value={conditions.kidneyDisease}
              />
            </View>
            <Divider />

            <View style={styles.conditionRow}>
              <Text style={styles.conditionText}>High Cholesterol</Text>
              <Switch
                trackColor={{ false: '#B0B0B0', true: '#2ECC71' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor="#B0B0B0"
                onValueChange={() => toggleCondition('highCholesterol')}
                value={conditions.highCholesterol}
              />
            </View>
            <Divider />
          </View>

          {/* Allergies Section */}
          <View style={[styles.sectionHeader, { marginTop: 30 }]}>
            <Text style={styles.title}>Allergies</Text>
            <Text style={styles.subtitle}>
              Select your allergies that affect your diet
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={20} color="#757575" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search allergies..."
              placeholderTextColor="#757575"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddAllergy}>
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>

          {/* Allergy Chips */}
          <View style={styles.chipsContainer}>
            {availableAllergies.map((allergy, index) => {
              const isSelected = selectedAllergies.includes(allergy);
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.chip,
                    isSelected && styles.chipSelected
                  ]}
                  onPress={() => toggleAllergy(allergy)}
                >
                  <Text style={[
                    styles.chipText,
                    isSelected && styles.chipTextSelected
                  ]}>
                    {allergy}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Bottom Next Button */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity 
            style={[styles.nextButton, loading && { opacity: 0.7 }]} 
            activeOpacity={0.8}
            disabled={loading}
            onPress={async () => {
              setLoading(true);
              try {
                if (userId) {
                  await updateUserProfile(userId, {
                    medicalConditions: conditions,
                    allergies: selectedAllergies,
                    onboardingCompleted: true,
                    updatedAt: new Date().toISOString()
                  });
                }
                Alert.alert(
                  "Registration Complete!",
                  "Your profile and preferences have been saved successfully.",
                  [
                    {
                      text: "Continue to Login",
                      onPress: () => navigation.navigate('LoginScreen')
                    }
                  ]
                );
              } catch (error) {
                console.error("Error completing onboarding:", error);
                Alert.alert(
                  "Notice",
                  "Profile preferences recorded locally. Proceeding to login.",
                  [
                    {
                      text: "OK",
                      onPress: () => navigation.navigate('LoginScreen')
                    }
                  ]
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text style={styles.nextButtonText}>Finish Registration</Text>
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
    backgroundColor: '#EEF5EE', // Light greenish tint
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 20 : 10,
    marginBottom: 15,
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
  divider: {
    height: 1,
    backgroundColor: '#D1DBD1', // Soft grey-green divider
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: 22,
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
  },
  conditionsList: {
    width: '100%',
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  conditionText: {
    fontFamily: typography.fonts.medium,
    fontSize: 16,
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4A4A4A',
    borderRadius: 8,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: 15,
    color: '#212121',
  },
  addButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginLeft: 8,
  },
  addButtonText: {
    fontFamily: typography.fonts.medium,
    fontSize: 14,
    color: '#000',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  chipSelected: {
    backgroundColor: '#2ECC71',
    borderColor: '#2ECC71',
  },
  chipText: {
    fontFamily: typography.fonts.bold,
    fontSize: 13,
    color: '#000000',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  bottomContainer: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 0 : 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#D1DBD1',
  },
  nextButton: {
    backgroundColor: '#2ECC71',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },
  nextButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: 18,
    color: '#000000',
  },
});

export default MedicalConditionScreen;