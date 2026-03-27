import { useGame } from '@/contexts/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Scroll, CheckCircle, Circle, Lock, TrendingUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'skills' | 'quests' | 'achievements';

export default function ProgressScreen() {
  const { gameState, isLoading, completeQuest, updateQuestProgress, unlockSkill } = useGame();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('quests');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0A0A0A', '#1A0A0A']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.loadingText}>Loading Progress...</Text>
      </View>
    );
  }

  const { quests, skillTrees, currencies } = gameState;
  const codexPoints = currencies.find(c => c.name === 'Codex Points')?.amount || 0;

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
          <TrendingUp size={32} color="#FFD700" strokeWidth={2.5} />
          <Text style={styles.title}>PROGRESSION</Text>
          <CopyButton
            text={`PROGRESSION SUMMARY\nActive Quests: ${quests.filter(q => q.status === 'active').length}\nCompleted Quests: ${quests.filter(q => q.status === 'completed').length}\nUnlocked Skills: ${skillTrees.filter(s => s.unlocked).length}/${skillTrees.length}\nCodex Points: ${codexPoints}`}
            label="Copy Summary"
            color="#FFD700"
            size={12}
            style={{ marginTop: 8 }}
          />
        </View>

        <View style={styles.tabBar}>
          <TabButton
            label="Quests"
            active={activeTab === 'quests'}
            onPress={() => setActiveTab('quests')}
          />
          <TabButton
            label="Skills"
            active={activeTab === 'skills'}
            onPress={() => setActiveTab('skills')}
          />
          <TabButton
            label="Achievements"
            active={activeTab === 'achievements'}
            onPress={() => setActiveTab('achievements')}
          />
        </View>

        {activeTab === 'quests' && (
          <View>
            {['epic', 'main', 'daily'].map((type) => {
              const typeQuests = quests.filter(q => q.type === type);
              if (typeQuests.length === 0) return null;

              return (
                <View key={type} style={styles.questSection}>
                  <Text style={styles.sectionTitle}>
                    {type.toUpperCase()} QUESTS
                  </Text>
                  {typeQuests.map((quest) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      onComplete={() => completeQuest(quest.id)}
                      onProgressUpdate={(progress) => updateQuestProgress(quest.id, progress)}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'skills' && (
          <View>
            <View style={styles.pointsCard}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
                style={styles.cardGradient}
              >
                <Text style={styles.pointsLabel}>CODEX POINTS</Text>
                <Text style={styles.pointsValue}>{codexPoints}</Text>
              </LinearGradient>
            </View>

            {['Mastery', 'Combat', 'Social', 'Creation'].map((category) => {
              const categorySkills = skillTrees.filter(s => s.category === category);
              if (categorySkills.length === 0) return null;

              return (
                <View key={category} style={styles.skillSection}>
                  <Text style={styles.sectionTitle}>{category.toUpperCase()}</Text>
                  {categorySkills.map((skill) => (
                    <SkillCard
                      key={skill.id}
                      skill={skill}
                      canAfford={codexPoints >= skill.cost}
                      onUnlock={() => unlockSkill(skill.id)}
                    />
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {activeTab === 'achievements' && (
          <View style={styles.achievementsContainer}>
            <Text style={styles.comingSoon}>ACHIEVEMENTS COMING SOON</Text>
            <Text style={styles.comingSoonSub}>
              Track your milestones and unlock exclusive titles
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function TabButton({ label, active, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface QuestCardProps {
  quest: any;
  onComplete: () => void;
  onProgressUpdate: (progress: number) => void;
}

function QuestCard({ quest, onComplete }: QuestCardProps) {
  const progressPercentage = quest.progress
    ? (quest.progress.current / quest.progress.target) * 100
    : 0;

  const statusColors = {
    active: '#32CD32',
    completed: '#FFD700',
    failed: '#DC143C',
    locked: '#666',
  };

  const color = statusColors[quest.status as keyof typeof statusColors];

  return (
    <TouchableOpacity
      style={styles.questCard}
      disabled={quest.status === 'completed'}
      onPress={quest.status === 'active' ? onComplete : undefined}
    >
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        style={styles.questCardGradient}
      >
        <View style={styles.questHeader}>
          <View style={styles.questTitleRow}>
            {quest.status === 'completed' ? (
              <CheckCircle size={20} color={color} />
            ) : quest.status === 'locked' ? (
              <Lock size={20} color={color} />
            ) : (
              <Circle size={20} color={color} />
            )}
            <Text style={[styles.questTitle, { color }]}>{quest.title}</Text>
          </View>
          <View style={[styles.xpBadge, { backgroundColor: `${color}30` }]}>
            <Text style={[styles.xpBadgeText, { color }]}>+{quest.xpReward} XP</Text>
          </View>
        </View>

        <Text style={styles.questDescription}>{quest.description}</Text>

        {quest.progress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={[color, `${color}80`]}
                style={[styles.progressFill, { width: `${progressPercentage}%` }]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.progressText}>
              {quest.progress.current} / {quest.progress.target}
            </Text>
          </View>
        )}

        {quest.realWorldMapping && (
          <View style={styles.mappingBadge}>
            <Text style={styles.mappingText}>🌎 {quest.realWorldMapping}</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

interface SkillCardProps {
  skill: any;
  canAfford: boolean;
  onUnlock: () => void;
}

function SkillCard({ skill, canAfford, onUnlock }: SkillCardProps) {
  return (
    <TouchableOpacity
      style={styles.skillCard}
      disabled={skill.unlocked || !canAfford}
      onPress={skill.unlocked ? undefined : onUnlock}
    >
      <LinearGradient
        colors={
          skill.unlocked
            ? ['rgba(50, 205, 50, 0.15)', 'rgba(50, 205, 50, 0.05)']
            : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
        }
        style={styles.skillCardGradient}
      >
        <View style={styles.skillHeader}>
          <View style={styles.skillTitleRow}>
            {skill.unlocked ? (
              <CheckCircle size={18} color="#32CD32" />
            ) : canAfford ? (
              <Circle size={18} color="#FFD700" />
            ) : (
              <Lock size={18} color="#666" />
            )}
            <Text style={[styles.skillName, skill.unlocked && { color: '#32CD32' }]}>
              {skill.name}
            </Text>
          </View>
          {!skill.unlocked && (
            <View style={styles.costBadge}>
              <Text style={[styles.costText, !canAfford && { color: '#DC143C' }]}>
                {skill.cost} CP
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.skillDescription}>{skill.description}</Text>
        <View style={styles.skillFooter}>
          <Text style={styles.skillTier}>Tier {skill.tier}</Text>
          <Text style={[styles.skillEnergy, { color: '#4169E1' }]}>
            {skill.energyType}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#FFD700',
    letterSpacing: 2,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#FFD700',
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#999',
    letterSpacing: 1,
  },
  tabButtonTextActive: {
    color: '#000',
  },
  questSection: {
    marginBottom: 24,
  },
  skillSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  questCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  questCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  questTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    flex: 1,
  },
  xpBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  questDescription: {
    fontSize: 13,
    color: '#999',
    marginBottom: 12,
    lineHeight: 18,
  },
  progressContainer: {
    gap: 6,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600' as const,
  },
  mappingBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(100, 149, 237, 0.2)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  mappingText: {
    fontSize: 10,
    color: '#6495ED',
    fontWeight: '600' as const,
  },
  pointsCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardGradient: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
    alignItems: 'center',
  },
  pointsLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 32,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
  skillCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  skillCardGradient: {
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  skillTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  skillName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  costBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 6,
  },
  costText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  skillDescription: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    lineHeight: 16,
  },
  skillFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillTier: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600' as const,
  },
  skillEnergy: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  achievementsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  comingSoon: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  comingSoonSub: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
});
