import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '@/lib/context';
import { deleteWallet } from '@/lib/storage';
import { Language, Currency } from '@/lib/i18n';

export default function Settings() {
  const router = useRouter();
  const { t, language, currency, setLanguage, setCurrency } = useApp();
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  async function handleDeleteWallet() {
    Alert.alert(
      t.settings.deleteWallet,
      t.settings.deleteWarning,
      [
        { text: t.common.cancel, style: 'cancel' },
        {
          text: t.settings.deleteConfirm,
          style: 'destructive',
          onPress: async () => {
            await deleteWallet();
            router.replace('/(auth)');
          },
        },
      ]
    );
  }

  function handleExportKey() {
    // TODO: Implement key export
    Alert.alert(t.settings.exportKey, 'Coming soon');
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.settings.title}</Text>

      {/* Language Selection */}
      <TouchableOpacity
        style={styles.settingsItem}
        onPress={() => setShowLanguagePicker(!showLanguagePicker)}
      >
        <Text style={styles.settingsLabel}>{t.settings.language}</Text>
        <Text style={styles.settingsValue}>{language === 'es' ? 'Español' : 'English'}</Text>
      </TouchableOpacity>

      {showLanguagePicker && (
        <View style={styles.pickerContainer}>
          <TouchableOpacity
            style={[styles.pickerItem, language === 'es' && styles.pickerItemActive]}
            onPress={() => { setLanguage('es'); setShowLanguagePicker(false); }}
          >
            <Text style={[styles.pickerText, language === 'es' && styles.pickerTextActive]}>
              Español
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.pickerItem, language === 'en' && styles.pickerItemActive]}
            onPress={() => { setLanguage('en'); setShowLanguagePicker(false); }}
          >
            <Text style={[styles.pickerText, language === 'en' && styles.pickerTextActive]}>
              English
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Currency Selection */}
      <TouchableOpacity
        style={styles.settingsItem}
        onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
      >
        <Text style={styles.settingsLabel}>{t.settings.currency}</Text>
        <Text style={styles.settingsValue}>{currency}</Text>
      </TouchableOpacity>

      {showCurrencyPicker && (
        <View style={styles.pickerContainer}>
          {(['CUP', 'USD', 'EUR'] as Currency[]).map((curr) => (
            <TouchableOpacity
              key={curr}
              style={[styles.pickerItem, currency === curr && styles.pickerItemActive]}
              onPress={() => { setCurrency(curr); setShowCurrencyPicker(false); }}
            >
              <Text style={[styles.pickerText, currency === curr && styles.pickerTextActive]}>
                {curr}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Backup */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.settings.backup}</Text>
      </View>

      <TouchableOpacity style={styles.settingsItem} onPress={handleExportKey}>
        <Text style={styles.settingsLabel}>{t.settings.exportKey}</Text>
        <Text style={styles.settingsArrow}>→</Text>
      </TouchableOpacity>

      <Text style={styles.settingsDescription}>{t.settings.backupDescription}</Text>

      {/* About */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{t.settings.about}</Text>
      </View>

      <View style={styles.settingsItem}>
        <Text style={styles.settingsLabel}>{t.settings.version}</Text>
        <Text style={styles.settingsValue}>0.1.0</Text>
      </View>

      <View style={styles.settingsItem}>
        <Text style={styles.settingsLabel}>{t.settings.network}</Text>
        <Text style={styles.settingsValue}>Arkade (Suiza)</Text>
      </View>

      {/* Danger Zone */}
      <View style={styles.dangerSection}>
        <Text style={styles.dangerTitle}>{t.settings.dangerZone}</Text>
        <TouchableOpacity style={styles.dangerButton} onPress={handleDeleteWallet}>
          <Text style={styles.dangerButtonText}>{t.settings.deleteWallet}</Text>
        </TouchableOpacity>
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
  sectionHeader: {
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingsLabel: {
    color: '#fff',
    fontSize: 16,
  },
  settingsValue: {
    color: '#888',
    fontSize: 16,
  },
  settingsArrow: {
    color: '#f7931a',
    fontSize: 18,
  },
  settingsDescription: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  pickerItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickerItemActive: {
    backgroundColor: '#f7931a',
  },
  pickerText: {
    color: '#fff',
    fontSize: 16,
  },
  pickerTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  dangerSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  dangerTitle: {
    color: '#ff4444',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  dangerButton: {
    backgroundColor: '#331111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#662222',
  },
  dangerButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
});
