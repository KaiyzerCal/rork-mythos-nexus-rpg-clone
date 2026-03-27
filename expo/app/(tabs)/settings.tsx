import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ChevronRight,
  User,
  Cpu,
  Shield,
  Bell,
  Moon,
  Volume2,
  Vibrate,
  Trash2,
  Info,
  Database,
  Wifi,
  Clock,
  Layers,
  Crown,
} from 'lucide-react-native';
import { useGame } from '@/contexts/GameContext';
import * as Haptics from 'expo-haptics';
import CopyButton from '@/components/CopyButton';

interface SettingToggle {
  notifications: boolean;
  darkMode: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
  autoSync: boolean;
}

export default function SettingsScreen() {
  const { gameState, isLoading } = useGame();
  const [settings, setSettings] = useState<SettingToggle>({
    notifications: true,
    darkMode: true,
    soundEffects: true,
    hapticFeedback: true,
    autoSync: true,
  });

  const toggleSetting = useCallback((key: keyof SettingToggle) => {
    if (settings.hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, [settings.hapticFeedback]);

  const handleClearCache = useCallback(() => {
    Alert.alert(
      'Clear Cache',
      'This will clear temporary cached data. Your progress and settings will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            console.log('[Settings] Cache cleared');
            Alert.alert('Done', 'Cache cleared successfully.');
          },
        },
      ]
    );
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { identity, stats } = gameState;

  const systemInfo = [
    { label: 'CodexOS Version', value: 'v21.1', icon: Cpu },
    { label: 'Platform', value: Platform.OS.toUpperCase(), icon: Layers },
    { label: 'App Version', value: '1.0.0', icon: Info },
    { label: 'Sync Status', value: settings.autoSync ? 'Active' : 'Paused', icon: Wifi },
    { label: 'DB Namespace', value: process.env.EXPO_PUBLIC_RORK_DB_NAMESPACE ? '●●●●●●' : 'Not Set', icon: Database },
    { label: 'Last Session', value: new Date().toLocaleDateString(), icon: Clock },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Settings</Text>
          <Text style={styles.headerSubtitle}>System Configuration</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Crown size={28} color="#FFD700" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{identity.inscribedName}</Text>
            <Text style={styles.profileTitle}>{identity.titles[0]}</Text>
            <View style={styles.profileMeta}>
              <View style={styles.profileBadge}>
                <Text style={styles.profileBadgeText}>Lv.{stats.level}</Text>
              </View>
              <View style={[styles.profileBadge, styles.rankBadge]}>
                <Text style={styles.rankBadgeText}>{stats.rank}</Text>
              </View>
              <View style={[styles.profileBadge, styles.speciesBadge]}>
                <Text style={styles.speciesBadgeText}>{identity.speciesLineage[identity.speciesLineage.length - 1]}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.profileDetailsCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>
              <User size={16} color="#08C284" /> Profile Details
            </Text>
            <CopyButton
              text={`${identity.inscribedName} — ${identity.titles[0]}\nLevel: ${stats.level} | Rank: ${stats.rank}\nSpecies: ${identity.speciesLineage[identity.speciesLineage.length - 1]}\nTerritory: ${identity.territory.class}\nFloor: ${gameState.currentFloor} | Form: ${gameState.currentForm}\nCodex: ${stats.codexIntegrity}% | Sync: ${stats.fullCowlSync}%\nPvP: ${gameState.pvpRating} | GPR: ${gameState.gpr}`}
              label="Copy"
              color="#08C284"
              size={12}
            />
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Territory</Text>
            <Text style={styles.detailValue}>{identity.territory.class}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tower Floors</Text>
            <Text style={styles.detailValue}>{identity.territory.towerFloorsInfluence}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Floor</Text>
            <Text style={styles.detailValue}>{gameState.currentFloor}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Current Form</Text>
            <Text style={styles.detailValue}>{gameState.currentForm}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Codex Integrity</Text>
            <Text style={styles.detailValue}>{stats.codexIntegrity}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Full Cowl Sync</Text>
            <Text style={styles.detailValue}>{stats.fullCowlSync}%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>PvP Rating</Text>
            <Text style={styles.detailValue}>{gameState.pvpRating}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.detailLabel}>GPR</Text>
            <Text style={styles.detailValue}>{gameState.gpr}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Cpu size={16} color="#08C284" /> System Information
          </Text>
          {systemInfo.map((item, index) => {
            const Icon = item.icon;
            return (
              <View
                key={item.label}
                style={[
                  styles.systemRow,
                  index === systemInfo.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={styles.systemRowLeft}>
                  <View style={styles.systemIconWrap}>
                    <Icon size={16} color="#08C284" />
                  </View>
                  <Text style={styles.systemLabel}>{item.label}</Text>
                </View>
                <Text style={styles.systemValue}>{item.value}</Text>
              </View>
            );
          })}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>
            <Shield size={16} color="#08C284" /> App Settings
          </Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.systemIconWrap, { backgroundColor: '#FF6B3520' }]}>
                <Bell size={16} color="#FF6B35" />
              </View>
              <Text style={styles.toggleLabel}>Notifications</Text>
            </View>
            <Switch
              value={settings.notifications}
              onValueChange={() => toggleSetting('notifications')}
              trackColor={{ false: '#333', true: '#08C28460' }}
              thumbColor={settings.notifications ? '#08C284' : '#666'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.systemIconWrap, { backgroundColor: '#6A0DAD20' }]}>
                <Moon size={16} color="#6A0DAD" />
              </View>
              <Text style={styles.toggleLabel}>Dark Mode</Text>
            </View>
            <Switch
              value={settings.darkMode}
              onValueChange={() => toggleSetting('darkMode')}
              trackColor={{ false: '#333', true: '#08C28460' }}
              thumbColor={settings.darkMode ? '#08C284' : '#666'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.systemIconWrap, { backgroundColor: '#00D9FF20' }]}>
                <Volume2 size={16} color="#00D9FF" />
              </View>
              <Text style={styles.toggleLabel}>Sound Effects</Text>
            </View>
            <Switch
              value={settings.soundEffects}
              onValueChange={() => toggleSetting('soundEffects')}
              trackColor={{ false: '#333', true: '#08C28460' }}
              thumbColor={settings.soundEffects ? '#08C284' : '#666'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <View style={[styles.systemIconWrap, { backgroundColor: '#FF149320' }]}>
                <Vibrate size={16} color="#FF1493" />
              </View>
              <Text style={styles.toggleLabel}>Haptic Feedback</Text>
            </View>
            <Switch
              value={settings.hapticFeedback}
              onValueChange={() => toggleSetting('hapticFeedback')}
              trackColor={{ false: '#333', true: '#08C28460' }}
              thumbColor={settings.hapticFeedback ? '#08C284' : '#666'}
            />
          </View>

          <View style={[styles.toggleRow, { borderBottomWidth: 0 }]}>
            <View style={styles.toggleLeft}>
              <View style={[styles.systemIconWrap, { backgroundColor: '#FFD70020' }]}>
                <Wifi size={16} color="#FFD700" />
              </View>
              <Text style={styles.toggleLabel}>Auto-Sync</Text>
            </View>
            <Switch
              value={settings.autoSync}
              onValueChange={() => toggleSetting('autoSync')}
              trackColor={{ false: '#333', true: '#08C28460' }}
              thumbColor={settings.autoSync ? '#08C284' : '#666'}
            />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
            <View style={styles.toggleLeft}>
              <View style={[styles.systemIconWrap, { backgroundColor: '#FF453A20' }]}>
                <Trash2 size={16} color="#FF453A" />
              </View>
              <Text style={styles.toggleLabel}>Clear Cache</Text>
            </View>
            <ChevronRight size={18} color="#444" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Mythos Nexus RPG</Text>
          <Text style={styles.footerVersion}>CodexOS v21.1 • Build 1.0.0</Text>
          <Text style={styles.footerCopy}>Black Sun Monarch System</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#08C284',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#555',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
    gap: 14,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD70040',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  profileTitle: {
    fontSize: 13,
    color: '#08C284',
    marginBottom: 8,
  },
  profileMeta: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  profileBadge: {
    backgroundColor: '#08C28418',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  profileBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#08C284',
  },
  rankBadge: {
    backgroundColor: '#FFD70018',
  },
  rankBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  speciesBadge: {
    backgroundColor: '#9400D318',
  },
  speciesBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#9400D3',
  },
  profileDetailsCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#08C284',
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  detailLabel: {
    fontSize: 13,
    color: '#777',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#DDD',
    maxWidth: '55%',
    textAlign: 'right' as const,
  },
  sectionCard: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  systemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  systemRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  systemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#08C28412',
    alignItems: 'center',
    justifyContent: 'center',
  },
  systemLabel: {
    fontSize: 13,
    color: '#AAA',
  },
  systemValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#DDD',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 14,
    color: '#CCC',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    gap: 4,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#333',
  },
  footerVersion: {
    fontSize: 12,
    color: '#2A2A2A',
  },
  footerCopy: {
    fontSize: 11,
    color: '#222',
    marginTop: 2,
  },
});
