import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button } from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Assuming uses modern react-native-picker since React Native deprecated core Picker
import { evaluateFoodSafety } from '../../services/healthEngine';
import { MOCK_PRODUCTS } from '../../mocks/healthEngine/mockDetectedFood';
import { MOCK_PROFILES } from '../../mocks/healthEngine/mockUserProfiles';

// TEMP: remove before production merge
export default function HealthEngineTestScreen() {
    const [selectedProductIndex, setSelectedProductIndex] = useState(0);
    const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
    const [result, setResult] = useState<any>(null);

    const handleRunEvaluation = () => {
        const food = MOCK_PRODUCTS[selectedProductIndex];
        const profile = MOCK_PROFILES[selectedProfileIndex];

        // Check if libraries work properly in case there are mismatches
        try {
            const res = evaluateFoodSafety(food, profile);
            setResult(res);
        } catch (e: any) {
            setResult({ error: e.message || 'Unknown error' });
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Health Engine Tester</Text>

            <Text style={styles.label}>Select Mock Product:</Text>
            <View style={styles.pickerContainer}>
                {/* If @react-native-picker/picker is not installed, this might fail, fallback gracefully if needed */}
                <Picker selectedValue={selectedProductIndex} onValueChange={(val: number) => setSelectedProductIndex(val)}>
                    {MOCK_PRODUCTS.map((p, i) => (
                        <Picker.Item key={i} label={p.productName || `Product ${i}`} value={i} />
                    ))}
                </Picker>
            </View>

            <Text style={styles.label}>Select Mock Profile:</Text>
            <View style={styles.pickerContainer}>
                <Picker selectedValue={selectedProfileIndex} onValueChange={(val: number) => setSelectedProfileIndex(val)}>
                    {MOCK_PROFILES.map((p, i) => (
                        <Picker.Item key={i} label={p.userId} value={i} />
                    ))}
                </Picker>
            </View>

            <Button title="Run Evaluation" onPress={handleRunEvaluation} />

            {result && (
                <View style={styles.resultContainer}>
                    {result.error ? (
                        <Text style={styles.verdict}>Error: {result.error}</Text>
                    ) : (
                        <>
                            <Text style={styles.verdict}>Verdict: {result.overallVerdict}</Text>
                            <Text style={styles.risk}>Risk Score: {result.riskScore}</Text>
                            <Text style={styles.summary}>{result.summary}</Text>
                            <Text style={styles.json}>{JSON.stringify(result, null, 2)}</Text>
                        </>
                    )}
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
    label: { fontSize: 16, marginTop: 10, fontWeight: '600' },
    pickerContainer: { borderWidth: 1, borderColor: '#ccc', marginVertical: 5 },
    resultContainer: { marginTop: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8 },
    verdict: { fontSize: 20, fontWeight: 'bold', color: '#ff4444' },
    risk: { fontSize: 16, marginVertical: 5 },
    summary: { fontSize: 14, fontStyle: 'italic', marginBottom: 10 },
    json: { fontSize: 12, fontFamily: 'monospace' }
});
