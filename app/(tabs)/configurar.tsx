import PrimaryButton from '@/components/PrimaryButton';
import { Text as ThemedText } from '@/components/Themed';
import { createRaffle, getActiveRaffle, updateRaffleTotalNumbers } from '@/database/database';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function Configurar() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [quantity, setQuantity] = useState('');
  const [totalNumbers, setTotalNumbers] = useState(0);
  const [additionalNumbers, setAdditionalNumbers] = useState('');
  const [raffleId, setRaffleId] = useState<number | null>(null);
  const [prizeName, setPrizeName] = useState('');
  const [drawDate, setDrawDate] = useState('');
  const [numberPrice, setNumberPrice] = useState('');

  // Carregar sorteio ativo ao abrir a tela
  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        loadActiveRaffle();
      }, 100);
      
      return () => clearTimeout(timer);
    }, [])
  );

  async function loadActiveRaffle() {
    try {
      const activeRaffle = await getActiveRaffle();
      if (activeRaffle) {
        setRaffleId(activeRaffle.id);
        setTotalNumbers(activeRaffle.total_numbers);
        setPrizeName(activeRaffle.prize_name);
        if (activeRaffle.prize_image) {
          setImageUri(activeRaffle.prize_image);
        }
        if (activeRaffle.draw_date) {
          setDrawDate(activeRaffle.draw_date);
        }
        if (activeRaffle.number_price) {
          setNumberPrice(activeRaffle.number_price.toString());
        }
      } else {
        // Limpar campos se não houver sorteio ativo
        setRaffleId(null);
        setTotalNumbers(0);
        setPrizeName('');
        setImageUri(null);
        setDrawDate('');
        setNumberPrice('');
        setQuantity('');
        setAdditionalNumbers('');
      }
    } catch (error) {
      console.error('Erro ao carregar sorteio ativo:', error);
    }
  }

  async function pickImage() {
    try {
      // Try to dynamically import expo-image-picker (optional dependency)
      // If it's not installed, inform the developer/user.
      // This keeps the app working even if the package is not present.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const ImagePicker = await import('expo-image-picker');

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita acesso às fotos para escolher uma imagem do prêmio.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      // Newer versions of expo-image-picker return an object with `assets` array
      // Fallback to older `uri` property if present.
      // @ts-ignore
      const uri = result.assets?.[0]?.uri ?? result.uri;
      if (uri) setImageUri(uri);
    } catch (e) {
      console.warn('expo-image-picker not available or error picking image', e);
      Alert.alert(
        'Seleção de imagem indisponível',
        'Instale e configure `expo-image-picker` para permitir enviar imagens (ou execute sem este recurso).'
      );
    }
  }

  function handleDateChange(text: string) {
    // Remove tudo que não é número
    const numbers = text.replace(/[^0-9]/g, '');
    
    // Formatar automaticamente
    let formatted = numbers;
    if (numbers.length >= 2) {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2);
    }
    if (numbers.length >= 4) {
      formatted = numbers.slice(0, 2) + '/' + numbers.slice(2, 4) + '/' + numbers.slice(4, 8);
    }
    
    setDrawDate(formatted);
  }

  function handleInitiateRaffle() {
    const num = parseInt(quantity, 10);
    if (isNaN(num) || num <= 0) {
      Alert.alert('Erro', 'Digite um número válido para iniciar o sorteio.');
      return;
    }
    if (!prizeName.trim()) {
      Alert.alert('Erro', 'Digite o nome do prêmio.');
      return;
    }
    
    const price = numberPrice ? parseFloat(numberPrice) : undefined;
    
    // Salvar no banco de dados
    createRaffle(prizeName, num, imageUri || undefined, drawDate || undefined, price)
      .then((id) => {
        setRaffleId(id);
        setTotalNumbers(num);
        setQuantity('');
        setAdditionalNumbers('');
        Alert.alert('Sucesso', `Sorteio "${prizeName}" iniciado com ${num} números!`);
      })
      .catch((error) => {
        Alert.alert('Erro', 'Não foi possível criar o sorteio.');
        console.error(error);
      });
  }

  function handleAddNumbers() {
    if (!raffleId) {
      Alert.alert('Erro', 'Nenhum sorteio ativo encontrado.');
      return;
    }
    
    const additionalNum = parseInt(additionalNumbers, 10);
    if (isNaN(additionalNum) || additionalNum <= 0) {
      Alert.alert('Erro', 'Digite um número válido para adicionar.');
      return;
    }
    
    // Atualizar no banco de dados
    updateRaffleTotalNumbers(raffleId, additionalNum)
      .then(() => {
        const newTotal = totalNumbers + additionalNum;
        setTotalNumbers(newTotal);
        setAdditionalNumbers('');
        Alert.alert('Sucesso', `${additionalNum} números adicionados! Total agora é ${newTotal} números.`);
      })
      .catch((error) => {
        Alert.alert('Erro', 'Não foi possível adicionar números.');
        console.error(error);
      });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>Detalhes do Sorteio</Text>

        <Text style={styles.description}>Adicione uma imagem para o prêmio e defina o total de números participantes.</Text>

        <Text style={styles.label}>Nome do Prêmio</Text>
        <TextInput
          placeholder="Ex: iPhone 15 Pro"
          placeholderTextColor="#9aa0a6"
          style={styles.input}
          value={prizeName}
          onChangeText={setPrizeName}
          editable={totalNumbers === 0}
        />
        <View style={{ height: 12 }} />

        <Text style={styles.label}>Data Prevista do Sorteio</Text>
        <TextInput
          placeholder="Ex: 31/12/2025"
          placeholderTextColor="#9aa0a6"
          style={styles.input}
          keyboardType="number-pad"
          value={drawDate}
          onChangeText={handleDateChange}
          editable={totalNumbers === 0}
          maxLength={10}
        />
        <View style={{ height: 12 }} />

        <Text style={styles.label}>Valor de Cada Número</Text>
        <TextInput
          placeholder="Ex: 5.00"
          placeholderTextColor="#9aa0a6"
          style={styles.input}
          keyboardType="decimal-pad"
          value={numberPrice}
          onChangeText={(t) => setNumberPrice(t.replace(/[^0-9.,]/g, ''))}
          editable={totalNumbers === 0}
        />
        <View style={{ height: 12 }} />

        <Pressable style={styles.uploader} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.uploadedImage} resizeMode="cover" />
          ) : (
            <View style={styles.placeholderInner}>
              <Text style={styles.placeholderText}>Clique para enviar ou arrastar e soltar</Text>
              <Text style={styles.placeholderSub}>PNG, JPG, até 5MB</Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.label}>Quantidade de Números</Text>
        <TextInput
          placeholder="Ex: 100"
          placeholderTextColor="#9aa0a6"
          style={styles.input}
          keyboardType="number-pad"
          value={quantity}
          onChangeText={(t) => setQuantity(t.replace(/[^0-9]/g, ''))}
          editable={totalNumbers === 0}
        />
        <ThemedText style={styles.hint}>Máximo de 1000 números.</ThemedText>

        <View style={{ height: 20 }} />

        {totalNumbers > 0 && (
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Total de Números</Text>
            <Text style={styles.totalValue}>{totalNumbers}</Text>
          </View>
        )}

        {totalNumbers > 0 && (
          <View>
            <View style={{ height: 20 }} />
            <Text style={styles.label}>Adicionar Mais Números</Text>
            <TextInput
              placeholder="Ex: 100"
              placeholderTextColor="#9aa0a6"
              style={styles.input}
              keyboardType="number-pad"
              value={additionalNumbers}
              onChangeText={(t) => setAdditionalNumbers(t.replace(/[^0-9]/g, ''))}
            />
            <View style={{ height: 12 }} />
            <PrimaryButton 
              color="#1db954"
              onPress={handleAddNumbers}
            >
              + Adicionar Mais Números
            </PrimaryButton>
          </View>
        )}

        <View style={{ height: 20 }} />

        <PrimaryButton 
          color={totalNumbers === 0 ? '#f2994a' : '#ef4444'}
          onPress={totalNumbers === 0 ? handleInitiateRaffle : () => {
            setTotalNumbers(0);
            setQuantity('');
            setAdditionalNumbers('');
          }}
        >
          {totalNumbers === 0 ? 'Iniciar Sorteio' : 'Resetar Sorteio'}
        </PrimaryButton>
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
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  description: { 
    color: '#9ca3af', 
    marginBottom: 20,
    fontSize: 15,
    lineHeight: 22,
  },
  uploader: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#3a2820',
    borderRadius: 16,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1410',
    marginBottom: 24,
  },
  placeholderInner: { alignItems: 'center', padding: 20 },
  placeholderText: { 
    color: '#e5e5e5', 
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 8,
  },
  placeholderSub: { 
    color: '#9ca3af', 
    fontSize: 14,
  },
  uploadedImage: { width: '100%', height: '100%', borderRadius: 14 },
  label: { 
    color: '#fff', 
    fontWeight: '700', 
    fontSize: 18,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  hint: { 
    color: '#9ca3af', 
    marginTop: 8,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#1f1612',
    color: '#fff',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#3a2820',
  },
  totalBox: {
    backgroundColor: '#1a1410',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#f6a623',
    shadowColor: '#f6a623',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  totalLabel: {
    color: '#9ca3af',
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  totalValue: {
    color: '#f6a623',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
