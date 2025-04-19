import { useState } from 'react';
import { StyleSheet, Switch, Platform, View } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const [isOnline, setIsOnline] = useState(true);
  const [precisionValue, setPrecisionValue] = useState(0.5);

  const toggleOnlineMode = () => {
    setIsOnline(previousState => !previousState);
  };

  const handlePrecisionChange = (value: number) => {
    setPrecisionValue(value);
  };

  const getSliderLabel = () => {
    if (precisionValue < 0.33) {
      return 'Concise';
    } else if (precisionValue < 0.66) {
      return 'Balanced';
    } else {
      return 'Precise';
    }
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
        <ThemedText type="title">Settings</ThemedText>
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
                ? 'Use internet for latest information' 
                : 'Work without internet connection'}
            </ThemedText>
          </ThemedView>
          
          <Switch
            trackColor={{ 
              false: Platform.select({ ios: '#D1D1D6', android: '#767577' }), 
              true: Colors[colorScheme ?? 'light'].tint 
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
        
        <ThemedView style={styles.settingRow}>
          <ThemedView style={styles.sliderLabelContainer}>
            <ThemedText style={styles.sliderLabel}>Concise</ThemedText>
            <ThemedText style={styles.sliderLabel}>Precise</ThemedText>
          </ThemedView>
        </ThemedView>
        
        <View style={styles.slider}>
          <View 
            style={[
              styles.sliderTrack, 
              { 
                backgroundColor: '#D1D1D6',
              }
            ]}
          >
            <View 
              style={[
                styles.sliderFill, 
                { 
                  width: `${precisionValue * 100}%`,
                  backgroundColor: Colors[colorScheme ?? 'light'].tint 
                }
              ]} 
            />
            <View 
              style={[
                styles.sliderThumb, 
                { 
                  left: `${precisionValue * 100}%`,
                  backgroundColor: Colors[colorScheme ?? 'light'].tint 
                }
              ]} 
            />
          </View>
        </View>
        
        <ThemedView style={styles.sliderValueContainer}>
          <ThemedText style={styles.sliderValueText}>{getSliderLabel()}</ThemedText>
        </ThemedView>
        
        <ThemedText style={styles.settingDescription}>
          {precisionValue < 0.33 
            ? 'Shorter responses with key information only'
            : precisionValue < 0.66 
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
  slider: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    position: 'absolute',
    top: -8,
    marginLeft: -10,
  },
  sliderLabelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  sliderLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  sliderValueContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderValueText: {
    fontSize: 16,
    fontWeight: '500',
  },
}); 