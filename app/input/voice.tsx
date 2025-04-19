import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import OpenAI from "openai";

// Initialize OpenAI client with API key from environment variable
const client = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

function VoiceInputScreen() {
  const colorScheme = useColorScheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navigation handler
  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  async function startRecording() {
    try {
      // Request permissions
      const { status } = await Audio.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.error('Permission to access microphone was denied');
        return;
      }

      // Prepare the recording session
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording...');
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  }

  async function stopRecording() {
    if (!recording) return;

    console.log('Stopping recording...');
    setIsRecording(false);
    
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      console.log('Recording stopped and stored at', uri);
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  }

  // Submit handler
  const handleSubmit = async () => {
    if (!audioUri || isSubmitting) return;
    
    setIsSubmitting(true);
    
    console.log('Submitting audio to OpenAI:', audioUri);
    
    try {
      // Create a FormData object to send the audio file
      const formData = new FormData();
      formData.append('file', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      formData.append('model', 'whisper-1');
      
      // First transcribe the audio using Whisper API
      const transcriptionResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
      
      const transcriptionData = await transcriptionResponse.json();
      const transcription = transcriptionData.text;
      
      console.log('Transcription:', transcription);
      
      // Now send the transcription to GPT for processing
      const response = await client.responses.create({
        model: "gpt-4.1",
        input: [
          {
            role: "developer",
            content: "Be helpful and concise."
          },
          {
            role: "user",
            content: transcription,
          },
        ],
      });
      
      const aiResponse = response.output_text;
      
      // Navigate to instructions screen with the response
      router.push({
        pathname: '/input/instructions',
        params: { aiResponse }
      });
      
    } catch (error) {
      console.error('Error processing audio:', error);
      setIsSubmitting(false);
    }
  };

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
        
        {/* Recording visualization */}
        <View style={styles.visualizerContainer}>
          {/* Record/Stop Button */}
          {!isRecording ? (
            <TouchableOpacity 
              style={styles.recordButton}
              onPress={startRecording}
              disabled={isSubmitting}
            >
              <IconSymbol name="mic.fill" size={32} color="white" />
              <ThemedText style={styles.buttonText}>START</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.recordButton, styles.recordingButton]}
              onPress={stopRecording}
              disabled={isSubmitting}
            >
              <IconSymbol name="stop.fill" size={32} color="white" />
              <ThemedText style={styles.buttonText}>STOP</ThemedText>
            </TouchableOpacity>
          )}
          
          {/* Recording status */}
          {isRecording && (
            <ThemedText style={styles.statusText}>Recording...</ThemedText>
          )}
          
          {/* Recording complete indicator */}
          {audioUri && !isRecording && (
            <ThemedText style={styles.statusText}>Recording complete</ThemedText>
          )}
        </View>
        
        {/* Submit button - only show after recording is complete */}
        {audioUri && !isRecording && (
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
              </>
            )}
          </TouchableOpacity>
        )}
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
  visualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  recordButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  recordingButton: {
    backgroundColor: '#d9534f',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 10,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
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
});

export default VoiceInputScreen; 