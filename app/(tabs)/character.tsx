import { useGame } from '@/contexts/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Star, Zap, Crown, Shield, Flame } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CharacterScreen() {
  const { gameState } = useGame();
  const insets = useSafeAreaInsets();

  const totalXPEarned = gameState.stats.level * 1000 + gameState.stats.xp;
  const questsCompleted = gameState.quests.filter((q) => q.status === 'completed').length;
  const totalSkills = gameState.skillTrees.filter((s) => s.unlocked).length;
  const activeEnergies = gameState.energySystems.filter((e) => e.current > 0).length;

  const getFullCharacterText = () => {
    return `CHARACTER SHEET — ${gameState.identity.inscribedName}

Title: ${gameState.identity.titles[0]}
Species: ${gameState.identity.speciesLineage[gameState.identity.speciesLineage.length - 1]}
Aura: ${gameState.stats.auraPower}

Level: ${gameState.stats.level} | Rank: ${gameState.stats.rank}
GPR: ${gameState.gpr} | PVP: ${gameState.pvpRating}
Floor: ${gameState.currentFloor} | XP Total: ${totalXPEarned}
Quests Completed: ${questsCompleted} | Skills: ${totalSkills}

STR: ${gameState.stats.STR} | INT: ${gameState.stats.INT} | VIT: ${gameState.stats.VIT}
AGI: ${gameState.stats.AGI} | WIS: ${gameState.stats.WIS} | CHA: ${gameState.stats.CHA}

Current Form: ${gameState.currentForm} | BPM: ${gameState.currentBPM}
Sync: ${gameState.stats.fullCowlSync}% | Fatigue: ${gameState.stats.fatigue}/100
Codex Integrity: ${gameState.stats.codexIntegrity}%`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#1A0A0A', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.crownContainer}>
            <Crown size={48} color="#FFD700" />
          </View>
          <Text style={styles.title}>CHARACTER SHEET</Text>
          <Text style={styles.playerName}>{gameState.identity.inscribedName}</Text>
          <CopyButton text={getFullCharacterText()} label="Copy All" color="#FFD700" style={{ marginTop: 12 }} />
        </View>

        <View style={styles.identityCard}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.1)']}
            style={styles.identityGradient}
          >
            <View style={styles.identityHeader}>
              <Star size={20} color="#FFD700" />
              <Text style={styles.identityTitle}>IDENTITY</Text>
            </View>
            <View style={styles.identityRow}>
              <Text style={styles.identityLabel}>Title:</Text>
              <Text style={styles.identityValue}>{gameState.identity.titles[0]}</Text>
            </View>
            <View style={styles.identityRow}>
              <Text style={styles.identityLabel}>Species:</Text>
              <Text style={styles.identityValue}>{gameState.identity.speciesLineage[gameState.identity.speciesLineage.length - 1]}</Text>
            </View>
            <View style={styles.identityRow}>
              <Text style={styles.identityLabel}>Aura:</Text>
              <Text style={styles.identityValue}>{gameState.stats.auraPower}</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.progressCard}>
          <LinearGradient
            colors={['rgba(220, 20, 60, 0.15)', 'rgba(220, 20, 60, 0.05)']}
            style={styles.progressGradient}
          >
            <View style={styles.progressHeader}>
              <Zap size={20} color="#DC143C" />
              <Text style={styles.progressTitle}>PROGRESSION</Text>
            </View>
            <View style={styles.progressGrid}>
              <ProgressStat label="LEVEL" value={(gameState?.stats?.level ?? 0).toString()} color="#FFD700" />
              <ProgressStat label="RANK" value={gameState.stats.rank} color="#DC143C" />
              <ProgressStat label="GPR" value={(gameState?.gpr ?? 0).toString()} color="#4169E1" />
              <ProgressStat label="PVP" value={(gameState?.pvpRating ?? 0).toString()} color="#9400D3" />
            </View>
            <View style={styles.progressGrid}>
              <ProgressStat label="FLOOR" value={(gameState?.currentFloor ?? 0).toString()} color="#FFD700" />
              <ProgressStat label="XP TOTAL" value={totalXPEarned.toLocaleString()} color="#32CD32" />
              <ProgressStat label="QUESTS" value={(questsCompleted ?? 0).toString()} color="#4169E1" />
              <ProgressStat label="SKILLS" value={(totalSkills ?? 0).toString()} color="#9400D3" />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.attributesCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.03)']}
            style={styles.attributesGradient}
          >
            <View style={styles.attributesHeader}>
              <Shield size={20} color="#FFD700" />
              <Text style={styles.attributesTitle}>CORE ATTRIBUTES</Text>
            </View>
            <View style={styles.attributesGrid}>
              <AttributeBar
                label="STR"
                value={gameState.stats.STR}
                color="#DC143C"
              />
              <AttributeBar
                label="INT"
                value={gameState.stats.INT}
                color="#4169E1"
              />
              <AttributeBar
                label="END"
                value={gameState.stats.VIT}
                color="#32CD32"
              />
              <AttributeBar
                label="AGI"
                value={gameState.stats.AGI}
                color="#FFD700"
              />
              <AttributeBar
                label="WIL"
                value={gameState.stats.WIS}
                color="#9400D3"
              />
              <AttributeBar
                label="CHA"
                value={gameState.stats.CHA}
                color="#FF69B4"
              />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.systemCard}>
          <LinearGradient
            colors={['rgba(148, 0, 211, 0.15)', 'rgba(148, 0, 211, 0.05)']}
            style={styles.systemGradient}
          >
            <View style={styles.systemHeader}>
              <Flame size={20} color="#9400D3" />
              <Text style={styles.systemTitle}>SYSTEM OVERVIEW</Text>
            </View>
            <View style={styles.systemStats}>
              <SystemRow label="Current Form" value={gameState.currentForm} />
              <SystemRow label="BPM" value={`${gameState.currentBPM}`} />
              <SystemRow label="Synchronization" value={`${gameState.stats.fullCowlSync}%`} />
              <SystemRow label="Domain Radius" value={`22m`} />
              <SystemRow label="Fatigue" value={`${gameState.stats.fatigue}/100`} />
              <SystemRow label="Codex Integrity" value={`${gameState.stats.codexIntegrity}%`} />
              <SystemRow label="Active Energies" value={`${activeEnergies}/12`} />
              <SystemRow label="Allies" value={(gameState?.allies?.length ?? 0).toString()} />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.achievementsCard}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
            style={styles.achievementsGradient}
          >
            <View style={styles.achievementsHeader}>
              <Crown size={20} color="#FFD700" />
              <Text style={styles.achievementsTitle}>ACCOMPLISHMENTS</Text>
            </View>
            <View style={styles.achievementsList}>
              <AchievementItem label="Transformations Unlocked" value={(gameState?.transformations?.filter(t => t.unlocked)?.length ?? 0).toString()} />
              <AchievementItem label="Journal Entries" value={(gameState?.journalEntries?.length ?? 0).toString()} />
              <AchievementItem label="Vault Entries" value={(gameState?.vaultEntries?.length ?? 0).toString()} />
              <AchievementItem label="Daily Streak" value={(gameState?.dailyRituals?.length > 0 ? Math.max(...gameState.dailyRituals.map(r => r.streak)) : 0).toString()} />
              <AchievementItem label="Inventory Items" value={(gameState?.inventory?.reduce((sum, item) => sum + item.quantity, 0) ?? 0).toString()} />
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

