import PrimaryButton from '@/components/PrimaryButton';
import PrizeCard from '@/components/PrizeCard';
import { getActiveRaffle, getFinishedRaffles, getParticipantsByRaffle, getSoldNumbers, setRaffleWinner } from '@/database/database';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Resultado() {
  const [raffle, setRaffle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [soldCount, setSoldCount] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [countdown, setCountdown] = useState(0);
  const [drawnNumber, setDrawnNumber] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      // Adicionar pequeno delay para garantir que o DB está inicializado
      const timer = setTimeout(() => {
        loadRaffle();
      }, 100);
      
      return () => clearTimeout(timer);
    }, [])
  );

  async function loadRaffle() {
    try {
      setLoading(true);
      const activeRaffle = await getActiveRaffle();
      setRaffle(activeRaffle);
      
      // Carregar contagem de números vendidos
      if (activeRaffle) {
        const sold = await getSoldNumbers(activeRaffle.id);
        setSoldCount(sold.length);
      }

      // Carregar histórico de sorteios finalizados
      const finishedRaffles = await getFinishedRaffles();
      setHistory(finishedRaffles);
    } catch (error) {
      console.error('Erro ao carregar sorteio:', error);
      // Definir raffle como null em caso de erro
      setRaffle(null);
    } finally {
      setLoading(false);
    }
  }

  // Efeito para o contador regressivo
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && drawing && drawnNumber !== null) {
      // Finalizar sorteio após contagem
      finalizeDraw();
    }
  }, [countdown, drawing, drawnNumber]);

  async function handleDraw() {
    if (!raffle) {
      Alert.alert('Erro', 'Nenhum sorteio ativo encontrado.');
      return;
    }

    // Verificar se já existe um ganhador para este sorteio
    if (raffle.winner_number !== null) {
      Alert.alert('Atenção', 'Este sorteio já possui um ganhador. Não é possível sortear novamente.');
      return;
    }

    setDrawing(true);

    try {
      // Buscar APENAS os números vendidos
      const sold = await getSoldNumbers(raffle.id);
      
      if (sold.length === 0) {
        Alert.alert(
          'Impossível Sortear', 
          'Não há números vendidos neste sorteio. É necessário que pelo menos um número seja vendido antes de realizar o sorteio.'
        );
        setDrawing(false);
        return;
      }

      // Sortear número aleatório APENAS entre os números vendidos
      const randomIndex = Math.floor(Math.random() * sold.length);
      const winnerNumber = sold[randomIndex];
      
      // Definir número sorteado e iniciar contagem regressiva de 20 segundos
      setDrawnNumber(winnerNumber);
      setCountdown(20);
    } catch (error) {
      console.error('Erro ao realizar sorteio:', error);
      Alert.alert('Erro', 'Não foi possível realizar o sorteio.');
      setDrawing(false);
    }
  }

  async function finalizeDraw() {
    try {
      if (!raffle || drawnNumber === null) return;

      // Buscar participantes para encontrar o ganhador
      const participants = await getParticipantsByRaffle(raffle.id);
      const winner = participants.find(p => 
        p.numbers.split(',').map(n => parseInt(n)).includes(drawnNumber)
      );

      if (winner) {
        await setRaffleWinner(raffle.id, drawnNumber, winner.participant_name, winner.seller_name);
        Alert.alert(
          '🎉 Sorteio Realizado!', 
          `Número sorteado: ${drawnNumber}\nGanhador: ${winner.participant_name}\nVendedor: ${winner.seller_name}`
        );
        await loadRaffle(); // Recarregar dados
      }
    } catch (error) {
      console.error('Erro ao finalizar sorteio:', error);
      Alert.alert('Erro', 'Não foi possível finalizar o sorteio.');
    } finally {
      setDrawing(false);
      setDrawnNumber(null);
      setCountdown(0);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#f6a623" />
        </View>
      </SafeAreaView>
    );
  }

  if (!raffle) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.content}>
          <Text style={styles.header}>Realizar Sorteio</Text>
          <View style={styles.noWinnerBox}>
            <Text style={styles.noWinnerText}>📊 Nenhum sorteio ativo</Text>
            <Text style={styles.noWinnerSubtext}>
              Configure um sorteio na aba "Configurar" para começar!
            </Text>
          </View>

          {/* Histórico de Ganhadores */}
          {history.length > 0 && (
            <>
              <View style={{ height: 32 }} />
              <Text style={styles.historyHeader}>🏆 Histórico de Ganhadores</Text>
              {history.map((item, index) => (
                <View key={item.id} style={styles.historyCard}>
                  <View style={styles.historyBadge}>
                    <Text style={styles.historyBadgeText}>#{index + 1}</Text>
                  </View>
                  <View style={styles.historyContent}>
                    <Text style={styles.historyPrize}>🎁 {item.prize_name}</Text>
                    <Text style={styles.historyWinner}>👤 {item.winner_name}</Text>
                    <Text style={styles.historyNumber}>🎟️ Número Sorteado: {item.winner_number}</Text>
                    {item.draw_date && (
                      <Text style={styles.historyDate}>📅 {item.draw_date}</Text>
                    )}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  const hasWinner = raffle.winner_number !== null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.header}>{hasWinner ? 'Parabéns ao Vencedor!' : 'Realizar Sorteio'}</Text>

        <PrizeCard 
          title={raffle.prize_name || 'Smartphone XPTO'} 
          subtitle="Prêmio" 
          imageUri={raffle.prize_image}
        />

        <View style={{ height: 24 }} />

        {drawing && drawnNumber !== null ? (
          // Tela de contagem regressiva
          <>
            <View style={styles.countdownBox}>
              <Text style={styles.countdownLabel}>🎲 Sorteando...</Text>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
              </View>
              <Text style={styles.countdownText}>segundos</Text>
            </View>
          </>
        ) : hasWinner ? (
          <>
            <View style={styles.numberBox}>
              <Text style={styles.label}>Número Sorteado</Text>
              <Text style={styles.number}>{raffle.winner_number}</Text>
            </View>

            <View style={{ height: 20 }} />

            <View style={styles.infoBox}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Ganhador(a)</Text>
                <Text style={styles.infoValue}>{raffle.winner_name}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Vendedor(a)</Text>
                <Text style={styles.infoValue}>{raffle.seller_name}</Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.noWinnerBox}>
              <Text style={styles.noWinnerText}>Nenhum sorteio realizado ainda.</Text>
              <Text style={styles.noWinnerSubtext}>Clique no botão abaixo para sortear um vencedor.</Text>
            </View>

            {/* Informação sobre números no sorteio */}
            {soldCount > 0 && (
              <>
                <View style={{ height: 20 }} />
                <View style={styles.raffleInfoBox}>
                  <Text style={styles.raffleInfoLabel}>Números participando do sorteio</Text>
                  <Text style={styles.raffleInfoValue}>{soldCount} números vendidos</Text>
                  <Text style={styles.raffleInfoHint}>
                    Apenas os números vendidos participam do sorteio
                  </Text>
                </View>
              </>
            )}

            <View style={{ height: 24 }} />

            <PrimaryButton 
              color="#1db954" 
              onPress={handleDraw}
              disabled={drawing}
            >
              {drawing ? 'Sorteando...' : '🎲 Realizar Sorteio'}
            </PrimaryButton>
          </>
        )}

        {/* Histórico de Ganhadores */}
        {history.length > 0 && (
          <>
            <View style={{ height: 40 }} />
            <Text style={styles.historyHeader}>🏆 Histórico de Ganhadores</Text>
            {history.map((item, index) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyBadge}>
                  <Text style={styles.historyBadgeText}>#{index + 1}</Text>
                </View>
                <View style={styles.historyContent}>
                  <Text style={styles.historyPrize}>🎁 {item.prize_name}</Text>
                  <Text style={styles.historyWinner}>👤 {item.winner_name}</Text>
                  <Text style={styles.historyNumber}>🎟️ Número: {item.winner_number}</Text>
                  {item.draw_date && (
                    <Text style={styles.historyDate}>📅 {item.draw_date}</Text>
                  )}
                </View>
              </View>
            ))}
            <View style={{ height: 20 }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, flex: 1 },
  header: { 
    fontSize: 28, 
    color: '#fff', 
    fontWeight: '800', 
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  numberBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1410',
    borderRadius: 16,
    padding: 32,
    marginTop: 24,
    borderWidth: 2,
    borderColor: '#f6a623',
    shadowColor: '#f6a623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  label: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
  number: { 
    fontSize: 64, 
    color: '#f6a623', 
    fontWeight: '900',
    letterSpacing: 2,
  },
  infoBox: {
    backgroundColor: '#1a1410',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3a2820',
  },
  infoItem: {
    marginBottom: 16,
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    color: '#e5e5e5',
    fontSize: 18,
    fontWeight: '700',
  },
  winner: { 
    color: '#e5e5e5', 
    marginTop: 24, 
    fontWeight: '700',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  noWinnerBox: {
    backgroundColor: '#1a1410',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a2820',
  },
  noWinnerText: {
    color: '#e5e5e5',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  noWinnerSubtext: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  raffleInfoBox: {
    backgroundColor: '#0f1e13',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1db954',
  },
  raffleInfoLabel: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  raffleInfoValue: {
    color: '#1db954',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  raffleInfoHint: {
    color: '#6b7280',
    fontSize: 11,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  historyHeader: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: 0.3,
  },
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#1a1410',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a2820',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  historyBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f6a623',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  historyBadgeText: {
    color: '#0a0a0a',
    fontSize: 16,
    fontWeight: '900',
  },
  historyContent: {
    flex: 1,
    justifyContent: 'center',
  },
  historyPrize: {
    color: '#f6a623',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  historyWinner: {
    color: '#e5e5e5',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  historyNumber: {
    color: '#9ca3af',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  historyDate: {
    color: '#6b7280',
    fontSize: 12,
    fontStyle: 'italic',
  },
  countdownBox: {
    backgroundColor: '#1a1410',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f6a623',
    shadowColor: '#f6a623',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  countdownLabel: {
    color: '#f6a623',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 24,
    letterSpacing: 1,
  },
  countdownCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#0a0a0a',
    borderWidth: 6,
    borderColor: '#f6a623',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  countdownNumber: {
    color: '#f6a623',
    fontSize: 72,
    fontWeight: '900',
    letterSpacing: 2,
  },
  countdownText: {
    color: '#9ca3af',
    fontSize: 16,
    fontWeight: '600',
  },
  drawnNumberBox: {
    backgroundColor: '#1a1410',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1db954',
    shadowColor: '#1db954',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  drawnLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 12,
    fontWeight: '600',
  },
  drawnNumber: {
    color: '#1db954',
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
