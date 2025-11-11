import { getChartData } from '@/database/database';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function Detalhes() {
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any>(null);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        loadChartData();
      }, 100);
      
      return () => clearTimeout(timer);
    }, [])
  );

  async function loadChartData() {
    try {
      setLoading(true);
      const data = await getChartData();
      setChartData(data);
    } catch (error) {
      console.error('Erro ao carregar dados dos gráficos:', error);
    } finally {
      setLoading(false);
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

  if (!chartData) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.header}>📊 Análises e Gráficos</Text>
          <View style={styles.noDataBox}>
            <Text style={styles.noDataText}>📈 Nenhum dado disponível</Text>
            <Text style={styles.noDataSubtext}>
              Configure sorteios e faça vendas para ver as análises aqui!
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Preparar dados para gráfico de pizza - Arrecadação por Prêmio
  const activeRaffles = chartData.raffleData.filter((r: any) => r.status === 'active');
  const finishedRaffles = chartData.raffleData.filter((r: any) => r.status === 'finished');
  
  const totalActiveValue = activeRaffles.reduce((sum: number, r: any) => sum + r.total_value, 0);
  const totalFinishedValue = finishedRaffles.reduce((sum: number, r: any) => sum + r.total_value, 0);

  const revenueByStatus = [
    {
      name: 'Em Andamento',
      value: totalActiveValue,
      color: '#f6a623',
      legendFontColor: '#9ca3af',
      legendFontSize: 13,
    },
    {
      name: 'Finalizados',
      value: totalFinishedValue,
      color: '#1db954',
      legendFontColor: '#9ca3af',
      legendFontSize: 13,
    },
  ].filter(item => item.value > 0);

  // Preparar dados para gráfico de pizza - Arrecadação por Rifa
  const revenueByRaffle = chartData.raffleData
    .filter((r: any) => r.total_value > 0)
    .slice(0, 5)
    .map((r: any, index: number) => ({
      name: r.prize_name.length > 15 ? r.prize_name.substring(0, 15) + '...' : r.prize_name,
      value: r.total_value,
      color: ['#f6a623', '#1db954', '#3b82f6', '#8b5cf6', '#ec4899'][index % 5],
      legendFontColor: '#9ca3af',
      legendFontSize: 12,
    }));

  const chartConfig = {
    backgroundGradientFrom: '#0a0a0a',
    backgroundGradientTo: '#0a0a0a',
    color: (opacity = 1) => `rgba(246, 166, 35, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>📊 Análises e Gráficos</Text>

        {/* Gráfico de Arrecadação por Status */}
        {revenueByStatus.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>💰 Arrecadação por Status</Text>
            <PieChart
              data={revenueByStatus}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Em Andamento</Text>
                <Text style={styles.statValue}>
                  R$ {totalActiveValue.toFixed(2).replace('.', ',')}
                </Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Finalizados</Text>
                <Text style={[styles.statValue, { color: '#1db954' }]}>
                  R$ {totalFinishedValue.toFixed(2).replace('.', ',')}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Gráfico de Arrecadação por Rifa */}
        {revenueByRaffle.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>💰 Valores Arrecadados por Rifa</Text>
            <PieChart
              data={revenueByRaffle}
              width={screenWidth - 40}
              height={220}
              chartConfig={chartConfig}
              accessor="value"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
            
            {/* Detalhes de cada rifa */}
            <View style={{ marginTop: 16 }}>
              {chartData.raffleData
                .filter((r: any) => r.total_value > 0)
                .slice(0, 5)
                .map((raffle: any, index: number) => (
                  <View key={index} style={styles.raffleDetailCard}>
                    <View style={styles.raffleHeader}>
                      <View style={[styles.colorDot, { 
                        backgroundColor: ['#f6a623', '#1db954', '#3b82f6', '#8b5cf6', '#ec4899'][index % 5] 
                      }]} />
                      <Text style={styles.raffleTitle}>{raffle.prize_name}</Text>
                    </View>
                    <View style={styles.raffleInfo}>
                      <View style={styles.raffleInfoItem}>
                        <Text style={styles.raffleInfoLabel}>📅 Data do Sorteio</Text>
                        <Text style={styles.raffleInfoValue}>
                          {raffle.draw_date || 'Não definida'}
                        </Text>
                      </View>
                      <View style={styles.raffleInfoItem}>
                        <Text style={styles.raffleInfoLabel}>💵 Valor por Número</Text>
                        <Text style={styles.raffleInfoValue}>
                          R$ {(raffle.number_price || 0).toFixed(2).replace('.', ',')}
                        </Text>
                      </View>
                      <View style={styles.raffleInfoItem}>
                        <Text style={styles.raffleInfoLabel}>🎫 Números Vendidos</Text>
                        <Text style={styles.raffleInfoValue}>{raffle.total_numbers}</Text>
                      </View>
                      <View style={styles.raffleInfoItem}>
                        <Text style={styles.raffleInfoLabel}>💰 Total Arrecadado</Text>
                        <Text style={[styles.raffleInfoValue, { color: '#1db954', fontWeight: '700' }]}>
                          R$ {raffle.total_value.toFixed(2).replace('.', ',')}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
            </View>
          </View>
        )}

        {/* Ranking de Vendedores */}
        {chartData.sellerStats.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>🏆 Ranking de Vendedores</Text>
            {chartData.sellerStats.map((seller: any, index: number) => {
              const totalValue = seller.total_numbers * 5; // Estimativa, pode ser ajustado
              return (
                <View key={index} style={styles.sellerRow}>
                  <View style={styles.sellerRank}>
                    <Text style={styles.rankText}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                    </Text>
                  </View>
                  <View style={styles.sellerInfo}>
                    <Text style={styles.sellerName}>{seller.seller_name}</Text>
                    <Text style={styles.sellerStats}>
                      {seller.total_rifas} rifas • {seller.total_numbers} números
                    </Text>
                  </View>
                  <View style={styles.sellerValue}>
                    <Text style={styles.valueText}>{seller.total_numbers}</Text>
                    <Text style={styles.valueLabel}>números</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20 },
  header: { 
    fontSize: 28, 
    color: '#fff', 
    fontWeight: '800', 
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  noDataBox: {
    backgroundColor: '#1a1410',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a2820',
  },
  noDataText: {
    color: '#e5e5e5',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  noDataSubtext: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#1a1410',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#3a2820',
  },
  chartTitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#3a2820',
  },
  statLabel: {
    color: '#9ca3af',
    fontSize: 12,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    color: '#f6a623',
    fontSize: 16,
    fontWeight: '800',
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#3a2820',
  },
  sellerRank: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontSize: 18,
    fontWeight: '800',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    color: '#e5e5e5',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  sellerStats: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: '500',
  },
  sellerValue: {
    alignItems: 'center',
    backgroundColor: '#1a1410',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  valueText: {
    color: '#1db954',
    fontSize: 20,
    fontWeight: '900',
  },
  valueLabel: {
    color: '#9ca3af',
    fontSize: 10,
    marginTop: 2,
  },
  raffleDetailCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3a2820',
  },
  raffleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a2820',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  raffleTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  raffleInfo: {
    gap: 8,
  },
  raffleInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  raffleInfoLabel: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '600',
  },
  raffleInfoValue: {
    color: '#e5e5e5',
    fontSize: 14,
    fontWeight: '700',
  },
});