interface ProgressStatProps {
  label: string;
  value: string;
  color: string;
}

function ProgressStat({ label, value, color }: ProgressStatProps) {
  return (
    <View style={styles.progressStat}>
      <Text style={styles.progressLabel}>{label}</Text>
      <Text style={[styles.progressValue, { color }]}>{value}</Text>
    </View>
  );
}

interface AttributeBarProps {
  label: string;
  value: number;
  color: string;
}

function AttributeBar({ label, value, color }: AttributeBarProps) {
  const percentage = Math.min((value / 200) * 100, 100);

  return (
    <View style={styles.attributeRow}>
      <Text style={styles.attributeLabel}>{label}</Text>
      <View style={styles.attributeBarContainer}>
        <View style={styles.attributeBar}>
          <LinearGradient
            colors={[color, `${color}80`]}
            style={[styles.attributeFill, { width: `${percentage}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.attributeValue}>{value}</Text>
      </View>
    </View>
  );
}

interface SystemRowProps {
  label: string;
  value: string;
}

function SystemRow({ label, value }: SystemRowProps) {
  return (
    <View style={styles.systemRow}>
      <Text style={styles.systemLabel}>{label}:</Text>
      <Text style={styles.systemValue}>{value}</Text>
    </View>
  );
}

interface AchievementItemProps {
  label: string;
  value: string;
}

function AchievementItem({ label, value }: AchievementItemProps) {
  return (
    <View style={styles.achievementItem}>
      <Text style={styles.achievementLabel}>{label}</Text>
      <Text style={styles.achievementValue}>{value}</Text>
    </View>
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
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  crownContainer: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  playerName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#CCC',
  },
  identityCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  identityGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 16,
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  identityTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFD700',
    letterSpacing: 2,
  },
  identityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  identityLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#999',
  },
  identityValue: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFD700',
    flex: 1,
    textAlign: 'right',
  },
  progressCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#DC143C',
    borderRadius: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#DC143C',
    letterSpacing: 2,
  },
  progressGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  progressStat: {
    flex: 1,
    minWidth: '22%',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 1,
    marginBottom: 6,
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '900' as const,
  },
  attributesCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  attributesGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
  },
  attributesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  attributesTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFD700',
    letterSpacing: 2,
  },
  attributesGrid: {
    gap: 16,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attributeLabel: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#CCC',
    width: 36,
  },
  attributeBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  attributeBar: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  attributeFill: {
    height: '100%',
    borderRadius: 4,
  },
  attributeValue: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFF',
    width: 36,
    textAlign: 'right',
  },
  systemCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  systemGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#9400D3',
    borderRadius: 16,
  },
  systemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  systemTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#9400D3',
    letterSpacing: 2,
  },
  systemStats: {
    gap: 12,
  },
  systemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  systemLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#999',
  },
  systemValue: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#9400D3',
  },
  achievementsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  achievementsGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 16,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  achievementsTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFD700',
    letterSpacing: 2,
  },
  achievementsList: {
    gap: 12,
  },
  achievementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
  achievementLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#CCC',
  },
  achievementValue: {
    fontSize: 16,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
});
