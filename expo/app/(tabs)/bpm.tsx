import { useGame } from '@/contexts/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Activity, Heart, TrendingUp, Minus, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BPMTrackerScreen() {
  const { gameState, setBPM } = useGame();
  const insets = useSafeAreaInsets();
  const [manualBPM, setManualBPM] = useState<string>((gameState?.currentBPM ?? 65).toString());
  const [mood, setMood] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSetBPM = () => {
    const bpmValue = parseInt(manualBPM, 10);
    if (!isNaN(bpmValue) && bpmValue >= 40 && bpmValue <= 400) {
      setBPM(bpmValue, mood || undefined, notes || undefined);
      setMood('');
      setNotes('');
    }
  };

  const adjustBPM = (delta: number) => {
    const current = parseInt(manualBPM, 10) || gameState.currentBPM;
    const newValue = Math.max(40, Math.min(400, current + delta));
    setManualBPM(newValue.toString());
  };

  const getSuggestedForm = (bpm: number): string | null => {
    for (const transformation of gameState.transformations) {
      const bpmRange = transformation.bpmRange;
      const match = bpmRange.match(/(\d+)\s*-\s*(\d+)/);
      if (match) {
        const min = parseInt(match[1], 10);
        const max = parseInt(match[2], 10);
        if (bpm >= min && bpm <= max) {
          return transformation.name;
        }
      }
    }
    return null;
  };

  const currentBPM = parseInt(manualBPM, 10) || gameState.currentBPM;
  const suggestedForm = getSuggestedForm(currentBPM);

  const recentSessions = gameState.bpmSessions.slice(0, 10);

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
          <Heart size={32} color="#DC143C" strokeWidth={2.5} />
          <Text style={styles.title}>BLACK HEART PULSE</Text>
          <Text style={styles.subtitle}>
            Track your frequency and synchronize your form
          </Text>
        </View>

        <View style={styles.currentCard}>
          <LinearGradient
            colors={['rgba(220, 20, 60, 0.2)', 'rgba(220, 20, 60, 0.1)']}
            style={styles.currentCardGradient}
          >
            <View style={styles.currentHeader}>
              <Activity size={20} color="#DC143C" />
              <Text style={styles.currentLabel}>CURRENT BPM</Text>
            </View>
            <Text style={styles.currentBPM}>{gameState.currentBPM}</Text>
            <View style={styles.formBadge}>
              <Text style={styles.formBadgeText}>{gameState.currentForm}</Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.trackerCard}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.02)']}
            style={styles.trackerCardGradient}
          >
            <Text style={styles.sectionTitle}>SET NEW BPM</Text>

            <View style={styles.bpmControls}>
              <Pressable
                onPress={() => adjustBPM(-5)}
                style={styles.controlButton}
              >
                <Minus size={24} color="#DC143C" />
              </Pressable>

              <TextInput
                style={styles.bpmInput}
                value={manualBPM}
                onChangeText={setManualBPM}
                keyboardType="number-pad"
                placeholder="BPM"
                placeholderTextColor="#666"
              />

              <Pressable
                onPress={() => adjustBPM(5)}
                style={styles.controlButton}
              >
                <Plus size={24} color="#DC143C" />
              </Pressable>
            </View>

            {suggestedForm && (
              <View style={styles.suggestion}>
                <TrendingUp size={14} color="#FFD700" />
                <Text style={styles.suggestionText}>
                  Suggested Form: <Text style={styles.suggestionForm}>{suggestedForm}</Text>
                </Text>
              </View>
            )}

            <TextInput
              style={styles.textInput}
              value={mood}
              onChangeText={setMood}
              placeholder="How are you feeling? (optional)"
              placeholderTextColor="#666"
            />

            <TextInput
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Session notes (optional)"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
            />

            <Pressable style={styles.saveButton} onPress={handleSetBPM}>
              <LinearGradient
                colors={['#DC143C', '#8B0000']}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>LOG BPM SESSION</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>

        {recentSessions.length > 0 && (
          <View style={styles.historyCard}>
            <Text style={styles.sectionTitle}>RECENT SESSIONS</Text>
            <View style={styles.sessionsList}>
              {recentSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface SessionCardProps {
  session: {
    id: string;
    timestamp: number;
    bpm: number;
    form: string;
    mood?: string;
  };
}

function SessionCard({ session }: SessionCardProps) {
  const date = new Date(session.timestamp);
  const timeStr = date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const dateStr = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionBPMContainer}>
          <Heart size={16} color="#DC143C" />
          <Text style={styles.sessionBPM}>{session.bpm}</Text>
        </View>
        <Text style={styles.sessionTime}>
          {dateStr} • {timeStr}
        </Text>
      </View>
      <Text style={styles.sessionForm}>{session.form}</Text>
      {session.mood && <Text style={styles.sessionMood}>{session.mood}</Text>}
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
  title: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#DC143C',
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
  currentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  currentCardGradient: {
    padding: 24,
    borderWidth: 2,
    borderColor: '#DC143C',
    borderRadius: 16,
    alignItems: 'center',
  },
  currentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  currentLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#DC143C',
    letterSpacing: 2,
  },
  currentBPM: {
    fontSize: 56,
    fontWeight: '900' as const,
    color: '#DC143C',
    marginBottom: 12,
  },
  formBadge: {
    backgroundColor: 'rgba(220, 20, 60, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  formBadgeText: {
    color: '#DC143C',
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1,
  },
  trackerCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  trackerCardGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 20,
  },
  bpmControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  controlButton: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DC143C',
  },
  bpmInput: {
    flex: 1,
    height: 56,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: '#DC143C',
    borderRadius: 12,
    paddingHorizontal: 20,
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  suggestionText: {
    fontSize: 12,
    color: '#999',
  },
  suggestionForm: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  textInput: {
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  notesInput: {
    height: 96,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  historyCard: {
    marginBottom: 20,
  },
  sessionsList: {
    gap: 12,
  },
  sessionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sessionBPMContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionBPM: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#DC143C',
  },
  sessionTime: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600' as const,
  },
  sessionForm: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  sessionMood: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
