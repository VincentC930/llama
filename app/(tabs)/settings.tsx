import { useState } from 'react';
import { StyleSheet, Switch, Platform, View, TouchableOpacity } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

// Define response style types for better type safety
type ResponseStyle = 'concise' | 'balanced' | 'precise';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [isOnline, setIsOnline] = useState(true);
  const [responseStyle, setResponseStyle] = useState<ResponseStyle>('balanced');

  const toggleOnlineMode = () => {
    setIsOnline(previousState => !previousState);
  };

  const handleSelectResponseStyle = (style: ResponseStyle) => {
    setResponseStyle(style);
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#E5E5E5', dark: '#2A2A2A' }}
      headerImage={
        <IconSymbol
          size={170}
          name="gearshape.2"
          color="#888"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={{color: '#4CAF50'}}>Settings</ThemedText>
      </ThemedView>
      
      <ThemedView style={styles.settingSection}>
        <ThemedText type="subtitle">Connection Mode</ThemedText>
        
        <ThemedView style={styles.settingRow}>
          <ThemedView style={styles.settingLabelContainer}>
            <ThemedText style={styles.settingLabel}>
              {isOnline ? 'Online' : 'Offline'}
            </ThemedText>
            <ThemedText style={styles.settingDescription}>
              {isOnline 
                ? 'Use internet to connect to more powerful models' 
                : 'Work without internet connection'}
            </ThemedText>
          </ThemedView>
          
          <Switch
            trackColor={{ 
              false: Platform.select({ ios: '#D1D1D6', android: '#767577' }), 
              true: '#4CAF50' 
            }}
            thumbColor={Platform.select({
              ios: '#FFFFFF',
              android: isOnline ? Colors[colorScheme ?? 'light'].tint : '#f4f3f4'
            })}
            ios_backgroundColor="#D1D1D6"
            onValueChange={toggleOnlineMode}
            value={isOnline}
          />
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.settingSection}>
        <ThemedText type="subtitle">Response Style</ThemedText>
        
        <View style={styles.backpackOptions}>
          {/* Concise option */}
          <TouchableOpacity 
            style={styles.backpackOption}
            onPress={() => handleSelectResponseStyle('concise')}
          >
            <IconSymbol 
              name="backpack" 
              size={40} 
              color={responseStyle === 'concise' ? '#4CAF50' : '#888'} 
            />
            <ThemedText style={[
              styles.backpackLabel,
              responseStyle === 'concise' && styles.selectedLabel
            ]}>
              Concise
            </ThemedText>
          </TouchableOpacity>
          
          {/* Balanced option */}
          <TouchableOpacity 
            style={styles.backpackOption}
            onPress={() => handleSelectResponseStyle('balanced')}
          >
            <IconSymbol 
              name="backpack" 
              size={40} 
              color={responseStyle === 'balanced' ? '#4CAF50' : '#888'} 
            />
            <ThemedText style={[
              styles.backpackLabel,
              responseStyle === 'balanced' && styles.selectedLabel
            ]}>
              Balanced
            </ThemedText>
          </TouchableOpacity>
          
          {/* Precise option */}
          <TouchableOpacity 
            style={styles.backpackOption}
            onPress={() => handleSelectResponseStyle('precise')}
          >
            <IconSymbol 
              name="backpack" 
              size={40} 
              color={responseStyle === 'precise' ? '#4CAF50' : '#888'} 
            />
            <ThemedText style={[
              styles.backpackLabel,
              responseStyle === 'precise' && styles.selectedLabel
            ]}>
              Precise
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        <ThemedText style={styles.settingDescription}>
          {responseStyle === 'concise' 
            ? 'Shorter responses with key information only'
            : responseStyle === 'balanced' 
              ? 'Balanced responses with essential details'
              : 'Detailed responses with comprehensive information'}
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    bottom: -50,
    right: 40,
    position: 'absolute',
    opacity: 0.5,
  },
  titleContainer: {
    marginBottom: 24,
  },
  settingSection: {
    marginBottom: 32,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  settingLabelContainer: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  backpackOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  backpackOption: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  backpackLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  selectedLabel: {
    color: '#4CAF50',
    fontWeight: '700',
  },
}); 