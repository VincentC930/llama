import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { Audio } from 'expo-av';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, cancelAnimation } from 'react-native-reanimated';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

function VoiceInputScreen() {
  const colorScheme = useColorScheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  
  // Animation value for recording indicator
  const pulseAnim = useSharedValue(1);
  
  // Request permissions when component mounts
  useEffect(() => {
    requestPermission();
    return () => {
      stopRecording();
    };
  }, []);
  
  // Timer for recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else if (!isRecording && recordingDuration !== 0) {
      clearInterval(interval as NodeJS.Timeout);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingDuration]);
  
  // Animation for recording indicator
  useEffect(() => {
    if (isRecording) {
      pulseAnim.value = withRepeat(
        withTiming(1.2, { duration: 1000 }),
        -1,
        true
      );
    } else {
      cancelAnimation(pulseAnim);
      pulseAnim.value = 1;
    }
  }, [isRecording]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseAnim.value }],
    };
  });
  
  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        await requestPermission();
        return;
      }
      
      // Prepare recording
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      
      // Start recording
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
      setRecordingDuration(0);
      setHasRecording(false);
      
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };
  
  const stopRecording = async () => {
    if (!recording) return;
    
    try {
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      setIsRecording(false);
      setHasRecording(true);
      
    } catch (err) {
      console.error('Failed to stop recording', err);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const handleBack = () => {
    router.back();
  };
  
  const handleSubmit = () => {
    if (!hasRecording || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // In a real app, you would upload the recording here
    // For now, we'll just navigate to the instructions screen
    
    setTimeout(() => {
      setIsSubmitting(false);
      router.push({
        pathname: '/input/instructions'
      });
    }, 1000); // Simulate processing delay
  };
  
  const handleRecordButton = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  const handleRerecord = () => {
    setHasRecording(false);
    setRecording(null);
    setRecordingDuration(0);
  };
  
  // Check if microphone permissions are denied
  if (permissionResponse && !permissionResponse.granted && permissionResponse.canAskAgain === false) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText style={styles.permissionText}>
          We need microphone permissions to record voice. Please enable microphone access in your device settings.
        </ThemedText>
        <TouchableOpacity 
          style={styles.goBackButton} 
          onPress={handleBack}>
          <ThemedText style={styles.goBackText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
          >
            <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <ThemedText type="title">Voice Input</ThemedText>
          <View style={styles.placeholderButton} />
        </View>
        
        {/* Instructions */}
        <ThemedView style={styles.instructions}>
          <IconSymbol name="mic" size={40} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.instructionsText}>
            {hasRecording 
              ? "Your recording is ready to submit"
              : isRecording 
                ? "Recording in progress..." 
                : "Tap the microphone button to start recording your message"
            }
          </ThemedText>
        </ThemedView>
        
        {/* Recording visualization */}
        <ThemedView style={styles.visualizerContainer}>
          {isRecording && (
            <Animated.View style={[styles.pulseCircle, animatedStyle]} />
          )}
          
          {/* Record/Stop Button */}
          <TouchableOpacity 
            style={[
              styles.recordButton, 
              isRecording && styles.recordingButton
            ]} 
            onPress={handleRecordButton}
            disabled={isSubmitting || (hasRecording && !isRecording)}
          >
            <IconSymbol 
              name={isRecording ? "stop.fill" : "mic.fill"} 
              size={32} 
              color="white" 
            />
          </TouchableOpacity>
          
          {/* Timer */}
          {(isRecording || hasRecording) && (
            <ThemedText style={styles.timer}>
              {formatTime(recordingDuration)}
            </ThemedText>
          )}
        </ThemedView>
        
        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          {hasRecording && (
            <>
              {/* Re-record button */}
              <TouchableOpacity 
                style={styles.rerecordButton} 
                onPress={handleRerecord}
                disabled={isSubmitting}
              >
                <IconSymbol name="arrow.counterclockwise" size={20} color={Colors[colorScheme ?? 'light'].text} />
                <ThemedText style={styles.rerecordText}>Record again</ThemedText>
              </TouchableOpacity>
              
              {/* Submit button */}
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled
                ]} 
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ThemedText style={styles.submitText}>Processing...</ThemedText>
                ) : (
                  <>
                    <ThemedText style={styles.submitText}>Submit</ThemedText>
                    <IconSymbol name="arrow.right" size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  placeholderButton: {
    width: 44, // Same width as back button for balance
  },
  instructions: {
    alignItems: 'center',
    marginBottom: 40,
  },
  instructionsText: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
    lineHeight: 24,
  },
  visualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseCircle: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(200, 50, 50, 0.2)',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6090C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#d9534f',
  },
  timer: {
    marginTop: 20,
    fontSize: 24,
    fontWeight: '600',
  },
  actionsContainer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  rerecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    marginBottom: 15,
  },
  rerecordText: {
    marginLeft: 8,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#6090C0',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0B0C0',
    opacity: 0.7,
  },
  submitText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 18,
    marginRight: 10,
  },
  permissionText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  goBackButton: {
    backgroundColor: '#6090C0',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  goBackText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default VoiceInputScreen; 