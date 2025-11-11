import PrimaryButton from '@/components/PrimaryButton';
import PrizeCard from '@/components/PrizeCard';
import { Text as ThemedText } from '@/components/Themed';
import { addParticipant, getActiveRaffle, getSoldNumbers } from '@/database/database';
import { useFocusEffect } from '@react-navigation/native';
import { Link } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

export default function Participar() {
  const [participantName, setParticipantName] = useState('');
  const [numbers, setNumbers] = useState('');
  const [sellerName, setSellerName] = useState('');
  const [activeRaffle, setActiveRaffle] = useState<any>(null);
  const [soldNumbers, setSoldNumbers] = useState<number[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);

  // Recarregar dados sempre que a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      loadRaffleData();
    }, [])
  );

  async function loadRaffleData() {
    try {
      // Pequeno delay para garantir que o banco está pronto
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const raffle = await getActiveRaffle();
      if (raffle) {
        setActiveRaffle(raffle);
        const sold = await getSoldNumbers(raffle.id);
        setSoldNumbers(sold);
      } else {
        setActiveRaffle(null);
        setSoldNumbers([]);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do sorteio:', error);
      setActiveRaffle(null);
      setSoldNumbers([]);
    }
  }

  function toggleNumberSelection(number: number) {
    if (soldNumbers.includes(number)) {
      Alert.alert('Número Vendido', 'Este número já foi vendido.');
      return;
    }

    let updatedNumbers: number[];
    if (selectedNumbers.includes(number)) {
      updatedNumbers = selectedNumbers.filter(n => n !== number);
    } else {
      updatedNumbers = [...selectedNumbers, number];
    }
    
    setSelectedNumbers(updatedNumbers);
    
    // Atualizar campo de números em tempo real
    const sortedNumbers = updatedNumbers.sort((a, b) => a - b);
    setNumbers(sortedNumbers.join(', '));
  }

  function openNumberPicker() {
    // Manter números já selecionados ao abrir o modal
    const currentNumbers = numbers
      .split(/[\s,]+/)
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n) && n > 0);
    setSelectedNumbers(currentNumbers);
    setModalVisible(true);
  }

  async function handleParticipate() {
    if (!activeRaffle) {
      Alert.alert('Erro', 'Nenhum sorteio ativo encontrado. Configure um sorteio primeiro.');
      return;
    }

    if (!participantName.trim()) {
      Alert.alert('Erro', 'Digite seu nome.');
      return;
    }

    if (!numbers.trim()) {
      Alert.alert('Erro', 'Digite os números desejados.');
      return;
    }

    if (!sellerName.trim()) {
      Alert.alert('Erro', 'Digite o nome do vendedor.');
      return;
    }

    // Parse números (ex: "01, 02, 03" ou "1 2 3")
    const parsedNumbers = numbers
      .split(/[\s,]+/)
      .map(n => parseInt(n.trim(), 10))
      .filter(n => !isNaN(n) && n > 0);

    if (parsedNumbers.length === 0) {
      Alert.alert('Erro', 'Digite números válidos (ex: 01, 02, 03).');
      return;
    }

    // Verificar se algum número já foi vendido
    const alreadySold = parsedNumbers.filter(n => soldNumbers.includes(n));
    if (alreadySold.length > 0) {
      Alert.alert('Erro', `Os seguintes números já foram vendidos: ${alreadySold.join(', ')}`);
      return;
    }

    // Verificar se os números estão dentro do range do sorteio
    const outOfRange = parsedNumbers.filter(n => n > activeRaffle.total_numbers);
    if (outOfRange.length > 0) {
      Alert.alert('Erro', `Os seguintes números estão fora do range (máximo ${activeRaffle.total_numbers}): ${outOfRange.join(', ')}`);
      return;
    }

    try {
      await addParticipant(activeRaffle.id, participantName, parsedNumbers, sellerName);
      Alert.alert('Sucesso!', `${participantName} participando com os números: ${parsedNumbers.join(', ')}`);
      
      // Limpar campos e recarregar números vendidos
      setParticipantName('');
      setNumbers('');
      setSellerName('');
      setSelectedNumbers([]);
      await loadRaffleData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível registrar a participação. Alguns números podem já estar vendidos.');
      console.error(error);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {!activeRaffle ? (
              <View style={styles.noRaffleContainer}>
                <Text style={styles.noRaffleTitle}>📢 Nenhum Sorteio Ativo</Text>
                <ThemedText style={styles.noRaffleText}>
                  Não há sorteios disponíveis no momento.{'\n'}
                  Configure um novo sorteio para começar!
                </ThemedText>
                <View style={{ height: 20 }} />
                <Link href="/configurar" asChild>
                  <PrimaryButton style={{ backgroundColor: '#f6a623' }}>
                    Configurar Sorteio
                  </PrimaryButton>
                </Link>
              </View>
            ) : (
              <>
                <Text style={styles.header}>{activeRaffle.prize_name}</Text>

                <PrizeCard 
                  title={activeRaffle.prize_name} 
                  subtitle="Prêmio" 
                  imageUri={activeRaffle.prize_image}
                />

                <View style={{ height: 18 }} />

                {/* Card de Informações do Sorteio */}
                <View style={styles.raffleInfoCard}>
                  <View style={styles.raffleInfoRow}>
                    <View style={styles.raffleInfoItem}>
                      <Text style={styles.raffleInfoLabel}>Total de Números</Text>
                      <Text style={styles.raffleInfoValue}>{activeRaffle.total_numbers}</Text>
                    </View>
                    <View style={styles.raffleInfoDivider} />
                    <View style={styles.raffleInfoItem}>
                      <Text style={styles.raffleInfoLabel}>Disponíveis</Text>
                      <Text style={[styles.raffleInfoValue, { color: '#1db954' }]}>
                        {activeRaffle.total_numbers - soldNumbers.length}
                      </Text>
                    </View>
                    <View style={styles.raffleInfoDivider} />
                    <View style={styles.raffleInfoItem}>
                      <Text style={styles.raffleInfoLabel}>Vendidos</Text>
                      <Text style={[styles.raffleInfoValue, { color: '#f6a623' }]}>
                        {soldNumbers.length}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={{ height: 24 }} />

                <Text style={styles.title}>Participe da Rifa</Text>
                <ThemedText style={styles.hint}>
                  Escolha seus números da sorte e garanta sua participação!
                </ThemedText>

                <TextInput 
                  placeholder="Digite seu nome completo" 
                  placeholderTextColor="#9aa0a6" 
                  style={styles.input}
                  returnKeyType="next"
                  value={participantName}
                  onChangeText={setParticipantName}
                />

                {/* Botão para abrir modal de seleção de números */}
                <Pressable 
                  style={styles.numberPickerButton}
                  onPress={openNumberPicker}
                >
                  <Text style={styles.numberPickerButtonText}>
                    {selectedNumbers.length > 0 
                      ? `✓ ${selectedNumbers.length} número(s): ${selectedNumbers.sort((a, b) => a - b).join(', ')}`
                      : '🎯 Clique para Selecionar Números'}
                  </Text>
                  <Text style={styles.numberPickerButtonHint}>
                    Toque nos números disponíveis (verdes) para adicionar
                  </Text>
                </Pressable>
                
                <TextInput 
                  placeholder="Nome do vendedor" 
                  placeholderTextColor="#9aa0a6" 
                  style={styles.input}
                  returnKeyType="done"
                  value={sellerName}
                  onChangeText={setSellerName}
                />
                
                <View style={{ height: 20 }} />

                <PrimaryButton 
                  style={{ backgroundColor: '#1db954' }}
                  onPress={handleParticipate}
                >
                  🎟️ Participar Agora
                </PrimaryButton>
              </>
            )}
            
            <View style={{ height: 40 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Modal de Seleção Visual de Números */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolha seus Números da Sorte</Text>
              <Pressable onPress={() => setModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalInstructions}>
              <Text style={styles.instructionText}>
                👆 Toque nos números para adicionar ou remover da sua seleção
              </Text>
            </View>

            {/* Legenda */}
            <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#1db954' }]} />
                <Text style={styles.legendText}>Disponível</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>Vendido</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendBox, { backgroundColor: '#f6a623', borderWidth: 2, borderColor: '#fff' }]} />
                <Text style={styles.legendText}>Selecionado</Text>
              </View>
            </View>

            {/* Grid de Números */}
            <ScrollView style={styles.numbersGrid} showsVerticalScrollIndicator={false}>
              <View style={styles.gridContainer}>
                {activeRaffle && Array.from({ length: activeRaffle.total_numbers }, (_, i) => i + 1).map((num) => {
                  const isSold = soldNumbers.includes(num);
                  const isSelected = selectedNumbers.includes(num);
                  
                  return (
                    <Pressable
                      key={num}
                      style={[
                        styles.numberBox,
                        isSold && styles.numberBoxSold,
                        isSelected && styles.numberBoxSelected,
                        !isSold && !isSelected && styles.numberBoxAvailable,
                      ]}
                      onPress={() => toggleNumberSelection(num)}
                      disabled={isSold}
                    >
                      <Text style={[
                        styles.numberText,
                        isSold && styles.numberTextSold,
                        isSelected && styles.numberTextSelected,
                      ]}>
                        {num.toString().padStart(2, '0')}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            {/* Rodapé com informações e botão */}
            <View style={styles.modalFooter}>
              <Text style={styles.selectedCount}>
                {selectedNumbers.length} número(s) selecionado(s)
              </Text>
              <PrimaryButton 
                style={{ backgroundColor: '#f6a623' }}
                onPress={() => setModalVisible(false)}
              >
                ✓ Fechar
              </PrimaryButton>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { padding: 20, flexGrow: 1 },
  header: { 
    fontSize: 28, 
    color: '#fff', 
    fontWeight: '800', 
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  title: { 
    fontSize: 24, 
    color: '#fff', 
    fontWeight: '800', 
    marginTop: 8,
    letterSpacing: 0.3,
  },
  hint: { 
    color: '#9ca3af', 
    marginTop: 8, 
    marginBottom: 12,
    fontSize: 15,
    lineHeight: 22,
  },
  raffleInfo: {
    color: '#1db954',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  noRaffleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noRaffleTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  noRaffleText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 8,
  },
  raffleInfoCard: {
    backgroundColor: '#1a1410',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3a2820',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  raffleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  raffleInfoItem: {
    flex: 1,
    alignItems: 'center',
  },
  raffleInfoLabel: {
    fontSize: 12,
    color: '#9ca3af',
    marginBottom: 6,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  raffleInfoValue: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '800',
  },
  raffleInfoDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#3a2820',
    marginHorizontal: 12,
  },
  numberHint: {
    fontSize: 13,
    color: '#9ca3af',
    marginTop: 6,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  input: {
    backgroundColor: '#1f1612',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a2820',
  },
  link: { 
    color: '#f6a623', 
    marginTop: 16, 
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '600',
  },
  numberPickerButton: {
    backgroundColor: '#1f1612',
    padding: 18,
    borderRadius: 12,
    marginTop: 10,
    borderWidth: 2,
    borderColor: '#f6a623',
    borderStyle: 'dashed',
  },
  numberPickerButtonText: {
    color: '#f6a623',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  numberPickerButtonHint: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  orText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginVertical: 12,
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1a1410',
    borderRadius: 20,
    width: '96%',
    height: '88%',
    borderWidth: 2,
    borderColor: '#f6a623',
    shadowColor: '#f6a623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#3a2820',
  },
  modalTitle: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalClose: {
    fontSize: 28,
    color: '#f6a623',
    fontWeight: '400',
  },
  modalInstructions: {
    backgroundColor: '#0f1e13',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#3a2820',
  },
  instructionText: {
    color: '#1db954',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#0f0a08',
    borderBottomWidth: 1,
    borderBottomColor: '#3a2820',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
  },
  legendText: {
    color: '#e5e5e5',
    fontSize: 11,
    fontWeight: '700',
  },
  numbersGrid: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'flex-start',
    paddingBottom: 10,
  },
  numberBox: {
    width: 55,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  numberBoxAvailable: {
    backgroundColor: '#1db954',
    borderColor: '#25e067',
  },
  numberBoxSold: {
    backgroundColor: '#ef4444',
    borderColor: '#7f1d1d',
    opacity: 0.6,
  },
  numberBoxSelected: {
    backgroundColor: '#f6a623',
    borderColor: '#fff',
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  numberText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 1,
  },
  numberTextSold: {
    color: '#fca5a5',
    textDecorationLine: 'line-through',
  },
  numberTextSelected: {
    color: '#fff',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: '#3a2820',
    gap: 12,
    backgroundColor: '#0f0a08',
  },
  selectedCount: {
    color: '#f6a623',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
