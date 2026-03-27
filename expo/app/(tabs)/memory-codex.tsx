import { useGame } from '@/contexts/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Plus, Calendar, Tag, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MemoryCodexScreen() {
  const { gameState, addJournalEntry } = useGame();
  const insets = useSafeAreaInsets();
  const [isCreating, setIsCreating] = useState(false);
  const [newEntry, setNewEntry] = useState({ title: '', content: '', mood: '', tags: '' });

  const handleCreateEntry = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      Alert.alert('Missing Information', 'Please enter both a title and content');
      return;
    }

    const tags = newEntry.tags.split(',').map((t) => t.trim()).filter(Boolean);
    addJournalEntry(newEntry.title, newEntry.content, newEntry.mood || undefined, tags);
    setNewEntry({ title: '', content: '', mood: '', tags: '' });
    setIsCreating(false);
    Alert.alert('Entry Created', '+50 XP awarded for journaling');
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          <BookOpen size={32} color="#9400D3" />
          <Text style={styles.title}>MEMORY CODEX</Text>
          <Text style={styles.subtitle}>Document your journey</Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setIsCreating(!isCreating)}
        >
          <LinearGradient
            colors={['rgba(148, 0, 211, 0.3)', 'rgba(148, 0, 211, 0.1)']}
            style={styles.createGradient}
          >
            <Plus size={20} color="#9400D3" />
            <Text style={styles.createText}>
              {isCreating ? 'CANCEL' : 'NEW ENTRY'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {isCreating && (
          <View style={styles.createForm}>
            <LinearGradient
              colors={['rgba(148, 0, 211, 0.15)', 'rgba(148, 0, 211, 0.05)']}
              style={styles.formGradient}
            >
              <Text style={styles.formLabel}>Title</Text>
              <TextInput
                style={styles.input}
                value={newEntry.title}
                onChangeText={(text) => setNewEntry({ ...newEntry, title: text })}
                placeholder="Entry title..."
                placeholderTextColor="#666"
              />

              <Text style={styles.formLabel}>Content</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newEntry.content}
                onChangeText={(text) => setNewEntry({ ...newEntry, content: text })}
                placeholder="Write your thoughts..."
                placeholderTextColor="#666"
                multiline
                numberOfLines={6}
              />

              <Text style={styles.formLabel}>Mood (Optional)</Text>
              <TextInput
                style={styles.input}
                value={newEntry.mood}
                onChangeText={(text) => setNewEntry({ ...newEntry, mood: text })}
                placeholder="e.g., Focused, Determined, Calm"
                placeholderTextColor="#666"
              />

              <Text style={styles.formLabel}>Tags (Optional, comma-separated)</Text>
              <TextInput
                style={styles.input}
                value={newEntry.tags}
                onChangeText={(text) => setNewEntry({ ...newEntry, tags: text })}
                placeholder="e.g., training, growth, breakthrough"
                placeholderTextColor="#666"
              />

              <TouchableOpacity style={styles.submitButton} onPress={handleCreateEntry}>
                <Text style={styles.submitText}>CREATE ENTRY (+50 XP)</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        <View style={styles.entriesContainer}>
          <Text style={styles.sectionTitle}>
            JOURNAL ENTRIES ({gameState.journalEntries.length})
          </Text>
          {gameState.journalEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <BookOpen size={48} color="#666" />
              <Text style={styles.emptyText}>No journal entries yet</Text>
              <Text style={styles.emptySubtext}>Start documenting your journey</Text>
            </View>
          ) : (
            gameState.journalEntries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <LinearGradient
                  colors={['rgba(148, 0, 211, 0.15)', 'rgba(148, 0, 211, 0.05)']}
                  style={styles.entryGradient}
                >
                  <View style={styles.entryHeader}>
                    <View style={styles.entryIcon}>
                      <Sparkles size={20} color="#9400D3" />
                    </View>
                    <View style={styles.entryInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.entryTitle, { flex: 1 }]}>{entry.title}</Text>
                        <CopyButton
                          text={`${entry.title}\n${entry.mood ? `Mood: ${entry.mood}\n` : ''}${entry.content}${entry.tags.length > 0 ? `\nTags: ${entry.tags.join(', ')}` : ''}`}
                          size={12}
                          color="#9400D3"
                          iconOnly
                        />
                      </View>
                      <View style={styles.entryMeta}>
                        <Calendar size={12} color="#999" />
                        <Text style={styles.entryDate}>{formatDate(entry.timestamp)}</Text>
                      </View>
                    </View>
                    {entry.xpGained && (
                      <View style={styles.xpBadge}>
                        <Text style={styles.xpText}>+{entry.xpGained}</Text>
                      </View>
                    )}
                  </View>

                  {entry.mood && (
                    <View style={styles.moodContainer}>
                      <Text style={styles.moodLabel}>MOOD:</Text>
                      <Text style={styles.moodText}>{entry.mood}</Text>
                    </View>
                  )}

                  <Text style={styles.entryContent} numberOfLines={4}>
                    {entry.content}
                  </Text>

                  {entry.tags.length > 0 && (
                    <View style={styles.tagsContainer}>
                      {entry.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Tag size={10} color="#9400D3" />
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </LinearGradient>
              </View>
            ))
          )}
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
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#9400D3',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#999',
    letterSpacing: 1,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderWidth: 2,
    borderColor: '#9400D3',
    borderRadius: 12,
  },
  createText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#9400D3',
    letterSpacing: 1,
  },
  createForm: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  formGradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: '#9400D3',
    borderRadius: 16,
    gap: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#9400D3',
    letterSpacing: 1,
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#9400D3',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: 1,
  },
  entriesContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#9400D3',
    letterSpacing: 2,
    marginBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#666',
  },
  emptySubtext: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#555',
  },
  entryCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  entryGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#9400D3',
    borderRadius: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  entryIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(148, 0, 211, 0.2)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#9400D3',
    marginBottom: 4,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryDate: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#999',
  },
  xpBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#FFD700',
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    backgroundColor: 'rgba(148, 0, 211, 0.1)',
    padding: 8,
    borderRadius: 8,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#9400D3',
    letterSpacing: 1,
  },
  moodText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#CCC',
  },
  entryContent: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#AAA',
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(148, 0, 211, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#9400D3',
  },
});
