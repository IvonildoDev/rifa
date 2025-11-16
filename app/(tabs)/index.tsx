import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function Home() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const appName =
    // Support for different Expo SDK fields
    (Constants.expoConfig && (Constants.expoConfig.name as string)) ||
    // legacy manifest
    // @ts-ignore
    (Constants.manifest && (Constants.manifest.name as string)) ||
    'Rifa';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#0a0a0a' }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={[styles.appName, { color: theme.tint }]}>{appName}</Text>
          <Text style={styles.welcome}>Bem-vindo(a) ao aplicativo de rifas!</Text>
          <Text style={styles.subtitle}>
            Gerencie sorteios, venda números e acompanhe relatórios com facilidade.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20 },
  card: {
    backgroundColor: '#1a1410',
    borderRadius: 14,
    padding: 24,
    borderWidth: 1,
    borderColor: '#3a2820',
  },
  appName: {
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 8,
  },
  welcome: {
    color: '#e5e5e5',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#9ca3af',
    fontSize: 14,
    lineHeight: 20,
  },
});
