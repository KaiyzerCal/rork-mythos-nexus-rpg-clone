import { useGame } from '@/contexts/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Flame, CheckCircle, Circle, Award, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RitualsScreen() {
  const { gameState, completeRitual } = useGame();
  const insets = useSafeAreaInsets();

  const totalCompleted = gameState.dailyRituals.filter(r => r.completed).length;
  const totalRituals = gameState.dailyRituals.length;
  const completionPercentage = (totalCompleted / totalRituals) * 100;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'meditation':
        return '🧘';
      case 'training':
        return '💪';
      case 'study':
        return '📚';
      case 'social':
        return '👥';
      case 'creation':
        return '✍️';
      default:
        return '⚡';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'meditation':
        return '#9400D3';
      case 'training':
        return '#DC143C';
      case 'study':
        return '#4169E1';
      case 'social':
        return '#FF69B4';
      case 'creation':
        return '#FFD700';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0A0A0A', '#1A0A00', '#0A0A0A']}
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
          <View style={styles.titleRow}>
            <Flame size={28} color="#DC143C" />
            <Text style={styles.title}>DAILY RITUALS</Text>
            <Flame size={28} color="#DC143C" />
          </View>
          <Text style={styles.subtitle}>Forge your path through discipline</Text>
        </View>

        <View style={styles.progressCard}>
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
            style={styles.progressCardGradient}
          >
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>TODAY{"'"}S PROGRESS</Text>
              <View style={styles.progressStats}>
                <Text style={styles.progressValue}>{totalCompleted}/{totalRituals}</Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500', '#DC143C']}
                  style={[styles.progressFill, { width: `${completionPercentage}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.progressPercentage}>{completionPercentage.toFixed(0)}%</Text>
            </View>

            {completionPercentage === 100 && (
              <View style={styles.perfectDayBanner}>
                <Award size={20} color="#FFD700" />
                <Text style={styles.perfectDayText}>PERFECT DAY ACHIEVED!</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        <View style={styles.ritualsContainer}>
          {gameState.dailyRituals.map((ritual) => {
            const categoryColor = getCategoryColor(ritual.category || 'other');
            
            return (
              <TouchableOpacity
                key={ritual.id}
                style={styles.ritualCard}
                onPress={() => !ritual.completed && completeRitual(ritual.id)}
                disabled={ritual.completed}
              >
                <LinearGradient
                  colors={
                    ritual.completed
                      ? ['rgba(50, 205, 50, 0.2)', 'rgba(50, 205, 50, 0.05)']
                      : ['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']
                  }
                  style={[
                    styles.ritualCardGradient,
                    ritual.completed && styles.ritualCardCompleted,
                  ]}
                >
                  <View style={styles.ritualHeader}>
                    <View style={styles.ritualLeft}>
                      <View style={[
                        styles.categoryIcon,
                        { backgroundColor: categoryColor + '20', borderColor: categoryColor },
                      ]}>
                        <Text style={styles.categoryEmoji}>{getCategoryIcon(ritual.category || 'other')}</Text>
                      </View>
                      <View style={styles.ritualInfo}>
                        <Text style={[
                          styles.ritualName,
                          ritual.completed && styles.ritualNameCompleted,
                        ]}>
                          {ritual.name}
                        </Text>
                        <Text style={styles.ritualDescription}>{ritual.description}</Text>
                      </View>
                    </View>

                    {ritual.completed ? (
                      <CheckCircle size={28} color="#32CD32" />
                    ) : (
                      <Circle size={28} color="#666" strokeWidth={2} />
                    )}
                  </View>

                  <View style={styles.ritualFooter}>
                    <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                      <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                        {(ritual.category || 'other').toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <CopyButton
                        text={`${ritual.name} [${(ritual.category || 'other').toUpperCase()}]\n${ritual.description}\n+${ritual.xpReward} XP | Streak: ${ritual.streak}${ritual.completed ? ' | COMPLETED' : ''}`}
                        size={12}
                        color={categoryColor}
                        iconOnly
                      />
                      <View style={styles.rewardContainer}>
                        <Text style={styles.xpLabel}>+{ritual.xpReward} XP</Text>
                      </View>
                    </View>
                  </View>

                  {ritual.streak > 0 && (
                    <View style={styles.streakContainer}>
                      <TrendingUp size={14} color="#FFA500" />
                      <Text style={styles.streakText}>{ritual.streak} day streak</Text>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.infoCard}>
          <LinearGradient
            colors={['rgba(148, 0, 211, 0.1)', 'rgba(148, 0, 211, 0.03)']}
            style={styles.infoCardGradient}
          >
            <Text style={styles.infoTitle}>RITUAL WISDOM</Text>
            <Text style={styles.infoText}>
              &ldquo;Discipline births flame. Flame births light. When light devours its own shadow, a sun is born.&rdquo;
            </Text>
            <Text style={styles.infoSubtext}>
              Complete daily rituals to gain XP and build streaks. Consistency is the path to mastery.
            </Text>
          </LinearGradient>
        </View>
      </ScrollView>
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
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900' as const,
    color: '#DC143C',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic' as const,
  },
  progressCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  progressCardGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFD700',
    letterSpacing: 2,
  },
  progressStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#FFD700',
    width: 48,
    textAlign: 'right',
  },
  perfectDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 8,
  },
  perfectDayText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFD700',
    letterSpacing: 1,
  },
  ritualsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  ritualCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  ritualCardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
  },
  ritualCardCompleted: {
    borderColor: '#32CD32',
  },
  ritualHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ritualLeft: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  categoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 22,
  },
  ritualInfo: {
    flex: 1,
    gap: 4,
  },
  ritualName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  ritualNameCompleted: {
    color: '#32CD32',
  },
  ritualDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  ritualFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  rewardContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#FFD700',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#FFA500',
  },
  infoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  infoCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#9400D3',
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#9400D3',
    letterSpacing: 2,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#CCCCCC',
    fontStyle: 'italic' as const,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoSubtext: {
    fontSize: 12,
    color: '#999',
    lineHeight: 18,
  },
});
