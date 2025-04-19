import { StyleSheet, View, Text, TouchableOpacity, Image, Modal } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { CameraView, CameraType, FlashMode, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ImageInputScreen() {
  const [type, setType] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [permission, requestPermission] = useCameraPermissions();
  const [lastPhoto, setLastPhoto] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermissionRequested, setCameraPermissionRequested] = useState(false);

  // Request camera permissions when component mounts
  useEffect(() => {
    (async () => {
      // Request camera permissions
      if (permission) {
        if (!permission.granted && !cameraPermissionRequested) {
          await requestPermission();
          setCameraPermissionRequested(true);
        }
      }
    })();
  }, [permission, cameraPermissionRequested]);

  if (!permission) {
    // Camera permissions are still loading
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading camera permissions...</ThemedText>
      </ThemedView>
    );
  }

  if (!permission.granted) {
    // Camera permissions were denied
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.text}>
          We need camera permissions to take photos. Please enable camera access in your device settings.
        </ThemedText>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.back()}>
          <Text style={styles.confirmText}>Go Back</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  const toggleCameraType = () => {
    setType((current: CameraType) => (current === 'back' ? 'front' : 'back'));
  };

  const toggleFlash = () => {
    setFlash((current: FlashMode) => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        if (photo) {
          const imageUri = photo.uri;
          // Check if the image is HEIC format
          if (imageUri.toLowerCase().endsWith('.heic')) {
            const convertedImage = await convertHeicToJpeg(imageUri);
            setLastPhoto(convertedImage);
          } else {
            setLastPhoto(imageUri);
          }
          setShowConfirmation(true); // Show the confirmation modal
        }
      } catch (e) {
        console.error('Error taking picture:', e);
      }
    }
  };

  const pickImage = async () => {
    try {
      // No permissions request is necessary for launching the image library
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: true, // Get EXIF data which may include format info
      });

      if (!result.canceled) {
        const imageAsset = result.assets[0];
        const imageUri = imageAsset.uri;
        
        // Check if image is HEIC/HEIF format by extension or mime type
        const isHeicFormat = 
          imageUri.toLowerCase().endsWith('.heic') || 
          imageUri.toLowerCase().endsWith('.heif') ||
          imageAsset.mimeType?.includes('heic') || 
          imageAsset.mimeType?.includes('heif');
        
        if (isHeicFormat) {
          console.log('HEIC/HEIF image detected, converting to JPEG');
          const convertedImage = await convertHeicToJpeg(imageUri);
          setLastPhoto(convertedImage);
        } else {
          setLastPhoto(imageUri);
        }
        setShowConfirmation(true);
      }
    } catch (e) {
      console.error('Error picking image:', e);
    }
  };

  // Function to convert HEIC to JPEG
  const convertHeicToJpeg = async (uri: string): Promise<string> => {
    try {
      console.log('Converting HEIC to JPEG...');
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [], // No transformations needed, just format conversion
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
      );
      console.log('Conversion successful:', manipResult.uri);
      return manipResult.uri;
    } catch (error) {
      console.error('Error converting HEIC to JPEG:', error);
      // Return original URI if conversion fails
      return uri;
    }
  };

  const handleConfirm = async () => {
    if (!lastPhoto) return;
    
    try {
      setIsProcessing(true);
      
      // Simulate processing the image
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For now, just return to the previous screen
      router.back();
      
    } catch (error) {
      console.error('Error processing image:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetake = () => {
    setShowConfirmation(false);
    setLastPhoto(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={type}
        flash={flash}
      >
        {/* Flash Button - Top Left */}
        <TouchableOpacity style={styles.flashButton} onPress={toggleFlash}>
          <IconSymbol 
            name={flash === 'off' ? 'bolt.slash' : flash === 'on' ? 'bolt.fill' : 'bolt'} 
            size={24} 
            color="white"
          />
        </TouchableOpacity>
        
        {/* Back Button - Top Left */}
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="white" />
        </TouchableOpacity>
        
        {/* Bottom Controls Container */}
        <View style={styles.buttonContainer}>
          {/* Gallery Button - Left */}
          <TouchableOpacity style={styles.iconButton} onPress={pickImage}>
            <IconSymbol name="photo.on.rectangle" size={24} color="white" />
          </TouchableOpacity>
          
          {/* Take Picture Button - Center */}
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          {/* Flip Camera Button - Right */}
          <TouchableOpacity style={styles.iconButton} onPress={toggleCameraType}>
            <IconSymbol name="camera.rotate" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </CameraView>
      
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirm Image</Text>
            
            {lastPhoto && (
              <Image source={{ uri: lastPhoto }} style={styles.previewImageLarge} />
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={handleRetake}
                disabled={isProcessing}
              >
                <Text style={styles.retakeText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleConfirm}
                disabled={isProcessing}
              >
                <Text style={styles.confirmText}>
                  {isProcessing ? 'Processing...' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Small preview thumbnail (when not in confirmation mode) */}
      {lastPhoto && !showConfirmation && (
        <View style={styles.preview}>
          <Image source={{ uri: lastPhoto }} style={styles.previewImage} />
          <TouchableOpacity 
            style={styles.closePreview} 
            onPress={() => setLastPhoto(null)}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 80,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    padding: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 20,
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
  },
  retakeText: {
    color: '#6090C0',
    fontSize: 16,
  },
  iconButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 30,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  preview: {
    position: 'absolute',
    right: 20,
    top: 40,
    width: 80,
    height: 120,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'white',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  closePreview: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '90%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  previewImageLarge: {
    width: '100%',
    height: 350,
    borderRadius: 10,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#6090C0',
    borderWidth: 2,
    borderColor: '#6090C0',
  },
  cancelButton: {
    borderColor: '#6090C0',
    borderWidth: 2,
  },
  flashButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 30,
    zIndex: 10,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 12,
    borderRadius: 30,
    zIndex: 10,
  },
}); 