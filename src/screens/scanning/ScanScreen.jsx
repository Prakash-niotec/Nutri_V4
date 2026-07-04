import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { typography } from '../../utils/typography';

const ScanScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Feather name="camera" size={48} color="#009933" />
        </View>
        <Text style={styles.title}>Food & Label Scanner</Text>
        <Text style={styles.subtitle}>
          Position your produce or nutrition label within the camera frame to analyze ingredients and health guidelines.
        </Text>

        <TouchableOpacity 
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={() => alert('Camera scanning feature ready to be integrated!')}
        >
          <Feather name="maximize" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.actionButtonText}>Start Scanning</Text>
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
    paddingHorizontal: 30,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#D2F0DA',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#A8E3B9',
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: 26,
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 15,
    color: '#555555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#009933',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  actionButtonText: {
    fontFamily: typography.fonts.bold,
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default ScanScreen;