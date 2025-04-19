import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';

export default function IndexScreen() {
  return <Redirect href="/(tabs)/help" />;
} 