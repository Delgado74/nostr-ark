import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { detectAddressType, sendPayment } from '@/lib/ark';
import { useApp } from '@/lib/context';

export default function Send() {
  const router = useRouter();
  const { t } = useApp();
  const [invoice, setInvoice] = useState('');
  const [amount, setAmount] = useState('');
  const [addressType, setAddressType] = useState<string>('');
  const [loading, setLoading] = useState(false);

  function handleInvoiceChange(text: string) {
    setInvoice(text);
    const type = detectAddressType(text);
    setAddressType(type);
  }

  async function handleSend() {
    if (!invoice) {
      Alert.alert(t.common.error, t.send.errors.enterInvoice);
      return;
    }

    if (addressType === 'unknown') {
      Alert.alert(t.common.error, t.send.errors.invalidFormat);
      return;
    }

    setLoading(true);
    try {
      const success = await sendPayment(invoice);
      if (success) {
        Alert.alert(t.send.success.title, t.send.success.message, [
          { text: t.common.confirm, onPress: () => router.push('/(tabs)') },
        ]);
      } else {
        Alert.alert(t.common.error, t.send.errors.sendFailed);
      }
    } catch (error) {
      Alert.alert(t.common.error, t.send.errors.sendFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.send.title}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t.send.invoiceAddress}</Text>
        <TextInput
          style={styles.input}
          value={invoice}
          onChangeText={handleInvoiceChange}
          placeholder={t.send.placeholder}
          placeholderTextColor="#666"
          autoCapitalize="none"
          autoCorrect={false}
          multiline
        />
        {addressType !== '' && addressType !== 'unknown' && (
          <Text style={styles.typeIndicator}>
            {addressType === 'lightning' && '⚡ Lightning'}
            {addressType === 'ark' && '🔗 Ark'}
            {addressType === 'onchain' && '₿ On-chain'}
          </Text>
        )}
      </View>

      <View style={styles.amountContainer}>
        <Text style={styles.label}>{t.send.amountOptional}</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="0"
          placeholderTextColor="#666"
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity style={styles.scanButton}>
        <Text style={styles.scanButtonText}>📷 {t.send.scanQR}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        onPress={handleSend}
        disabled={loading}
      >
        <Text style={styles.primaryButtonText}>
          {loading ? t.send.sending : t.send.sendPayment}
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>{t.send.supportedFormats}</Text>
        <Text style={styles.infoText}>• {t.send.lightningInvoice}</Text>
        <Text style={styles.infoText}>• {t.send.arkAddress}</Text>
        <Text style={styles.infoText}>• {t.send.bitcoinAddress}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  amountContainer: {
    marginBottom: 20,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeIndicator: {
    color: '#f7931a',
    fontSize: 14,
    marginTop: 8,
  },
  scanButton: {
    backgroundColor: '#222',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#f7931a',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  infoText: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
});
