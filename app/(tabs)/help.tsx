import { StyleSheet, TouchableOpacity, Image, View } from 'react-native';
import { router } from 'expo-router';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import React from 'react';

export default function HelpScreen() {
  const handleSelectInputMethod = (method: string) => {
    // Navigate based on the selected input method
    console.log(`Selected input method: ${method}`);
    
    if (method === 'image') {
      router.push('/input/image');
    } else if (method === 'voice') {
      router.push('/input/voice');
    } else if (method === 'text') {
      router.push('/input/text');
    }
  };

  return (
    <ThemedView style={styles.container}>
      {/* Topographic background pattern */}
      <Image 
        source={require('@/assets/images/4060492.jpg')} 
        style={styles.backgroundPattern}
        resizeMode="cover"
      />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header text */}
        <View style={styles.headerContainer}>
        <ThemedText style={[styles.headerText, styles.accentText]}>LLAMA.</ThemedText>
          <ThemedText style={styles.headerText}>BACKPACKING.</ThemedText>
          <ThemedText style={styles.headerText}>KNOWLEDGEBASE.</ThemedText>
        </View>
        
        {/* Trail Cards - Simplified version without stats */}
        <Animated.ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Trail Image 1 - Camera/Image Query */}
          <TouchableOpacity 
            style={styles.trailCard} 
            onPress={() => handleSelectInputMethod('image')}>
            <Image 
              source={{uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'}} 
              style={styles.trailImage}
              resizeMode="cover"
            />
            <View style={styles.overlayContainer}>
              <IconSymbol name="camera" size={50} color="#fff" />
              <ThemedText style={styles.overlayText}>IMAGE QUERY</ThemedText>
            </View>
          </TouchableOpacity>
          
          {/* Trail Image 2 - Voice Query */}
          <TouchableOpacity 
            style={styles.trailCard} 
            onPress={() => handleSelectInputMethod('voice')}>
            <Image 
              source={{uri: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80'}} 
              style={styles.trailImage}
              resizeMode="cover"
            />
            <View style={styles.overlayContainer}>
              <IconSymbol name="mic" size={50} color="#fff" />
              <ThemedText style={styles.overlayText}>VOICE QUERY</ThemedText>
            </View>
          </TouchableOpacity>
          
          {/* Trail Image 3 - Text Query */}
          <TouchableOpacity 
            style={styles.trailCard} 
            onPress={() => handleSelectInputMethod('text')}>
            <Image 
              source={{uri: 'https://images.unsplash.com/photo-1448375240586-882707db888b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80'}} 
              style={styles.trailImage}
              resizeMode="cover"
            />
            <View style={styles.overlayContainer}>
              <IconSymbol name="keyboard" size={50} color="#fff" />
              <ThemedText style={styles.overlayText}>TEXT QUERY</ThemedText>
            </View>
          </TouchableOpacity>
        </Animated.ScrollView>
      </SafeAreaView>
      
      {/* Bottom navigation - matching the input methods */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => handleSelectInputMethod('image')}>
          <IconSymbol name="camera" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => handleSelectInputMethod('voice')}>
          <IconSymbol name="mic" size={24} color="#333" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navButton}
          onPress={() => handleSelectInputMethod('text')}>
          <IconSymbol name="keyboard" size={24} color="#333" />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backgroundPattern: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0.3,
  },
  safeArea: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    marginBottom: 30,
    width: '95%',
    paddingRight: 30,
  },
  headerText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
    marginBottom: 5,
    // flexShrink: 1,
  },
  accentText: {
    color: '#4CAF50',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 80,
    gap: 20, // Add gap between cards
  },
  trailCard: {
    height: 320,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#222',
    // Add shadow for better card appearance
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.32,
    shadowRadius: 5.46,
    elevation: 9,
  },
  trailImage: {
    width: '100%',
    height: '100%',
  },
  bookmarkContainer: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: '#fff',
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    letterSpacing: 2,
  },
}); 