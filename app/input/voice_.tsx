import React, { useState } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router'; // if you're using expo-router

export default function AudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [uri, setUri] = useState('');
  const router = useRouter();

  const startRecording = async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) return;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );

    setRecording(recording);
  };

  const stopRecording = async () => {
    await recording.stopAndUnloadAsync();
    const recordingUri = recording.getURI();
    setUri(recordingUri);
    setRecording(null);

    if (recordingUri) {
        router.push({
            pathname: '/input/confirmation',
            params: { recordingUri: recordingUri }
        });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎙️ Audio Recorder</Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Start Recording"
          onPress={startRecording}
          color="#4CAF50"
          disabled={!!recording}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button
          title="Stop Recording"
          onPress={stopRecording}
          color="#F44336"
          disabled={!recording}
        />
      </View>

      {uri ? <Text style={styles.uri}>Recording saved: {uri}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 100,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 40,
    color: '#333',
  },
  buttonContainer: {
    width: '100%',
    marginVertical: 10,
  },
  uri: {
    marginTop: 30,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});


