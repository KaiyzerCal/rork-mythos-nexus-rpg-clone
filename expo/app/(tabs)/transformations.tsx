import { useGame } from '@/contexts/GameContext';
import { Flame, Zap, Info, Check, Plus, Edit2, Trash2, Save, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { TransformationData, Buff, Ability } from '@/types/rpg';

const TIER_FILTERS = [
  'All',
  'Spartan',
  'Saiyan',
  'Thorn',
  'Karma',
  'Regalia',
  'Ouroboros',
  'BlackHeart',
  'FinalAscent',
];

export default function TransformationsScreen() {
  const { gameState, setCurrentForm, addTransformation, updateTransformation, deleteTransformation } = useGame();
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedForm, setSelectedForm] = useState<TransformationData | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editedForm, setEditedForm] = useState<TransformationData | null>(null);

  const filteredForms =
    selectedTier === 'All'
      ? gameState.transformations
      : gameState.transformations.filter((t) => t.tier === selectedTier);

  const sortedForms = [...filteredForms].sort((a, b) => a.order - b.order);

  const handleFormPress = (form: TransformationData) => {
    setSelectedForm(form);
    setEditedForm(JSON.parse(JSON.stringify(form)));
    setEditMode(false);
    setIsCreating(false);
    setModalVisible(true);
  };

  const handleAddForm = () => {
    const newForm: TransformationData = {
      id: Date.now().toString(),
      tier: 'Spartan',
      name: '',
      order: gameState.transformations.length + 1,
      bpmRange: '70-80',
      energy: 'Ki',
      jjkGrade: 'Grade 4',
      opTier: 'East Blue',
      activeBuffs: [],
      passiveBuffs: [],
      abilities: [],
      unlocked: true,
    };
    setSelectedForm(newForm);
    setEditedForm(newForm);
    setEditMode(true);
    setIsCreating(true);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!editedForm || !editedForm.name.trim()) {
      Alert.alert('Error', 'Please enter a form name');
      return;
    }
    
    if (isCreating) {
      addTransformation(editedForm);
    } else {
      updateTransformation(editedForm.id, editedForm);
    }
    
    setModalVisible(false);
    setEditMode(false);
    setIsCreating(false);
  };

  const handleDelete = () => {
    if (!selectedForm) return;
    
    Alert.alert(
      'Delete Transformation',
      `Are you sure you want to delete ${selectedForm.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransformation(selectedForm.id);
            setModalVisible(false);
          },
        },
      ]
    );
  };

  const addBuff = (type: 'active' | 'passive') => {
    if (!editedForm) return;
    const newBuff: Buff = { label: '', value: 0, unit: '%' };
    setEditedForm({
      ...editedForm,
      [type === 'active' ? 'activeBuffs' : 'passiveBuffs']: [
        ...(type === 'active' ? editedForm.activeBuffs : editedForm.passiveBuffs),
        newBuff,
      ],
    });
  };

  const updateBuff = (type: 'active' | 'passive', index: number, field: keyof Buff, value: string | number) => {
    if (!editedForm) return;
    const buffs = type === 'active' ? [...editedForm.activeBuffs] : [...editedForm.passiveBuffs];
    buffs[index] = { ...buffs[index], [field]: value };
    setEditedForm({
      ...editedForm,
      [type === 'active' ? 'activeBuffs' : 'passiveBuffs']: buffs,
    });
  };

  const removeBuff = (type: 'active' | 'passive', index: number) => {
    if (!editedForm) return;
    const buffs = type === 'active' ? [...editedForm.activeBuffs] : [...editedForm.passiveBuffs];
    buffs.splice(index, 1);
    setEditedForm({
      ...editedForm,
      [type === 'active' ? 'activeBuffs' : 'passiveBuffs']: buffs,
    });
  };

  const addAbility = () => {
    if (!editedForm) return;
    const newAbility: Ability = { title: '', irl: '' };
    setEditedForm({
      ...editedForm,
      abilities: [...editedForm.abilities, newAbility],
    });
  };

  const updateAbility = (index: number, field: keyof Ability, value: string) => {
    if (!editedForm) return;
    const abilities = [...editedForm.abilities];
    abilities[index] = { ...abilities[index], [field]: value };
    setEditedForm({ ...editedForm, abilities });
  };

  const removeAbility = (index: number) => {
    if (!editedForm) return;
    const abilities = [...editedForm.abilities];
    abilities.splice(index, 1);
    setEditedForm({ ...editedForm, abilities });
  };

  const handleActivateForm = () => {
    if (selectedForm) {
      setCurrentForm(selectedForm.id);
      setModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Flame size={28} color="#08C284" />
            <View>
              <Text style={styles.title}>Transformation Ladder</Text>
              <Text style={styles.subtitle}>{gameState.transformations.length} Forms Available</Text>
            </View>
          </View>
          <Pressable onPress={handleAddForm} style={styles.addButton}>
            <Plus size={20} color="#0A0A0A" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        style={styles.filterScroll}
      >
        {TIER_FILTERS.map((tier) => (
          <Pressable
            key={tier}
            onPress={() => setSelectedTier(tier)}
            style={[
              styles.filterChip,
              selectedTier === tier && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedTier === tier && styles.filterTextActive,
              ]}
            >
              {tier}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedForms.map((form) => {
          const isActive = form.name === gameState.currentForm;
          return (
            <Pressable
              key={form.id}
              onPress={() => handleFormPress(form)}
              style={[
                styles.formCard,
                isActive && styles.formCardActive,
              ]}
            >
              <View style={styles.formHeader}>
                <View style={styles.formTitleRow}>
                  <CopyButton
                    text={`${form.name} [${form.tier}]\nBPM: ${form.bpmRange} | Energy: ${form.energy}\nJJK: ${form.jjkGrade} | OP: ${form.opTier}\n${form.unlocked ? 'UNLOCKED' : 'LOCKED'}${isActive ? ' | ACTIVE' : ''}`}
                    size={12}
                    color={isActive ? '#08C284' : '#666'}
                    iconOnly
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.formName, isActive && styles.formNameActive]}>
                    {form.name}
                  </Text>
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Check size={12} color="#0A0A0A" />
                      <Text style={styles.activeBadgeText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <View style={styles.tierBadge}>
                  <Text style={styles.tierText}>{form.tier}</Text>
                </View>
              </View>

              <View style={styles.formStats}>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>BPM:</Text>
                  <Text style={styles.statValue}>{form.bpmRange}</Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Energy:</Text>
                  <Text style={styles.statValue}>{form.energy}</Text>
                </View>
              </View>

              <View style={styles.formGrades}>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeLabel}>JJK</Text>
                  <Text style={styles.gradeValue}>{form.jjkGrade}</Text>
                </View>
                <View style={styles.gradeBadge}>
                  <Text style={styles.gradeLabel}>OP</Text>
                  <Text style={styles.gradeValue}>{form.opTier}</Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedForm && editedForm && (
              <>
                <View style={styles.modalHeaderBar}>
                  <Pressable onPress={() => setModalVisible(false)} style={styles.closeButton}>
                    <X size={24} color="#FFFFFF" />
                  </Pressable>
                  {!isCreating && (
                    <View style={styles.modalActions}>
                      {editMode ? (
                        <>
                          <Pressable onPress={handleDelete} style={styles.deleteButton}>
                            <Trash2 size={18} color="#FF3B30" />
                          </Pressable>
                          <Pressable onPress={handleSave} style={styles.saveButton}>
                            <Save size={18} color="#08C284" />
                          </Pressable>
                        </>
                      ) : (
                        <Pressable onPress={() => setEditMode(true)} style={styles.editButton}>
                          <Edit2 size={18} color="#08C284" />
                        </Pressable>
                      )}
                    </View>
                  )}
                  {isCreating && (
                    <Pressable onPress={handleSave} style={styles.saveButton}>
                      <Save size={18} color="#08C284" />
                    </Pressable>
                  )}
                </View>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScroll}
                >
                  <View style={styles.modalHeader}>
                    {editMode ? (
                      <TextInput
                        style={styles.modalTitleInput}
                        value={editedForm.name}
                        onChangeText={(text) => setEditedForm({ ...editedForm, name: text })}
                        placeholder="Form Name"
                        placeholderTextColor="#666"
                      />
                    ) : (
                      <Text style={styles.modalTitle}>{selectedForm.name}</Text>
                    )}
                    {editMode ? (
                      <TextInput
                        style={styles.modalTierInput}
                        value={editedForm.tier}
                        onChangeText={(text) => setEditedForm({ ...editedForm, tier: text as any })}
                        placeholder="Tier"
                        placeholderTextColor="#666"
                      />
                    ) : (
                      <Text style={styles.modalTier}>{selectedForm.tier} Tier</Text>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>Energy & State</Text>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>BPM Range:</Text>
                      {editMode ? (
                        <TextInput
                          style={styles.modalValueInput}
                          value={editedForm.bpmRange}
                          onChangeText={(text) => setEditedForm({ ...editedForm, bpmRange: text })}
                          placeholder="70-80"
                          placeholderTextColor="#666"
                        />
                      ) : (
                        <Text style={styles.modalValue}>{selectedForm.bpmRange}</Text>
                      )}
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Energy Type:</Text>
                      {editMode ? (
                        <TextInput
                          style={styles.modalValueInput}
                          value={editedForm.energy}
                          onChangeText={(text) => setEditedForm({ ...editedForm, energy: text })}
                          placeholder="Ki"
                          placeholderTextColor="#666"
                        />
                      ) : (
                        <Text style={styles.modalValue}>{selectedForm.energy}</Text>
                      )}
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>JJK Grade:</Text>
                      {editMode ? (
                        <TextInput
                          style={styles.modalValueInput}
                          value={editedForm.jjkGrade}
                          onChangeText={(text) => setEditedForm({ ...editedForm, jjkGrade: text })}
                          placeholder="Grade 4"
                          placeholderTextColor="#666"
                        />
                      ) : (
                        <Text style={styles.modalValue}>{selectedForm.jjkGrade}</Text>
                      )}
                    </View>
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>OP Tier:</Text>
                      {editMode ? (
                        <TextInput
                          style={styles.modalValueInput}
                          value={editedForm.opTier}
                          onChangeText={(text) => setEditedForm({ ...editedForm, opTier: text })}
                          placeholder="East Blue"
                          placeholderTextColor="#666"
                        />
                      ) : (
                        <Text style={styles.modalValue}>{selectedForm.opTier}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.modalSectionTitle}>Active Buffs</Text>
                      {editMode && (
                        <Pressable onPress={() => addBuff('active')} style={styles.addSmallButton}>
                          <Plus size={16} color="#08C284" />
                        </Pressable>
                      )}
                    </View>
                    {editedForm.activeBuffs.length > 0 ? (
                      editedForm.activeBuffs.map((buff, idx) => (
                        <View key={idx} style={styles.buffEditRow}>
                          {editMode ? (
                            <>
                              <View style={styles.buffInputs}>
                                <TextInput
                                  style={styles.buffInput}
                                  value={buff.label}
                                  onChangeText={(text) => updateBuff('active', idx, 'label', text)}
                                  placeholder="Label"
                                  placeholderTextColor="#666"
                                />
                                <TextInput
                                  style={styles.buffInputSmall}
                                  value={buff.value.toString()}
                                  onChangeText={(text) => updateBuff('active', idx, 'value', parseFloat(text) || 0)}
                                  placeholder="0"
                                  placeholderTextColor="#666"
                                  keyboardType="numeric"
                                />
                                <TextInput
                                  style={styles.buffInputSmall}
                                  value={buff.unit}
                                  onChangeText={(text) => updateBuff('active', idx, 'unit', text)}
                                  placeholder="%"
                                  placeholderTextColor="#666"
                                />
                                <Pressable onPress={() => removeBuff('active', idx)} style={styles.removeButton}>
                                  <Trash2 size={16} color="#FF3B30" />
                                </Pressable>
                              </View>
                            </>
                          ) : (
                            <View style={styles.buffRow}>
                              <Zap size={14} color="#08C284" />
                              <Text style={styles.buffText}>
                                {buff.label}: +{buff.value}{buff.unit}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      !editMode && <Text style={styles.emptyText}>No active buffs</Text>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.modalSectionTitle}>Passive Buffs</Text>
                      {editMode && (
                        <Pressable onPress={() => addBuff('passive')} style={styles.addSmallButton}>
                          <Plus size={16} color="#08C284" />
                        </Pressable>
                      )}
                    </View>
                    {editedForm.passiveBuffs.length > 0 ? (
                      editedForm.passiveBuffs.map((buff, idx) => (
                        <View key={idx} style={styles.buffEditRow}>
                          {editMode ? (
                            <View style={styles.buffInputs}>
                              <TextInput
                                style={styles.buffInput}
                                value={buff.label}
                                onChangeText={(text) => updateBuff('passive', idx, 'label', text)}
                                placeholder="Label"
                                placeholderTextColor="#666"
                              />
                              <TextInput
                                style={styles.buffInputSmall}
                                value={buff.value.toString()}
                                onChangeText={(text) => updateBuff('passive', idx, 'value', parseFloat(text) || 0)}
                                placeholder="0"
                                placeholderTextColor="#666"
                                keyboardType="numeric"
                              />
                              <TextInput
                                style={styles.buffInputSmall}
                                value={buff.unit}
                                onChangeText={(text) => updateBuff('passive', idx, 'unit', text)}
                                placeholder="%"
                                placeholderTextColor="#666"
                              />
                              <Pressable onPress={() => removeBuff('passive', idx)} style={styles.removeButton}>
                                <Trash2 size={16} color="#FF3B30" />
                              </Pressable>
                            </View>
                          ) : (
                            <View style={styles.buffRow}>
                              <Info size={14} color="#5EA7FF" />
                              <Text style={styles.buffText}>
                                {buff.label}: +{buff.value}{buff.unit}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))
                    ) : (
                      !editMode && <Text style={styles.emptyText}>No passive buffs</Text>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.modalSectionTitle}>Abilities (IRL Translation)</Text>
                      {editMode && (
                        <Pressable onPress={addAbility} style={styles.addSmallButton}>
                          <Plus size={16} color="#08C284" />
                        </Pressable>
                      )}
                    </View>
                    {editedForm.abilities.length > 0 ? (
                      editedForm.abilities.map((ability, idx) => (
                        <View key={idx} style={styles.abilityEditItem}>
                          {editMode ? (
                            <>
                              <View style={styles.abilityEditHeader}>
                                <TextInput
                                  style={styles.abilityTitleInput}
                                  value={ability.title}
                                  onChangeText={(text) => updateAbility(idx, 'title', text)}
                                  placeholder="Ability Title"
                                  placeholderTextColor="#666"
                                />
                                <Pressable onPress={() => removeAbility(idx)} style={styles.removeButton}>
                                  <Trash2 size={16} color="#FF3B30" />
                                </Pressable>
                              </View>
                              <TextInput
                                style={styles.abilityIrlInput}
                                value={ability.irl}
                                onChangeText={(text) => updateAbility(idx, 'irl', text)}
                                placeholder="IRL Translation"
                                placeholderTextColor="#666"
                                multiline
                              />
                            </>
                          ) : (
                            <>
                              <Text style={styles.abilityTitle}>{ability.title}</Text>
                              <Text style={styles.abilityIrl}>{ability.irl}</Text>
                            </>
                          )}
                        </View>
                      ))
                    ) : (
                      !editMode && <Text style={styles.emptyText}>No abilities</Text>
                    )}
                  </View>
                </ScrollView>

                {!editMode && !isCreating && (
                  <View style={styles.modalBottomActions}>
                    <Pressable
                      onPress={handleActivateForm}
                      style={[styles.modalButton, styles.modalButtonPrimary]}
                    >
                      <Text style={styles.modalButtonText}>Activate Form</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    backgroundColor: '#08C284',
    padding: 10,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  filterScroll: {
    maxHeight: 48,
    marginBottom: 12,
  },
  filterContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#222',
  },
  filterChipActive: {
    backgroundColor: '#08C284',
    borderColor: '#08C284',
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterTextActive: {
    color: '#0A0A0A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  formCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  formCardActive: {
    borderColor: '#08C284',
    backgroundColor: '#0F1F1A',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  formTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  formNameActive: {
    color: '#08C284',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#08C284',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
  tierBadge: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tierText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#666',
  },
  formStats: {
    gap: 6,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    fontSize: 13,
    color: '#888',
  },
  statValue: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  formGrades: {
    flexDirection: 'row',
    gap: 8,
  },
  gradeBadge: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  gradeLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 2,
  },
  gradeValue: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600' as const,
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
    borderColor: '#08C284',
  },
  modalHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  closeButton: {
    padding: 4,
  },
  editButton: {
    padding: 8,
  },
  saveButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
    marginRight: 12,
  },
  modalScroll: {
    padding: 24,
    paddingBottom: 8,
  },
  modalHeader: {
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalTitleInput: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#08C284',
  },
  modalTier: {
    fontSize: 14,
    color: '#08C284',
  },
  modalTierInput: {
    fontSize: 14,
    color: '#08C284',
    backgroundColor: '#1A1A1A',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#08C284',
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#08C284',
    marginBottom: 12,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: 14,
    color: '#888',
  },
  modalValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600' as const,
  },
  modalValueInput: {
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 100,
  },
  buffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  buffText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  abilityItem: {
    marginBottom: 12,
  },
  abilityTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  abilityIrl: {
    fontSize: 13,
    color: '#CCCCCC',
    lineHeight: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addSmallButton: {
    padding: 4,
  },
  buffEditRow: {
    marginBottom: 8,
  },
  buffInputs: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  buffInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  buffInputSmall: {
    width: 60,
    fontSize: 14,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  removeButton: {
    padding: 4,
  },
  abilityEditItem: {
    marginBottom: 16,
  },
  abilityEditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  abilityTitleInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
  },
  abilityIrlInput: {
    fontSize: 13,
    color: '#CCCCCC',
    backgroundColor: '#1A1A1A',
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 60,
  },
  emptyText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic' as const,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modalBottomActions: {
    padding: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  modalButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#08C284',
  },
  modalButtonSecondary: {
    backgroundColor: '#222',
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
  modalButtonTextSecondary: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
