import PrimaryButton from '@/components/PrimaryButton';
import PrizeCard from '@/components/PrizeCard';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function Resultado() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Parabéns ao Vencedor!</Text>

  <PrizeCard title="Smartphone XPTO" subtitle="Prêmio" />

        <View style={{ height: 18 }} />

        <View style={styles.numberBox}>
          <Text style={styles.number}>345</Text>
        </View>

        <Text style={styles.winner}>Ganhador(a): Ana Beatriz Costa</Text>

        <View style={{ flex: 1 }} />

        <PrimaryButton color="#f2994a">Voltar para o Início</PrimaryButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, flex: 1 },
  header: { fontSize: 20, color: '#fff', fontWeight: '800', marginBottom: 12 },
  numberBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3a261d',
    borderRadius: 10,
    padding: 20,
  },
  number: { fontSize: 48, color: '#f2994a', fontWeight: '900' },
  winner: { color: '#fff', marginTop: 12, fontWeight: '600' },
});
