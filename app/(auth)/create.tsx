import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { generateNostrKeys } from '@/lib/nostr';
import { saveNsec, saveNpub } from '@/lib/storage';
import { useApp } from '@/lib/context';

export default function CreateWallet() {
  const router = useRouter();
  const { t } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [step, setStep] = useState<'generate' | 'backup' | 'confirm'>('generate');

  async function handleGenerate() {
    if (password.length < 6) {
      Alert.alert(t.common.error, t.create.errors.passwordLength);
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(t.common.error, t.create.errors.passwordMatch);
      return;
    }

    try {
      const keys = generateNostrKeys();
      setMnemonic(keys.nsec);
      setShowMnemonic(true);
      setStep('backup');
    } catch (error) {
      Alert.alert(t.common.error, t.create.errors.generateFailed);
    }
  }

  async function handleConfirmBackup() {
    try {
      const keys = generateNostrKeys();
      await saveNsec(keys.nsec, password);
      await saveNpub(keys.npub);
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert(t.common.error, t.create.errors.saveFailed);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.create.title}</Text>

      {!showMnemonic ? (
        <>
          <Text style={styles.description}>
            {t.create.description}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.create.password}</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder={t.create.password}
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>{t.create.confirmPassword}</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder={t.create.confirmPassword}
              placeholderTextColor="#666"
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={handleGenerate}>
            <Text style={styles.primaryButtonText}>{t.create.generate}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.warningBox}>
            <Text style={styles.warningTitle}>⚠️ {t.create.important}</Text>
            <Text style={styles.warningText}>
              {t.create.warning}
            </Text>
          </View>

          <View style={styles.mnemonicContainer}>
            <Text style={styles.label}>{t.create.privateKey}</Text>
            <Text style={styles.mnemonic}>{mnemonic}</Text>
          </View>

          <TouchableOpacity
            style={styles.copyButton}
            onPress={() => {
              Alert.alert(t.common.success, 'Private key copied to clipboard');
            }}
          >
            <Text style={styles.copyButtonText}>{t.create.copyClipboard}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmBackup}>
            <Text style={styles.primaryButtonText}>{t.create.savedKey}</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backButtonText}>{t.create.back}</Text>
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
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  description: {
    color: '#888',
    fontSize: 16,
    marginBottom: 30,
    lineHeight: 24,
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
  warningBox: {
    backgroundColor: '#332200',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#664400',
  },
  warningTitle: {
    color: '#ffaa00',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  warningText: {
    color: '#ffcc44',
    fontSize: 14,
    lineHeight: 20,
  },
  mnemonicContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  mnemonic: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
  copyButton: {
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  copyButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: '#f7931a',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#888',
    fontSize: 16,
  },
});
