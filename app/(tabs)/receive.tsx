import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { getNpub } from '@/lib/storage';
import { fiatToSats, formatSats, formatFiat } from '@/lib/yadio';
import { useApp } from '@/lib/context';

export default function Receive() {
  const { t, currency } = useApp();
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [satsAmount, setSatsAmount] = useState(0);
  const [npub, setNpub] = useState('');
  const [invoice, setInvoice] = useState('');
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadNpub();
  }, []);

  async function loadNpub() {
    const storedNpub = await getNpub();
    if (storedNpub) {
      setNpub(storedNpub);
    }
  }

  async function handleAmountChange(text: string) {
    setAmount(text);
    if (text) {
      const fiatAmount = parseFloat(text);
      if (!isNaN(fiatAmount)) {
        const sats = await fiatToSats(fiatAmount, currency);
        setSatsAmount(sats);
      }
    } else {
      setSatsAmount(0);
    }
  }

  async function handleGenerate() {
    if (!amount) {
      Alert.alert(t.common.error, t.receive.errors.enterAmount);
      return;
    }

    // TODO: Generate real invoice with Arkade SDK
    const mockInvoice = `lnbc${satsAmount}n1p...placeholder`;
    setInvoice(mockInvoice);
    setShowQR(true);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.receive.title}</Text>

      {!showQR ? (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.receive.amount} ({currency})</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
            {satsAmount > 0 && (
              <Text style={styles.satsAmount}>
                ≈ {formatSats(satsAmount)} sats
              </Text>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.receive.memo}</Text>
            <TextInput
              style={styles.input}
              value={memo}
              onChangeText={setMemo}
              placeholder={t.receive.memoPlaceholder}
              placeholderTextColor="#666"
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleGenerate}>
            <Text style={styles.primaryButtonText}>{t.receive.generateInvoice}</Text>
          </TouchableOpacity>

          <View style={styles.addressTypes}>
            <Text style={styles.addressTitle}>{t.receive.yourAddresses}</Text>
            <View style={styles.addressItem}>
              <Text style={styles.addressLabel}>{t.receive.lightning}</Text>
              <Text style={styles.addressValue}>{t.receive.availableAfter}</Text>
            </View>
            <View style={styles.addressItem}>
              <Text style={styles.addressLabel}>Ark</Text>
              <Text style={styles.addressValue}>ark1qq...</Text>
            </View>
            <View style={styles.addressItem}>
              <Text style={styles.addressLabel}>On-chain</Text>
              <Text style={styles.addressValue}>bc1q...</Text>
            </View>
          </View>
        </>
      ) : (
        <>
          <View style={styles.invoiceCard}>
            <Text style={styles.invoiceTitle}>{t.receive.invoiceGenerated}</Text>
            
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>QR CODE</Text>
              <Text style={styles.qrSubtext}>{t.receive.scanToPay}</Text>
            </View>

            <View style={styles.invoiceDetails}>
              <Text style={styles.invoiceLabel}>{t.receive.amount}:</Text>
              <Text style={styles.invoiceValue}>{formatSats(satsAmount)} sats</Text>
              <Text style={styles.invoiceFiat}>≈ {formatFiat(parseFloat(amount), currency)}</Text>
            </View>

            {memo && (
              <View style={styles.invoiceDetails}>
                <Text style={styles.invoiceLabel}>{t.receive.memo}:</Text>
                <Text style={styles.invoiceValue}>{memo}</Text>
              </View>
            )}

            <View style={styles.invoiceContainer}>
              <Text style={styles.invoiceLabel}>Invoice:</Text>
              <Text style={styles.invoiceText} numberOfLines={3}>{invoice}</Text>
            </View>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={() => {
                Alert.alert(t.common.success, 'Invoice copied to clipboard');
              }}
            >
              <Text style={styles.copyButtonText}>{t.receive.copyInvoice}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setShowQR(false)}
          >
            <Text style={styles.secondaryButtonText}>{t.receive.createNew}</Text>
          </TouchableOpacity>
        </>
      )}
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
  },
  satsAmount: {
    color: '#f7931a',
    fontSize: 14,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#f7931a',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addressTypes: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  addressTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  addressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addressLabel: {
    color: '#888',
    fontSize: 14,
  },
  addressValue: {
    color: '#666',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  invoiceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  invoiceTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  qrPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  qrText: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  qrSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  invoiceDetails: {
    marginBottom: 16,
  },
  invoiceLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  invoiceValue: {
    color: '#fff',
    fontSize: 16,
  },
  invoiceFiat: {
    color: '#f7931a',
    fontSize: 14,
    marginTop: 4,
  },
  invoiceContainer: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  invoiceText: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  copyButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: '#222',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
