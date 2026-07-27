import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { getNpub } from '@/lib/storage';
import { maskNpub } from '@/lib/nostr';
import { formatSats, formatFiat, satsToFiat, getCurrency } from '@/lib/yadio';
import { useApp } from '@/lib/context';

export default function Dashboard() {
  const router = useRouter();
  const { t, currency } = useApp();
  const [npub, setNpub] = useState('');
  const [balance, setBalance] = useState(0);
  const [fiatBalance, setFiatBalance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const storedNpub = await getNpub();
    if (storedNpub) {
      setNpub(maskNpub(storedNpub));
    }

    // TODO: Get real balance from Arkade SDK
    const mockBalance = 250000;
    setBalance(mockBalance);

    const fiat = await satsToFiat(mockBalance, currency);
    setFiatBalance(fiat);
  }

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f7931a" />}
    >
      <View style={styles.header}>
        <Text style={styles.npub}>{npub}</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/settings')}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>{t.dashboard.balance}</Text>
        <Text style={styles.balanceAmount}>{formatSats(balance)} sats</Text>
        <Text style={styles.balanceFiat}>≈ {formatFiat(fiatBalance, currency)}</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/send')}
        >
          <Text style={styles.actionIcon}>📤</Text>
          <Text style={styles.actionLabel}>{t.tabs.send}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => router.push('/(tabs)/receive')}
        >
          <Text style={styles.actionIcon}>📥</Text>
          <Text style={styles.actionLabel}>{t.tabs.receive}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.networkInfo}>
        <Text style={styles.networkTitle}>{t.dashboard.network}</Text>
        <View style={styles.networkRow}>
          <Text style={styles.networkLabel}>{t.dashboard.lightning}</Text>
          <Text style={styles.networkStatus}>✓ {t.dashboard.connected}</Text>
        </View>
        <View style={styles.networkRow}>
          <Text style={styles.networkLabel}>{t.dashboard.ark}</Text>
          <Text style={styles.networkStatus}>✓ {t.dashboard.connected}</Text>
        </View>
        <View style={styles.networkRow}>
          <Text style={styles.networkLabel}>{t.dashboard.onchain}</Text>
          <Text style={styles.networkStatus}>✓ {t.dashboard.connected}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.historyButton}
        onPress={() => router.push('/(tabs)/history')}
      >
        <Text style={styles.historyButtonText}>{t.dashboard.viewHistory}</Text>
        <Text style={styles.historyArrow}>→</Text>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  npub: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  settingsIcon: {
    fontSize: 24,
  },
  balanceCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  balanceLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  balanceFiat: {
    color: '#f7931a',
    fontSize: 20,
    marginTop: 8,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  networkInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  networkTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  networkLabel: {
    color: '#888',
    fontSize: 14,
  },
  networkStatus: {
    color: '#4caf50',
    fontSize: 14,
  },
  historyButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  historyButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  historyArrow: {
    color: '#f7931a',
    fontSize: 20,
  },
});
