import React, { forwardRef, useImperativeHandle, useRef, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, Dimensions, ActivityIndicator } from 'react-native';
import { Camera, useCameraDevice, CameraRef, Frame, useFrameOutput } from 'react-native-vision-camera';
import { NitroModules } from 'react-native-nitro-modules';
import Animated, { useSharedValue, useAnimatedStyle, runOnJS, withSpring, withTiming } from 'react-native-reanimated';
import { calculateLetterboxDetails, unletterboxCoords, mapBoxToScreen, Orientation } from '../../utils/coordinateTransforms';
import { useTFLite } from '../../context/TFLiteContext';
import { calculateLaplacianVariance } from '../../services/imageAnalysis';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

export interface NutritionScannerRef {
  takeSnapshot: () => Promise<{ path: string; details: any } | null>;
  focus: () => Promise<void>;
}

interface NutritionScannerProps {
  isActive: boolean;
  onStableDetection: (details: any) => void;
}

export const NutritionScanner = forwardRef<NutritionScannerRef, NutritionScannerProps>(({ isActive, onStableDetection }, ref) => {
  const device = useCameraDevice('back');
  const cameraRef = useRef<CameraRef>(null);

  const { tfModel, gpuResizer } = useTFLite();

  const model = tfModel.state === 'loaded' ? tfModel.model : undefined;
  const resizer = gpuResizer.state === 'ready' ? gpuResizer.resizer : undefined;

  const boxX = useSharedValue(0);
  const boxY = useSharedValue(0);
  const boxWidth = useSharedValue(0);
  const boxHeight = useSharedValue(0);
  const boxOpacity = useSharedValue(0);

  const currentBoxJson = useSharedValue('');
  const lastInferenceTime = useSharedValue(0);
  const lastDiagnosticLogTime = useSharedValue(0);

  const consecutiveDetections = useSharedValue(0);
  const isActiveWorklet = useSharedValue(true);
  const [lightingAlert, setLightingAlert] = React.useState<'too_bright' | 'too_dark' | null>(null);

  React.useEffect(() => {
    console.log(`[NutritionScanner] Model State: ${tfModel.state}, Resizer State: ${gpuResizer.state}`);
    if (tfModel.state === 'error') {
      console.error("[NutritionScanner] TFLite Model Error:", (tfModel as any).error);
    }
  }, [tfModel.state, gpuResizer.state]);

  const triggerFocus = useCallback(() => {
    if (cameraRef.current) {
      const cam = cameraRef.current as any;
      if (typeof cam.focusTo === "function") {
        cam.focusTo({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 })?.catch?.(() => {});
      } else if (typeof cam.focus === "function") {
        cam.focus({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 })?.catch?.(() => {});
      }
    }
  }, []);

  useImperativeHandle(ref, () => ({
    async focus() {
      triggerFocus();
    },
    async takeSnapshot() {
      if (!cameraRef.current) return null;
      triggerFocus();
      console.log("[NutritionScanner] Grabbing high-quality snapshot...");
      const image = await cameraRef.current.takeSnapshot();
      const tempPath = await image.saveToTemporaryFileAsync('jpg', 90);
      return {
        path: tempPath,
        details: JSON.parse(currentBoxJson.value || '{}'),
      };
    }
  }));

  React.useEffect(() => {
    if (isActive) {
      consecutiveDetections.value = 0;
      isActiveWorklet.value = true;
    }
  }, [isActive]);

  const boxedModel = useMemo(
    () => (model != null ? NitroModules.box(model) : undefined),
    [model]
  );
  const boxedResizer = useMemo(
    () => (resizer != null ? NitroModules.box(resizer) : undefined),
    [resizer]
  );

  const onFrame = useCallback((frame: Frame) => {
    'worklet';
    if (frame.width <= 0 || frame.height <= 0) {
      return;
    }

    if (!isActiveWorklet.value) {
      frame.dispose();
      return;
    }

    let gpuFrame: any = null;
    try {
      const actualModel = boxedModel ? boxedModel.unbox() : undefined;
      const actualResizer = boxedResizer ? boxedResizer.unbox() : undefined;

      const now = performance.now();

      if (!actualModel) {
        if (now - lastDiagnosticLogTime.value > 2000) {
          lastDiagnosticLogTime.value = now;
          console.log("[NutritionScanner] Waiting for TFLite model unbox...");
        }
        frame.dispose();
        return;
      }

      if (now - lastInferenceTime.value < 250) {
        frame.dispose();
        return;
      }
      lastInferenceTime.value = now;

      if (!(globalThis as any).inputBuffer) {
        (globalThis as any).inputBuffer = new Float32Array(3 * 640 * 640);
      }
      const floatBufferView = (globalThis as any).inputBuffer as Float32Array;
      const tfliteInputBuffer = floatBufferView.buffer as ArrayBuffer;
      const inv255 = 1.0 / 255.0;

      if (actualResizer) {
        gpuFrame = actualResizer.resize(frame);
        const buffer = gpuFrame.getPixelBuffer();
        const uintBytes = new Uint8Array(buffer);
        const limit = Math.min(uintBytes.length, floatBufferView.length);
        for (let i = 0; i < limit; i++) {
          floatBufferView[i] = uintBytes[i] * inv255;
        }
      } else {
        try {
          const planes = frame.getPlanes();
          if (planes.length > 0) {
            const rawBuffer = planes[0].getPixelBuffer();
            const rawBytes = new Uint8Array(rawBuffer);

            const scaleX = frame.width / 640;
            const scaleY = frame.height / 640;
            const greenOffset = 409600;
            const blueOffset = 819200;

            for (let y = 0; y < 640; y++) {
              const srcY = Math.floor(y * scaleY);
              const srcRowOffset = srcY * frame.width;
              for (let x = 0; x < 640; x++) {
                const srcX = Math.floor(x * scaleX);
                const val = rawBytes[srcRowOffset + srcX] * inv255;
                const destIdx = y * 640 + x;
                floatBufferView[destIdx] = val;
                floatBufferView[greenOffset + destIdx] = val;
                floatBufferView[blueOffset + destIdx] = val;
              }
            }
          } else {
            frame.dispose();
            return;
          }
        } catch (cpuError) {
          floatBufferView.fill(0);
        }
      }

      const details = calculateLetterboxDetails(frame.width, frame.height);

      const outputs = actualModel.runSync([tfliteInputBuffer]);
      if (!outputs || outputs.length === 0) {
        frame.dispose();
        return;
      }
      const outputArray = new Float32Array(outputs[0]);
      const numElements = outputArray.length;

      let maxScore = 0;
      let bestBox = null;

      // 1. Transposed Tensor Format Parsing [1, 5, 8400]
      if (numElements === 42000 || numElements % 8400 === 0) {
        for (let i = 0; i < 8400; i++) {
          const rawScore = outputArray[4 * 8400 + i];
          const score = rawScore < 0 || rawScore > 1.0 ? 1.0 / (1.0 + Math.exp(-rawScore)) : rawScore;

          if (score > 0.01 && score > maxScore) {
            maxScore = score;
            let cx = outputArray[i];
            let cy = outputArray[8400 + i];
            let w = outputArray[2 * 8400 + i];
            let h = outputArray[3 * 8400 + i];

            if (cx <= 1.0 && cy <= 1.0 && w <= 1.0 && h <= 1.0) {
              cx *= 640;
              cy *= 640;
              w *= 640;
              h *= 640;
            }

            bestBox = unletterboxCoords(cx, cy, w, h, details);
          }
        }
      }

      // 2. Untransposed Tensor Format Parsing [1, 8400, 5]
      if (maxScore < 0.05 && numElements >= 42000) {
        const stride = Math.floor(numElements / 8400);
        for (let i = 0; i < 8400; i++) {
          const idx = i * stride;
          const rawScore = outputArray[idx + 4];
          const score = rawScore < 0 || rawScore > 1.0 ? 1.0 / (1.0 + Math.exp(-rawScore)) : rawScore;

          if (score > 0.01 && score > maxScore) {
            maxScore = score;
            let cx = outputArray[idx];
            let cy = outputArray[idx + 1];
            let w = outputArray[idx + 2];
            let h = outputArray[idx + 3];

            if (cx <= 1.0 && cy <= 1.0 && w <= 1.0 && h <= 1.0) {
              cx *= 640;
              cy *= 640;
              w *= 640;
              h *= 640;
            }

            bestBox = unletterboxCoords(cx, cy, w, h, details);
          }
        }
      }

      // (Removed artificial fallback box)

      const sharpness = calculateLaplacianVariance(floatBufferView, 640, 640);

      let lumSum = 0;
      let lumSamples = 0;
      // Sample Y-luminance channel (indices 0 to 409600)
      for (let i = 0; i < 409600; i += 500) {
        lumSum += floatBufferView[i];
        lumSamples++;
      }
      const avgBrightness = lumSamples > 0 ? (lumSum / lumSamples) * 255.0 : 128;

      if (now - lastDiagnosticLogTime.value > 1500) {
        lastDiagnosticLogTime.value = now;
        console.log(`[YOLO-DIAGNOSTIC] Tensor Size: ${numElements}, Score: ${maxScore.toFixed(3)}, Sharpness: ${sharpness.toFixed(1)}, Brightness: ${avgBrightness.toFixed(1)}`);
        if (avgBrightness > 235) {
          runOnJS(setLightingAlert)('too_bright');
        } else if (avgBrightness < 25) {
          runOnJS(setLightingAlert)('too_dark');
        } else {
          runOnJS(setLightingAlert)(null);
        }
      }

      if (bestBox) {
        if (maxScore >= 0.60) {
          consecutiveDetections.value += 1;
        } else {
          consecutiveDetections.value = 0;
        }

        const isStable = consecutiveDetections.value >= 6;
        const ori = (frame.orientation as string);
        let orientationStr: Orientation = 'landscape-left';
        if (ori === 'right' || ori === 'portrait') {
          orientationStr = 'portrait';
        } else if (ori === 'left' || ori === 'portrait-upside-down') {
          orientationStr = 'portrait-upside-down';
        } else if (ori === 'down' || ori === 'landscape-right') {
          orientationStr = 'landscape-right';
        }

        const screenCoords = mapBoxToScreen(
          bestBox,
          orientationStr,
          frame.width,
          frame.height,
          SCREEN_WIDTH,
          SCREEN_HEIGHT
        );

        boxX.value = screenCoords.x;
        boxY.value = screenCoords.y;
        boxWidth.value = screenCoords.width;
        boxHeight.value = screenCoords.height;

        if (isStable) {
          console.log(`[YOLO-STABILITY-PASS] Active Table Lock! Score: ${maxScore.toFixed(3)}, Sharpness: ${sharpness.toFixed(1)}`);
          isActiveWorklet.value = false; // Freeze worklet instantly
          consecutiveDetections.value = 0; // Reset counter so it never re-fires
          currentBoxJson.value = JSON.stringify({ box: bestBox, frameWidth: frame.width, frameHeight: frame.height });
          runOnJS(onStableDetection)({
            box: bestBox,
            frameWidth: frame.width,
            frameHeight: frame.height,
            orientation: orientationStr
          });
          boxOpacity.value = 1;
        } else {
          boxOpacity.value = maxScore >= 0.50 ? 0.8 : (maxScore >= 0.35 ? 0.5 : 0);
        }
      } else {
        consecutiveDetections.value = 0;
        boxOpacity.value = 0;
      }
    } catch (err: any) {
      console.log(`[YOLO-ERROR] Worklet exception: ${err.message || err}`);
    } finally {
      if (gpuFrame != null) {
        gpuFrame.dispose();
      }
      frame.dispose();
    }
  }, [boxedModel, boxedResizer]);

  const frameOutput = useFrameOutput({
    onFrame,
    pixelFormat: 'yuv',
  });

  const animatedStyle = useAnimatedStyle(() => ({
    left: withSpring(boxX.value, { damping: 15, stiffness: 120 }),
    top: withSpring(boxY.value, { damping: 15, stiffness: 120 }),
    width: withSpring(boxWidth.value, { damping: 15, stiffness: 120 }),
    height: withSpring(boxHeight.value, { damping: 15, stiffness: 120 }),
    opacity: withTiming(boxOpacity.value, { duration: 150 }),
  }));

  if (device == null) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No camera device found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef as any}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        outputs={[frameOutput]}
      />
      <Animated.View style={[styles.boundingBox, animatedStyle]} />

      {lightingAlert && (
        <View style={styles.lightingPill}>
          <Text style={styles.lightingText}>
            {lightingAlert === 'too_bright'
              ? '⚠️ Lighting Too Bright - Avoid Direct Glare'
              : '💡 Lighting Too Dark - Move to Brighter Area'}
          </Text>
        </View>
      )}

      {tfModel.state !== 'loaded' && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>
            {tfModel.state === 'error' ? 'Failed to load detection model' : 'Loading Detection Model...'}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  lightingPill: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderColor: '#F39C12',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 999,
  },
  lightingText: {
    fontWeight: 'bold',
    fontSize: 13,
    color: '#FFCC00',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  boundingBox: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#10B981',
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NutritionScanner;
