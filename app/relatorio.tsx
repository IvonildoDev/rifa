import PrimaryButton from '@/components/PrimaryButton';
import { Text as ThemedText } from '@/components/Themed';
import React from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, View } from 'react-native';

const sample = [
  { id: '1', name: 'Carlos Souza', qty: 50 },
  { id: '2', name: 'Ana Pereira', qty: 32 },
  { id: '3', name: 'Marcos Andrade', qty: 25 },
];

export default function Relatorio() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Relatório do Sorteio</Text>
        <View style={styles.metrics}>
          <View style={styles.metricBox}>
            <Text style={styles.metricTitle}>Números Vendidos</Text>
            <Text style={styles.metricValue}>850</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricTitle}>Participantes</Text>
            <Text style={styles.metricValue}>150</Text>
          </View>
        </View>

        <ThemedText style={{ marginTop: 12 }}>Ranking</ThemedText>
        <FlatList data={sample} keyExtractor={(i) => i.id} renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>{index + 1}º</Text>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.qtd}>{item.qty} números</Text>
          </View>
        )} />

        <PrimaryButton style={{ marginTop: 12, backgroundColor: '#f2994a' }}>Exportar</PrimaryButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, flex: 1 },
  header: { fontSize: 18, color: '#fff', fontWeight: '700', marginBottom: 12 },
  metrics: { flexDirection: 'row', gap: 12 },
  metricBox: { backgroundColor: '#2d1f17', padding: 12, borderRadius: 8, marginRight: 8 },
  metricTitle: { color: '#cfcfcf' },
  metricValue: { color: '#fff', fontWeight: '800', fontSize: 18 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: '#3a2b23', borderBottomWidth: 1 },
  rank: { color: '#f6a623', width: 30 },
  name: { color: '#fff', flex: 1 },
  qtd: { color: '#cfcfcf' },
});
