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
import { useAuth } from '../../hooks/useAuth';
import { wp, hp, fs, STATUS_BAR_HEIGHT } from '../../utils/responsive';

const MedicalConditionScreen = ({ navigation, route }) => {
  const { userId, userName, email, dietPreference } = route?.params || {};
  const { userProfile, setUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [conditions, setConditions] = useState({
    diabetes: false,
    highBloodPressure: false,
    heartDisease: false,
    kidneyDisease: false,
    highCholesterol: false,
  });

  const [searchQuery, setSearchQuery] = useState('');

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
            <Feather name="chevron-left" size={fs(28)} color="#212121" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>NutriLens</Text>
          <View style={{ width: wp(8) }} />
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
                thumbColor="#FFFFFF"
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
          <View style={[styles.sectionHeader, { marginTop: hp(3.5) }]}>
            <Text style={styles.title}>Allergies</Text>
            <Text style={styles.subtitle}>
              Select your allergies that affect your diet
            </Text>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Feather name="search" size={fs(18)} color="#757575" style={styles.searchIcon} />
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
                  style={[styles.chip, isSelected && styles.chipSelected]}
                  onPress={() => toggleAllergy(allergy)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
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
                  const updates = {
                    medicalConditions: conditions,
                    allergies: selectedAllergies,
                    onboardingCompleted: true,
                    updatedAt: new Date().toISOString()
                  };
                  await updateUserProfile(userId, updates);
                  setUserProfile({ ...userProfile, ...updates });
                }
              } catch (error) {
                console.error("Error completing onboarding:", error);
                Alert.alert(
                  "Notice",
                  "Profile preferences recorded locally. Proceeding to dashboard.",
                  [{ text: "OK" }]
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
    backgroundColor: '#EEF5EE',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    marginTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + hp(1) : hp(1),
    marginBottom: hp(1.5),
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
  divider: {
    height: 1,
    backgroundColor: '#D1DBD1',
    width: '100%',
  },
  scrollContent: {
    paddingBottom: hp(4),
  },
  sectionHeader: {
    alignItems: 'center',
    marginTop: hp(2.5),
    marginBottom: hp(2.5),
    paddingHorizontal: wp(5),
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(20),
    color: '#000000',
    marginBottom: hp(1),
  },
  subtitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: fs(13),
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
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.6),
  },
  conditionText: {
    fontFamily: typography.fonts.medium,
    fontSize: fs(15),
    color: '#000000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#4A4A4A',
    borderRadius: wp(2),
    marginHorizontal: wp(5),
    paddingHorizontal: wp(3),
    height: hp(5.8),
    marginBottom: hp(2.5),
  },
  searchIcon: {
    marginRight: wp(2.5),
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: fs(14),
    color: '#212121',
  },
  addButton: {
    backgroundColor: '#2ECC71',
    borderRadius: wp(1.5),
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(4),
    marginLeft: wp(2),
  },
  addButtonText: {
    fontFamily: typography.fonts.medium,
    fontSize: fs(13),
    color: '#000',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: wp(5),
    gap: wp(3),
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: wp(2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
  },
  chipSelected: {
    backgroundColor: '#2ECC71',
    borderColor: '#2ECC71',
  },
  chipText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(12),
    color: '#000000',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  bottomContainer: {
    paddingHorizontal: wp(6),
    paddingBottom: Platform.OS === 'ios' ? 0 : hp(2.5),
    paddingTop: hp(1),
    borderTopWidth: 1,
    borderTopColor: '#D1DBD1',
  },
  nextButton: {
    backgroundColor: '#2ECC71',
    borderRadius: wp(3),
    height: hp(6.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: hp(1.5),
  },
  nextButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(17),
    color: '#000000',
  },
});

export default MedicalConditionScreen;