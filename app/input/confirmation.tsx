import { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import OpenAI from "openai";
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';
import { useModel } from '@/app/context/ModelContext';
import { useLLM, LLAMA3_2_1B_QLORA } from 'react-native-executorch';

const openaiApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const ENDPOINT = "http://10.197.204.116:8000";

// Initialize OpenAI client
const client = new OpenAI({apiKey: openaiApiKey, dangerouslyAllowBrowser: true});

export default function ImageConfirmationScreen() {
  const params = useLocalSearchParams();
  const imageUri = params.imageUri as string | undefined;
  const recordingUri = params.recordingUri as string | undefined;
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResponseComplete, setIsResponseComplete] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const colorScheme = useColorScheme();
  const { modelReady, modelPath, tokenizerPath } = useModel();
  
  const llama = useLLM({
    modelSource: LLAMA3_2_1B_QLORA,
    tokenizerSource: tokenizerPath,
    systemPrompt: 'Be a helpful assistant',
    contextWindowLength: 3,
  });

  // Monitor llama response and generation state
  useEffect(() => {
    if (llama.response && !llama.isGenerating) {
      setIsSubmitting(false);
      console.log(llama.response);
      // Navigate to instructions screen with the response
      router.push({
        pathname: '/input/instructions',
        params: { aiResponse: llama.response }
      });
    }
  }, [llama.response, llama.isGenerating]);

  // keep track of internet connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    setIsConnected(true);

    return () => unsubscribe();
  }, []);
  
  // Start or stop voice recording
  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording logic will go here
      setIsRecording(false);
      setHasRecording(true);
    } else {
      // Start recording logic will go here
      setIsRecording(true);
    }
  };
  
  // Delete the current recording
  const deleteRecording = () => {
    setHasRecording(false);
  };

  // takes image or audio uri and returns base64 encoding
  const convertUriToBase64 = async (uri: string) => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('base64 encoding created');
      return base64;
    } catch (error) {
      console.error("Error converting image to base64:", error);
      return null;
    }
  };

  const sendImageUriAsBase64 = async (imageUri: string) => {
    try {
      const dataUrl = await convertUriToBase64(imageUri);
      
      if (isConnected === false) {
        if (!modelReady) {
          Alert.alert('Model not ready', 'Please wait for the model to load before submitting in offline mode.');
          return;
        }
        console.log("offline llama - processing image with text:", text);
        // Using LLaMA in offline mode
        await llama.generate(`Analyze this image and ${text ? `help with the following: ${text}` : 'provide helpful insights.'}`);
      } else {
        const response = await fetch(`${ENDPOINT}/process`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "Help the user.",
            text: text,
            image_base64: dataUrl,
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
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert(
        'Error',
        'Something went wrong while processing your request. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  const sendRecordingUriAsBase64 = async (recordingUri: string) => {
    try {
      const dataUrl = await convertUriToBase64(recordingUri);
      
      if (isConnected === false) {
        if (!modelReady) {
          Alert.alert('Model not ready', 'Please wait for the model to load before submitting in offline mode.');
          return;
        }
        console.log("offline llama - processing audio");
        // Using LLaMA in offline mode
        await llama.generate(`Process this audio recording and ${text ? `consider this additional context: ${text}` : 'help the user with their request.'}`);
      } else {
        const response = await fetch(`${ENDPOINT}/process`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "Help the user with this audio recording.",
            text: text || "",
            image_base64: "",
            audio_base64: dataUrl,
          }),
        });

        const data = await response.json();
        const aiResponse = data.response;

        // Navigate to instructions screen with the response
        router.push({
          pathname: '/input/instructions',
          params: { aiResponse }
        });
      }
    } catch (error) {
      console.error('Error processing audio:', error);
      Alert.alert(
        'Error',
        'Something went wrong while processing your request. Please try again.'
      );
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (!isConnected && !modelReady) {
        Alert.alert('Offline Mode', 'You are currently offline and the local model is not ready. Please connect to the internet or wait for the model to load.');
        setIsSubmitting(false);
        return;
      }
      
      if (imageUri) {
        console.log("image received");
        sendImageUriAsBase64(imageUri);
      } else if (recordingUri) {
        console.log("recording received");
        sendRecordingUriAsBase64(recordingUri);
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Navigation error:', error);
      setIsSubmitting(false);
    }
  };
  
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color={Colors[colorScheme ?? 'light'].text} />
          </TouchableOpacity>
          <ThemedText type="title">Confirm Details</ThemedText>
          <View style={styles.spacer} />
        </View>
        
        {/* Image Preview */}
        <View style={styles.imageContainer}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.image} />
          ) : (
            <ThemedView style={styles.placeholderImage}>
              <IconSymbol name="photo" size={64} color="#999" />
            </ThemedView>
          )}
        </View>
        
        {/* Text Input Section */}
        <ThemedView style={styles.inputSection}>
          <ThemedText type="subtitle">Add Description</ThemedText>
          <TextInput
            style={[
              styles.textInput, 
              { color: Colors[colorScheme ?? 'light'].text,
                backgroundColor: colorScheme === 'dark' ? '#333' : '#F5F5F5' }
            ]}
            placeholder="Add any additional details..."
            placeholderTextColor="#999"
            multiline
            value={text}
            onChangeText={setText}
          />
        </ThemedView>
        
        {/* Voice Recording Section */}
        <ThemedView style={styles.inputSection}>
          <ThemedText type="subtitle">Voice Note</ThemedText>
          
          <ThemedView style={styles.recordingContainer}>
            {!hasRecording ? (
              <TouchableOpacity 
                style={[
                  styles.recordButton, 
                  isRecording && styles.recordingActive
                ]} 
                onPress={toggleRecording}
              >
                <IconSymbol 
                  name={isRecording ? "stop.fill" : "mic.fill"} 
                  size={28} 
                  color={isRecording ? "white" : Colors[colorScheme ?? 'light'].tint} 
                />
                <ThemedText style={styles.recordButtonText}>
                  {isRecording ? "Recording..." : "Record Voice Note"}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedView style={styles.recordingPreview}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <IconSymbol name="waveform" size={20} color={Colors[colorScheme ?? 'light'].tint} />
                  <ThemedText style={{ marginLeft: 8 }}>Voice note recorded</ThemedText>
                </View>
                
                <TouchableOpacity onPress={deleteRecording}>
                  <IconSymbol name="trash" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </ThemedView>
            )}
          </ThemedView>
        </ThemedView>
        
        {/* Submit Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled
          ]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <ThemedText style={styles.submitButtonText}>
            {isSubmitting ? "Processing..." : "Submit"}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
  },
  spacer: {
    width: 40,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
  },
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    marginTop: 8,
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    fontSize: 16,
  },
  recordingContainer: {
    marginTop: 8,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: 'transparent',
  },
  recordingActive: {
    backgroundColor: '#FC5800',
    borderColor: '#FC5800',
  },
  recordButtonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  recordingPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  submitButton: {
    backgroundColor: '#6090C0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9DB7D0',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 