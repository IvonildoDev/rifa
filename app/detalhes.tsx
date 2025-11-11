import PrimaryButton from '@/components/PrimaryButton';
import PrizeCard from '@/components/PrizeCard';
import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Detalhes() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Detalhes do Sorteio</Text>

        <PrizeCard title="Smartphone XPTO" subtitle="Adicione uma imagem para o prêmio" />

        <View style={{ height: 18 }} />
        <Text style={styles.label}>Quantidade de Números</Text>
        <Text style={styles.hint}>Máximo de 1000 números.</Text>

        <PrimaryButton color="#f2994a" style={{ marginTop: 12 }}>Iniciar Sorteio</PrimaryButton>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  header: { fontSize: 18, color: '#fff', fontWeight: '700', marginBottom: 12 },
  label: { color: '#fff', fontWeight: '700' },
  hint: { color: '#cfcfcf', marginTop: 6 },
});
