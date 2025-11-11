import PrimaryButton from '@/components/PrimaryButton';
import { Text as ThemedText } from '@/components/Themed';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Configurar() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Configurar Sorteio</Text>

        <Text style={styles.question}>Quantos números na rifa?</Text>
        <ThemedText style={styles.hint}>Defina o total de números participantes para iniciar o sorteio.</ThemedText>

        <TextInput placeholder="Ex: 100" placeholderTextColor="#9aa0a6" style={styles.input} keyboardType="number-pad" />

        <View style={{ height: 18 }} />

        <PrimaryButton color="#f2994a">Iniciar Sorteio</PrimaryButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { fontSize: 18, color: '#fff', fontWeight: '700', marginBottom: 12 },
  question: { fontSize: 20, color: '#fff', fontWeight: '700', marginTop: 6 },
  hint: { color: '#cfcfcf', marginTop: 6, marginBottom: 8 },
  input: {
    backgroundColor: '#112028',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
});
