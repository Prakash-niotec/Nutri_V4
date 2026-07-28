import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useCameraPermission } from 'react-native-vision-camera';
import { typography } from '../../utils/typography';
import { wp, hp, fs, STATUS_BAR_HEIGHT } from '../../utils/responsive';
import { useAuth } from '../../hooks/useAuth';
import { evaluateFoodSafety } from '../../services/healthEngine';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { NutritionScanner } from '../../components/scanning/NutritionScanner';
import { fuseOcrResults } from '../../services/ml/ocrFusion';
import { normalizeOcrIngredients } from '../../services/nutrition/ingredientDatabase';

// Adapter to map AuthContext user profile format to Health Engine format
const mapAuthProfileToHealthProfile = (authProfile) => {
  if (!authProfile) {
    return { userId: 'guest', allergies: [], medicalConditions: [], dietaryRestrictions: [] };
  }

  const mappedAllergies = (authProfile.allergies || []).map(a => a.toLowerCase().replace(' ', '_'));

  const mappedConditions = [];
  if (typeof authProfile.medicalConditions === 'object' && authProfile.medicalConditions !== null) {
    if (authProfile.medicalConditions.diabetes) mappedConditions.push('diabetes');
    if (authProfile.medicalConditions.highBloodPressure) mappedConditions.push('high_blood_pressure');
    if (authProfile.medicalConditions.heartDisease) mappedConditions.push('heart_disease');
    if (authProfile.medicalConditions.kidneyDisease) mappedConditions.push('kidney_disease');
    if (authProfile.medicalConditions.highCholesterol) mappedConditions.push('high_cholesterol');
  } else if (typeof authProfile.medicalConditions === 'string') {
    const conds = authProfile.medicalConditions.split(',').map(s => s.trim().toLowerCase());
    if (conds.includes('diabetes')) mappedConditions.push('diabetes');
    if (conds.includes('high blood pressure')) mappedConditions.push('high_blood_pressure');
    if (conds.includes('heart disease')) mappedConditions.push('heart_disease');
    if (conds.includes('kidney disease')) mappedConditions.push('kidney_disease');
    if (conds.includes('high cholesterol')) mappedConditions.push('high_cholesterol');
  }

  const dietaryRestrictions = authProfile.dietPreference ? [authProfile.dietPreference.toLowerCase()] : [];

  return {
    userId: authProfile.id || 'current_user',
    allergies: mappedAllergies,
    medicalConditions: mappedConditions,
    dietaryRestrictions: dietaryRestrictions,
    ageGroup: 'adult'
  };
};

