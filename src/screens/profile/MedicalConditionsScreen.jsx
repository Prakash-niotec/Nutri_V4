import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, TextInput, KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { updateFamilyMember } from '../../services/firebase/memberService';
import { updateUserProfile } from '../../services/firebase/userService';
import { useAuth } from '../../hooks/useAuth';
import { typography } from '../../utils/typography';
import { wp, hp, fs, STATUS_BAR_HEIGHT } from '../../utils/responsive';

const CONDITIONS = ['Diabetes', 'High Blood Pressure', 'Heart Disease', 'Kidney Disease', 'High Cholesterol'];

export default function MedicalConditionsScreen() {
    const { userProfile, activeProfile, switchProfile, setUserProfile } = useAuth();
    const navigation = useNavigation();

    const profileToEdit = activeProfile || userProfile;

    const [selectedConditions, setSelectedConditions] = useState([]);
    const [allergies, setAllergies] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profileToEdit) {
            if (profileToEdit.medicalConditions) {
                const conds = profileToEdit.medicalConditions.split(',').map(s => s.trim()).filter(Boolean);
                setSelectedConditions(conds);
            }
            setAllergies(profileToEdit.allergies || '');
        }
    }, [profileToEdit]);

    const toggleCondition = (condition) => {
        if (selectedConditions.includes(condition)) {
            setSelectedConditions(selectedConditions.filter(c => c !== condition));
        } else {
            setSelectedConditions([...selectedConditions, condition]);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const updates = {
                medicalConditions: selectedConditions.join(', '),
                allergies: allergies.trim()
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
            alert("Error", "Could not save your health information.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : null}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                            <Feather name="arrow-left" size={fs(24)} color="#1A1A1A" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Medical & Allergies</Text>
                        <View style={styles.dummy} />
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.iconCircle}>
                            <Feather name="heart" size={fs(32)} color="#009933" />
                        </View>
                        <Text style={styles.subtitle}>
                            Update health conditions for {profileToEdit?.fullName || profileToEdit?.name || 'this profile'}.
                        </Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Medical Conditions</Text>
                            <View style={styles.chipContainer}>
                                {CONDITIONS.map((c) => (
                                    <TouchableOpacity
                                        key={c}
                                        style={[styles.chip, selectedConditions.includes(c) && styles.chipSelected]}
                                        onPress={() => toggleCondition(c)}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.chipText, selectedConditions.includes(c) && styles.chipTextSelected]}>{c}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Food Allergies</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="e.g. Peanuts, Shellfish, Dairy, Gluten"
                                placeholderTextColor="#999"
                                value={allergies}
                                onChangeText={setAllergies}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </View>
                </ScrollView>

                <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleSave}
                    activeOpacity={0.8}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Save Details</Text>
                    )}
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT : 0,
    },
    scrollContent: {
        paddingBottom: hp(22),
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: wp(5),
        paddingVertical: hp(2),
    },
    headerTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: fs(18),
        color: '#1A1A1A',
    },
    backButton: {
        padding: wp(2),
        marginLeft: -wp(2),
    },
    dummy: {
        width: wp(10),
    },
    formContainer: {
        paddingHorizontal: wp(6),
        marginTop: hp(1),
    },
    iconCircle: {
        width: wp(20),
        height: wp(20),
        borderRadius: wp(10),
        backgroundColor: '#EEF5EE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: hp(1.5),
        alignSelf: 'center',
    },
    subtitle: {
        fontFamily: typography.fonts.medium,
        fontSize: fs(14),
        color: '#666',
        textAlign: 'center',
        marginBottom: hp(4),
    },
    inputGroup: {
        width: '100%',
        marginBottom: hp(3),
    },
    inputLabel: {
        fontFamily: typography.fonts.semiBold,
        fontSize: fs(14),
        color: '#333',
        marginBottom: hp(1.5),
    },
    input: {
        width: '100%',
        backgroundColor: '#F8F9FA',
        borderWidth: 1,
        borderColor: '#E5E5E5',
        borderRadius: wp(3),
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.8),
        fontFamily: typography.fonts.regular,
        fontSize: fs(14),
        color: '#1A1A1A',
    },
    textArea: {
        height: hp(12),
    },
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    chip: {
        paddingHorizontal: wp(4),
        paddingVertical: hp(1.2),
        borderRadius: wp(5),
        backgroundColor: '#F0F0F0',
        marginRight: wp(2.5),
        marginBottom: hp(1.5),
        borderWidth: 1,
        borderColor: '#E5E5E5',
    },
    chipSelected: {
        backgroundColor: '#009933',
        borderColor: '#009933',
    },
    chipText: {
        fontFamily: typography.fonts.medium,
        fontSize: fs(13),
        color: '#666',
    },
    chipTextSelected: {
        color: '#FFFFFF',
    },
    submitButton: {
        position: 'absolute',
        bottom: hp(14),
        left: wp(5),
        right: wp(5),
        backgroundColor: '#009933',
        paddingVertical: hp(2),
        borderRadius: wp(4),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#009933',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    submitButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: fs(16),
        color: '#FFFFFF',
    }
});
