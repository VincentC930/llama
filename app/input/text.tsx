import React, { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Text } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OpenAI from "openai";

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Initialize OpenAI client
const client = new OpenAI({apiKey: openaiApiKey, dangerouslyAllowBrowser: true});

function TextInputScreen() {
  const colorScheme = useColorScheme();
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
            content: "Be helpful and concise. "+text.trim(),
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
      Alert.alert(
        'Error',
        'Something went wrong while processing your request. Please try again.'
      );
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
          <ThemedText type="title">Ask SOS.AI</ThemedText>
          <View style={styles.placeholderButton} />
        </View>

        {/* Instructions */}
        {/* <ThemedView style={styles.instructions}>
          <IconSymbol name="text.bubble" size={40} color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.instructionsText}>
            Type your question or message below and tap Submit to continue.
          </ThemedText>
        </ThemedView> */}

        {/* Input area */}
        <ThemedView style={styles.inputContainer}>
          <TextInput
            style={[
              styles.textInput,
              { color: Colors[colorScheme ?? 'light'].text }
            ]}
            placeholder="Type your question here..."
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
    width: '80%',
    maxWidth: 500,
    marginLeft: 'auto',
    marginRight: 'auto',
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
    padding: -15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255, 0.3)',
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    padding: 10,
    margin: 15,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 14,
    color: '#999',
    marginTop: 10,
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