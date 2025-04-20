import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type AIResponseType = {
  summary: string;
  steps: string[];
};

type Props = {
  aiResponse: AIResponseType;
};

const AIResponseView = ({ aiResponse }: Props) => {
  if (!aiResponse) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.summary}>{aiResponse.summary}</Text>
      {aiResponse.steps.map((step, index) => (
        <Text key={index} style={styles.step}>
          {index + 1}. {step}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingLeft: 0,
    paddingRight: 0,
  },
  summary: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 14,
    color: '#333',
  },
  step: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
});

export default AIResponseView;