import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OpenAI from "openai";
import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-voice/voice';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Initialize OpenAI client with API key from environment variable
const client = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

function TextInputScreen() {
  const colorScheme = useColorScheme();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    // Initialize voice recognition event handlers
    Voice.onSpeechStart = onSpeechStartHandler;
    Voice.onSpeechEnd = onSpeechEndHandler;
    Voice.onSpeechResults = onSpeechResultsHandler;
    Voice.onSpeechError = onSpeechErrorHandler;

    // Cleanup function
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStartHandler = (_: any) => {
    console.log('Speech recognition started');
  };

  const onSpeechEndHandler = (_: any) => {
    setIsListening(false);
    console.log('Speech recognition ended');
  };

  const onSpeechResultsHandler = (e: SpeechResultsEvent) => {
    if (e.value && e.value.length > 0) {
      const result = e.value[0];
      setText(result);
      console.log('Speech to text result:', result);
    }
  };

  const onSpeechErrorHandler = (e: SpeechErrorEvent) => {
    console.error('Speech recognition error:', e);
    setIsListening(false);
  };

  const startListening = async () => {
    try {
      await Voice.isAvailable();
      await Voice.start('en-US');
      setIsListening(true);
    } catch (error) {
      console.error('Error starting voice recognition:', error);
      Alert.alert('Error', 'Speech recognition failed to start. Please try again.');
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (error) {
      console.error('Error stopping voice recognition:', error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
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
            content: text.trim(),
          },
        ],
      });
      
      const aiResponse = response.output_text;
      
      // Navigate to instructions screen with the response
      router.push({
        pathname: '/input/instructions',
        params: { aiResponse }
      });
      
    } catch (error: any) {
      console.error('Error calling OpenAI API:', error);
      
      // Show appropriate error message
      let errorMessage = 'Something went wrong while processing your request. Please try again.';
      
      if (error.message && error.message.includes('API key')) {
        errorMessage = 'OpenAI API key is not properly configured. Please check your .env file.';
      } else if (error.status === 401) {
        errorMessage = 'Invalid API key. Please check your OpenAI API key.';
      } else if (error.status === 429) {
        errorMessage = 'Too many requests or quota exceeded. Please try again later.';
      }
      
      Alert.alert('Error', errorMessage);
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
          >
            <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <ThemedText type="title">Text Input</ThemedText>
          <View style={styles.placeholderButton} />
        </View>

        {/* Instructions */}
        <ThemedView style={styles.instructions}>
          <IconSymbol name="text.bubble" size={40} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.instructionsText}>
            Type your question or message below and tap Submit to continue.
          </ThemedText>
        </ThemedView>

        {/* Input area */}
        <ThemedView style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              { color: Colors[colorScheme ?? 'light'].text }
            ]}
            placeholder="Type your message here..."
            placeholderTextColor="#999"
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            maxLength={500}
          />
          <ThemedText style={styles.charCount}>
            {text.length}/500
          </ThemedText>
        </ThemedView>

        {/* Voice input button */}
        <TouchableOpacity 
          style={[
            styles.voiceButton,
            isListening && styles.voiceButtonActive
          ]} 
          onPress={isListening ? stopListening : startListening}
        >
          <IconSymbol 
            name={isListening ? "mic.fill" : "mic"} 
            size={24} 
            color="#FFF" 
          />
          <ThemedText style={styles.voiceButtonText}>
            {isListening ? "Stop Listening" : "Voice Input"}
          </ThemedText>
        </TouchableOpacity>

        {/* Submit button */}
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!text.trim() || isSubmitting) && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={!text.trim() || isSubmitting}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  },
  instructionsText: {
    textAlign: 'center',
    marginTop: 15,
    fontSize: 16,
    lineHeight: 24,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 20,
    borderRadius: 12,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    padding: 0,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  voiceButton: {
    backgroundColor: '#60A0C0',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  voiceButtonActive: {
    backgroundColor: '#D04040',
  },
  voiceButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 10,
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
}); 

export default TextInputScreen; 