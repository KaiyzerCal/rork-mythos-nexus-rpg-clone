import { useGame } from '@/contexts/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Heart, Shield, Swords, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AllyData } from '@/types/rpg';

export default function AlliesScreen() {
  const { gameState } = useGame();
  const insets = useSafeAreaInsets();
  const [selectedRelationship, setSelectedRelationship] = useState<string>('all');

  const relationships = ['all', 'harem', 'ally', 'council', 'rival'];

  const filteredAllies = selectedRelationship === 'all'
    ? gameState.allies
    : gameState.allies.filter((ally) => ally.relationship === selectedRelationship);

  const getRelationshipIcon = (relationship: AllyData['relationship']) => {
    switch (relationship) {
      case 'harem': return Heart;
      case 'ally': return Users;
      case 'council': return Shield;
      case 'rival': return Swords;
      default: return Users;
    }
  };

  const getRelationshipColor = (relationship: AllyData['relationship']) => {
    switch (relationship) {
      case 'harem': return '#FF69B4';
      case 'ally': return '#4169E1';
      case 'council': return '#FFD700';
      case 'rival': return '#DC143C';
      default: return '#999';
    }
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
          <Users size={32} color="#FFD700" />
          <Text style={styles.title}>ALLIES & HAREM</Text>
          <Text style={styles.subtitle}>Your network of power</Text>
        </View>

        <View style={styles.statsCard}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
            style={styles.statsGradient}
          >
            <View style={styles.statsRow}>
              <StatItem
                icon={Users}
                label="TOTAL ALLIES"
                value={(gameState?.allies?.length ?? 0).toString()}
                color="#4169E1"
              />
              <StatItem
                icon={Heart}
                label="HAREM"
                value={(gameState?.allies?.filter((a) => a.relationship === 'harem')?.length ?? 0).toString()}
                color="#FF69B4"
              />
              <StatItem
                icon={Shield}
                label="COUNCIL"
                value={(gameState?.allies?.filter((a) => a.relationship === 'council')?.length ?? 0).toString()}
                color="#FFD700"
              />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesRow}>
              {relationships.map((rel) => (
                <TouchableOpacity
                  key={rel}
                  style={[
                    styles.categoryButton,
                    selectedRelationship === rel && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedRelationship(rel)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedRelationship === rel && styles.categoryTextActive,
                    ]}
                  >
                    {rel.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.alliesContainer}>
          {filteredAllies.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Users size={48} color="#666" />
              <Text style={styles.emptyText}>No allies in this category</Text>
            </View>
          ) : (
            filteredAllies.map((ally) => {
              const Icon = getRelationshipIcon(ally.relationship);
              const color = getRelationshipColor(ally.relationship);

              return (
                <View key={ally.id} style={[styles.allyCard, { borderLeftColor: color }]}>
                  <LinearGradient
                    colors={[`${color}15`, `${color}05`]}
                    style={styles.allyGradient}
                  >
                    <View style={styles.allyHeader}>
                      <View style={[styles.allyIcon, { backgroundColor: `${color}30` }]}>
                        <Icon size={28} color={color} />
                      </View>
                      <View style={styles.allyInfo}>
                        <Text style={[styles.allyName, { color }]}>{ally.name}</Text>
                        <Text style={styles.allyRelationship}>
                          {ally.relationship.toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>LV {ally.level}</Text>
                      </View>
                    </View>

                    <Text style={styles.specialty}>{ally.specialty}</Text>

                    <View style={styles.affinityContainer}>
                      <Text style={styles.affinityLabel}>AFFINITY</Text>
                      <View style={styles.affinityBar}>
                        <LinearGradient
                          colors={[color, `${color}80`]}
                          style={[styles.affinityFill, { width: `${ally.affinity}%` }]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        />
                      </View>
                      <Text style={styles.affinityValue}>{ally.affinity}%</Text>
                    </View>

                    <View style={styles.actionButtons}>
                      <CopyButton
                        text={`${ally.name} [${ally.relationship.toUpperCase()}]\nLevel: ${ally.level} | Affinity: ${ally.affinity}%\nSpecialty: ${ally.specialty}`}
                        size={12}
                        color={color}
                        iconOnly
                      />
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: `${color}20` }]}>
                        <Text style={[styles.actionText, { color }]}>INTERACT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.actionButton, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                        <Text style={styles.actionTextSecondary}>DETAILS</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

interface StatItemProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  color: string;
}

function StatItem({ icon: Icon, label, value, color }: StatItemProps) {
  return (
    <View style={styles.statItem}>
      <Icon size={20} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
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
    marginBottom: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFD700',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#999',
    letterSpacing: 1,
  },
  statsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  statsGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900' as const,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 1,
  },
  categoryTextActive: {
    color: '#FFD700',
  },
  alliesContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  allyCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderLeftWidth: 4,
  },
  allyGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
  },
  allyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  allyIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allyInfo: {
    flex: 1,
  },
  allyName: {
    fontSize: 18,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  allyRelationship: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 1,
  },
  levelBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  levelText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFD700',
  },
  specialty: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#AAA',
    marginBottom: 16,
    lineHeight: 18,
  },
  affinityContainer: {
    marginBottom: 16,
  },
  affinityLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 1,
    marginBottom: 8,
  },
  affinityBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  affinityFill: {
    height: '100%',
    borderRadius: 4,
  },
  affinityValue: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#FFD700',
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  actionTextSecondary: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#999',
    letterSpacing: 1,
  },
});
