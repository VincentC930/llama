import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import OpenAI from "openai";
import Voice from '@react-native-voice/voice';


// Initialize OpenAI client with API key from environment variable
const client = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

function VoiceInputScreen() {
  const colorScheme = useColorScheme();
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Navigation handler
  const handleBack = () => {
    router.back();
  };

  useEffect(() => {
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    } 
  }, []);

  const startSpeechToText = async () => {
    setResults([]);
    console.log(results)
    try {
      console.log("Starting speech to text1");
      await Voice.start("en-US");
      console.log("Starting speech to text2");
    } catch (error) {
      console.log(error);
    }
    setStarted(true);
  };

  const onSpeechResults = async (result: any) => {
    console.log("Speech results");
    setResults(result.value);
    
    console.log(result)

  };

  const onSpeechError = (error: any) => {
    console.log(error);
  };

  const stopSpeechToText = async () => {
    await Voice.stop();
    setStarted(false);
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!results.length || isSubmitting) return;
    
    setIsSubmitting(true);
    const transcription = results[0];
    
    console.log('Submitting transcription to OpenAI:', transcription);
    
    try {
      // Make API call to OpenAI
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
      console.error('Error calling OpenAI API:', error);
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
        
        {/* Speech visualization and transcription */}
        <View style={styles.visualizerContainer}>
          {/* Record/Stop Button */}
          {!started ? (
            <TouchableOpacity 
              style={styles.recordButton}
              onPress={startSpeechToText}
              disabled={isSubmitting}
            >
              <IconSymbol name="mic.fill" size={32} color="white" />
              <ThemedText style={styles.buttonText}>START</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.recordButton, styles.recordingButton]}
              onPress={stopSpeechToText}
              disabled={isSubmitting}
            >
              <IconSymbol name="stop.fill" size={32} color="white" />
              <ThemedText style={styles.buttonText}>STOP</ThemedText>
            </TouchableOpacity>
          )}
          
        </View>
        
        {/* Submit button */}
        {results.length > 0 && (
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
  instructions: {
    alignItems: 'center',
    marginBottom: 30,
    padding: 15,
  },
  instructionsText: {
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 10,
    fontSize: 18,
    fontWeight: 'bold',
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
  transcriptionContainer: {
    padding: 15,
    borderRadius: 12,
    width: '100%',
    maxHeight: 200,
  },
  transcriptionLabel: {
    fontWeight: '600',
    marginBottom: 10,
  },
  transcriptionText: {
    fontSize: 16,
    lineHeight: 24,
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