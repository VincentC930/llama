import React, { useEffect, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import OpenAI from "openai";
import NetInfo from '@react-native-community/netinfo';
import { useModel } from '@/app/context/ModelContext';
import { useLLM, LLAMA3_2_1B_QLORA } from 'react-native-executorch';

// Initialize OpenAI client with API key from environment variable
const client = new OpenAI({
  apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
});

const ENDPOINT = "http://10.197.204.116:8000";

function VoiceInputScreen() {
  const colorScheme = useColorScheme();
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
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
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access microphone was denied');
        return;
      }

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

  const handleSubmit = async () => {
    if (!audioUri || isSubmitting) return;

    setIsSubmitting(true);

    console.log('Submitting audio to OpenAI:', audioUri);
    
    try {
      if (!modelReady && isConnected === false) {
        Alert.alert('Model not ready', 'Please wait for the model to load before submitting in offline mode.');
        setIsSubmitting(false);
        return;
      }

      const base64 = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      console.log('base64 encoding created');

      if (isConnected === false) {
        console.log("offline llama");
        await llama.generate(`Process this audio recording and help the user with their request.`);
      } else {
        const response = await fetch(`${ENDPOINT}/process`, {
          method: 'POST',
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: "Help the user with this audio recording.",
            text: "",
            image_base64: "",
            audio_base64: base64,
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
      console.error("Error processing audio:", error);
      setIsSubmitting(false);
      Alert.alert('Error', 'Failed to process audio. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
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

        <View style={styles.visualizerContainer}>
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

          {isRecording && (
            <ThemedText style={styles.statusText}>Recording...</ThemedText>
          )}

          {audioUri && !isRecording && (
            <ThemedText style={styles.statusText}>Recording complete</ThemedText>
          )}
        </View>

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
              <ThemedText style={styles.submitText}>Submit</ThemedText>
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
    width: 44,
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