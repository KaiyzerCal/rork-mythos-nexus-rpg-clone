import { useGame } from '@/contexts/GameContext';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, X, Edit2, Trash2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EnergySystem } from '@/types/rpg';

export default function AllSkillsScreen() {
  const { gameState, skillSubTrees, addSkill, updateSkill, deleteSkill, addSubSkill, updateSubSkill, deleteSubSkill } = useGame();
  const { skillTrees } = gameState;
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEditSubModal, setShowEditSubModal] = useState(false);
  const [selectedParentSkill, setSelectedParentSkill] = useState<string>('');
  const [editingSkillId, setEditingSkillId] = useState<string>('');
  const [editingSubSkillId, setEditingSubSkillId] = useState<string>('');
  const [newSkill, setNewSkill] = useState({
    name: '',
    description: '',
    tier: 1,
    category: 'Combat',
    energyType: 'Ki' as EnergySystem,
  });
  const [newSubSkill, setNewSubSkill] = useState({
    name: '',
    description: '',
    tier: 1,
  });
  const [editSkill, setEditSkill] = useState({
    name: '',
    description: '',
    tier: 1,
    category: 'Combat',
    energyType: 'Ki' as EnergySystem,
  });
  const [editSubSkill, setEditSubSkill] = useState({
    name: '',
    description: '',
    tier: 1,
  });

  const toggleSkill = (skillId: string) => {
    const newExpanded = new Set(expandedSkills);
    if (newExpanded.has(skillId)) {
      newExpanded.delete(skillId);
    } else {
      newExpanded.add(skillId);
    }
    setExpandedSkills(newExpanded);
  };

  const handleAddSkill = () => {
    if (newSkill.name.trim() && newSkill.description.trim()) {
      addSkill({
        name: newSkill.name,
        description: newSkill.description,
        tier: newSkill.tier,
        category: newSkill.category,
        energyType: newSkill.energyType,
        unlocked: true,
        cost: 0,
      });
      setNewSkill({
        name: '',
        description: '',
        tier: 1,
        category: 'Combat',
        energyType: 'Ki',
      });
      setShowAddModal(false);
    }
  };

  const handleAddSubSkill = () => {
    if (newSubSkill.name.trim() && newSubSkill.description.trim() && selectedParentSkill) {
      addSubSkill(selectedParentSkill, {
        name: newSubSkill.name,
        description: newSubSkill.description,
        tier: newSubSkill.tier,
        unlocked: true,
        cost: 0,
        energyType: skillTrees.find(s => s.id === selectedParentSkill)?.energyType || 'Ki',
        category: skillTrees.find(s => s.id === selectedParentSkill)?.category || 'Combat',
      });
      setNewSubSkill({
        name: '',
        description: '',
        tier: 1,
      });
      setShowAddSubModal(false);
      setSelectedParentSkill('');
    }
  };

  const handleEditSkill = (skillId: string) => {
    const skill = skillTrees.find(s => s.id === skillId);
    if (skill) {
      setEditingSkillId(skillId);
      setEditSkill({
        name: skill.name,
        description: skill.description,
        tier: skill.tier,
        category: skill.category,
        energyType: skill.energyType,
      });
      setShowEditModal(true);
    }
  };

  const handleSaveEditSkill = () => {
    if (editSkill.name.trim() && editSkill.description.trim() && editingSkillId) {
      updateSkill(editingSkillId, {
        name: editSkill.name,
        description: editSkill.description,
        tier: editSkill.tier,
        category: editSkill.category,
        energyType: editSkill.energyType,
      });
      setShowEditModal(false);
      setEditingSkillId('');
    }
  };

  const handleDeleteSkill = (skillId: string) => {
    const skill = skillTrees.find(s => s.id === skillId);
    Alert.alert(
      'Delete Skill',
      `Are you sure you want to delete "${skill?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteSkill(skillId)
        }
      ]
    );
  };

  const handleEditSubSkill = (parentSkillId: string, subSkillId: string) => {
    const subSkill = skillSubTrees[parentSkillId]?.find(s => s.id === subSkillId);
    if (subSkill) {
      setSelectedParentSkill(parentSkillId);
      setEditingSubSkillId(subSkillId);
      setEditSubSkill({
        name: subSkill.name,
        description: subSkill.description,
        tier: subSkill.tier,
      });
      setShowEditSubModal(true);
    }
  };

  const handleSaveEditSubSkill = () => {
    if (editSubSkill.name.trim() && editSubSkill.description.trim() && editingSubSkillId && selectedParentSkill) {
      updateSubSkill(selectedParentSkill, editingSubSkillId, {
        name: editSubSkill.name,
        description: editSubSkill.description,
        tier: editSubSkill.tier,
      });
      setShowEditSubModal(false);
      setEditingSubSkillId('');
      setSelectedParentSkill('');
    }
  };

  const handleDeleteSubSkill = (parentSkillId: string, subSkillId: string) => {
    const subSkill = skillSubTrees[parentSkillId]?.find(s => s.id === subSkillId);
    Alert.alert(
      'Delete Sub-Skill',
      `Are you sure you want to delete "${subSkill?.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteSubSkill(parentSkillId, subSkillId)
        }
      ]
    );
  };

  const categories = Array.from(new Set(skillTrees.map((s) => s.category)));
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Skills & Sub-Skills</Text>
            <Text style={styles.subtitle}>{skillTrees.length} Main Skills</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
      >
        {categories.map((category) => {
          const categorySkills = skillTrees.filter((s) => s.category === category);

          return (
            <View key={category} style={styles.categorySection}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryTitle}>{category}</Text>
                <Text style={styles.categoryCount}>{categorySkills.length}</Text>
              </View>

              {categorySkills.map((skill) => {
                const isExpanded = expandedSkills.has(skill.id);
                const subSkills = skillSubTrees[skill.id] || [];
                const hasSubSkills = subSkills.length > 0;

                return (
                  <View key={skill.id} style={styles.skillContainer}>
                    <View style={styles.skillCard}>
                      <View style={styles.skillHeader}>
                        <View style={styles.skillTitleRow}>
                          {hasSubSkills && (
                            isExpanded ? (
                              <ChevronDown size={20} color="#08C284" />
                            ) : (
                              <ChevronRight size={20} color="#08C284" />
                            )
                          )}
                          <Text style={styles.skillName}>{skill.name}</Text>
                        </View>
                        <View style={styles.skillBadges}>
                          <View style={[styles.tierBadge, { backgroundColor: getTierColor(skill.tier) }]}>
                            <Text style={styles.tierText}>T{skill.tier}</Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.skillDescription}>{skill.description}</Text>

                      <View style={styles.skillMeta}>
                        <View style={styles.metaItem}>
                          <Text style={styles.metaLabel}>Energy</Text>
                          <Text style={[styles.metaValue, { color: getEnergyColor(skill.energyType) }]}>
                            {skill.energyType}
                          </Text>
                        </View>
                        {hasSubSkills && (
                          <View style={styles.metaItem}>
                            <Text style={styles.metaLabel}>Sub-Skills</Text>
                            <Text style={styles.metaValue}>{subSkills.length}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => hasSubSkills && toggleSkill(skill.id)}
                        >
                          {hasSubSkills && (
                            <>
                              {isExpanded ? (
                                <ChevronDown size={16} color="#08C284" />
                              ) : (
                                <ChevronRight size={16} color="#08C284" />
                              )}
                              <Text style={styles.actionButtonText}>View Sub-Skills</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <View style={styles.actionButtonGroup}>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleEditSkill(skill.id)}
                          >
                            <Edit2 size={18} color="#08C284" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleDeleteSkill(skill.id)}
                          >
                            <Trash2 size={18} color="#DC143C" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.addSubSkillButton}
                      onPress={() => {
                        setSelectedParentSkill(skill.id);
                        setShowAddSubModal(true);
                      }}
                    >
                      <Plus size={16} color="#08C284" />
                      <Text style={styles.addSubSkillText}>Add Sub-Skill</Text>
                    </TouchableOpacity>

                    {isExpanded && hasSubSkills && (
                      <View style={styles.subSkillsContainer}>
                        {subSkills.map((subSkill) => (
                          <View key={subSkill.id} style={styles.subSkillCard}>
                            <View style={styles.subSkillHeader}>
                              <Text style={styles.subSkillName}>{subSkill.name}</Text>
                              <View style={styles.subSkillActions}>
                                <View style={[styles.subTierBadge, { backgroundColor: getTierColor(subSkill.tier) }]}>
                                  <Text style={styles.subTierText}>T{subSkill.tier}</Text>
                                </View>
                                <TouchableOpacity
                                  style={styles.iconButton}
                                  onPress={() => handleEditSubSkill(skill.id, subSkill.id)}
                                >
                                  <Edit2 size={16} color="#08C284" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                  style={styles.iconButton}
                                  onPress={() => handleDeleteSubSkill(skill.id, subSkill.id)}
                                >
                                  <Trash2 size={16} color="#DC143C" />
                                </TouchableOpacity>
                              </View>
                            </View>
                            <Text style={styles.subSkillDescription}>{subSkill.description}</Text>
                            {subSkill.prerequisites && subSkill.prerequisites.length > 0 && (
                              <View style={styles.prereqContainer}>
                                <Text style={styles.prereqLabel}>Requires:</Text>
                                <Text style={styles.prereqText} numberOfLines={1}>
                                  {subSkill.prerequisites.join(', ')}
                                </Text>
                              </View>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Skill</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={newSkill.name}
                onChangeText={(text) => setNewSkill({ ...newSkill, name: text })}
                placeholder="Skill name"
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newSkill.description}
                onChangeText={(text) => setNewSkill({ ...newSkill, description: text })}
                placeholder="Skill description"
                placeholderTextColor="#666"
                multiline
              />

              <Text style={styles.label}>Tier (1-7)</Text>
              <TextInput
                style={styles.input}
                value={String(newSkill.tier)}
                onChangeText={(text) => {
                  if (text === '') {
                    setNewSkill({ ...newSkill, tier: 1 });
                    return;
                  }
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(num)) {
                    setNewSkill({ ...newSkill, tier: Math.max(1, Math.min(7, num)) });
                  }
                }}
                placeholder="1"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={1}
              />

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={newSkill.category}
                onChangeText={(text) => setNewSkill({ ...newSkill, category: text })}
                placeholder="Combat, Energy, etc."
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Energy Type</Text>
              <TextInput
                style={styles.input}
                value={newSkill.energyType}
                onChangeText={(text) => setNewSkill({ ...newSkill, energyType: text as any })}
                placeholder="Ki, Haki, Nen, etc."
                placeholderTextColor="#666"
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddSkill}
            >
              <Text style={styles.saveButtonText}>Add Skill</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showAddSubModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddSubModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Sub-Skill</Text>
              <TouchableOpacity onPress={() => setShowAddSubModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Parent Skill</Text>
              <Text style={styles.parentSkillName}>
                {skillTrees.find(s => s.id === selectedParentSkill)?.name || 'Select a skill'}
              </Text>

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={newSubSkill.name}
                onChangeText={(text) => setNewSubSkill({ ...newSubSkill, name: text })}
                placeholder="Sub-skill name"
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newSubSkill.description}
                onChangeText={(text) => setNewSubSkill({ ...newSubSkill, description: text })}
                placeholder="Sub-skill description"
                placeholderTextColor="#666"
                multiline
              />

              <Text style={styles.label}>Tier (1-7)</Text>
              <TextInput
                style={styles.input}
                value={String(newSubSkill.tier)}
                onChangeText={(text) => {
                  if (text === '') {
                    setNewSubSkill({ ...newSubSkill, tier: 1 });
                    return;
                  }
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(num)) {
                    setNewSubSkill({ ...newSubSkill, tier: Math.max(1, Math.min(7, num)) });
                  }
                }}
                placeholder="1"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={1}
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddSubSkill}
            >
              <Text style={styles.saveButtonText}>Add Sub-Skill</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Skill</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editSkill.name}
                onChangeText={(text) => setEditSkill({ ...editSkill, name: text })}
                placeholder="Skill name"
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editSkill.description}
                onChangeText={(text) => setEditSkill({ ...editSkill, description: text })}
                placeholder="Skill description"
                placeholderTextColor="#666"
                multiline
              />

              <Text style={styles.label}>Tier (1-7)</Text>
              <TextInput
                style={styles.input}
                value={String(editSkill.tier)}
                onChangeText={(text) => {
                  if (text === '') {
                    setEditSkill({ ...editSkill, tier: 1 });
                    return;
                  }
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(num)) {
                    setEditSkill({ ...editSkill, tier: Math.max(1, Math.min(7, num)) });
                  }
                }}
                placeholder="1"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={1}
              />

              <Text style={styles.label}>Category</Text>
              <TextInput
                style={styles.input}
                value={editSkill.category}
                onChangeText={(text) => setEditSkill({ ...editSkill, category: text })}
                placeholder="Combat, Energy, etc."
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Energy Type</Text>
              <TextInput
                style={styles.input}
                value={editSkill.energyType}
                onChangeText={(text) => setEditSkill({ ...editSkill, energyType: text as any })}
                placeholder="Ki, Haki, Nen, etc."
                placeholderTextColor="#666"
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveEditSkill}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showEditSubModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditSubModal(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Sub-Skill</Text>
              <TouchableOpacity onPress={() => setShowEditSubModal(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editSubSkill.name}
                onChangeText={(text) => setEditSubSkill({ ...editSubSkill, name: text })}
                placeholder="Sub-skill name"
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editSubSkill.description}
                onChangeText={(text) => setEditSubSkill({ ...editSubSkill, description: text })}
                placeholder="Sub-skill description"
                placeholderTextColor="#666"
                multiline
              />

              <Text style={styles.label}>Tier (1-7)</Text>
              <TextInput
                style={styles.input}
                value={String(editSubSkill.tier)}
                onChangeText={(text) => {
                  if (text === '') {
                    setEditSubSkill({ ...editSubSkill, tier: 1 });
                    return;
                  }
                  const num = parseInt(text.replace(/[^0-9]/g, ''), 10);
                  if (!isNaN(num)) {
                    setEditSubSkill({ ...editSubSkill, tier: Math.max(1, Math.min(7, num)) });
                  }
                }}
                placeholder="1"
                placeholderTextColor="#666"
                keyboardType="number-pad"
                maxLength={1}
              />
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveEditSubSkill}
            >
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function getTierColor(tier: number): string {
  if (tier >= 7) return '#FF1493';
  if (tier >= 6) return '#9370DB';
  if (tier >= 5) return '#FFD700';
  if (tier >= 4) return '#FF6B35';
  if (tier >= 3) return '#08C284';
  if (tier >= 2) return '#4169E1';
  return '#666';
}

function getEnergyColor(energyType: string): string {
  const colorMap: Record<string, string> = {
    'Ki': '#FFD700',
    'Haki': '#8B0000',
    'Nen': '#32CD32',
    'Nen/Aura': '#32CD32',
    'VRIL': '#FF6B35',
    'Ichor': '#FFD700',
    'VRIL/Ichor': '#FF6B35',
    'Aura': '#4169E1',
    'Black Heart': '#111111',
    'Aether': '#9370DB',
    'Emerald Flames': '#08C284',
    'Cursed Energy': '#8B00FF',
    'Mana': '#00CED1',
    'Chakra': '#FF4500',
    'Lacrima': '#FF69B4',
    'Magoi': '#FFD700',
  };
  return colorMap[energyType] || '#666';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#08C284',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#08C284',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#08C284',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#08C284',
    backgroundColor: '#08C28420',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillContainer: {
    marginBottom: 12,
  },
  skillCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  skillTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  skillName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
    flex: 1,
  },
  skillBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  tierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
  },
  skillDescription: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 12,
    lineHeight: 20,
  },
  skillMeta: {
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  metaValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#08C284',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#08C28410',
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#08C284',
  },
  actionButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  addSubSkillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#08C28420',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  addSubSkillText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#08C284',
  },
  subSkillsContainer: {
    marginTop: 8,
    marginLeft: 12,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#08C284',
  },
  subSkillCard: {
    backgroundColor: '#0D0D0D',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1A1A1A',
  },
  subSkillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  subSkillActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subSkillName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#08C284',
    flex: 1,
  },
  subTierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  subTierText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  subSkillDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  prereqContainer: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 6,
  },
  prereqLabel: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600' as const,
  },
  prereqText: {
    fontSize: 11,
    color: '#888',
    flex: 1,
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
    paddingTop: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#08C284',
  },
  modalForm: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#08C284',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#222',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top' as const,
  },
  parentSkillName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#08C284',
  },
  saveButton: {
    backgroundColor: '#08C284',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    margin: 20,
    marginTop: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
    textAlign: 'center' as const,
  },
});
