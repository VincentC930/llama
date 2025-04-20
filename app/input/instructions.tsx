import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function InstructionsScreen() {
  const colorScheme = useColorScheme();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const params = useLocalSearchParams<{ aiResponse?: string }>();
  const aiResponse = params.aiResponse;

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  const handleBackToHelp = () => {
    // Stop any ongoing speech
    Speech.stop();
    
    // Navigate back to the help screen
    router.replace('/(tabs)/help');
  };
  
  const toggleSpeech = async () => {
    // If already speaking, stop the speech
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }
    
    // Get all the text content to speak
    let textToSpeak = [
      'Your request has been submitted!',
      'Next Steps',
    ];
    
    // Add AI response to speech if available
    if (aiResponse) {
      textToSpeak.push('AI Response: ' + aiResponse);
    } else {
      textToSpeak = textToSpeak.concat([
        'Your image and additional information have been processed. Here\'s what you can expect next:',
        '1. Our system is analyzing your submission to provide the best assistance.',
        '2. You\'ll receive a notification once the analysis is complete.',
        '3. For complex requests, additional information may be requested.',
        'Helpful Tips',
        'Keep your device nearby for notifications about your request.',
        'You can check the status of your submission in the history section.',
        'For faster results, make sure your images are clear and well-lit.'
      ]);
    }
    
    setIsSpeaking(true);
    
    try {
      await Speech.speak(textToSpeak.join('. '), {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with done and audio buttons */}
        <View style={styles.header}>
          <ThemedText type="title">Instructions</ThemedText>
          <View style={styles.headerButtons}>
            {/* Audio button */}
            <TouchableOpacity 
              style={[styles.audioButton, isSpeaking && styles.audioButtonActive]} 
              onPress={toggleSpeech}
            >
              <IconSymbol 
                name={isSpeaking ? "speaker.wave.3.fill" : "speaker.wave.2"} 
                size={20} 
                color={isSpeaking ? "#fff" : Colors[colorScheme ?? 'light'].text} 
              />
            </TouchableOpacity>
            
            {/* Done button */}
            <TouchableOpacity 
              style={styles.doneButton} 
              onPress={handleBackToHelp}
            >
              <ThemedText style={styles.doneButtonText}>Done</ThemedText>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* AI Response section (if available) */}
        {aiResponse ? (
          <ThemedView style={styles.card}>
            <ThemedText type="subtitle">AI Response</ThemedText>
            <ThemedText style={styles.aiResponse}>
              {aiResponse}
            </ThemedText>
          </ThemedView>
        ) : (
          // Standard instructions when no AI response
          <>
            <ThemedView style={styles.card}>
              <ThemedText type="subtitle">Next Steps</ThemedText>
              <ThemedText style={styles.paragraph}>
                Your image and additional information have been processed. Here's what you can expect next:
              </ThemedText>
              
              <ThemedView style={styles.stepItem}>
                <IconSymbol name="1.circle.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText style={styles.stepText}>
                  Our system is analyzing your submission to provide the best assistance.
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.stepItem}>
                <IconSymbol name="2.circle.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText style={styles.stepText}>
                  You'll receive a notification once the analysis is complete.
                </ThemedText>
              </ThemedView>
              
              <ThemedView style={styles.stepItem}>
                <IconSymbol name="3.circle.fill" size={24} color={Colors[colorScheme ?? 'light'].tint} />
                <ThemedText style={styles.stepText}>
                  For complex requests, additional information may be requested.
                </ThemedText>
              </ThemedView>
            </ThemedView>
          
          </>
        )}
        
        {/* Return to help button */}
        <TouchableOpacity 
          style={styles.returnButton} 
          onPress={handleBackToHelp}
        >
          <IconSymbol name="house.fill" size={18} color="white" />
          <ThemedText style={styles.returnButtonText}>
            Return to Home
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginLeft: 10,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doneButton: {
    padding: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  doneButtonText: {
    fontWeight: '600',
  },
  audioButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  audioButtonActive: {
    backgroundColor: '#6090C0',
  },
  successContainer: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  successText: {
    marginTop: 16,
    textAlign: 'center',
  },
  card: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  paragraph: {
    marginVertical: 12,
    lineHeight: 22,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  stepText: {
    marginLeft: 12,
    flex: 1,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  tipText: {
    marginLeft: 12,
    flex: 1,
  },
  returnButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
  },
  returnButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  aiResponse: {
    marginTop: 12,
    lineHeight: 22,
    fontSize: 16,
  },
}); 