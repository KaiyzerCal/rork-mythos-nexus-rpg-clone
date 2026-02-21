import { useGame } from '@/contexts/GameContext';
import { Medal, TrendingUp, Shield, Zap, Plus, X, Edit2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal, Alert } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RosterEntry } from '@/types/rpg';

export default function RankingsScreen() {
  const { gameState, addRosterEntry, deleteRosterEntry, updateRosterEntry } = useGame();
  const [sortBy, setSortBy] = useState<'gpr' | 'pvp' | 'level'>('gpr');
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<RosterEntry | null>(null);

  const [formData, setFormData] = useState({
    display: '',
    role: 'npc' as RosterEntry['role'],
    rank: 'D',
    level: 1,
    jjkGrade: 'G4',
    opTier: 'Local',
    gpr: 1000,
    pvp: 5000,
    influence: 'Local',
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      display: '',
      role: 'npc',
      rank: 'D',
      level: 1,
      jjkGrade: 'G4',
      opTier: 'Local',
      gpr: 1000,
      pvp: 5000,
      influence: 'Local',
      notes: '',
    });
  };

  const sortedRoster = [...gameState.roster].sort((a, b) => {
    switch (sortBy) {
      case 'gpr':
        return b.gpr - a.gpr;
      case 'pvp':
        return b.pvp - a.pvp;
      case 'level':
        return b.level - a.level;
      default:
        return 0;
    }
  });

  const handleAddEntry = () => {
    if (!formData.display.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    addRosterEntry(formData);
    resetForm();
    setModalVisible(false);
  };

  const handleViewEntry = (entry: RosterEntry) => {
    setSelectedEntry(entry);
    setDetailModalVisible(true);
  };

  const handleDeleteEntry = (id: string) => {
    const entry = gameState.roster.find(r => r.id === id);
    if (entry?.role === 'self') {
      Alert.alert('Error', 'Cannot delete self entry');
      return;
    }

    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this roster entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteRosterEntry(id);
            setDetailModalVisible(false);
          },
        },
      ]
    );
  };

  const handleEditEntry = (entry: RosterEntry) => {
    setSelectedEntry(entry);
    setFormData({
      display: entry.display,
      role: entry.role === 'self' ? 'npc' : entry.role,
      rank: entry.rank,
      level: entry.level,
      jjkGrade: entry.jjkGrade,
      opTier: entry.opTier,
      gpr: entry.gpr,
      pvp: entry.pvp,
      influence: entry.influence,
      notes: entry.notes,
    });
    setDetailModalVisible(false);
    setEditModalVisible(true);
  };

  const handleUpdateEntry = () => {
    if (!selectedEntry) return;
    if (!formData.display.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    updateRosterEntry(selectedEntry.id, formData);
    resetForm();
    setEditModalVisible(false);
    setSelectedEntry(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <Medal size={28} color="#E7A857" />
            <Text style={styles.title}>Global Rankings</Text>
          </View>
          <Pressable
            onPress={() => {
              resetForm();
              setModalVisible(true);
            }}
            style={styles.addButton}
          >
            <Plus size={20} color="#0A0A0A" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortContainer}
        >
          <Pressable
            onPress={() => setSortBy('gpr')}
            style={[styles.sortChip, sortBy === 'gpr' && styles.sortChipActive]}
          >
            <TrendingUp size={14} color={sortBy === 'gpr' ? '#0A0A0A' : '#E7A857'} />
            <Text style={[styles.sortText, sortBy === 'gpr' && styles.sortTextActive]}>
              GPR
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortBy('pvp')}
            style={[styles.sortChip, sortBy === 'pvp' && styles.sortChipActive]}
          >
            <Shield size={14} color={sortBy === 'pvp' ? '#0A0A0A' : '#E7A857'} />
            <Text style={[styles.sortText, sortBy === 'pvp' && styles.sortTextActive]}>
              PvP
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSortBy('level')}
            style={[styles.sortChip, sortBy === 'level' && styles.sortChipActive]}
          >
            <Zap size={14} color={sortBy === 'level' ? '#0A0A0A' : '#E7A857'} />
            <Text style={[styles.sortText, sortBy === 'level' && styles.sortTextActive]}>
              Level
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedRoster.map((entry, index) => (
          <Pressable
            key={entry.id}
            onPress={() => handleViewEntry(entry)}
            style={[
              styles.rankCard,
              entry.role === 'self' && styles.rankCardSelf,
            ]}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
            </View>

            <View style={styles.rankContent}>
              <View style={styles.rankHeader}>
                <Text style={[styles.rankName, entry.role === 'self' && styles.rankNameSelf]}>
                  {entry.display}
                </Text>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(entry.role) }]}>
                  <Text style={styles.roleText}>{entry.role.toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.rankStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Level</Text>
                  <Text style={styles.statValue}>{entry.level}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Rank</Text>
                  <Text style={styles.statValue}>{entry.rank}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>GPR</Text>
                  <Text style={styles.statValue}>{entry.gpr}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>PvP</Text>
                  <Text style={styles.statValue}>{(entry.pvp / 1000).toFixed(1)}</Text>
                </View>
              </View>

              <View style={styles.gradeRow}>
                <Text style={styles.gradeLabel}>JJK: {entry.jjkGrade}</Text>
                <Text style={styles.gradeLabel}>OP: {entry.opTier}</Text>
                <Text style={styles.gradeLabel}>{entry.influence}</Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          resetForm();
          setModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Roster Entry</Text>
              <Pressable
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.display}
                  onChangeText={(text) => setFormData({ ...formData, display: text })}
                  placeholder="Enter name"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Role</Text>
                <View style={styles.roleButtons}>
                  {(['ally', 'enemy', 'npc'] as RosterEntry['role'][]).map((role) => (
                    <Pressable
                      key={role}
                      onPress={() => setFormData({ ...formData, role })}
                      style={[
                        styles.roleButton,
                        formData.role === role && styles.roleButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          formData.role === role && styles.roleButtonTextActive,
                        ]}
                      >
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Level</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.level.toString()}
                    onChangeText={(text) => setFormData({ ...formData, level: parseInt(text) || 1 })}
                    keyboardType="numeric"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Rank</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.rank}
                    onChangeText={(text) => setFormData({ ...formData, rank: text })}
                    placeholder="S"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>GPR</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.gpr.toString()}
                    onChangeText={(text) => setFormData({ ...formData, gpr: parseInt(text) || 1000 })}
                    keyboardType="numeric"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>PvP (x1000)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={(formData.pvp / 1000).toString()}
                    onChangeText={(text) => setFormData({ ...formData, pvp: (parseFloat(text) || 5) * 1000 })}
                    keyboardType="numeric"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>JJK Grade</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.jjkGrade}
                  onChangeText={(text) => setFormData({ ...formData, jjkGrade: text })}
                  placeholder="G4"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>OP Tier</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.opTier}
                  onChangeText={(text) => setFormData({ ...formData, opTier: text })}
                  placeholder="Local"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Influence</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.influence}
                  onChangeText={(text) => setFormData({ ...formData, influence: text })}
                  placeholder="Local / Regional / National / Global"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Additional notes"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  resetForm();
                  setModalVisible(false);
                }}
                style={[styles.modalButton, styles.modalButtonSecondary]}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddEntry}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={styles.modalButtonText}>Add Entry</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={detailModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedEntry && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailName}>{selectedEntry.display}</Text>
                  <Pressable
                    onPress={() => setDetailModalVisible(false)}
                    style={styles.detailCloseButton}
                  >
                    <X size={24} color="#FFFFFF" />
                  </Pressable>
                </View>

                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(selectedEntry.role), alignSelf: 'flex-start', marginBottom: 16 }]}>
                  <Text style={styles.roleText}>{selectedEntry.role.toUpperCase()}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Stats</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Level:</Text>
                    <Text style={styles.detailValue}>{selectedEntry.level}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Rank:</Text>
                    <Text style={styles.detailValue}>{selectedEntry.rank}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>GPR:</Text>
                    <Text style={styles.detailValue}>{selectedEntry.gpr}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>PvP Rating:</Text>
                    <Text style={styles.detailValue}>{(selectedEntry.pvp / 1000).toFixed(1)}/10</Text>
                  </View>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Power Scale</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>JJK Grade:</Text>
                    <Text style={styles.detailValue}>{selectedEntry.jjkGrade}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>OP Tier:</Text>
                    <Text style={styles.detailValue}>{selectedEntry.opTier}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Influence:</Text>
                    <Text style={styles.detailValue}>{selectedEntry.influence}</Text>
                  </View>
                </View>

                {selectedEntry.notes && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Notes</Text>
                    <Text style={styles.detailNotes}>{selectedEntry.notes}</Text>
                  </View>
                )}

                <CopyButton
                  text={`${selectedEntry.display} [${selectedEntry.role.toUpperCase()}]\nLevel: ${selectedEntry.level} | Rank: ${selectedEntry.rank}\nGPR: ${selectedEntry.gpr} | PvP: ${(selectedEntry.pvp / 1000).toFixed(1)}/10\nJJK: ${selectedEntry.jjkGrade} | OP: ${selectedEntry.opTier} | ${selectedEntry.influence}${selectedEntry.notes ? `\nNotes: ${selectedEntry.notes}` : ''}`}
                  label="Copy Entry"
                  color="#E7A857"
                  style={{ marginBottom: 16 }}
                />

                <View style={styles.detailActions}>
                  <Pressable
                    onPress={() => handleEditEntry(selectedEntry)}
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                  >
                    <Edit2 size={16} color="#0A0A0A" />
                    <Text style={styles.modalButtonText}>Edit</Text>
                  </Pressable>
                  {selectedEntry.role !== 'self' && (
                    <Pressable
                      onPress={() => handleDeleteEntry(selectedEntry.id)}
                      style={[styles.modalButton, styles.modalButtonDanger]}
                    >
                      <Text style={styles.modalButtonText}>Delete</Text>
                    </Pressable>
                  )}
                </View>
                <Pressable
                  onPress={() => setDetailModalVisible(false)}
                  style={[styles.modalButton, styles.modalButtonSecondary, { marginTop: 12 }]}
                >
                  <Text style={styles.modalButtonTextSecondary}>Close</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          resetForm();
          setEditModalVisible(false);
          setSelectedEntry(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Roster Entry</Text>
              <Pressable
                onPress={() => {
                  resetForm();
                  setEditModalVisible(false);
                  setSelectedEntry(null);
                }}
                style={styles.modalCloseButton}
              >
                <X size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.display}
                  onChangeText={(text) => setFormData({ ...formData, display: text })}
                  placeholder="Enter name"
                  placeholderTextColor="#666"
                />
              </View>

              {selectedEntry?.role !== 'self' && (
                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Role</Text>
                  <View style={styles.roleButtons}>
                    {(['ally', 'enemy', 'npc'] as RosterEntry['role'][]).map((role) => (
                      <Pressable
                        key={role}
                        onPress={() => setFormData({ ...formData, role })}
                        style={[
                          styles.roleButton,
                          formData.role === role && styles.roleButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleButtonText,
                            formData.role === role && styles.roleButtonTextActive,
                          ]}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Level</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.level.toString()}
                    onChangeText={(text) => setFormData({ ...formData, level: parseInt(text) || 1 })}
                    keyboardType="numeric"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Rank</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.rank}
                    onChangeText={(text) => setFormData({ ...formData, rank: text })}
                    placeholder="S"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>GPR</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.gpr.toString()}
                    onChangeText={(text) => setFormData({ ...formData, gpr: parseInt(text) || 1000 })}
                    keyboardType="numeric"
                    placeholderTextColor="#666"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>PvP (x1000)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={(formData.pvp / 1000).toString()}
                    onChangeText={(text) => setFormData({ ...formData, pvp: (parseFloat(text) || 5) * 1000 })}
                    keyboardType="numeric"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>JJK Grade</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.jjkGrade}
                  onChangeText={(text) => setFormData({ ...formData, jjkGrade: text })}
                  placeholder="G4"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>OP Tier</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.opTier}
                  onChangeText={(text) => setFormData({ ...formData, opTier: text })}
                  placeholder="Local"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Influence</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.influence}
                  onChangeText={(text) => setFormData({ ...formData, influence: text })}
                  placeholder="Local / Regional / National / Global"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  placeholder="Additional notes"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  resetForm();
                  setEditModalVisible(false);
                  setSelectedEntry(null);
                }}
                style={[styles.modalButton, styles.modalButtonSecondary]}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleUpdateEntry}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={styles.modalButtonText}>Update Entry</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function getRoleColor(role: RosterEntry['role']): string {
  switch (role) {
    case 'self':
      return '#E7A857';
    case 'ally':
      return '#08C284';
    case 'enemy':
      return '#E75757';
    default:
      return '#5EA7FF';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: '#E7A857',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortContainer: {
    gap: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7A857',
  },
  sortChipActive: {
    backgroundColor: '#E7A857',
    borderColor: '#E7A857',
  },
  sortText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#E7A857',
  },
  sortTextActive: {
    color: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  rankCard: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
    gap: 16,
  },
  rankCardSelf: {
    borderColor: '#E7A857',
    backgroundColor: '#1F1A0F',
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E7A857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
  rankContent: {
    flex: 1,
  },
  rankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  rankNameSelf: {
    color: '#E7A857',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
  rankStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  gradeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gradeLabel: {
    fontSize: 11,
    color: '#888',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderTopWidth: 2,
    borderColor: '#E7A857',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#E7A857',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  formTextArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  roleButtonActive: {
    backgroundColor: '#E7A857',
    borderColor: '#E7A857',
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#0A0A0A',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#E7A857',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#222',
  },
  modalButtonDanger: {
    backgroundColor: '#E75757',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0A0A0A',
    marginLeft: 6,
  },
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    padding: 24,
  },
  detailModalContent: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#E7A857',
    maxHeight: '90%',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  detailCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#E7A857',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#888',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  detailNotes: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  detailActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
