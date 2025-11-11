import PrimaryButton from '@/components/PrimaryButton';
import PrizeCard from '@/components/PrizeCard';
import { Text as ThemedText } from '@/components/Themed';
import { Link } from 'expo-router';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function Participar() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Rifa do iPhone 15</Text>

  <PrizeCard title="Smartphone XPTO" subtitle="Prêmio" />

        <View style={{ height: 18 }} />

        <Text style={styles.title}>Participe da Rifa</Text>
        <ThemedText style={styles.hint}>Insira seu nome abaixo para garantir seu número da sorte.</ThemedText>

        <TextInput placeholder="Digite seu nome aqui" placeholderTextColor="#9aa0a6" style={styles.input} />
        <TextInput placeholder="Números da rifa (ex: 01, 02)" placeholderTextColor="#9aa0a6" style={styles.input} />

        <PrimaryButton style={{ backgroundColor: '#1db954', marginTop: 8 }}>Participar Agora</PrimaryButton>

        <View style={{ height: 30 }} />

        <Link href="/configurar">
          <ThemedText style={styles.link}>Ir para Configurar Sorteio</ThemedText>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { fontSize: 18, color: '#fff', fontWeight: '700', marginBottom: 12 },
  title: { fontSize: 22, color: '#fff', fontWeight: '800', marginTop: 6 },
  hint: { color: '#cfcfcf', marginTop: 6, marginBottom: 8 },
  input: {
    backgroundColor: '#112028',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  link: { color: '#f6a623', marginTop: 8, textAlign: 'center' },
});
