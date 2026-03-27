import { useGame } from '@/contexts/GameContext';
import { Plus, Edit2, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { EnergyLevel, EnergyStatus } from '@/types/rpg';

export default function EnergyScreen() {
  const { gameState, addEnergySystem, updateEnergySystem, deleteEnergySystem } = useGame();
  const { energySystems } = gameState;
  const insets = useSafeAreaInsets();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingEnergy, setEditingEnergy] = useState<EnergyLevel | null>(null);
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    color: '#FFD700',
    status: 'developing' as EnergyStatus,
    current: 100,
    max: 100,
  });

  const resetForm = () => {
    setFormData({
      type: '',
      description: '',
      color: '#FFD700',
      status: 'developing',
      current: 100,
      max: 100,
    });
    setEditingEnergy(null);
  };

  const handleOpenEdit = (energy: EnergyLevel) => {
    setEditingEnergy(energy);
    setFormData({
      type: energy.type,
      description: energy.description,
      color: energy.color,
      status: energy.status || 'developing',
      current: energy.current,
      max: energy.max,
    });
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!formData.type.trim() || !formData.description.trim()) {
      Alert.alert('Error', 'Type and description are required');
      return;
    }

    if (editingEnergy) {
      updateEnergySystem(editingEnergy.type, formData as Partial<EnergyLevel>);
    } else {
      addEnergySystem(formData as any);
    }

    resetForm();
    setModalVisible(false);
  };

  const handleDelete = (type: string) => {
    Alert.alert(
      'Delete Energy System',
      'Are you sure you want to delete this energy system?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteEnergySystem(type),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Energy Systems</Text>
            <Text style={styles.subtitle}>{energySystems.length} Active Systems</Text>
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
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {energySystems.map((energy) => {
          const percentage = (energy.current / energy.max) * 100;
          
          return (
            <View key={energy.type} style={styles.energyCard}>
              <View style={styles.energyHeader}>
                <Text style={styles.energyName}>{energy.type}</Text>
                <View style={styles.actionButtons}>
                  <CopyButton
                    text={`${energy.type}: ${energy.current}/${energy.max} (${energy.status?.toUpperCase() || 'DEVELOPING'})\n${energy.description}`}
                    size={14}
                    color="#08C284"
                    iconOnly
                  />
                  <Pressable
                    onPress={() => handleOpenEdit(energy)}
                    style={styles.iconButton}
                  >
                    <Edit2 size={16} color="#5EA7FF" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDelete(energy.type)}
                    style={styles.iconButton}
                  >
                    <Trash2 size={16} color="#E75757" />
                  </Pressable>
                </View>
              </View>

              <View style={styles.energyValueRow}>
                <Text style={styles.energyValue}>
                  {energy.current}/{energy.max}
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percentage}%`,
                      backgroundColor: energy.color,
                    },
                  ]}
                />
              </View>

              <Text style={styles.energyDescription}>{energy.description}</Text>

              <View style={styles.energyStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Mastery</Text>
                  <Text style={[styles.statValue, { color: energy.color }]}>
                    {energy.status?.toUpperCase() || 'DEVELOPING'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Current</Text>
                  <Text style={[styles.statValue, { color: energy.color }]}>
                    {percentage === 100 ? 'FULL' : percentage > 50 ? 'STABLE' : 'LOW'}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Efficiency</Text>
                  <Text style={styles.statValue}>{Math.round(percentage)}%</Text>
                </View>
              </View>
            </View>
          );
        })}
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
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingEnergy ? 'Edit Energy System' : 'Add Energy System'}
              </Text>
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
                <Text style={styles.formLabel}>Type *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.type}
                  onChangeText={(text) => setFormData({ ...formData, type: text })}
                  placeholder="e.g., Ki, Chakra, Mana"
                  placeholderTextColor="#666"
                  editable={!editingEnergy}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description *</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Energy description"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Color</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.color}
                  onChangeText={(text) => setFormData({ ...formData, color: text })}
                  placeholder="#FFD700"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status</Text>
                <View style={styles.statusButtons}>
                  {(['developing', 'advanced', 'mastered', 'perfect'] as EnergyStatus[]).map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => setFormData({ ...formData, status })}
                      style={[
                        styles.statusButton,
                        formData.status === status && styles.statusButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          formData.status === status && styles.statusButtonTextActive,
                        ]}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Current</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.current.toString()}
                    onChangeText={(text) => setFormData({ ...formData, current: parseInt(text) || 0 })}
                    placeholder="100"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Max</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.max.toString()}
                    onChangeText={(text) => setFormData({ ...formData, max: parseInt(text) || 100 })}
                    placeholder="100"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
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
                onPress={handleSave}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={styles.modalButtonText}>
                  {editingEnergy ? 'Update' : 'Add'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
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
    alignItems: 'center',
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
    backgroundColor: '#08C284',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  energyCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  energyName: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyValueRow: {
    marginBottom: 8,
  },
  energyValue: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#08C284',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
  },
  energyDescription: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 16,
  },
  energyStats: {
    flexDirection: 'row',
    gap: 24,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase' as const,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
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
  formLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#08C284',
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
    textAlignVertical: 'top' as const,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  statusButtonActive: {
    backgroundColor: '#08C284',
    borderColor: '#08C284',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  statusButtonTextActive: {
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
