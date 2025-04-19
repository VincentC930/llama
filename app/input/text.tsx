import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OpenAI from "openai";

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useModel } from '@/app/context/ModelContext';
import { useLLM, LLAMA3_2_1B_QLORA } from 'react-native-executorch';

// Initialize OpenAI client with API key from environment variable
const client = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

function TextInputScreen() {
  const colorScheme = useColorScheme();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { modelReady, downloadProgress, modelPath, tokenizerPath } = useModel();
  const [aiResponse, setAiResponse] = useState('');

  // const llama = useLLM({
  //   modelSource: modelPath,
  //   tokenizerSource: tokenizerPath,
  //   systemPrompt: 'Be a helpful assistant',
  //   contextWindowLength: 3,
  // });

  const llama = useLLM({
    modelSource: LLAMA3_2_1B_QLORA,
    tokenizerSource: tokenizerPath,
    systemPrompt: 'Be a helpful assistant',
    contextWindowLength: 3,
  });

  // Monitor llama response and generation state
  useEffect(() => {
    if (llama.response && !llama.isGenerating) {
      setAiResponse(llama.response);
      setIsSubmitting(false);
      console.log(llama.response);
      // Navigate to instructions screen with the response
      router.push({
        pathname: '/input/instructions',
        params: { aiResponse: llama.response }
      });
    }
  }, [llama.response, llama.isGenerating]);

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting || !modelReady) {
      if (!modelReady) {
        Alert.alert('Model not ready', 'Please wait for the model to load before submitting.');
      }
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('Generating response...');
      
      // Instead of using the return value, use the message from the input
      await llama.generate(text);
      
      // Response handling moved to useEffect
    } catch (error: any) {
      console.log(error);
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

        {/* Download progress indicator */}
        {!modelReady && downloadProgress > 0 && downloadProgress < 1 && (
          <View style={styles.downloadContainer}>
            <ThemedText style={styles.downloadText}>
              Downloading model: {Math.round(downloadProgress * 100)}%
            </ThemedText>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${downloadProgress * 100}%` }
                ]} 
              />
            </View>
          </View>
        )}

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

        {/* Submit button */}
        <TouchableOpacity 
          style={[
            styles.submitButton,
            (!text.trim() || isSubmitting || !modelReady) && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={!text.trim() || isSubmitting || !modelReady}
        >
          {isSubmitting ? (
            <ThemedText style={styles.submitText}>Processing...</ThemedText>
          ) : !modelReady && downloadProgress > 0 ? (
            <ThemedText style={styles.submitText}>Downloading model...</ThemedText>
          ) : !modelReady ? (
            <ThemedText style={styles.submitText}>Preparing model...</ThemedText>
          ) : (
            <ThemedText style={styles.submitText}>Submit</ThemedText>
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
  submitButton: {
    backgroundColor: '#4CAF50',
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
  downloadContainer: {
    marginBottom: 20,
  },
  downloadText: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
}); 

export default TextInputScreen; 