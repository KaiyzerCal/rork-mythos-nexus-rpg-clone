import { useGame } from '@/contexts/GameContext';
import type { SkillTreeNode } from '@/types/rpg';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Lock, CheckCircle, TrendingUp, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SkillsScreen() {
  const { gameState, unlockSkill, skillSubTrees } = useGame();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedSkills, setExpandedSkills] = useState<Record<string, boolean>>({});

  const categories = ['All', 'Combat', 'Energy', 'Transformation', 'Mutation', 'Soul', 'Perception', 'Mental', 'Absorption', 'Transcendence'];

  const filteredSkills = selectedCategory === 'All' 
    ? gameState.skillTrees 
    : gameState.skillTrees.filter(skill => skill.category === selectedCategory);

  const codexPoints = gameState.currencies.find(c => c.name === 'Codex Points')?.amount || 0;

  const getEnergyColor = (energyType: string): string => {
    const colors: Record<string, string> = {
      Ki: '#FFD700',
      Aura: '#4169E1',
      Nen: '#32CD32',
      Haki: '#8B0000',
      Magoi: '#FF69B4',
      Chakra: '#00CED1',
      'Cursed Energy': '#9400D3',
      Mana: '#4682B4',
      VRIL: '#FFD700',
      Ichor: '#FFD700',
      Lacrima: '#87CEEB',
      'Black Heart': '#000000',
    };
    return colors[energyType] || '#FFFFFF';
  };

  const getTierColor = (tier: number): string => {
    const colors = ['#808080', '#32CD32', '#4169E1', '#9400D3', '#FFD700', '#DC143C', '#FF1493'];
    return colors[Math.min(tier, colors.length - 1)];
  };

  const canUnlock = (skillId: string): boolean => {
    const skill = gameState.skillTrees.find(s => s.id === skillId);
    if (!skill || skill.unlocked) return false;
    if (codexPoints < skill.cost) return false;
    if (!skill.prerequisites || skill.prerequisites.length === 0) return true;
    return skill.prerequisites.every(prereqId => {
      const prereq = gameState.skillTrees.find(s => s.id === prereqId);
      return prereq?.unlocked === true;
    });
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#1A0A1A', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.titleRow}>
          <Sparkles size={24} color="#9400D3" />
          <Text style={styles.title}>SKILL TREE</Text>
          <Sparkles size={24} color="#9400D3" />
        </View>
        <View style={styles.currencyContainer}>
          <Zap size={16} color="#FFD700" />
          <Text style={styles.currencyText}>{codexPoints} Codex Points</Text>
        </View>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryPill,
              selectedCategory === category && styles.categoryPillActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === category && styles.categoryTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {filteredSkills.map((skill) => {
          const unlockable = canUnlock(skill.id);
          const energyColor = getEnergyColor(skill.energyType);
          const tierColor = getTierColor(skill.tier);

          return (
            <View key={skill.id} style={styles.skillCard}>
              <LinearGradient
                colors={
                  skill.unlocked
                    ? ['rgba(50, 205, 50, 0.15)', 'rgba(50, 205, 50, 0.05)']
                    : unlockable
                    ? ['rgba(148, 0, 211, 0.15)', 'rgba(148, 0, 211, 0.05)']
                    : ['rgba(50, 50, 50, 0.15)', 'rgba(50, 50, 50, 0.05)']
                }
                style={styles.skillCardGradient}
              >
                <View style={styles.skillHeader}>
                  <View style={styles.skillHeaderLeft}>
                    <CopyButton
                      text={`${skill.name} (T${skill.tier})\nEnergy: ${skill.energyType}\n${skill.description}\nStatus: ${skill.unlocked ? 'UNLOCKED' : 'LOCKED'}${!skill.unlocked ? ` | Cost: ${skill.cost} CP` : ''}`}
                      size={12}
                      color={energyColor}
                      iconOnly
                      style={{ marginRight: 6 }}
                    />
                    <View style={[styles.tierBadge, { backgroundColor: tierColor + '40', borderColor: tierColor }]}>
                      <Text style={[styles.tierText, { color: tierColor }]}>T{skill.tier}</Text>
                    </View>
                    <View style={styles.skillTitleContainer}>
                      <Text style={[styles.skillName, skill.unlocked && styles.skillNameUnlocked]}>
                        {skill.name}
                      </Text>
                      <View style={[styles.energyBadge, { backgroundColor: energyColor + '20', borderColor: energyColor + '80' }]}>
                        <Text style={[styles.energyText, { color: energyColor }]}>{skill.energyType}</Text>
                      </View>
                    </View>
                  </View>

                  {skill.unlocked ? (
                    <CheckCircle size={24} color="#32CD32" />
                  ) : unlockable ? (
                    <TrendingUp size={24} color="#9400D3" />
                  ) : (
                    <Lock size={24} color="#666" />
                  )}
                </View>

                <Text style={styles.skillDescription}>{skill.description}</Text>

                <View style={styles.skillFooter}>
                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryTagText}>{skill.category}</Text>
                  </View>

                  {!skill.unlocked && (
                    <View style={styles.costContainer}>
                      <Zap size={14} color="#FFD700" />
                      <Text style={styles.costText}>{skill.cost}</Text>
                    </View>
                  )}
                </View>

                {skill.prerequisites && skill.prerequisites.length > 0 && !skill.unlocked && (
                  <View style={styles.prerequisitesContainer}>
                    <Text style={styles.prerequisitesLabel}>Prerequisites:</Text>
                    {skill.prerequisites.map((prereqId) => {
                      const prereq = gameState.skillTrees.find(s => s.id === prereqId);
                      if (!prereq) return null;
                      return (
                        <View key={prereqId} style={styles.prerequisiteItem}>
                          {prereq.unlocked ? (
                            <CheckCircle size={12} color="#32CD32" />
                          ) : (
                            <Lock size={12} color="#DC143C" />
                          )}
                          <Text style={[
                            styles.prerequisiteText,
                            prereq.unlocked && styles.prerequisiteTextUnlocked,
                          ]}>
                            {prereq.name}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}

                {!skill.unlocked && unlockable && (
                  <TouchableOpacity
                    style={styles.unlockButton}
                    onPress={() => unlockSkill(skill.id)}
                  >
                    <LinearGradient
                      colors={['#9400D3', '#4B0082']}
                      style={styles.unlockButtonGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      <Sparkles size={16} color="#FFF" />
                      <Text style={styles.unlockButtonText}>UNLOCK SKILL</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                {skillSubTrees[skill.id] && skillSubTrees[skill.id].length > 0 && (
                  <>
                    <TouchableOpacity
                      style={styles.expandButton}
                      onPress={() => setExpandedSkills(prev => ({ ...prev, [skill.id]: !prev[skill.id] }))}
                    >
                      <Text style={styles.expandButtonText}>
                        {expandedSkills[skill.id] ? '▼' : '▶'} {skillSubTrees[skill.id].length} Sub-Skills
                      </Text>
                    </TouchableOpacity>

                    {expandedSkills[skill.id] && (
                      <View style={styles.subSkillsContainer}>
                        {skillSubTrees[skill.id].map((subSkill: SkillTreeNode) => {
                          const subUnlockable = canUnlock(subSkill.id);
                          const subEnergyColor = getEnergyColor(subSkill.energyType);
                          const subTierColor = getTierColor(subSkill.tier);

                          return (
                            <View key={subSkill.id} style={styles.subSkillCard}>
                              <View style={styles.subSkillHeader}>
                                <View style={[styles.tierBadge, { backgroundColor: subTierColor + '40', borderColor: subTierColor, width: 28, height: 28 }]}>
                                  <Text style={[styles.tierText, { color: subTierColor, fontSize: 10 }]}>T{subSkill.tier}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={[styles.subSkillName, subSkill.unlocked && styles.skillNameUnlocked]}>
                                    {subSkill.name}
                                  </Text>
                                  <View style={[styles.energyBadge, { backgroundColor: subEnergyColor + '20', borderColor: subEnergyColor + '80' }]}>
                                    <Text style={[styles.energyText, { color: subEnergyColor }]}>{subSkill.energyType}</Text>
                                  </View>
                                </View>
                                {subSkill.unlocked ? (
                                  <CheckCircle size={18} color="#32CD32" />
                                ) : subUnlockable ? (
                                  <TrendingUp size={18} color="#9400D3" />
                                ) : (
                                  <Lock size={18} color="#666" />
                                )}
                              </View>

                              <Text style={[styles.skillDescription, { fontSize: 12 }]}>{subSkill.description}</Text>

                              <View style={styles.skillFooter}>
                                <View style={styles.categoryTag}>
                                  <Text style={styles.categoryTagText}>{subSkill.category}</Text>
                                </View>

                                {!subSkill.unlocked && (
                                  <View style={styles.costContainer}>
                                    <Zap size={12} color="#FFD700" />
                                    <Text style={[styles.costText, { fontSize: 12 }]}>{subSkill.cost}</Text>
                                  </View>
                                )}
                              </View>

                              {!subSkill.unlocked && subUnlockable && (
                                <TouchableOpacity
                                  style={[styles.unlockButton, { marginTop: 8 }]}
                                  onPress={() => unlockSkill(subSkill.id)}
                                >
                                  <LinearGradient
                                    colors={['#9400D3', '#4B0082']}
                                    style={[styles.unlockButtonGradient, { paddingVertical: 8 }]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                  >
                                    <Sparkles size={14} color="#FFF" />
                                    <Text style={[styles.unlockButtonText, { fontSize: 12 }]}>UNLOCK</Text>
                                  </LinearGradient>
                                </TouchableOpacity>
                              )}
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}
              </LinearGradient>
            </View>
          );
        })}

        {filteredSkills.length === 0 && (
          <View style={styles.emptyContainer}>
            <Lock size={48} color="#666" />
            <Text style={styles.emptyText}>No skills in this category</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#9400D3',
    letterSpacing: 2,
  },
  currencyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
    alignSelf: 'center',
  },
  currencyText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  categoryScroll: {
    maxHeight: 50,
    marginBottom: 16,
  },
  categoryContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryPillActive: {
    backgroundColor: 'rgba(148, 0, 211, 0.2)',
    borderColor: '#9400D3',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
  },
  categoryTextActive: {
    color: '#9400D3',
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 16,
  },
  skillCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  skillCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
    gap: 12,
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  skillHeaderLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  tierBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierText: {
    fontSize: 12,
    fontWeight: '900' as const,
  },
  skillTitleContainer: {
    flex: 1,
    gap: 6,
  },
  skillName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#CCCCCC',
  },
  skillNameUnlocked: {
    color: '#32CD32',
  },
  energyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  energyText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  skillDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  skillFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#666',
    textTransform: 'uppercase' as const,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  costText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  prerequisitesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 10,
    borderRadius: 8,
    gap: 6,
  },
  prerequisitesLabel: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#666',
    textTransform: 'uppercase' as const,
    marginBottom: 4,
  },
  prerequisiteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prerequisiteText: {
    fontSize: 12,
    color: '#DC143C',
  },
  prerequisiteTextUnlocked: {
    color: '#32CD32',
  },
  unlockButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  unlockButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  unlockButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
  },
  expandButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    backgroundColor: 'rgba(148, 0, 211, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9400D3',
  },
  expandButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#9400D3',
    textAlign: 'center' as const,
  },
  subSkillsContainer: {
    marginTop: 12,
    gap: 12,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#9400D3',
  },
  subSkillCard: {
    backgroundColor: 'rgba(148, 0, 211, 0.05)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    gap: 8,
  },
  subSkillHeader: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    gap: 10,
  },
  subSkillName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#CCCCCC',
    marginBottom: 4,
  },
});
