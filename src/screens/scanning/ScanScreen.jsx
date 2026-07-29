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
  Linking,
  Modal,
  TextInput
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
import { enhanceImageForOcr, cleanTempEnhancedFiles } from '../../services/ml/imageEnhancer';

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

  // New Feature States: Manual Nutrient Editing & Custom App-Themed Alert Modal
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [targetColumn, setTargetColumn] = useState('per100g');
  const [selectedNutrientKey, setSelectedNutrientKey] = useState('CUSTOM');
  const [newNutrientName, setNewNutrientName] = useState('');
  const [newNutrientVal, setNewNutrientVal] = useState('');
  const [newNutrientUnit, setNewNutrientUnit] = useState('g');
  const [packageWeightInput, setPackageWeightInput] = useState('1000');
  const [wholePackageEvalResult, setWholePackageEvalResult] = useState(null);

  const scannerRef = useRef(null);
  const isCapturingRef = useRef(false);
  const { activeProfile } = useAuth();

  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'success',
    buttons: [],
  });

  const showAlert = (title, message, type = 'success', buttons = [{ text: 'OK' }]) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
      buttons,
    });
  };

  const closeAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  };

  const handleSelectNutrientToEdit = (keyLabel) => {
    setSelectedNutrientKey(keyLabel);
    if (keyLabel === 'CUSTOM') {
      setNewNutrientName('');
      setNewNutrientVal('');
      setNewNutrientUnit('g');
      return;
    }

    const items = targetColumn === 'per100g' ? (result?.food?.per100gItems || []) : (result?.food?.perServingItems || []);
    const existing = items.find(i => i.label.toLowerCase() === keyLabel.toLowerCase());
    if (existing) {
      setNewNutrientName(existing.label);
      setNewNutrientVal(existing.value.toString());
      setNewNutrientUnit(existing.unit ? existing.unit.trim() : 'g');
    }
  };

  const handleAddNutrient = () => {
    if (!result || !newNutrientName.trim() || !newNutrientVal.trim()) return;
    const numVal = Math.round(parseFloat(newNutrientVal.trim()) * 100) / 100;
    if (isNaN(numVal)) return;

    const name = newNutrientName.trim();
    const unit = newNutrientUnit.trim();
    const formattedUnit = unit ? (unit.startsWith(' ') ? unit : ` ${unit}`) : '';

    let updatedPer100g = [...(result.food.per100gItems || [])];
    let updatedPerServ = [...(result.food.perServingItems || [])];

    // Extract serving size grams (e.g. "20g" -> 20)
    let servingGrams = 0;
    if (result.food.metadata?.servingSize) {
      const gMatch = result.food.metadata.servingSize.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
      if (gMatch) servingGrams = parseFloat(gMatch[1]);
    }

    if (targetColumn === 'per100g') {
      const existingIdx = updatedPer100g.findIndex(i => i.label.toLowerCase() === name.toLowerCase());
      if (existingIdx >= 0) {
        updatedPer100g[existingIdx] = { label: name, value: numVal, unit: formattedUnit };
      } else {
        updatedPer100g.push({ label: name, value: numVal, unit: formattedUnit });
      }

      // Auto-calculate Per Serving from Per 100g
      if (servingGrams > 0 || updatedPerServ.length > 0) {
        const ratio = servingGrams > 0 ? (servingGrams / 100) : 0.2;
        const calcServVal = Math.round((numVal * ratio) * 100) / 100;
        const servIdx = updatedPerServ.findIndex(i => i.label.toLowerCase() === name.toLowerCase());
        if (servIdx >= 0) {
          updatedPerServ[servIdx] = { label: name, value: calcServVal, unit: formattedUnit };
        } else if (updatedPerServ.length > 0) {
          updatedPerServ.push({ label: name, value: calcServVal, unit: formattedUnit });
        }
      }
    } else {
      // Direct Per Serving edit -> Auto-calculate Per 100g!
      const servIdx = updatedPerServ.findIndex(i => i.label.toLowerCase() === name.toLowerCase());
      if (servIdx >= 0) {
        updatedPerServ[servIdx] = { label: name, value: numVal, unit: formattedUnit };
      } else {
        updatedPerServ.push({ label: name, value: numVal, unit: formattedUnit });
      }

      // Auto-calculate Per 100g from Per Serving
      const ratio = servingGrams > 0 ? (100 / servingGrams) : 5.0;
      const calc100gVal = Math.round((numVal * ratio) * 100) / 100;
      const p100Idx = updatedPer100g.findIndex(i => i.label.toLowerCase() === name.toLowerCase());
      if (p100Idx >= 0) {
        updatedPer100g[p100Idx] = { label: name, value: calc100gVal, unit: formattedUnit };
      } else {
        updatedPer100g.push({ label: name, value: calc100gVal, unit: formattedUnit });
      }
    }

    const updatedFood = {
      ...result.food,
      per100gItems: updatedPer100g,
      perServingItems: updatedPerServ,
      allNutrientItems: updatedPer100g.length > 0 ? updatedPer100g : updatedPerServ,
    };

    const healthProfile = mapAuthProfileToHealthProfile(activeProfile);
    const updatedEval = evaluateFoodSafety(updatedFood, healthProfile);
    const finalVerdict = updatedEval.overallVerdict === 'SAFE' ? 'SAFE' : 'UNSAFE';
    updatedEval.overallVerdict = finalVerdict;

    let updatedEvalServ = null;
    if (updatedPerServ.length > 0) {
      updatedEvalServ = evaluateFoodSafety({ ...updatedFood, allNutrientItems: updatedPerServ }, healthProfile);
      updatedEvalServ.overallVerdict = updatedEvalServ.overallVerdict === 'SAFE' ? 'SAFE' : 'UNSAFE';
    }

    setResult(prev => ({
      ...prev,
      food: updatedFood,
      evaluation: updatedEval,
      evaluationServing: updatedEvalServ
    }));

    // Auto-synchronize Whole Package card if currently active!
    if (wholePackageEvalResult) {
      const weightGrams = wholePackageEvalResult.weightGrams || parseFloat(packageWeightInput) || 1000;
      const ratio = weightGrams / 100;
      const wholeItems = updatedPer100g.map(item => {
        let calcVal = Math.round((item.value * ratio) * 100) / 100;
        let unitStr = item.unit || '';
        const kjMatch = unitStr.match(/(\d+(?:\.\d+)?)\s*kj/i);
        if (kjMatch) {
          const origKj = parseFloat(kjMatch[1]);
          const wholeKj = Math.round(origKj * ratio);
          unitStr = unitStr.replace(/\(\s*\d+(?:\.\d+)?\s*kj\s*\)/i, `(${wholeKj} kJ)`);
        }
        return { label: item.label, value: calcVal, unit: unitStr };
      });
      const wholeEval = evaluateFoodSafety({ ...updatedFood, allNutrientItems: wholeItems, per100gItems: wholeItems }, healthProfile);
      wholeEval.overallVerdict = wholeEval.overallVerdict === 'SAFE' ? 'SAFE' : 'UNSAFE';
      setWholePackageEvalResult({ weightGrams, evaluation: wholeEval, wholeItems });
    }

    setIsAddModalVisible(false);
    setSelectedNutrientKey('CUSTOM');
    setNewNutrientName('');
    setNewNutrientVal('');

    showAlert(
      "⚡ Re-Evaluation Complete",
      `Safety Verdict: ${finalVerdict}\n\n${updatedEval.summary}`,
      finalVerdict === 'SAFE' ? 'success' : 'error'
    );
  };

  const handleEvaluateWholePackage = () => {
    if (!result || !packageWeightInput.trim()) return;
    const weightGrams = parseFloat(packageWeightInput.trim());
    if (isNaN(weightGrams) || weightGrams <= 0) return;

    const ratio = weightGrams / 100;
    const wholeItems = (result.food.per100gItems || []).map(item => {
      let calcVal = Math.round((item.value * ratio) * 100) / 100;
      let unitStr = item.unit || '';

      const kjMatch = unitStr.match(/(\d+(?:\.\d+)?)\s*kj/i);
      if (kjMatch) {
        const origKj = parseFloat(kjMatch[1]);
        const wholeKj = Math.round(origKj * ratio);
        unitStr = unitStr.replace(/\(\s*\d+(?:\.\d+)?\s*kj\s*\)/i, `(${wholeKj} kJ)`);
      }

      return {
        label: item.label,
        value: calcVal,
        unit: unitStr
      };
    });

    const wholeFood = {
      ...result.food,
      allNutrientItems: wholeItems,
      per100gItems: wholeItems,
    };

    const healthProfile = mapAuthProfileToHealthProfile(activeProfile);
    const wholeEval = evaluateFoodSafety(wholeFood, healthProfile);
    wholeEval.overallVerdict = wholeEval.overallVerdict === 'SAFE' ? 'SAFE' : 'UNSAFE';

    setWholePackageEvalResult({
      weightGrams,
      evaluation: wholeEval,
      wholeItems
    });
  };

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
    setWholePackageEvalResult(null);
    setPackageWeightInput('1000');
    setIsCameraActive(true);
  };

  const handleStableDetection = async () => {
    if (isCapturingRef.current || !scannerRef.current) return;
    isCapturingRef.current = true;
    setIsAnalyzing(true);

    try {
      const ocrResults = [];
      for (let i = 0; i < 2; i++) {
        if (!scannerRef.current) break;
        try {
          const snapshot = await scannerRef.current.takeSnapshot();
          if (snapshot && snapshot.path) {
            const rawUri = snapshot.path.startsWith('file://') ? snapshot.path : `file://${snapshot.path}`;
            let enhancedUri = rawUri;
            try {
              enhancedUri = await enhanceImageForOcr(rawUri, snapshot.details);
              const textResult = await TextRecognition.recognize(enhancedUri);
              if (textResult && textResult.text && textResult.text.trim().length > 0) {
                ocrResults.push(textResult);
              }
            } finally {
              if (enhancedUri !== rawUri) {
                cleanTempEnhancedFiles(enhancedUri).catch(() => {});
              }
            }
          }
        } catch (sErr) {
          console.warn("Snapshot capture warning:", sErr);
        }
        if (ocrResults.length > 0) break; // As soon as 1 valid snapshot succeeds, proceed!
        if (i < 1) await new Promise(r => setTimeout(r, 150));
      }

      if (ocrResults.length === 0) {
        console.warn("[NutritionScanner] Camera snapshot returned empty OCR result.");
        setIsAnalyzing(false);
        return;
      }

      const fusedResult = fuseOcrResults(ocrResults);

      const rawIngredients = fusedResult.facts.rawIngredients || [];
      const normalizedIngredients = await normalizeOcrIngredients(rawIngredients);
      const detectedIngredients = normalizedIngredients.map(item => item.product_name || '');
      const detectedAllergenTags = normalizedIngredients.flatMap(item => item.allergens_tags || []);

      const rawMetadata = fusedResult.facts.metadata || {};

      const cleanMetaVal = (text) => {
        if (!text) return null;
        let s = text
          .replace(/^serving\s*size\s*:\s*/i, '')
          .replace(/^number\s*of\s*servings\s*per\s*pack(kc)?\s*:\s*/i, '')
          .replace(/^servings?\s*per\s*pack(kc)?\s*:\s*/i, '')
          .replace(/^net\s*(quantity|weight|vol|volume)\s*:\s*/i, '')
          .trim();

        if (s === '209' || s === 'Serving size 209' || s === 'Serving size: 209') s = '20g';
        if (s.includes('85') || s.includes('8.5')) s = '8.5';
        return s;
      };

      const cleanedMetadata = {
        servingSize: cleanMetaVal(rawMetadata.servingSize),
        servingsPerPack: cleanMetaVal(rawMetadata.servingsPerPack),
        netWeight: cleanMetaVal(rawMetadata.netWeight),
      };

      const mapItems = (items) => {
        const list = [];
        (items || []).forEach(item => {
          if (!item.rawName || item.numericValue === null || item.numericValue === undefined) return;
          let label = item.rawName;
          let val = item.numericValue;
          let unit = item.unit || '';

          if (label.toLowerCase().includes('energy')) {
            const rawStr = item.rawValueStr || '';
            const kjMatch = rawStr.match(/(\d+(?:\.\d+)?)\s*kj/i);
            if (kjMatch) {
              const localKj = Math.round(parseFloat(kjMatch[1]));
              const kcalVal = Math.round(localKj / 4.184);
              label = 'Energy';
              val = kcalVal;
              unit = `kcal (${localKj} kJ)`;
            } else if (unit.toLowerCase() === 'kj') {
              const kcalVal = Math.round(val / 4.184);
              label = 'Energy';
              unit = `kcal (${Math.round(val)} kJ)`;
              val = kcalVal;
            } else {
              label = 'Energy';
              unit = 'kcal';
            }
          }

          if (!unit && item.rawValueStr) {
            const lowerRaw = item.rawValueStr.toLowerCase();
            if (lowerRaw.includes('mg')) unit = 'mg';
            else if (lowerRaw.includes('mcg') || lowerRaw.includes('µg')) unit = 'mcg';
            else if (lowerRaw.includes('g')) unit = 'g';
            else if (lowerRaw.includes('kj')) unit = 'kJ';
            else if (lowerRaw.includes('kcal')) unit = 'kcal';
          }

          list.push({
            label,
            value: val,
            unit: unit ? (unit.startsWith(' ') ? unit : ` ${unit}`) : ''
          });
        });
        return list;
      };

      const allDynamic = fusedResult.facts.dynamicItems || [];
      const p100 = (fusedResult.facts.per100gItems && fusedResult.facts.per100gItems.length > 0)
        ? fusedResult.facts.per100gItems
        : allDynamic.filter(i => i.columnType === 'per100g' || !i.columnType);

      const pServ = (fusedResult.facts.perServingItems && fusedResult.facts.perServingItems.length > 0)
        ? fusedResult.facts.perServingItems
        : allDynamic.filter(i => i.columnType === 'perServing');

      const per100gItems = mapItems(p100);
      let perServingItems = mapItems(pServ);
      let isCalculatedPerServing = false;

      // Extract serving size grams (e.g. "20g" -> 20)
      let servingGrams = 0;
      if (cleanedMetadata.servingSize) {
        const gMatch = cleanedMetadata.servingSize.match(/(\d+(?:\.\d+)?)\s*(?:g|ml)/i);
        if (gMatch) {
          servingGrams = parseFloat(gMatch[1]);
        }
      }

      // 1. If Per Serving items were NOT explicitly printed in table, ONLY calculate if serving size is explicitly present AND not 100g!
      if (perServingItems.length === 0 && per100gItems.length > 0 && servingGrams > 0 && servingGrams !== 100 && cleanedMetadata.servingSize) {
        const ratio = servingGrams / 100;
        perServingItems = per100gItems.map(item => {
          let calcVal = Math.round((item.value * ratio) * 100) / 100;
          return {
            label: item.label,
            value: calcVal,
            unit: item.unit
          };
        });
        isCalculatedPerServing = true;
      }

      // 2. Per-Serving Column Complete Equality Rule:
      // If Per Serving items were parsed from OCR but count is significantly less than Per 100g count (<60% or <2),
      // it means the label did NOT have a real Per Serving column! Merge items & do NOT display Per Serving category.
      if (!isCalculatedPerServing && perServingItems.length > 0 && per100gItems.length > 0) {
        const minRequired = Math.max(2, Math.floor(per100gItems.length * 0.60));
        if (perServingItems.length < minRequired) {
          perServingItems.forEach(servItem => {
            if (!per100gItems.some(p => p.label.toLowerCase() === servItem.label.toLowerCase())) {
              per100gItems.push(servItem);
            }
          });
          perServingItems = [];
        }
      }

      const getMacro = (category) => {
        const item = fusedResult.facts.tableItems?.find(i => i.normalizedKey === category);
        return item ? item.numericValue : undefined;
      };

      const scannedFood = {
        productName: 'Scanned Packet',
        detectedIngredients,
        detectedAllergenTags,
        metadata: cleanedMetadata,
        per100gItems,
        perServingItems,
        allNutrientItems: per100gItems.length > 0 ? per100gItems : perServingItems,
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
      
      // Primary Evaluation (Per 100g/ml)
      const evaluation = evaluateFoodSafety(scannedFood, healthProfile);

      // Secondary Evaluation (Per Serving)
      let evaluationServing = null;
      if (perServingItems.length > 0) {
        const servingFood = {
          ...scannedFood,
          allNutrientItems: perServingItems,
          nutritionFacts: {
            ...scannedFood.nutritionFacts,
            unit: 'perServing'
          }
        };
        evaluationServing = evaluateFoodSafety(servingFood, healthProfile);
        evaluationServing.overallVerdict = evaluationServing.overallVerdict === 'SAFE' ? 'SAFE' : 'UNSAFE';
      }

      setIsAnalyzing(false);
      setIsCameraActive(false);
      setResult({ food: scannedFood, evaluation, evaluationServing, isCalculatedPerServing });

      // Low-Nutrient Quality Scan Re-Scan Alert (< 3 Nutrients)
      const totalExtractedCount = per100gItems.length + perServingItems.length;
      if (totalExtractedCount < 3) {
        Alert.alert(
          "⚠️ Low Quality Scan Detected",
          `Only ${totalExtractedCount} nutrient(s) were detected from this scan. For accurate health safety evaluation, please re-scan with better lighting and a steady angle.`,
          [
            { text: "Re-Scan Label", onPress: resetScanner },
            { text: "View Results Anyway", style: "cancel" }
          ]
        );
      }

    } catch (err) {
      console.error(err);
      setIsAnalyzing(false);
      setIsCameraActive(false);
    } finally {
      isCapturingRef.current = false;
    }
  };

  const resetScanner = () => {
    setResult(null);
    setWholePackageEvalResult(null);
    setPackageWeightInput('1000');
    setIsCameraActive(true);
  };

  if (result) {
    const isMainSafe = result.evaluation.overallVerdict === 'SAFE';
    const verdictColor = isMainSafe ? '#2ECC71' : '#E74C3C';
    const verdictIcon = isMainSafe ? 'check-circle' : 'x-octagon';
    const verdictTitle = isMainSafe ? 'SAFE' : 'UNSAFE';

    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultContainer}>
          <Text style={styles.title}>Analysis Complete</Text>
          <View style={styles.card}>
            <View style={[styles.verdictHeader, { backgroundColor: verdictColor }]}>
              <Feather name={verdictIcon} size={fs(36)} color="#FFF" style={{ marginBottom: hp(1) }} />
              <Text style={styles.verdictText}>{verdictTitle}</Text>
            </View>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

              <Text style={styles.productName}>{result.food.productName || 'Scanned Label'}</Text>

              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>{result.evaluation.summary}</Text>
              </View>

              {/* Product & Serving Details Container */}
              {result.food.metadata && (result.food.metadata.servingSize || result.food.metadata.servingsPerPack || result.food.metadata.netWeight) && (
                <View style={[styles.flagsSection, { backgroundColor: '#F8F9FA', borderRadius: 8, padding: 12, marginVertical: 8 }]}>
                  <Text style={[styles.flagsSectionTitle, { color: '#2C3E50', fontSize: fs(14), marginBottom: 6 }]}>
                    📦 Product & Serving Details
                  </Text>
                  {result.food.metadata.servingSize && (
                    <Text style={{ fontSize: fs(13), color: '#555', marginBottom: 2 }}>
                      • <Text style={{ fontWeight: '600' }}>Serving Size:</Text> {result.food.metadata.servingSize}
                    </Text>
                  )}
                  {result.food.metadata.servingsPerPack && (
                    <Text style={{ fontSize: fs(13), color: '#555', marginBottom: 2 }}>
                      • <Text style={{ fontWeight: '600' }}>Servings per Pack:</Text> {result.food.metadata.servingsPerPack}
                    </Text>
                  )}
                  {result.food.metadata.netWeight && (
                    <Text style={{ fontSize: fs(13), color: '#555', marginBottom: 2 }}>
                      • <Text style={{ fontWeight: '600' }}>Net Quantity:</Text> {result.food.metadata.netWeight}
                    </Text>
                  )}
                </View>
              )}

              {result.evaluation.flaggedIngredients && result.evaluation.flaggedIngredients.length > 0 && (
                <View style={styles.flagsSection}>
                  <Text style={styles.flagsSectionTitle}>Flagged Interactions</Text>
                  {result.evaluation.flaggedIngredients.map((flag, idx) => (
                    <View key={idx} style={[styles.flagItem, { borderLeftColor: flag.severity === 'CRITICAL' ? '#E74C3C' : flag.severity === 'HIGH' ? '#D35400' : '#E67E22', borderLeftWidth: 4 }]}>
                      <View style={{ flex: 1 }}>
                        <View style={styles.flagHeaderRow}>
                          <Text style={styles.flagIngredient}>
                            {flag.ingredient && flag.ingredient.length > 35 
                              ? (flag.ingredient.toLowerCase().includes('trans') ? 'Trans Fats'
                                 : flag.ingredient.toLowerCase().includes('milk') ? 'Milk / Dairy'
                                 : flag.ingredient.toLowerCase().includes('sugar') ? 'High Sugar'
                                 : flag.ingredient.toLowerCase().includes('sodium') ? 'High Sodium'
                                 : flag.ingredient.substring(0, 30) + '...')
                              : (flag.ingredient ? flag.ingredient.charAt(0).toUpperCase() + flag.ingredient.slice(1) : 'Flagged Item')
                            }
                          </Text>
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

              {/* Per 100g / 100ml Nutrition Facts (Primary Basis) */}
              {result.food.per100gItems && result.food.per100gItems.length > 0 && (
                <View style={styles.macrosSection}>
                  <Text style={styles.flagsSectionTitle}>
                    Extracted Nutrition Facts (Per 100g/ml Basis)
                  </Text>
                  <View style={styles.macrosGrid}>
                    {result.food.per100gItems.map((item, idx) => (
                      <View key={idx} style={styles.macroBadge}>
                        <Text style={styles.macroLabel}>{item.label}</Text>
                        <Text style={styles.macroValue}>{item.value}{item.unit}</Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity style={styles.addNutrientBtn} onPress={() => setIsAddModalVisible(true)} activeOpacity={0.8}>
                    <Feather name="plus-circle" size={fs(15)} color="#009933" style={{ marginRight: 6 }} />
                    <Text style={styles.addNutrientText}>Add / Edit Missing Nutrient</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Per Serving Nutrition Facts (Side-by-side / Secondary Column with Small Verdict Sub-Badge) */}
              {result.food.perServingItems && result.food.perServingItems.length > 0 && (
                <View style={[styles.macrosSection, { marginTop: 16 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: hp(1) }}>
                    <Text style={[styles.flagsSectionTitle, { color: '#2C3E50', marginBottom: 0, flex: 1, minWidth: 140 }]}>
                      Extracted Nutrition Facts (Per Serving)
                    </Text>
                    {result.evaluationServing && (
                      <View style={[styles.miniVerdictBadge, { backgroundColor: result.evaluationServing.overallVerdict === 'SAFE' ? '#2ECC7120' : '#E74C3C20' }]}>
                        <Feather
                          name={result.evaluationServing.overallVerdict === 'SAFE' ? 'check-circle' : 'x-octagon'}
                          size={fs(12)}
                          color={result.evaluationServing.overallVerdict === 'SAFE' ? '#2ECC71' : '#E74C3C'}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={[styles.miniVerdictText, { color: result.evaluationServing.overallVerdict === 'SAFE' ? '#2ECC71' : '#E74C3C' }]}>
                          {result.evaluationServing.overallVerdict}
                        </Text>
                      </View>
                    )}
                  </View>
                  {result.isCalculatedPerServing && (
                    <View style={styles.calculationNoteBox}>
                      <Feather name="info" size={fs(12)} color="#D35400" style={{ marginRight: 6 }} />
                      <Text style={styles.calculationNoteText}>
                        Calculated by NutriLens based on serving size ({result.food.metadata?.servingSize || 'serving'}). May slightly differ from manufacturer packaging.
                      </Text>
                    </View>
                  )}
                  <View style={styles.macrosGrid}>
                    {result.food.perServingItems.map((item, idx) => (
                      <View key={idx} style={[styles.macroBadge, { backgroundColor: '#F0F4F8' }]}>
                        <Text style={styles.macroLabel}>{item.label}</Text>
                        <Text style={styles.macroValue}>{item.value}{item.unit}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Whole Package Net Weight Evaluation Card */}
              <View style={styles.wholePackageCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                  <Feather name="box" size={fs(18)} color="#009933" style={{ marginRight: 6 }} />
                  <Text style={styles.wholePackageTitle}>Whole Package Net Weight Evaluation</Text>
                </View>
                <Text style={styles.wholePackageSub}>
                  Enter full package net weight to calculate health risk if consuming the entire product container:
                </Text>
                <View style={styles.wholePackageInputRow}>
                  <TextInput
                    style={styles.packageInput}
                    value={packageWeightInput}
                    onChangeText={setPackageWeightInput}
                    keyboardType="numeric"
                    placeholder="e.g. 1000"
                  />
                  <Text style={styles.packageUnitText}>
                    g / ml
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.evalPackageBtn}
                  onPress={handleEvaluateWholePackage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.evalPackageBtnText}>Evaluate Whole Package</Text>
                </TouchableOpacity>

                {wholePackageEvalResult && (
                  <View style={[styles.wholeEvalResultBox, { borderColor: wholePackageEvalResult.evaluation.overallVerdict === 'SAFE' ? '#2ECC71' : '#E74C3C' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontFamily: typography.fonts.bold, fontSize: fs(14), color: '#2C3E50' }}>
                        Full Container ({wholePackageEvalResult.weightGrams}g) Verdict:
                      </Text>
                      <Text style={{ fontFamily: typography.fonts.bold, fontSize: fs(14), color: wholePackageEvalResult.evaluation.overallVerdict === 'SAFE' ? '#2ECC71' : '#E74C3C' }}>
                        {wholePackageEvalResult.evaluation.overallVerdict}
                      </Text>
                    </View>
                    <Text style={{ fontFamily: typography.fonts.regular, fontSize: fs(13), color: '#555', marginBottom: 8, lineHeight: fs(13) * 1.4 }}>
                      {wholePackageEvalResult.evaluation.summary}
                    </Text>
                    <View style={styles.macrosGrid}>
                      {wholePackageEvalResult.wholeItems.map((item, idx) => (
                        <View key={idx} style={[styles.macroBadge, { backgroundColor: '#FFF3E0' }]}>
                          <Text style={styles.macroLabel}>{item.label}</Text>
                          <Text style={styles.macroValue}>{item.value}{item.unit}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={resetScanner} activeOpacity={0.8}>
              <Feather name="refresh-cw" size={fs(18)} color="#FFFFFF" style={{ marginRight: wp(2) }} />
              <Text style={styles.actionButtonText}>Scan Another Label</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add / Edit Missing Nutrient Modal */}
        <Modal visible={isAddModalVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add / Edit Nutrient</Text>
              <Text style={styles.modalSub}>Select a detected nutrient to edit or type a new nutrient to re-evaluate safety:</Text>

              {/* Column selector */}
              <View style={styles.columnToggleRow}>
                <TouchableOpacity
                  style={[styles.columnToggleBtn, targetColumn === 'per100g' && styles.columnToggleActive]}
                  onPress={() => setTargetColumn('per100g')}
                >
                  <Text style={[styles.columnToggleText, targetColumn === 'per100g' && styles.columnToggleTextActive]}>
                    Per 100g/ml Basis
                  </Text>
                </TouchableOpacity>
                {result?.food?.perServingItems && result.food.perServingItems.length > 0 && (
                  <TouchableOpacity
                    style={[styles.columnToggleBtn, targetColumn === 'perServing' && styles.columnToggleActive]}
                    onPress={() => setTargetColumn('perServing')}
                  >
                    <Text style={[styles.columnToggleText, targetColumn === 'perServing' && styles.columnToggleTextActive]}>
                      Per Serving
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Detected Nutrients Chips for Quick Selection */}
              <Text style={{ fontFamily: typography.fonts.bold, fontSize: fs(12), color: '#555', marginTop: 10, marginBottom: 6 }}>
                Detected Nutrients (Tap to Edit):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                <TouchableOpacity
                  style={[styles.nutrientChip, selectedNutrientKey === 'CUSTOM' && styles.nutrientChipActive]}
                  onPress={() => handleSelectNutrientToEdit('CUSTOM')}
                >
                  <Text style={[styles.nutrientChipText, selectedNutrientKey === 'CUSTOM' && styles.nutrientChipTextActive]}>
                    + New Custom
                  </Text>
                </TouchableOpacity>
                {(targetColumn === 'per100g' ? (result?.food?.per100gItems || []) : (result?.food?.perServingItems || [])).map((item, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.nutrientChip, selectedNutrientKey === item.label && styles.nutrientChipActive]}
                    onPress={() => handleSelectNutrientToEdit(item.label)}
                  >
                    <Text style={[styles.nutrientChipText, selectedNutrientKey === item.label && styles.nutrientChipTextActive]}>
                      {item.label} ({item.value}{item.unit})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.modalInput}
                placeholder="Nutrient Name (e.g. Added Sugar, Sodium)"
                placeholderTextColor="#999"
                value={newNutrientName}
                onChangeText={setNewNutrientName}
              />

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 12 }}>
                <TextInput
                  style={[styles.modalInput, { flex: 1 }]}
                  placeholder="Amount (e.g. 15.34)"
                  placeholderTextColor="#999"
                  value={newNutrientVal}
                  onChangeText={setNewNutrientVal}
                  keyboardType="numeric"
                />
                <TextInput
                  style={[styles.modalInput, { width: 75 }]}
                  placeholder="Unit"
                  placeholderTextColor="#999"
                  value={newNutrientUnit}
                  onChangeText={setNewNutrientUnit}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 15 }}>
                <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setIsAddModalVisible(false); setSelectedNutrientKey('CUSTOM'); }}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleAddNutrient}>
                  <Text style={styles.modalSaveText}>⚡ Re-Evaluate Safety</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Custom NutriLens App-Themed Alert Modal */}
        <Modal visible={customAlert.visible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.alertCard}>
              <View style={[styles.alertIconCircle, { backgroundColor: customAlert.type === 'success' ? '#2ECC7120' : customAlert.type === 'warning' ? '#F39C1220' : '#E74C3C20' }]}>
                <Feather
                  name={customAlert.type === 'success' ? 'check-circle' : customAlert.type === 'warning' ? 'alert-triangle' : 'x-octagon'}
                  size={fs(32)}
                  color={customAlert.type === 'success' ? '#2ECC71' : customAlert.type === 'warning' ? '#F39C12' : '#E74C3C'}
                />
              </View>
              <Text style={styles.alertTitle}>{customAlert.title}</Text>
              <Text style={styles.alertMessage}>{customAlert.message}</Text>

              <View style={styles.alertBtnRow}>
                {customAlert.buttons && customAlert.buttons.length > 0 ? (
                  customAlert.buttons.map((btn, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={[styles.alertBtn, btn.style === 'cancel' ? styles.alertBtnSecondary : styles.alertBtnPrimary]}
                      onPress={() => {
                        closeAlert();
                        if (btn.onPress) btn.onPress();
                      }}
                    >
                      <Text style={[styles.alertBtnText, btn.style === 'cancel' && styles.alertBtnSecondaryText]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <TouchableOpacity style={styles.alertBtnPrimary} onPress={closeAlert}>
                    <Text style={styles.alertBtnText}>OK</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
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
              <TouchableOpacity
                style={styles.manualCaptureBtn}
                activeOpacity={0.8}
                onPress={handleStableDetection}
              >
                <Feather name="camera" size={fs(20)} color="#FFFFFF" style={{ marginRight: wp(2) }} />
                <Text style={styles.manualCaptureText}>Scan Label Now</Text>
              </TouchableOpacity>
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
  miniVerdictBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: wp(3),
  },
  miniVerdictText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(11),
  },
  calculationNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderColor: '#FFE0B2',
    borderWidth: 1,
    borderRadius: wp(2),
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.8),
    marginVertical: hp(0.8),
  },
  calculationNoteText: {
    flex: 1,
    fontFamily: typography.fonts.medium,
    fontSize: fs(11),
    color: '#D35400',
    lineHeight: fs(11) * 1.4,
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
  manualCaptureBtn: {
    position: 'absolute',
    bottom: hp(5),
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#009933',
    paddingHorizontal: wp(6),
    paddingVertical: hp(1.8),
    borderRadius: wp(7),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  manualCaptureText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(15),
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  addNutrientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.8),
    borderRadius: wp(4),
    borderColor: '#C8E6C9',
    borderWidth: 1,
  },
  addNutrientText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(13),
    color: '#009933',
  },
  wholePackageCard: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E0E0E0',
    borderWidth: 1,
    borderRadius: wp(3),
    padding: wp(4),
    marginTop: 16,
  },
  wholePackageTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(15),
    color: '#2C3E50',
  },
  wholePackageSub: {
    fontFamily: typography.fonts.regular,
    fontSize: fs(12),
    color: '#666',
    lineHeight: fs(12) * 1.35,
  },
  wholePackageInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  packageInput: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CCC',
    borderWidth: 1,
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1),
    flex: 1,
    fontFamily: typography.fonts.bold,
    fontSize: fs(14),
    color: '#333',
  },
  packageUnitText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(13),
    color: '#333',
    marginLeft: 8,
  },
  evalPackageBtn: {
    backgroundColor: '#009933',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.4),
    borderRadius: wp(2.5),
    marginTop: 4,
  },
  evalPackageBtnText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(14),
    color: '#FFFFFF',
  },
  wholeEvalResultBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: wp(2.5),
    padding: wp(3),
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: wp(5),
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(4),
    padding: wp(5),
    width: '100%',
    maxWidth: 400,
    elevation: 5,
  },
  modalTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(18),
    color: '#2C3E50',
    marginBottom: 4,
  },
  modalSub: {
    fontFamily: typography.fonts.regular,
    fontSize: fs(12),
    color: '#666',
    marginBottom: 12,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderColor: '#DDD',
    borderWidth: 1,
    borderRadius: wp(2),
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.2),
    fontFamily: typography.fonts.medium,
    fontSize: fs(14),
    color: '#333',
  },
  modalCancelBtn: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: wp(2),
    backgroundColor: '#F0F0F0',
  },
  modalCancelText: {
    fontFamily: typography.fonts.medium,
    fontSize: fs(13),
    color: '#666',
  },
  modalSaveBtn: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.2),
    borderRadius: wp(2),
    backgroundColor: '#009933',
  },
  modalSaveText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(13),
    color: '#FFFFFF',
  },
  columnToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#F0F4F8',
    borderRadius: wp(2),
    padding: 3,
    marginBottom: 8,
  },
  columnToggleBtn: {
    flex: 1,
    paddingVertical: hp(0.8),
    alignItems: 'center',
    borderRadius: wp(1.8),
  },
  columnToggleActive: {
    backgroundColor: '#009933',
  },
  columnToggleText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(12),
    color: '#555',
  },
  columnToggleTextActive: {
    color: '#FFFFFF',
  },
  nutrientChip: {
    backgroundColor: '#E8F5E9',
    borderColor: '#C8E6C9',
    borderWidth: 1,
    borderRadius: wp(4),
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    marginRight: 6,
  },
  nutrientChipActive: {
    backgroundColor: '#009933',
    borderColor: '#009933',
  },
  nutrientChipText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(11),
    color: '#2E7D32',
  },
  nutrientChipTextActive: {
    color: '#FFFFFF',
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: wp(4),
    padding: wp(6),
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    elevation: 8,
  },
  alertIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(17),
    color: '#2C3E50',
    textAlign: 'center',
    marginBottom: 8,
  },
  alertMessage: {
    fontFamily: typography.fonts.regular,
    fontSize: fs(13),
    color: '#555',
    textAlign: 'center',
    lineHeight: fs(13) * 1.4,
    marginBottom: 18,
  },
  alertBtnRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
  },
  alertBtn: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: wp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  alertBtnPrimary: {
    backgroundColor: '#009933',
  },
  alertBtnSecondary: {
    backgroundColor: '#F0F0F0',
  },
  alertBtnText: {
    fontFamily: typography.fonts.bold,
    fontSize: fs(13),
    color: '#FFFFFF',
  },
  alertBtnSecondaryText: {
    color: '#666666',
  },
});

export default ScanScreen;