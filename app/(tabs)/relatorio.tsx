import PrimaryButton from '@/components/PrimaryButton';
import { Text as ThemedText } from '@/components/Themed';
import { getActiveRaffle, getRaffleStatistics } from '@/database/database';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function Relatorio() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Recarregar dados sempre que a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        loadStatistics();
      }, 100);
      
      return () => clearTimeout(timer);
    }, [])
  );

  async function loadStatistics() {
    try {
      setLoading(true);
      const raffle = await getActiveRaffle();
      if (raffle) {
        const statistics = await getRaffleStatistics(raffle.id);
        // Adicionar informações do sorteio às estatísticas
        setStats({
          ...statistics,
          drawDate: raffle.draw_date,
          numberPrice: raffle.number_price
        });
      } else {
        setStats(null);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadStatistics();
  }

  async function handleShareWhatsApp() {
    if (!stats) return;

    // Obter data atual
    const now = new Date();
    const dataFormatada = now.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Montar mensagem formatada
    let message = `╔═══════════════════════╗\n`;
    message += `║  📊 *RELATÓRIO DE VENDAS*  ║\n`;
    message += `╚═══════════════════════╝\n\n`;
    message += `🎁 *Prêmio:* ${stats.prizeName}\n`;
    if (stats.drawDate) {
      message += `�️ *Sorteio:* ${stats.drawDate}\n`;
    }
    if (stats.numberPrice) {
      message += `💰 *Valor:* R$ ${stats.numberPrice.toFixed(2).replace('.', ',')}\n`;
    }
    message += `�📅 *Relatório gerado:* ${dataFormatada}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Resumo Geral
    message += `📈 *RESUMO GERAL*\n`;
    message += `┌─────────────────────┐\n`;
    message += `│ 🎯 Números Vendidos: *${stats.totalSold}*\n`;
    message += `│ 👥 Participantes: *${stats.totalParticipants}*\n`;
    if (stats.numberPrice && stats.totalSold) {
      const totalValue = stats.numberPrice * stats.totalSold;
      message += `│ 💵 Arrecadado: *R$ ${totalValue.toFixed(2).replace('.', ',')}*\n`;
    }
    message += `└─────────────────────┘\n\n`;

    // Ranking de Vendedores
    if (stats.topSellers && stats.topSellers.length > 0) {
      message += `🏆 *RANKING DE VENDEDORES*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━\n`;
      stats.topSellers.forEach((seller: any, index: number) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
        message += `\n${medal} *${seller.seller_name}*\n`;
        message += `   ├ 📦 Rifas: ${seller.quantity}\n`;
        message += `   └ 🎫 Números: ${seller.total_numbers || 0}\n`;
      });
      message += `\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }

    // Ranking de Compradores
    if (stats.topBuyers && stats.topBuyers.length > 0) {
      message += `🎟️ *RANKING DE COMPRADORES*\n`;
      message += `━━━━━━━━━━━━━━━━━━━━━\n`;
      stats.topBuyers.slice(0, 10).forEach((buyer: any, index: number) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`;
        message += `\n${medal} *${buyer.participant_name}*\n`;
        message += `   ├ 🎫 Números: ${buyer.quantity}\n`;
        message += `   └ 🤝 Vendedor: ${buyer.seller_name}\n`;
      });
      message += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
    }

    message += `\n✨ _Relatório gerado automaticamente_`;


    // Codificar mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;

    // Abrir WhatsApp
    try {
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        alert('WhatsApp não está instalado no dispositivo.');
      }
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error);
      alert('Erro ao compartilhar relatório.');
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#f6a623"
            colors={['#f6a623']}
          />
        }
      >
        <Text style={styles.header}>Relatório do Sorteio</Text>
        
        {!stats ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>📊 Nenhum dado disponível</Text>
            <ThemedText style={styles.noDataHint}>
              Configure um sorteio e comece a vender para ver as estatísticas aqui!
            </ThemedText>
          </View>
        ) : (
          <>
            {/* Nome do Prêmio */}
            {stats.prizeName && (
              <View style={styles.prizeCard}>
                <Text style={styles.prizeLabel}>🎁 Prêmio</Text>
                <Text style={styles.prizeName}>{stats.prizeName}</Text>
                <View style={styles.prizeDetails}>
                  {stats.drawDate && (
                    <Text style={styles.prizeDetailText}>🗓️ Sorteio: {stats.drawDate}</Text>
                  )}
                  {stats.numberPrice && (
                    <Text style={styles.prizeDetailText}>💰 R$ {stats.numberPrice.toFixed(2).replace('.', ',')}/número</Text>
                  )}
                </View>
              </View>
            )}

            <View style={styles.metrics}>
              <View style={styles.metricBox}>
                <Text style={styles.metricTitle}>Números Vendidos</Text>
                <Text style={styles.metricValue}>{stats.totalSold}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricTitle}>Pessoas</Text>
                <Text style={styles.metricValue}>{stats.totalParticipants}</Text>
              </View>
              {stats.numberPrice && stats.totalSold > 0 && (
                <View style={styles.metricBox}>
                  <Text style={styles.metricTitle}>Arrecadado</Text>
                  <Text style={styles.metricValue}>
                    R$ {(stats.numberPrice * stats.totalSold).toFixed(2).replace('.', ',')}
                  </Text>
                </View>
              )}
            </View>

            {/* Ranking de Vendedores */}
            <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>🏆 Ranking de Vendedores</ThemedText>
          {stats?.topSellers && stats.topSellers.length > 0 ? (
            stats.topSellers.map((item: any, index: number) => (
              <View key={index} style={[styles.row, index < 3 && styles.topRow]}>
                <View style={styles.rankBadge}>
                  <Text style={[styles.rank, index < 3 && styles.topRank]}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                  </Text>
                </View>
                <View style={styles.sellerInfo}>
                  <Text style={styles.name}>{item.seller_name}</Text>
                  <Text style={styles.sellerDetails}>
                    {item.quantity} rifas • {item.total_numbers || 0} números
                  </Text>
                </View>
                <Text style={styles.qtd}>{item.quantity}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum vendedor ainda</Text>
          )}
        </View>

        {/* Ranking de Compradores */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>🎟️ Ranking de Compradores</ThemedText>
          {stats?.topBuyers && stats.topBuyers.length > 0 ? (
            stats.topBuyers.map((item: any, index: number) => (
              <View key={index} style={[styles.buyerRow, index < 3 && styles.topRow]}>
                <View style={styles.rankBadge}>
                  <Text style={[styles.rank, index < 3 && styles.topRank]}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}º`}
                  </Text>
                </View>
                <View style={styles.buyerInfo}>
                  <Text style={styles.buyerName}>{item.participant_name}</Text>
                  <Text style={styles.buyerSeller}>Vendedor: {item.seller_name}</Text>
                </View>
                <View style={styles.buyerStats}>
                  <Text style={styles.buyerQtd}>{item.quantity}</Text>
                  <Text style={styles.buyerLabel}>números</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhum comprador ainda</Text>
          )}
        </View>

        <PrimaryButton 
          style={{ marginTop: 24, marginBottom: 24, backgroundColor: '#25d366' }}
          onPress={handleShareWhatsApp}
        >
          � Compartilhar via WhatsApp
        </PrimaryButton>
          </>
        )}
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
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noDataText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  noDataHint: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 22,
  },
  prizeCard: {
    backgroundColor: '#1a1410',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#f6a623',
    alignItems: 'center',
  },
  prizeLabel: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 8,
    fontWeight: '600',
  },
  prizeName: {
    fontSize: 22,
    color: '#f6a623',
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  prizeDetails: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  prizeDetailText: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '600',
  },
  metrics: { flexDirection: 'row', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  metricBox: { 
    backgroundColor: '#1a1410', 
    padding: 16, 
    borderRadius: 16, 
    minWidth: '30%',
    flex: 1,
    borderWidth: 1,
    borderColor: '#3a2820',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
    alignItems: 'center',
  },
  metricTitle: { 
    color: '#9ca3af', 
    fontSize: 11,
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: { 
    color: '#f6a623', 
    fontWeight: '900', 
    fontSize: 20,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16, 
    borderBottomColor: '#3a2820', 
    borderBottomWidth: 1,
    backgroundColor: '#1a1410',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  topRow: {
    backgroundColor: '#2a1f17',
    borderWidth: 1,
    borderColor: '#f6a623',
  },
  rankBadge: {
    width: 50,
    alignItems: 'center',
  },
  rank: { 
    color: '#f6a623', 
    fontSize: 18,
    fontWeight: '800',
  },
  topRank: {
    fontSize: 22,
  },
  name: { 
    color: '#e5e5e5', 
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerDetails: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  qtd: { 
    color: '#9ca3af',
    fontSize: 14,
  },
  buyerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#1a1410',
    borderRadius: 12,
    marginBottom: 10,
    borderBottomColor: '#3a2820',
    borderBottomWidth: 1,
  },
  buyerInfo: {
    flex: 1,
    marginLeft: 4,
  },
  buyerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  buyerSeller: {
    color: '#9ca3af',
    fontSize: 13,
  },
  buyerStats: {
    alignItems: 'center',
    backgroundColor: '#2a1f17',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buyerQtd: {
    color: '#1db954',
    fontSize: 20,
    fontWeight: '800',
  },
  buyerLabel: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    fontSize: 15,
    marginTop: 20,
    fontStyle: 'italic',
  },
});
