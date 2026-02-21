import { useGame } from '@/contexts/GameContext';
import { Package, Plus, Trash2, X, Scan, Edit2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { InventoryItemV2 } from '@/types/rpg';


export default function InventoryScreen() {
  const { gameState, addInventoryItem, deleteInventoryItem, updateInventoryItem } = useGame();
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemV2 | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanForm, setScanForm] = useState({
    appearance: '',
    power: '',
    rarity: '',
  });

  const [formData, setFormData] = useState({
    slot: '',
    name: '',
    tier: 'S',
    description: '',
    effectLabel: '',
    effectValue: 10,
    effectUnit: '%',
  });

  const resetForm = () => {
    setFormData({
      slot: '',
      name: '',
      tier: 'S',
      description: '',
      effectLabel: '',
      effectValue: 10,
      effectUnit: '%',
    });
  };

  const handleAddItem = () => {
    if (!formData.name.trim() || !formData.slot.trim()) {
      Alert.alert('Error', 'Item name and slot are required');
      return;
    }

    addInventoryItem({
      slot: formData.slot,
      name: formData.name,
      tier: formData.tier,
      description: formData.description,
      effects: [
        {
          label: formData.effectLabel || 'Bonus',
          value: formData.effectValue,
          unit: formData.effectUnit,
        },
      ],
    });

    resetForm();
    setModalVisible(false);
  };

  const handleEditItem = () => {
    if (!selectedItem) return;
    
    if (!formData.name.trim() || !formData.slot.trim()) {
      Alert.alert('Error', 'Item name and slot are required');
      return;
    }

    updateInventoryItem(selectedItem.id, {
      slot: formData.slot,
      name: formData.name,
      tier: formData.tier,
      description: formData.description,
      effects: [
        {
          label: formData.effectLabel || 'Bonus',
          value: formData.effectValue,
          unit: formData.effectUnit,
        },
      ],
    });

    resetForm();
    setSelectedItem(null);
    setEditModalVisible(false);
  };

  const handleStartEdit = (item: InventoryItemV2) => {
    setSelectedItem(item);
    setFormData({
      slot: item.slot,
      name: item.name,
      tier: item.tier,
      description: item.description,
      effectLabel: item.effects[0]?.label || '',
      effectValue: item.effects[0]?.value || 10,
      effectUnit: item.effects[0]?.unit || '%',
    });
    setDetailModalVisible(false);
    setEditModalVisible(true);
  };

  const handleDeleteItem = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteInventoryItem(id),
        },
      ]
    );
  };

  const handleViewItem = (item: InventoryItemV2) => {
    setSelectedItem(item);
    setDetailModalVisible(true);
  };

  const handleStartScan = () => {
    console.log('[SCAN] Opening scan modal');
    setScanForm({ appearance: '', power: '', rarity: '' });
    setScanLoading(false);
    setScanModalVisible(true);
  };

  const handleGenerateItem = async () => {
    console.log('[SCAN] Generate item pressed');
    console.log('[SCAN] Form data:', scanForm);
    
    if (!scanForm.appearance.trim() || !scanForm.power.trim() || !scanForm.rarity.trim()) {
      Alert.alert('Required', 'Please fill out all fields');
      return;
    }
    
    setScanLoading(true);
    
    try {
      console.log('[SCAN] Calling AI to generate item...');
      
      const prompt = `Based on these details, create an RPG inventory item:

Appearance: ${scanForm.appearance}
Power/Ability: ${scanForm.power}
Rarity: ${scanForm.rarity}

The slot should be one of: Head, Arms, Legs, Body, Aura, Weapon, Accessory, Ring, Necklace. The tier should reflect rarity from B (common) to SSS (legendary).

Respond with ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "name": "item name",
  "slot": "equipment slot",
  "tier": "SSS|SS|S|A|B",
  "description": "brief description",
  "effectLabel": "effect category",
  "effectValue": number,
  "effectUnit": "%|pts|x"
}`;

      console.log('[SCAN] Importing generateText...');
      const { generateText } = await import('@rork-ai/toolkit-sdk');
      
      if (!generateText) {
        throw new Error('generateText not found in toolkit-sdk');
      }
      
      console.log('[SCAN] Calling generateText...');
      const resultText = await generateText({
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      console.log('[SCAN] AI Raw Response:', resultText);

      let result;
      try {
        const cleanedText = resultText.replace(/```json\s*|```\s*/g, '').trim();
        result = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('[SCAN] JSON Parse Error:', parseError);
        throw new Error('Failed to parse AI response as JSON');
      }

      console.log('[SCAN] AI Parsed Result:', JSON.stringify(result, null, 2));

      if (!result || typeof result !== 'object') {
        throw new Error('Invalid response from AI');
      }

      if (!result.name || !result.slot || !result.tier || !result.description) {
        throw new Error('Missing required fields in AI response');
      }

      const newItem = {
        name: String(result.name),
        slot: String(result.slot),
        tier: String(result.tier),
        description: String(result.description),
        effects: [
          {
            label: String(result.effectLabel || 'Power'),
            value: Number(result.effectValue) || 10,
            unit: String(result.effectUnit || '%'),
          },
        ],
      };

      console.log('[SCAN] Adding item:', JSON.stringify(newItem, null, 2));
      addInventoryItem(newItem);
      
      setScanModalVisible(false);
      setScanForm({ appearance: '', power: '', rarity: '' });
      
      Alert.alert('✓ Item Added', `${newItem.name} has been added to your inventory!`);
    } catch (error) {
      console.error('[SCAN] Error:', error);
      console.error('[SCAN] Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('[SCAN] Error name:', error instanceof Error ? error.name : 'No name');
      console.error('[SCAN] Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to generate item: ${errorMessage}`);
    } finally {
      setScanLoading(false);
    }
  };



  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <Package size={28} color="#08C284" />
            <Text style={styles.title}>Inventory</Text>
          </View>
          <View style={styles.headerButtons}>
            <Pressable
              onPress={handleStartScan}
              style={[styles.addButton, { backgroundColor: '#5EA7FF' }]}
            >
              <Scan size={20} color="#0A0A0A" />
            </Pressable>
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
        <Text style={styles.subtitle}>{gameState.inventoryV2.length} items equipped</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {gameState.inventoryV2.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color="#333" />
            <Text style={styles.emptyText}>No items in inventory</Text>
            <Text style={styles.emptySubtext}>Tap + to add an item</Text>
          </View>
        ) : (
          gameState.inventoryV2.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleViewItem(item)}
              style={styles.itemCard}
            >
              <View style={styles.itemHeader}>
                <View style={styles.itemTitleRow}>
                  <View style={[styles.tierBadge, { backgroundColor: getTierColor(item.tier) }]}>
                    <Text style={styles.tierText}>{item.tier}</Text>
                  </View>
                  <View style={styles.itemTitleContainer}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSlot}>{item.slot}</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <CopyButton
                    text={`${item.name} [${item.tier}] - ${item.slot}\n${item.description}\nEffects: ${item.effects.map(e => `${e.label}: +${e.value}${e.unit}`).join(', ')}`}
                    size={14}
                    color="#08C284"
                    iconOnly
                  />
                  <Pressable
                    onPress={() => handleDeleteItem(item.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={18} color="#E75757" />
                  </Pressable>
                </View>
              </View>

              <Text style={styles.itemDescription}>{item.description}</Text>

              <View style={styles.effectsContainer}>
                {item.effects.map((effect, idx) => (
                  <View key={idx} style={styles.effectBadge}>
                    <Text style={styles.effectText}>
                      {effect.label}: +{effect.value}{effect.unit}
                    </Text>
                  </View>
                ))}
              </View>
            </Pressable>
          ))
        )}
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
              <Text style={styles.modalTitle}>Add New Item</Text>
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
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Item name"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Slot *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.slot}
                  onChangeText={(text) => setFormData({ ...formData, slot: text })}
                  placeholder="e.g., Head, Arms, Aura"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tier</Text>
                <View style={styles.tierButtons}>
                  {['SSS', 'SS', 'S', 'A', 'B'].map((tier) => (
                    <Pressable
                      key={tier}
                      onPress={() => setFormData({ ...formData, tier })}
                      style={[
                        styles.tierButton,
                        formData.tier === tier && styles.tierButtonActive,
                        { borderColor: getTierColor(tier) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tierButtonText,
                          formData.tier === tier && { color: getTierColor(tier) },
                        ]}
                      >
                        {tier}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Item description"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Effect Label</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.effectLabel}
                  onChangeText={(text) => setFormData({ ...formData, effectLabel: text })}
                  placeholder="e.g., Energy Control, Aura Stability"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Effect Value</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.effectValue.toString()}
                    onChangeText={(text) => setFormData({ ...formData, effectValue: parseInt(text) || 0 })}
                    placeholder="10"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { width: 80 }]}>
                  <Text style={styles.formLabel}>Unit</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.effectUnit}
                    onChangeText={(text) => setFormData({ ...formData, effectUnit: text })}
                    placeholder="%"
                    placeholderTextColor="#666"
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
                onPress={handleAddItem}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={styles.modalButtonText}>Add Item</Text>
              </Pressable>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={detailModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            {selectedItem && (
              <>
                <View style={styles.detailHeader}>
                  <View style={[styles.tierBadge, { backgroundColor: getTierColor(selectedItem.tier) }]}>
                    <Text style={styles.tierText}>{selectedItem.tier}</Text>
                  </View>
                  <Pressable
                    onPress={() => setDetailModalVisible(false)}
                    style={styles.detailCloseButton}
                  >
                    <X size={24} color="#FFFFFF" />
                  </Pressable>
                </View>

                <Text style={styles.detailName}>{selectedItem.name}</Text>
                <Text style={styles.detailSlot}>{selectedItem.slot}</Text>
                <Text style={styles.detailDescription}>{selectedItem.description}</Text>

                <View style={styles.detailDivider} />

                <Text style={styles.detailSectionTitle}>Effects</Text>
                {selectedItem.effects.map((effect, idx) => (
                  <View key={idx} style={styles.detailEffect}>
                    <Text style={styles.detailEffectLabel}>{effect.label}</Text>
                    <Text style={styles.detailEffectValue}>
                      +{effect.value}{effect.unit}
                    </Text>
                  </View>
                ))}

                <View style={styles.modalActions}>
                  <Pressable
                    onPress={() => handleStartEdit(selectedItem)}
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                  >
                    <Edit2 size={16} color="#08C284" />
                    <Text style={[styles.modalButtonTextSecondary, { color: '#08C284' }]}>Edit</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setDetailModalVisible(false)}
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                  >
                    <Text style={styles.modalButtonText}>Close</Text>
                  </Pressable>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={scanModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          if (!scanLoading) {
            setScanModalVisible(false);
            setScanForm({ appearance: '', power: '', rarity: '' });
          }
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan Item</Text>
              <Pressable
                onPress={() => {
                  if (!scanLoading) {
                    setScanModalVisible(false);
                    setScanForm({ appearance: '', power: '', rarity: '' });
                  }
                }}
                style={styles.modalCloseButton}
                disabled={scanLoading}
              >
                <X size={24} color="#FFFFFF" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalScroll}
            >
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>What does it look like?</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={scanForm.appearance}
                  onChangeText={(text) => setScanForm({ ...scanForm, appearance: text })}
                  placeholder="Describe the item's appearance..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                  editable={!scanLoading}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>What power does it grant?</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={scanForm.power}
                  onChangeText={(text) => setScanForm({ ...scanForm, power: text })}
                  placeholder="Describe its abilities or effects..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                  editable={!scanLoading}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>How rare is it?</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={scanForm.rarity}
                  onChangeText={(text) => setScanForm({ ...scanForm, rarity: text })}
                  placeholder="Describe its rarity or power level..."
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                  editable={!scanLoading}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  console.log('[SCAN] Cancel button pressed');
                  if (!scanLoading) {
                    setScanModalVisible(false);
                    setScanForm({ appearance: '', power: '', rarity: '' });
                  }
                }}
                style={[styles.modalButton, styles.modalButtonSecondary]}
                disabled={scanLoading}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleGenerateItem}
                style={[
                  styles.modalButton,
                  styles.scanButton,
                  scanLoading && styles.modalButtonDisabled
                ]}
                disabled={scanLoading}
              >
                {scanLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator color="#0A0A0A" />
                    <Text style={styles.modalButtonText}>Generating...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalButtonText}>Generate Item</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          resetForm();
          setSelectedItem(null);
          setEditModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Item</Text>
              <Pressable
                onPress={() => {
                  resetForm();
                  setSelectedItem(null);
                  setEditModalVisible(false);
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
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="Item name"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Slot *</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.slot}
                  onChangeText={(text) => setFormData({ ...formData, slot: text })}
                  placeholder="e.g., Head, Arms, Aura"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Tier</Text>
                <View style={styles.tierButtons}>
                  {['SSS', 'SS', 'S', 'A', 'B'].map((tier) => (
                    <Pressable
                      key={tier}
                      onPress={() => setFormData({ ...formData, tier })}
                      style={[
                        styles.tierButton,
                        formData.tier === tier && styles.tierButtonActive,
                        { borderColor: getTierColor(tier) },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tierButtonText,
                          formData.tier === tier && { color: getTierColor(tier) },
                        ]}
                      >
                        {tier}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Item description"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Effect Label</Text>
                <TextInput
                  style={styles.formInput}
                  value={formData.effectLabel}
                  onChangeText={(text) => setFormData({ ...formData, effectLabel: text })}
                  placeholder="e.g., Energy Control, Aura Stability"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Effect Value</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.effectValue.toString()}
                    onChangeText={(text) => setFormData({ ...formData, effectValue: parseInt(text) || 0 })}
                    placeholder="10"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.formGroup, { width: 80 }]}>
                  <Text style={styles.formLabel}>Unit</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.effectUnit}
                    onChangeText={(text) => setFormData({ ...formData, effectUnit: text })}
                    placeholder="%"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  resetForm();
                  setSelectedItem(null);
                  setEditModalVisible(false);
                }}
                style={[styles.modalButton, styles.modalButtonSecondary]}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleEditItem}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={styles.modalButtonText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function getTierColor(tier: string): string {
  switch (tier) {
    case 'SSS':
      return '#E75757';
    case 'SS':
      return '#E7A857';
    case 'S':
      return '#08C284';
    case 'A':
      return '#5EA7FF';
    default:
      return '#666';
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
    marginBottom: 4,
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
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
  },
  itemCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tierBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tierText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
  itemTitleContainer: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  itemSlot: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    width: 32,
    height: 32,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  effectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  effectBadge: {
    backgroundColor: '#08C28420',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#08C284',
  },
  effectText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#08C284',
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
  formRow: {
    flexDirection: 'row',
    gap: 12,
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
    textAlignVertical: 'top',
  },
  tierButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  tierButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  tierButtonActive: {
    backgroundColor: '#222',
  },
  tierButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#666',
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
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
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
  modalButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.6,
  },
  scanButton: {
    backgroundColor: '#5EA7FF',
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
    borderColor: '#08C284',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailCloseButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailName: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  detailSlot: {
    fontSize: 14,
    color: '#08C284',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#222',
    marginVertical: 20,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#08C284',
    marginBottom: 12,
  },
  detailEffect: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailEffectLabel: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  detailEffectValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#08C284',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
