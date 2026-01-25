import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChopText } from './chop-text';
import { IconSymbol } from './ui/icon-symbol';
import { useAppSelector } from '@/store/hooks';
import { extractRecipeWithGemini } from '@/services/geminiService';
import { ScannedRecipe } from '@/types/recipeScanner';

export interface ScanResult {
  success: boolean;
  recipe?: ScannedRecipe;
  error?: string;
}

interface RecipeScannerProps {
  onScanComplete: (result: ScanResult) => void;
  onClose: () => void;
}

export function RecipeScanner({ onScanComplete, onClose }: RecipeScannerProps) {
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();

  const darkMode = useAppSelector((state) => state.settings.darkMode);
  const themeColor = useAppSelector((state) => state.settings.themeColor);
  const geminiApiKey = useAppSelector((state) => state.settings.recipesSettings.geminiApiKey);

  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Request permission if needed
  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleCapture = async () => {
    if (!camera.current) return;

    setError(null);

    try {
      // Take photo first, before setting any state that might affect the camera
      const photo = await camera.current.takePhoto();
      const photoUri = `file://${photo.path}`;

      // Now set processing state and show preview
      setCapturedPhoto(photoUri);
      setIsProcessing(true);

      // Use Gemini Vision to extract recipe
      const result = await extractRecipeWithGemini(photoUri, geminiApiKey);

      if (result.success && result.ingredients) {
        onScanComplete({
          success: true,
          recipe: {
            name: result.recipeName || '',
            ingredients: result.ingredients,
            rawText: '',
          },
        });
      } else {
        setError(result.error || 'Failed to process image');
        setCapturedPhoto(null);
      }
    } catch (err) {
      console.error('Recipe scan error:', err);
      setError('Failed to capture photo. Please try again.');
      setCapturedPhoto(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setCapturedPhoto(null);
    setError(null);
  };

  if (!hasPermission) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}
      >
        <View style={styles.centered}>
          <IconSymbol name="camera" size={48} color={darkMode ? '#666' : '#999'} />
          <ChopText size="medium" style={styles.permissionText}>
            Camera permission required to scan recipes
          </ChopText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColor }]}
            onPress={requestPermission}
          >
            <ChopText color="#fff" weight="semibold">
              Grant Permission
            </ChopText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
            <ChopText variant="muted">Cancel</ChopText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}
      >
        <View style={styles.centered}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={48}
            color={darkMode ? '#666' : '#999'}
          />
          <ChopText size="medium" style={styles.permissionText}>
            No camera device found
          </ChopText>
          <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
            <ChopText variant="theme">Close</ChopText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <IconSymbol name="xmark" size={24} color="#fff" />
        </TouchableOpacity>
        <ChopText color="#fff" size="large" weight="semibold">
          Scan Recipe
        </ChopText>
        <View style={styles.headerButton} />
      </SafeAreaView>

      {/* Camera or Preview */}
      {capturedPhoto ? (
        <Image source={{ uri: capturedPhoto }} style={styles.preview} />
      ) : (
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={!capturedPhoto && !error}
          photo={true}
          outputOrientation="device"
        />
      )}

      {/* Overlay for guidance */}
      {!capturedPhoto && !isProcessing && !error && (
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
          <ChopText color="#fff" size="small" style={styles.hint}>
            Position the recipe ingredients within the frame
          </ChopText>
        </View>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={themeColor} />
          <ChopText color="#fff" size="medium" style={styles.processingText}>
            Analyzing recipe...
          </ChopText>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.errorOverlay}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#ff3b30" />
          <ChopText color="#fff" size="medium" style={styles.errorText}>
            {error}
          </ChopText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColor }]}
            onPress={handleRetry}
          >
            <ChopText color="#fff" weight="semibold">
              Try Again
            </ChopText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
            <ChopText color="#fff" variant="muted">
              Cancel
            </ChopText>
          </TouchableOpacity>
        </View>
      )}

      {/* Capture button */}
      {!capturedPhoto && !isProcessing && !error && (
        <SafeAreaView edges={['bottom']} style={styles.controls}>
          <TouchableOpacity
            style={[styles.captureButton, { borderColor: themeColor }]}
            onPress={handleCapture}
          >
            <View style={[styles.captureButtonInner, { backgroundColor: themeColor }]} />
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  permissionText: {
    textAlign: 'center',
    marginTop: 8,
  },
  preview: {
    flex: 1,
    resizeMode: 'cover',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '85%',
    height: '60%',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  hint: {
    marginTop: 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  processingText: {
    marginTop: 16,
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 32,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelLink: {
    marginTop: 16,
    padding: 8,
  },
});
