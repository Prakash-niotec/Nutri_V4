import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Switch,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { typography } from '../../utils/typography';
import { wp, hp, fs, STATUS_BAR_HEIGHT } from '../../utils/responsive';
import { updateFamilyMember } from '../../services/firebase/memberService';
import { updateUserProfile } from '../../services/firebase/userService';
import { useAuth } from '../../hooks/useAuth';

export default function MedicalConditionsScreen() {
    const { userProfile, activeProfile, switchProfile, setUserProfile } = useAuth();
    const navigation = useNavigation();

    const profileToEdit = activeProfile || userProfile;

    const [loading, setLoading] = useState(false);

    // Default condition schema based on registration
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

    useEffect(() => {
        if (profileToEdit) {
            // Handle conditions (whether legacy string, array, or correct object)
            let parsedConditions = {
                diabetes: false,
                highBloodPressure: false,
                heartDisease: false,
                kidneyDisease: false,
                highCholesterol: false,
            };

            if (profileToEdit.medicalConditions) {
                if (typeof profileToEdit.medicalConditions === 'object' && !Array.isArray(profileToEdit.medicalConditions)) {
                    parsedConditions = { ...parsedConditions, ...profileToEdit.medicalConditions };
                } else if (Array.isArray(profileToEdit.medicalConditions)) {
                    // It's an array of strings (e.g. ['diabetes', 'highBloodPressure'])
                    profileToEdit.medicalConditions.forEach(cond => {
                        // fuzzy mapping for safety
                        if (cond === 'diabetes') parsedConditions.diabetes = true;
                        if (cond === 'high_blood_pressure' || cond === 'highBloodPressure') parsedConditions.highBloodPressure = true;
                        if (cond === 'heart_disease' || cond === 'heartDisease') parsedConditions.heartDisease = true;
                        if (cond === 'kidney_disease' || cond === 'kidneyDisease') parsedConditions.kidneyDisease = true;
                        if (cond === 'high_cholesterol' || cond === 'highCholesterol') parsedConditions.highCholesterol = true;
                    });
                } else if (typeof profileToEdit.medicalConditions === 'string') {
                    // Legacy string format: 'Diabetes, High Blood Pressure'
                    const condStr = profileToEdit.medicalConditions.toLowerCase();
                    if (condStr.includes('diabetes')) parsedConditions.diabetes = true;
                    if (condStr.includes('high blood pressure')) parsedConditions.highBloodPressure = true;
                    if (condStr.includes('heart disease')) parsedConditions.heartDisease = true;
                    if (condStr.includes('kidney disease')) parsedConditions.kidneyDisease = true;
                    if (condStr.includes('cholesterol')) parsedConditions.highCholesterol = true;
                }
            }
            setConditions(parsedConditions);

            // Handle allergies (whether legacy string or correct array)
            if (profileToEdit.allergies) {
                if (Array.isArray(profileToEdit.allergies)) {
                    setSelectedAllergies(profileToEdit.allergies);
                } else if (typeof profileToEdit.allergies === 'string') {
                    const parsedAllergies = profileToEdit.allergies.split(',').map(s => s.trim()).filter(Boolean);
                    setSelectedAllergies(parsedAllergies);
                }
            } else {
                setSelectedAllergies([]);
            }
        }
    }, [profileToEdit]);

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

    const handleSave = async () => {
        setLoading(true);
        try {
            const updates = {
                medicalConditions: conditions,
                allergies: selectedAllergies
            };

            const isMainUser = profileToEdit?.email !== undefined;

            if (isMainUser) {
                await updateUserProfile(profileToEdit.id, updates);
                const updatedProfile = { ...profileToEdit, ...updates };
                setUserProfile(updatedProfile);
                if (!activeProfile || activeProfile.id === profileToEdit.id) {
                    switchProfile(updatedProfile);
                }
            } else {
                await updateFamilyMember(profileToEdit.id, updates);
                switchProfile({ ...profileToEdit, ...updates });
            }

            navigation.goBack();
        } catch (error) {
            console.error("Failed to save medical info:", error);
            Alert.alert("Error", "Could not save your health information.");
        } finally {
            setLoading(false);
        }
    };

    const Divider = () => <View style={styles.divider} />;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Feather name="chevron-left" size={fs(28)} color="#212121" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Medical & Allergies</Text>
                    <View style={{ width: wp(8) }} />
                </View>

                <Divider />

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.title}>Medical Condition</Text>
                        <Text style={styles.subtitle}>
                            Update health conditions for {profileToEdit?.fullName || profileToEdit?.name || 'this profile'}
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

                    <View style={[styles.sectionHeader, { marginTop: hp(3.5) }]}>
                        <Text style={styles.title}>Allergies</Text>
                        <Text style={styles.subtitle}>
                            Select your allergies that affect your diet
                        </Text>
                    </View>

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

                <View style={styles.bottomContainer}>
                    <TouchableOpacity
                        style={[styles.nextButton, loading && { opacity: 0.7 }]}
                        activeOpacity={0.8}
                        disabled={loading}
                        onPress={handleSave}
                    >
                        {loading ? (
                            <ActivityIndicator color="#000000" size="small" />
                        ) : (
                            <Text style={styles.nextButtonText}>Save Details</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

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
        color: '#1A1A1A',
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
