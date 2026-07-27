import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useApp } from '@/lib/context';

interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount_sats: number;
  memo?: string;
  timestamp: number;
  rate_at_time: number;
  fiat_at_time: number;
  currency: string;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'receive',
    amount_sats: 588000,
    memo: 'Café con leche x2',
    timestamp: Date.now() - 3600000,
    rate_at_time: 85000,
    fiat_at_time: 500,
    currency: 'CUP',
  },
  {
    id: '2',
    type: 'send',
    amount_sats: 50000,
    timestamp: Date.now() - 7200000,
    rate_at_time: 85000,
    fiat_at_time: 42,
    currency: 'CUP',
  },
  {
    id: '3',
    type: 'receive',
    amount_sats: 352800,
    memo: 'Sándwich de jamón',
    timestamp: Date.now() - 10800000,
    rate_at_time: 85000,
    fiat_at_time: 300,
    currency: 'CUP',
  },
];

export default function History() {
  const { t, currency } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(timestamp: number): string {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.history.title}</Text>

      {transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>{t.history.noTransactions}</Text>
        </View>
      ) : (
        transactions.map((tx) => (
          <TouchableOpacity key={tx.id} style={styles.transactionCard}>
            <View style={styles.transactionHeader}>
              <Text style={styles.transactionType}>
                {tx.type === 'receive' ? `📥 ${t.history.received}` : `📤 ${t.history.sent}`}
              </Text>
              <Text style={styles.transactionTime}>{formatTime(tx.timestamp)}</Text>
            </View>

            <View style={styles.transactionAmount}>
              <Text style={styles.satsAmount}>
                {tx.type === 'receive' ? '+' : '-'}{tx.amount_sats.toLocaleString()} sats
              </Text>
            </View>

            {tx.memo && (
              <Text style={styles.transactionMemo}>{tx.memo}</Text>
            )}

            <View style={styles.transactionDetails}>
              <Text style={styles.detailText}>
                {tx.type === 'receive' ? t.history.atReception : t.history.atSending}: {tx.fiat_at_time} {tx.currency}
              </Text>
            </View>
          </TouchableOpacity>
        ))
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  transactionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transactionType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  transactionTime: {
    color: '#666',
    fontSize: 14,
  },
  transactionAmount: {
    marginBottom: 8,
  },
  satsAmount: {
    color: '#f7931a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  transactionMemo: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  transactionDetails: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 8,
  },
  detailText: {
    color: '#666',
    fontSize: 12,
  },
});
