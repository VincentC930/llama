import { useState } from 'react';
import { 
  StyleSheet, 
  Switch, 
  Platform, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native';

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
  const [sourceLink, setSourceLink] = useState('');
  const [knowledgeSources, setKnowledgeSources] = useState([
    'https://example.com/resource1',
    'https://docs.llamasources.com'
  ]);

  const toggleOnlineMode = () => {
    setIsOnline(previousState => !previousState);
  };

  const handleSelectResponseStyle = (style: ResponseStyle) => {
    setResponseStyle(style);
  };

  const addKnowledgeSource = () => {
    if (sourceLink && !knowledgeSources.includes(sourceLink)) {
      setKnowledgeSources([...knowledgeSources, sourceLink]);
      setSourceLink('');
      Keyboard.dismiss();
    }
  };

  const removeKnowledgeSource = (source: string) => {
    setKnowledgeSources(knowledgeSources.filter(item => item !== source));
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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

          <ThemedView style={styles.settingSection}>
            <ThemedText type="subtitle">Advanced Knowledge Base</ThemedText>
            
            <ThemedView style={styles.inputContainer}>
              <TextInput
                style={styles.linkInput}
                placeholder="Paste URL"
                placeholderTextColor="#999"
                value={sourceLink}
                onChangeText={setSourceLink}
              />
              <TouchableOpacity 
                style={[
                  styles.addButton, 
                  !sourceLink ? styles.addButtonDisabled : null
                ]}
                disabled={!sourceLink}
                onPress={addKnowledgeSource}
              >
                <ThemedText style={styles.addButtonText}>Add Source</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ScrollView 
              horizontal
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
            >
              {knowledgeSources.map((source, index) => (
                <ThemedView key={index} style={styles.chip}>
                  <ThemedText
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    style={styles.chipText}
                  >
                    {source}
                  </ThemedText>
                  <TouchableOpacity
                    onPress={() => removeKnowledgeSource(source)}
                    style={styles.chipDelete}
                  >
                    <IconSymbol name="xmark" size={10} color="#FFF" />
                  </TouchableOpacity>
                </ThemedView>
              ))}
            </ScrollView>
          </ThemedView>
        </ParallaxScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  inputContainer: {
    flexDirection: 'column',
    marginTop: 16,
    marginBottom: 16,
  },
  linkInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: '#333333',
    backgroundColor: 'white',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#A5D6A7',
    opacity: 0.5,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  chipsContainer: {
    paddingVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 6,
    marginRight: 8,
  },
  chipText: {
    color: 'white',
    fontWeight: '400',
    maxWidth: 150,
  },
  chipDelete: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
}); 