import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { addFamilyMember } from '../../services/firebase/memberService';
import { useAuth } from '../../hooks/useAuth';
import { typography } from '../../utils/typography';
import { wp, hp, fs, STATUS_BAR_HEIGHT } from '../../utils/responsive';

const CONDITIONS = ['Diabetes', 'High Blood Pressure', 'Heart Disease', 'Kidney Disease', 'High Cholesterol'];

export default function AddMemberScreen() {
    const [fullName, setFullName] = useState('');
    const [dietPreference, setDietPreference] = useState('');
    const [selectedConditions, setSelectedConditions] = useState([]);
    const [allergies, setAllergies] = useState('');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();
    const navigation = useNavigation();

    const toggleCondition = (condition) => {
        if (selectedConditions.includes(condition)) {
            setSelectedConditions(selectedConditions.filter(c => c !== condition));
        } else {
            setSelectedConditions([...selectedConditions, condition]);
        }
    };

    const handleAddMember = async () => {
        if (!fullName.trim()) {
            alert("Please check your inputs", "Member name cannot be empty.");
            return;
        }

        setLoading(true);
        try {
            await addFamilyMember(user.uid, {
                fullName: fullName.trim(),
                dietPreference: dietPreference.trim() || 'None',
                medicalConditions: selectedConditions.join(', '),
                allergies: allergies.trim()
            });
            navigation.goBack();
        } catch (error) {
            console.error("Failed to add member:", error);
            alert("Error", "Could not add member.");
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
                        <Text style={styles.headerTitle}>Add Family Member</Text>
                        <View style={styles.dummy} />
                    </View>

                    <View style={styles.formContainer}>
                        <View style={styles.iconCircle}>
                            <Feather name="user-plus" size={fs(32)} color="#009933" />
                        </View>
                        <Text style={styles.subtitle}>Create a new profile for your family member.</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Full Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter member's name"
                                placeholderTextColor="#999"
                                value={fullName}
                                onChangeText={setFullName}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Diet Preference</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Vegan, Keto, None"
                                placeholderTextColor="#999"
                                value={dietPreference}
                                onChangeText={setDietPreference}
                            />
                        </View>

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
                            <Text style={styles.inputLabel}>Allergies</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Peanuts, Shellfish, Dairy"
                                placeholderTextColor="#999"
                                value={allergies}
                                onChangeText={setAllergies}
                            />
                        </View>
                    </View>
                </ScrollView>

                <TouchableOpacity
                    style={[styles.submitButton, (!fullName) && styles.submitButtonDisabled]}
                    onPress={handleAddMember}
                    activeOpacity={0.8}
                    disabled={!fullName || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.submitButtonText}>Save Member</Text>
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
        marginBottom: hp(2),
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
        marginBottom: hp(1),
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
    chipContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: hp(1),
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
    submitButtonDisabled: {
        backgroundColor: '#A8E3B9',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        fontFamily: typography.fonts.bold,
        fontSize: fs(16),
        color: '#FFFFFF',
    }
});