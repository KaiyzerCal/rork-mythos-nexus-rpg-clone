import { useGame } from '@/contexts/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BookOpen, Shield, Users, Crown, Plus } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Tab = 'journal' | 'vault' | 'allies' | 'councils';

export default function CodexScreen() {
  const { gameState, isLoading, addVaultEntry } = useGame();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('journal');
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [entryTitle, setEntryTitle] = useState('');
  const [entryContent, setEntryContent] = useState('');

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#0A0A0A', '#1A0A0A']}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.loadingText}>Loading Codex...</Text>
      </View>
    );
  }

  const { journalEntries, vaultEntries, allies, councils } = gameState;

  const handleAddEntry = () => {
    if (activeTab === 'journal') {
      addVaultEntry(entryTitle, entryContent, 'personal', 'medium');
    } else if (activeTab === 'vault') {
      addVaultEntry(entryTitle, entryContent, 'personal', 'medium');
    }
    setEntryTitle('');
    setEntryContent('');
    setShowAddEntry(false);
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
          <BookOpen size={32} color="#FFD700" strokeWidth={2.5} />
          <Text style={styles.title}>THE CODEX</Text>
        </View>

        <View style={styles.tabBar}>
          <TabButton
            label="Journal"
            active={activeTab === 'journal'}
            icon={BookOpen}
            onPress={() => setActiveTab('journal')}
          />
          <TabButton
            label="Vault"
            active={activeTab === 'vault'}
            icon={Shield}
            onPress={() => setActiveTab('vault')}
          />
          <TabButton
            label="Allies"
            active={activeTab === 'allies'}
            icon={Users}
            onPress={() => setActiveTab('allies')}
          />
          <TabButton
            label="Councils"
            active={activeTab === 'councils'}
            icon={Crown}
            onPress={() => setActiveTab('councils')}
          />
        </View>

        {(activeTab === 'journal' || activeTab === 'vault') && !showAddEntry && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddEntry(true)}
          >
            <Plus size={20} color="#000" />
            <Text style={styles.addButtonText}>
              New {activeTab === 'journal' ? 'Journal' : 'Vault'} Entry
            </Text>
          </TouchableOpacity>
        )}

        {showAddEntry && (
          <View style={styles.entryForm}>
            <LinearGradient
              colors={['rgba(255, 215, 0, 0.15)', 'rgba(255, 215, 0, 0.05)']}
              style={styles.formGradient}
            >
              <Text style={styles.formTitle}>NEW ENTRY</Text>
              <TextInput
                style={styles.input}
                placeholder="Title"
                placeholderTextColor="#666"
                value={entryTitle}
                onChangeText={setEntryTitle}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Content"
                placeholderTextColor="#666"
                value={entryContent}
                onChangeText={setEntryContent}
                multiline
                numberOfLines={6}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddEntry(false);
                    setEntryTitle('');
                    setEntryContent('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.submitButton]}
                  onPress={handleAddEntry}
                  disabled={!entryTitle || !entryContent}
                >
                  <Text style={styles.submitButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        )}

        {activeTab === 'journal' && (
          <View>
            {journalEntries.length === 0 ? (
              <Text style={styles.emptyText}>No journal entries yet. Start documenting your journey.</Text>
            ) : (
              journalEntries.map((entry) => (
                <JournalCard key={entry.id} entry={entry} />
              ))
            )}
          </View>
        )}

        {activeTab === 'vault' && (
          <View>
            {vaultEntries.length === 0 ? (
              <Text style={styles.emptyText}>No vault entries yet. Store critical data securely.</Text>
            ) : (
              vaultEntries.map((entry) => (
                <VaultCard key={entry.id} entry={entry} />
              ))
            )}
          </View>
        )}

        {activeTab === 'allies' && (
          <View>
            {allies.map((ally) => (
              <AllyCard key={ally.id} ally={ally} />
            ))}
          </View>
        )}

        {activeTab === 'councils' && (
          <View>
            {councils.map((council) => (
              <CouncilCard key={council.id} council={council} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  icon: React.ComponentType<{ size: number; color: string }>;
  onPress: () => void;
}

function TabButton({ label, active, icon: Icon, onPress }: TabButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Icon size={16} color={active ? '#000' : '#999'} />
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function JournalCard({ entry }: { entry: any }) {
  const date = new Date(entry.timestamp).toLocaleDateString();
  const time = new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 215, 0, 0.05)']}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{entry.title}</Text>
          <Text style={styles.timestamp}>{date} {time}</Text>
        </View>
        <Text style={styles.cardContent}>{entry.content}</Text>
        {entry.mood && (
          <View style={styles.moodBadge}>
            <Text style={styles.moodText}>Mood: {entry.mood}</Text>
          </View>
        )}
        {entry.xpGained && (
          <Text style={styles.xpGained}>+{entry.xpGained} XP</Text>
        )}
      </LinearGradient>
    </View>
  );
}

function VaultCard({ entry }: { entry: any }) {
  const importanceColors = {
    low: '#32CD32',
    medium: '#FFD700',
    high: '#FFA500',
    critical: '#DC143C',
  };
  const color = importanceColors[entry.importance as keyof typeof importanceColors];
  const date = new Date(entry.timestamp).toLocaleDateString();

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        style={styles.cardGradient}
      >
        <View style={styles.cardHeader}>
          <View style={styles.vaultTitleRow}>
            <Shield size={18} color={color} />
            <Text style={[styles.cardTitle, { color }]}>{entry.title}</Text>
          </View>
          <Text style={styles.timestamp}>{date}</Text>
        </View>
        <Text style={styles.cardContent}>{entry.content}</Text>
        <View style={styles.vaultFooter}>
          <View style={[styles.categoryBadge, { backgroundColor: `${color}30` }]}>
            <Text style={[styles.categoryText, { color }]}>
              {entry.category.toUpperCase()}
            </Text>
          </View>
          <View style={[styles.importanceBadge, { backgroundColor: `${color}30` }]}>
            <Text style={[styles.importanceText, { color }]}>
              {entry.importance.toUpperCase()}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

function AllyCard({ ally }: { ally: any }) {
  const relationshipColors = {
    ally: '#32CD32',
    harem: '#FF69B4',
    council: '#FFD700',
    rival: '#DC143C',
  };
  const color = relationshipColors[ally.relationship as keyof typeof relationshipColors];

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        style={styles.cardGradient}
      >
        <View style={styles.allyHeader}>
          <Text style={[styles.allyName, { color }]}>{ally.name}</Text>
          <Text style={styles.allyLevel}>LVL {ally.level}</Text>
        </View>
        <Text style={styles.allySpecialty}>{ally.specialty}</Text>
        <View style={styles.affinityBar}>
          <LinearGradient
            colors={[color, `${color}80`]}
            style={[styles.affinityFill, { width: `${ally.affinity}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
        <Text style={styles.affinityText}>Affinity: {ally.affinity}%</Text>
        <View style={[styles.relationshipBadge, { backgroundColor: `${color}30` }]}>
          <Text style={[styles.relationshipText, { color }]}>
            {ally.relationship.toUpperCase()}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function CouncilCard({ council }: { council: any }) {
  const councilColors = {
    Core: '#DC143C',
    Advisory: '#4169E1',
    'Think-Tank': '#9400D3',
    Shadows: '#000',
  };
  const color = councilColors[council.type as keyof typeof councilColors] || '#FFD700';

  return (
    <View style={styles.councilCard}>
      <LinearGradient
        colors={[`${color}15`, `${color}05`]}
        style={styles.cardGradient}
      >
        <View style={styles.councilHeader}>
          <Crown size={24} color={color} />
          <Text style={[styles.councilTitle, { color }]}>{council.type.toUpperCase()} COUNCIL</Text>
        </View>
        <Text style={styles.councilDescription}>{council.description}</Text>
        <View style={styles.membersGrid}>
          {council.members.map((member: any, index: number) => (
            <View key={index} style={styles.memberChip}>
              <Text style={styles.memberName}>{member.name}</Text>
              <Text style={styles.memberRole}>{member.role}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </View>
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
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    gap: 4,
  },
  tabButtonActive: {
    backgroundColor: '#FFD700',
  },
  tabButtonText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#999',
  },
  tabButtonTextActive: {
    color: '#000',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#000',
    letterSpacing: 0.5,
  },
  entryForm: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  formGradient: {
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFD700',
    letterSpacing: 2,
    marginBottom: 16,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    marginBottom: 12,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  submitButton: {
    backgroundColor: '#FFD700',
  },
  submitButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 40,
  },
  card: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  cardGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600' as const,
  },
  cardContent: {
    fontSize: 13,
    color: '#CCC',
    lineHeight: 18,
    marginBottom: 8,
  },
  moodBadge: {
    backgroundColor: 'rgba(100, 149, 237, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  moodText: {
    fontSize: 10,
    color: '#6495ED',
    fontWeight: '600' as const,
  },
  xpGained: {
    fontSize: 11,
    color: '#32CD32',
    fontWeight: '700' as const,
    marginTop: 8,
  },
  vaultTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vaultFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  importanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  importanceText: {
    fontSize: 9,
    fontWeight: '700' as const,
  },
  allyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  allyName: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  allyLevel: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '700' as const,
  },
  allySpecialty: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  affinityBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  affinityFill: {
    height: '100%',
  },
  affinityText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  relationshipBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  relationshipText: {
    fontSize: 10,
    fontWeight: '700' as const,
  },
  councilCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  councilHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  councilTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
  councilDescription: {
    fontSize: 12,
    color: '#999',
    lineHeight: 16,
    marginBottom: 16,
  },
  membersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: '47%',
  },
  memberName: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFF',
    marginBottom: 2,
  },
  memberRole: {
    fontSize: 10,
    color: '#666',
  },
});
