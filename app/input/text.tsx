import { StyleSheet, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Text } from 'react-native';
import React, { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import OpenAI from "openai";
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
// import { useModel } from '@/app/context/ModelContext';
import { useLLM, LLAMA3_2_1B_QLORA } from 'react-native-executorch';
// import NetInfo from '@react-native-community/netinfo';

const ENDPOINT = "http://10.197.236.114:8000";

// Initialize OpenAI client
const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const client = new OpenAI({apiKey: openaiApiKey, dangerouslyAllowBrowser: true});

function TextInputScreen() {
  const colorScheme = useColorScheme();
  const [text, setText] = useState('');
  const [response, setReponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const { modelReady, downloadProgress, modelPath, tokenizerPath } = useModel();
  const [aiResponse, setAiResponse] = useState('');
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // const llama = useLLM({
  //   modelSource: LLAMA3_2_1B_QLORA,
  //   tokenizerSource: tokenizerPath,
  //   systemPrompt: 'Be a helpful assistant',
  //   contextWindowLength: 3,
  // });

  // keep track of internet connectivity
  useEffect(() => {
    // const unsubscribe = NetInfo.addEventListener(state => {
    //   setIsConnected(state.isConnected);
    // });
    setIsConnected(true);

    // return () => unsubscribe();
  }, []);

  // Monitor llama response and generation state
  // useEffect(() => {
  //   if (llama.response && !llama.isGenerating) {
  //     setAiResponse(llama.response);
  //     setIsSubmitting(false);
  //     console.log(llama.response);
  //     // Navigate to instructions screen with the response
  //     router.push({
  //       pathname: '/input/instructions',
  //       params: { aiResponse: llama.response }
  //     });
  //   }
  // }, [llama.response, llama.isGenerating]);

  const handleBack = () => {
    router.back();
  };

  const handleSubmit = async () => {
    // if (!text.trim() || isSubmitting || !modelReady) {
    //   if (!modelReady) {
    //     Alert.alert('Model not ready', 'Please wait for the model to load before submitting.');
    //   }
    //   return;
    // }
    
    try {
      setIsSubmitting(true);
      console.log('Generating response to text...');

      let response;
      if (isConnected == false) {
        console.log("offline llama");
        // await llama.generate(text);
      } else {
        response = await fetch(`${ENDPOINT}/process`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "Help the user.",
            text: text.trim(),
            image_base64: "",
            audio_base64: "",
          }),
        });

        const data = await response.json();
        const aiResponse = data.response;

        router.push({
          pathname: '/input/instructions',
          params: { aiResponse }
        });
      }
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
          <ThemedText type="title">Ask AI</ThemedText>
          <View style={styles.placeholderButton} />
        </View>

        {/* Download progress indicator */}
        {/* {!modelReady && downloadProgress > 0 && downloadProgress < 1 && (
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
        )} */}

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
    width: '95%',
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
    marginBottom: 20,
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
    padding: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255, 0.3)',
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    padding: 0,
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