const ScanScreen = ({ navigation }) => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const scannerRef = useRef(null);
  const { activeProfile } = useAuth();

  React.useEffect(() => {
    navigation.setOptions({
      tabBarStyle: isCameraActive ? { display: 'none' } : undefined,
    });
  }, [isCameraActive, navigation]);

  const startScanning = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          "Camera Permission Required",
          "NutriLens requires camera access to scan nutrition labels. Please allow camera permissions in your device settings.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }
    }
    setResult(null);
    setIsCameraActive(true);
  };

  const handleStableDetection = async () => {
    if (!scannerRef.current) return;
    setIsAnalyzing(true);

    try {
      const ocrResults = [];
      // Take 2 rapid snapshots as requested by user
      for (let i = 0; i < 2; i++) {
        const snapshot = await scannerRef.current.takeSnapshot();
        if (snapshot && snapshot.path) {
          const imageUri = snapshot.path.startsWith('file://') ? snapshot.path : `file://${snapshot.path}`;
          const textResult = await TextRecognition.recognize(imageUri);
          ocrResults.push(textResult);
        }
        if (i < 1) await new Promise(r => setTimeout(r, 80));
      }

      if (ocrResults.length === 0) {
        throw new Error("Failed to capture images.");
      }

      const fusedResult = fuseOcrResults(ocrResults);

      const rawIngredients = fusedResult.facts.rawIngredients || [];
      const normalizedIngredients = await normalizeOcrIngredients(rawIngredients);
      const detectedIngredients = normalizedIngredients.map(item => item.product_name || '');
      const detectedAllergenTags = normalizedIngredients.flatMap(item => item.allergens_tags || []);

      const getMacro = (category) => {
        const item = fusedResult.facts.tableItems?.find(i => i.normalizedKey === category);
        return item ? item.numericValue : undefined;
      };

      const scannedFood = {
        productName: 'Scanned Packet',
        detectedIngredients,
        detectedAllergenTags,
        nutritionFacts: {
          unit: fusedResult.facts.unit,
          calories: fusedResult.facts.calories,
          sugar_g: fusedResult.facts.sugar,
          sodium_mg: fusedResult.facts.sodium,
          saturatedFat_g: fusedResult.facts.saturatedFat,
          totalCarbs_g: getMacro('carbohydrates'),
          protein_g: getMacro('protein')
        }
      };

      const healthProfile = mapAuthProfileToHealthProfile(activeProfile);
      const evaluation = evaluateFoodSafety(scannedFood, healthProfile);

      setIsAnalyzing(false);
      setIsCameraActive(false);
      setResult({ food: scannedFood, evaluation });

    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
      setIsCameraActive(false);
      alert("OCR Analysis Failed. Ensure @react-native-ml-kit/text-recognition is built correctly into the native client.");
    }
  };

  const resetScanner = () => {
    setResult(null);
    setIsCameraActive(false);
  };

  if (result) {
    const verdictColor =
      result.evaluation.overallVerdict === 'SAFE' ? '#2ECC71' :
        result.evaluation.overallVerdict === 'CAUTION' ? '#F39C12' : '#E74C3C';
    const verdictIcon =
      result.evaluation.overallVerdict === 'SAFE' ? 'check-circle' :
        result.evaluation.overallVerdict === 'CAUTION' ? 'alert-triangle' : 'x-octagon';

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultContainer}>
          <Text style={styles.title}>Analysis Complete</Text>
          <View style={styles.card}>
            <View style={[styles.verdictHeader, { backgroundColor: verdictColor }]}>
              <Feather name={verdictIcon} size={fs(36)} color="#FFF" style={{ marginBottom: hp(1) }} />
              <Text style={styles.verdictText}>{result.evaluation.overallVerdict}</Text>
            </View>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

              <Text style={styles.productName}>{result.food.productName || 'Scanned Label'}</Text>

              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>{result.evaluation.summary}</Text>
              </View>

              <View style={styles.riskRow}>
                <Text style={styles.riskScoreLabel}>Calculated Risk Score</Text>
                <View style={[styles.riskScoreBadge, { backgroundColor: verdictColor + '20' }]}>
                  <Text style={[styles.riskScoreValue, { color: verdictColor }]}>{result.evaluation.riskScore}/100</Text>
                </View>
              </View>

              {result.evaluation.flaggedIngredients && result.evaluation.flaggedIngredients.length > 0 && (
                <View style={styles.flagsSection}>
                  <Text style={styles.flagsSectionTitle}>Flagged Interactions</Text>
                  {result.evaluation.flaggedIngredients.map((flag, idx) => (
                    <View key={idx} style={[styles.flagItem, { borderLeftColor: flag.severity === 'CRITICAL' ? '#E74C3C' : flag.severity === 'HIGH' ? '#D35400' : '#E67E22', borderLeftWidth: 4 }]}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.flagHeaderRow}>
                          <Text style={styles.flagIngredient}>{flag.ingredient.charAt(0).toUpperCase() + flag.ingredient.slice(1)}</Text>
                          <View style={[styles.severityPill, { backgroundColor: flag.severity === 'CRITICAL' ? '#E74C3C15' : '#E67E2215' }]}>
                            <Text style={[styles.flagSeverity, { color: flag.severity === 'CRITICAL' ? '#E74C3C' : '#D35400' }]}>{flag.severity}</Text>
                          </View>
                        </View>
                        <Text style={styles.flagReason}>{flag.reason}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Macro Quantities Section */}
              {Object.values(result.food.nutritionFacts).some(v => v !== undefined) && (
                <View style={styles.macrosSection}>
                  <Text style={styles.flagsSectionTitle}>Extracted Nutrition Facts</Text>
                  <View style={styles.macrosGrid}>
                    {result.food.nutritionFacts.calories !== undefined && (
                      <View style={styles.macroBadge}>
                        <Text style={styles.macroLabel}>Calories</Text>
                        <Text style={styles.macroValue}>{result.food.nutritionFacts.calories} kcal</Text>
                      </View>
                    )}
                    {result.food.nutritionFacts.sugar_g !== undefined && (
                      <View style={styles.macroBadge}>
                        <Text style={styles.macroLabel}>Sugar</Text>
                        <Text style={styles.macroValue}>{result.food.nutritionFacts.sugar_g}g</Text>
                      </View>
                    )}
                    {result.food.nutritionFacts.sodium_mg !== undefined && (
                      <View style={styles.macroBadge}>
                        <Text style={styles.macroLabel}>Sodium</Text>
                        <Text style={styles.macroValue}>{result.food.nutritionFacts.sodium_mg}mg</Text>
                      </View>
                    )}
                    {result.food.nutritionFacts.protein_g !== undefined && (
                      <View style={styles.macroBadge}>
                        <Text style={styles.macroLabel}>Protein</Text>
                        <Text style={styles.macroValue}>{result.food.nutritionFacts.protein_g}g</Text>
                      </View>
                    )}
                    {result.food.nutritionFacts.totalCarbs_g !== undefined && (
                      <View style={styles.macroBadge}>
                        <Text style={styles.macroLabel}>Carbs</Text>
                        <Text style={styles.macroValue}>{result.food.nutritionFacts.totalCarbs_g}g</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={resetScanner} activeOpacity={0.8}>
              <Feather name="refresh-cw" size={fs(18)} color="#FFFFFF" style={{ marginRight: wp(2) }} />
              <Text style={styles.actionButtonText}>Scan Another Label</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isCameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <NutritionScanner 
          ref={scannerRef}
          isActive={isCameraActive && !isAnalyzing}
          onStableDetection={handleStableDetection}
        />

        <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
          <View style={styles.controls}>
            {isAnalyzing ? (
              <View style={styles.analyzingWrapper}>
                <ActivityIndicator size="large" color="#009933" />
                <Text style={styles.analyzingText}>Extracting Ingredients...</Text>
              </View>
            ) : (
              <View style={styles.analyzingWrapper}>
                 <ActivityIndicator size="large" color="#FFF" />
                 <Text style={styles.analyzingText}>Stabilizing Lens...</Text>
              </View>
            )}
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCameraActive(false)}>
               <Feather name="x" size={fs(28)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Feather name="file-text" size={fs(44)} color="#009933" />
        </View>
        <Text style={styles.title}>Packet Health Scanner</Text>
        <Text style={styles.subtitle}>
          Use the camera to scan the ingredients label on any packet. Our AI will instantly warn you if it conflicts with your allergies or medical conditions.
        </Text>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={startScanning}
        >
          <Feather name="camera" size={fs(18)} color="#FFFFFF" style={{ marginRight: wp(2) }} />
          <Text style={styles.actionButtonText}>Scan Ingredients Label</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT : 0,
  },
  iconCircle: {
    width: wp(25),
    height: wp(25),
    borderRadius: wp(12.5),
    backgroundColor: '#D2F0DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(3),
    borderWidth: 2,
    borderColor: '#A8E3B9',
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(24),
    color: '#1A1A1A',
    marginBottom: hp(1.5),
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: fs(14),
    color: '#555555',
    textAlign: 'center',
    lineHeight: fs(14) * 1.6,
    marginBottom: hp(4),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#009933',
    paddingHorizontal: wp(8),
    paddingVertical: hp(2),
    borderRadius: wp(6.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(15),
    color: '#FFFFFF',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: hp(5),
    paddingTop: hp(2),
    backgroundColor: 'rgba(0,0,0,0.5)',
    height: hp(18),
  },
  closeBtn: {
    position: 'absolute',
    right: wp(6),
    top: hp(6),
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    color: '#FFFFFF',
    fontFamily: typography.fonts.semiBold,
    marginTop: hp(1)
  },
  resultContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT + hp(2) : hp(2),
    paddingHorizontal: wp(6),
    paddingBottom: hp(4),
    alignItems: 'center',
  },
  card: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: wp(4),
    marginBottom: hp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden'
  },
  verdictHeader: {
    paddingVertical: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  verdictText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(24),
    color: '#FFF',
    letterSpacing: 2
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(2),
  },
  productName: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(18),
    color: '#212121',
    marginBottom: hp(1),
  },
  summaryContainer: {
    backgroundColor: '#F8F9FA',
    padding: wp(4),
    borderRadius: wp(3),
    marginBottom: hp(2),
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  summaryText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: fs(14),
    color: '#444444',
    lineHeight: fs(14) * 1.5,
  },
  riskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    marginBottom: hp(2.5),
  },
  riskScoreLabel: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(15),
    color: '#1A1A1A',
  },
  riskScoreBadge: {
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.5),
    borderRadius: wp(2),
  },
  riskScoreValue: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(15),
  },
  flagsSection: {
    marginTop: hp(1),
  },
  flagsSectionTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(16),
    color: '#1A1A1A',
    marginBottom: hp(1.5),
  },
  flagItem: {
    flexDirection: 'row',
    marginBottom: hp(1.5),
    backgroundColor: '#FDFDFD',
    padding: wp(3.5),
    borderRadius: wp(2.5),
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  flagHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: hp(0.8),
  },
  flagIngredient: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(15),
    color: '#212121',
  },
  severityPill: {
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.4),
    borderRadius: wp(4),
  },
  flagSeverity: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(10),
    letterSpacing: 0.5,
  },
  flagReason: {
    fontFamily: typography.fonts.regular,
    fontSize: fs(13),
    color: '#555555',
    lineHeight: fs(13) * 1.5,
  },
  macrosSection: {
    marginTop: hp(1),
    marginBottom: hp(2),
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: wp(3),
    marginTop: hp(1),
  },
  macroBadge: {
    backgroundColor: '#E6F4FE',
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    borderRadius: wp(2),
    alignItems: 'center',
    minWidth: wp(18),
  },
  macroLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: fs(12),
    color: '#0066CC',
    marginBottom: hp(0.5),
  },
  macroValue: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(14),
    color: '#004C99',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
});

export default ScanScreen;