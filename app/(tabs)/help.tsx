import { StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

type InputMethodOption = 'image' | 'voice' | 'text';

export default function HelpScreen() {
  const handleSelectInputMethod = (method: InputMethodOption) => {
    // Navigate based on the selected input method
    if (method === 'image') {
      router.push('/input/image');
    } else if (method === 'text') {
      router.push({
        pathname: '/input/text'
      });
    } else if (method === 'voice') {
      router.push({
        pathname: '/input/voice'
      });
    } else {
      // For other methods, just log for now (dummy implementations)
      console.log(`Selected input method: ${method}`);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#C8D5E5', dark: '#2A3A4A' }}
      headerImage={
        <IconSymbol
          size={200}
          name="questionmark.circle"
          color="#6090C0"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Help Center</ThemedText>
      </ThemedView>
      
      <ThemedText style={styles.subtitle}>
        Select your preferred input method:
      </ThemedText>

      <TouchableOpacity 
        style={styles.optionButton} 
        onPress={() => handleSelectInputMethod('image')}>
        <ThemedView style={styles.optionContent}>
          <IconSymbol name="photo" size={32} color="#6090C0" />
          <ThemedView style={styles.optionTextContainer}>
            <ThemedText type="subtitle">Image Input</ThemedText>
            <ThemedText>Upload or take a picture to get help</ThemedText>
          </ThemedView>
          <IconSymbol name="chevron.right" size={20} color="#999" />
        </ThemedView>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionButton} 
        onPress={() => handleSelectInputMethod('voice')}>
        <ThemedView style={styles.optionContent}>
          <IconSymbol name="mic" size={32} color="#6090C0" />
          <ThemedView style={styles.optionTextContainer}>
            <ThemedText type="subtitle">Voice Input</ThemedText>
            <ThemedText>Speak your question or command</ThemedText>
          </ThemedView>
          <IconSymbol name="chevron.right" size={20} color="#999" />
        </ThemedView>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.optionButton} 
        onPress={() => handleSelectInputMethod('text')}>
        <ThemedView style={styles.optionContent}>
          <IconSymbol name="keyboard" size={32} color="#6090C0" />
          <ThemedView style={styles.optionTextContainer}>
            <ThemedText type="subtitle">Text Input</ThemedText>
            <ThemedText>Type your question or command</ThemedText>
          </ThemedView>
          <IconSymbol name="chevron.right" size={20} color="#999" />
        </ThemedView>
      </TouchableOpacity>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -70,
    right: 30,
    position: 'absolute',
    opacity: 0.7,
  },
  titleContainer: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  optionButton: {
    marginBottom: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(200, 213, 229, 0.1)',
  },
  optionTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
}); 