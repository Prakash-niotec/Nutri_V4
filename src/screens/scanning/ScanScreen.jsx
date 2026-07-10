import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { typography } from '../../utils/typography';
import { wp, hp, fs, STATUS_BAR_HEIGHT } from '../../utils/responsive';

const ScanScreen = ({ navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [extractedText, setExtractedText] = useState('');

  const startScanning = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        alert("Camera permission is required to scan.");
        return;
      }
    }
    setExtractedText('');
    setIsCameraActive(true);
  };

  const handleBarcodeScanned = ({ type, data }) => {
    setIsCameraActive(false);
    setExtractedText(`Scanned Data:\n${data}`);
  };

  const resetScanner = () => {
    setExtractedText('');
    setIsCameraActive(false);
  };

  if (extractedText) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.resultContainer}>
          <Text style={styles.title}>Scan Result</Text>
          <View style={styles.card}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <Text style={styles.resultText}>{extractedText}</Text>
            </ScrollView>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionButton} onPress={resetScanner} activeOpacity={0.8}>
              <Feather name="refresh-cw" size={fs(18)} color="#FFFFFF" style={{ marginRight: wp(2) }} />
              <Text style={styles.actionButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isCameraActive) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e", "code128"],
          }}
        >
          <View style={styles.cameraOverlay}>
            <Text style={{ color: 'white', marginBottom: hp(2), fontFamily: typography.fonts.semiBold }}>Point at QR or Barcode</Text>
            <View style={styles.scanFrame} />
          </View>
          <View style={styles.controls}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCameraActive(false)}>
              <Feather name="x" size={fs(28)} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Feather name="camera" size={fs(44)} color="#009933" />
        </View>
        <Text style={styles.title}>Food & Label Scanner</Text>
        <Text style={styles.subtitle}>
          Position your produce or nutrition label within the camera frame to analyze ingredients and health guidelines.
        </Text>

        <TouchableOpacity
          style={styles.actionButton}
          activeOpacity={0.8}
          onPress={startScanning}
        >
          <Feather name="maximize" size={fs(18)} color="#FFFFFF" style={{ marginRight: wp(2) }} />
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
    paddingHorizontal: wp(8),
    paddingTop: Platform.OS === 'android' ? STATUS_BAR_HEIGHT : 0,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(8),
  },
  loadingText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: fs(16),
    color: '#009933',
    marginTop: hp(2),
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
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  scanFrame: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderWidth: 2,
    borderColor: '#009933',
    borderRadius: wp(4),
    backgroundColor: 'transparent',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: hp(5),
    paddingTop: hp(2),
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  captureBtn: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#009933',
  },
  closeBtn: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
    padding: wp(4),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(2),
  },
  resultText: {
    fontFamily: typography.fonts.regular,
    fontSize: fs(14),
    color: '#333333',
    lineHeight: fs(14) * 1.5,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
});

export default ScanScreen;