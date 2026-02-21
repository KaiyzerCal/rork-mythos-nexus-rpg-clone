import { useGame } from '@/contexts/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { ShoppingCart, Sparkles, Lock, Check, Edit2, Plus, Trash2, GripVertical, X, Save } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, TextInput, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  category: 'consumable' | 'material' | 'upgrade' | 'artifact';
  effect?: string;
  requirements?: {
    level?: number;
    rank?: string;
  };
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'lacrima-pack',
    name: 'Lacrima Crystal Pack',
    description: '5× Lacrima Crystals for energy restoration',
    price: 250,
    currency: 'Codex Points',
    rarity: 'rare',
    category: 'consumable',
    effect: 'Restore 50 energy to all systems',
  },
  {
    id: 'chaos-shard',
    name: 'Chaos Emerald Shard',
    description: 'Pure chaos energy fragment',
    price: 500,
    currency: 'Soul Essence',
    rarity: 'legendary',
    category: 'material',
    effect: 'Used for Dragon Gate unlocks',
  },
  {
    id: 'stat-boost',
    name: 'Spartan Enhancement Serum',
    description: 'Permanently increases all stats by +5',
    price: 1000,
    currency: 'Codex Points',
    rarity: 'epic',
    category: 'upgrade',
    requirements: { level: 50 },
  },
  {
    id: 'oken-fragment',
    name: 'Oken Core Fragment',
    description: 'Divine creation essence',
    price: 5,
    currency: 'Black Sun Tokens',
    rarity: 'mythic',
    category: 'artifact',
    effect: 'Required for Regalia ignitions',
    requirements: { level: 70, rank: 'S' },
  },
  {
    id: 'xp-boost',
    name: 'XP Multiplier (24h)',
    description: '×2 XP gain for 24 hours',
    price: 500,
    currency: 'Codex Points',
    rarity: 'rare',
    category: 'consumable',
  },
  {
    id: 'fatigue-reset',
    name: 'Full Restoration Elixir',
    description: 'Reset fatigue to 0',
    price: 300,
    currency: 'Codex Points',
    rarity: 'rare',
    category: 'consumable',
  },
];

export default function StoreScreen() {
  const { gameState, saveStoreItems } = useGame();
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editMode, setEditMode] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StoreItem | null>(null);
  const [storeItems, setStoreItems] = useState<StoreItem[]>(gameState.storeItems || STORE_ITEMS);

  React.useEffect(() => {
    if (gameState.storeItems) {
      setStoreItems(gameState.storeItems);
    }
  }, [gameState.storeItems]);

  const categories = ['all', 'consumable', 'material', 'upgrade', 'artifact'];

  const filteredItems = selectedCategory === 'all'
    ? storeItems
    : storeItems.filter((item) => item.category === selectedCategory);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'mythic': return '#FFD700';
      case 'legendary': return '#FF8C00';
      case 'epic': return '#9400D3';
      case 'rare': return '#4169E1';
      default: return '#808080';
    }
  };

  const canAfford = (item: StoreItem) => {
    const currency = gameState.currencies.find((c) => c.name === item.currency);
    return currency ? currency.amount >= item.price : false;
  };

  const meetsRequirements = (item: StoreItem) => {
    if (!item.requirements) return true;
    if (item.requirements.level && gameState.stats.level < item.requirements.level) return false;
    if (item.requirements.rank) {
      const rankOrder = ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'Sovereign'];
      const playerRankIndex = rankOrder.indexOf(gameState.stats.rank);
      const requiredRankIndex = rankOrder.indexOf(item.requirements.rank);
      if (playerRankIndex < requiredRankIndex) return false;
    }
    return true;
  };

  const handlePurchase = (item: StoreItem) => {
    if (!canAfford(item)) {
      Alert.alert('Insufficient Funds', `You need ${item.price} ${item.currency}`);
      return;
    }
    if (!meetsRequirements(item)) {
      Alert.alert('Requirements Not Met', 'You do not meet the requirements for this item');
      return;
    }
    Alert.alert('Purchase Confirmed', `You purchased ${item.name}`);
  };

  const handleAddItem = () => {
    const newItem: StoreItem = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: 0,
      currency: 'Codex Points',
      rarity: 'common',
      category: 'consumable',
    };
    setEditingItem(newItem);
    setShowModal(true);
  };

  const handleEditItem = (item: StoreItem) => {
    setEditingItem({ ...item });
    setShowModal(true);
  };

  const handleSaveItem = () => {
    if (!editingItem || !editingItem.name.trim()) {
      Alert.alert('Error', 'Item name is required');
      return;
    }

    const existingIndex = storeItems.findIndex(i => i.id === editingItem.id);
    let updatedItems: StoreItem[];
    
    if (existingIndex >= 0) {
      updatedItems = storeItems.map(i => i.id === editingItem.id ? editingItem : i);
    } else {
      updatedItems = [...storeItems, editingItem];
    }

    setStoreItems(updatedItems);
    saveStoreItems?.(updatedItems);
    setShowModal(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedItems = storeItems.filter(i => i.id !== itemId);
            setStoreItems(updatedItems);
            saveStoreItems?.(updatedItems);
          },
        },
      ]
    );
  };

  const moveItem = (itemId: string, direction: 'up' | 'down') => {
    const currentList = selectedCategory === 'all' ? storeItems : storeItems.filter(i => i.category === selectedCategory);
    const itemIndex = currentList.findIndex(i => i.id === itemId);
    if (itemIndex === -1) return;

    if (direction === 'up' && itemIndex === 0) return;
    if (direction === 'down' && itemIndex === currentList.length - 1) return;

    const globalIndex = storeItems.findIndex(i => i.id === itemId);
    const targetItem = currentList[direction === 'up' ? itemIndex - 1 : itemIndex + 1];
    const targetGlobalIndex = storeItems.findIndex(i => i.id === targetItem.id);

    const updatedItems = [...storeItems];
    [updatedItems[globalIndex], updatedItems[targetGlobalIndex]] = [updatedItems[targetGlobalIndex], updatedItems[globalIndex]];
    
    setStoreItems(updatedItems);
    saveStoreItems?.(updatedItems);
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
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <ShoppingCart size={32} color="#FFD700" />
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditMode(!editMode)}
            >
              <Edit2 size={20} color={editMode ? '#FFD700' : '#999'} />
              <Text style={[styles.editButtonText, editMode && styles.editButtonTextActive]}>
                {editMode ? 'DONE' : 'EDIT'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.title}>CODEX STORE</Text>
          <Text style={styles.subtitle}>Empower your ascension</Text>
        </View>

        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesRow}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category && styles.categoryTextActive,
                    ]}
                  >
                    {category.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {editMode && (
          <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
            <Plus size={20} color="#000" />
            <Text style={styles.addButtonText}>ADD NEW ITEM</Text>
          </TouchableOpacity>
        )}

        <View style={styles.itemsContainer}>
          {filteredItems.map((item, index) => {
            const affordable = canAfford(item);
            const meetsReqs = meetsRequirements(item);
            const rarityColor = getRarityColor(item.rarity);
            const isFirst = index === 0;
            const isLast = index === filteredItems.length - 1;

            return (
              <View key={item.id} style={[styles.storeCard, { borderColor: rarityColor }]}>
                {editMode && (
                  <View style={styles.editControls}>
                    <View style={styles.reorderButtons}>
                      <TouchableOpacity
                        style={[styles.editControlButton, styles.moveButton]}
                        onPress={() => moveItem(item.id, 'up')}
                        disabled={isFirst}
                      >
                        <GripVertical size={14} color={isFirst ? '#333' : '#FFD700'} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editControlButton, styles.moveButton]}
                        onPress={() => moveItem(item.id, 'down')}
                        disabled={isLast}
                      >
                        <GripVertical size={14} color={isLast ? '#333' : '#FFD700'} style={{ transform: [{ rotate: '180deg' }] }} />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={styles.editControlButton}
                      onPress={() => handleEditItem(item)}
                    >
                      <Edit2 size={18} color="#4169E1" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.editControlButton}
                      onPress={() => handleDeleteItem(item.id)}
                    >
                      <Trash2 size={18} color="#FF6347" />
                    </TouchableOpacity>
                  </View>
                )}
                <LinearGradient
                  colors={[`${rarityColor}15`, `${rarityColor}05`]}
                  style={styles.storeGradient}
                >
                  <View style={styles.storeHeader}>
                    <View style={[styles.storeIcon, { backgroundColor: `${rarityColor}30` }]}>
                      <Sparkles size={28} color={rarityColor} />
                    </View>
                    <View style={styles.storeInfo}>
                      <Text style={[styles.storeName, { color: rarityColor }]}>{item.name}</Text>
                      <Text style={styles.storeRarity}>{item.rarity.toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={styles.storeDescription}>{item.description}</Text>

                  {item.effect && (
                    <View style={styles.storeEffect}>
                      <Text style={styles.effectLabel}>EFFECT:</Text>
                      <Text style={styles.effectText}>{item.effect}</Text>
                    </View>
                  )}

                  {item.requirements && (
                    <View style={styles.requirements}>
                      <Text style={styles.requirementsLabel}>REQUIREMENTS:</Text>
                      {item.requirements.level && (
                        <Text style={styles.requirementText}>
                          Level {item.requirements.level}
                          {gameState.stats.level >= item.requirements.level ? ' ✓' : ''}
                        </Text>
                      )}
                      {item.requirements.rank && (
                        <Text style={styles.requirementText}>
                          Rank {item.requirements.rank}
                          {meetsReqs ? ' ✓' : ''}
                        </Text>
                      )}
                    </View>
                  )}

                  <View style={styles.storeFooter}>
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceAmount}>{item.price}</Text>
                      <Text style={styles.priceCurrency}>{item.currency}</Text>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.purchaseButton,
                        (!affordable || !meetsReqs) && styles.purchaseButtonDisabled,
                      ]}
                      onPress={() => handlePurchase(item)}
                      disabled={!affordable || !meetsReqs}
                    >
                      {!meetsReqs ? (
                        <Lock size={16} color="#666" />
                      ) : affordable ? (
                        <>
                          <Check size={16} color="#000" />
                          <Text style={styles.purchaseText}>PURCHASE</Text>
                        </>
                      ) : (
                        <>
                          <Lock size={16} color="#666" />
                          <Text style={styles.purchaseTextDisabled}>INSUFFICIENT</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem?.name ? 'Edit Item' : 'New Item'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={24} color="#999" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.input}
                value={editingItem?.name || ''}
                onChangeText={(text) => setEditingItem(prev => prev ? { ...prev, name: text } : null)}
                placeholder="Item name"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingItem?.description || ''}
                onChangeText={(text) => setEditingItem(prev => prev ? { ...prev, description: text } : null)}
                placeholder="Item description"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.inputLabel}>Price</Text>
              <TextInput
                style={styles.input}
                value={editingItem?.price.toString() || '0'}
                onChangeText={(text) => setEditingItem(prev => prev ? { ...prev, price: parseInt(text) || 0 } : null)}
                placeholder="Price"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Currency</Text>
              <TextInput
                style={styles.input}
                value={editingItem?.currency || ''}
                onChangeText={(text) => setEditingItem(prev => prev ? { ...prev, currency: text } : null)}
                placeholder="Currency type"
                placeholderTextColor="#666"
              />

              <Text style={styles.inputLabel}>Rarity</Text>
              <View style={styles.rarityButtons}>
                {(['common', 'rare', 'epic', 'legendary', 'mythic'] as const).map((rarity) => (
                  <TouchableOpacity
                    key={rarity}
                    style={[
                      styles.rarityButton,
                      editingItem?.rarity === rarity && styles.rarityButtonActive,
                    ]}
                    onPress={() => setEditingItem(prev => prev ? { ...prev, rarity } : null)}
                  >
                    <Text style={[
                      styles.rarityButtonText,
                      editingItem?.rarity === rarity && styles.rarityButtonTextActive,
                    ]}>
                      {rarity.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryButtonsModal}>
                {(['consumable', 'material', 'upgrade', 'artifact'] as const).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButtonModal,
                      editingItem?.category === category && styles.categoryButtonModalActive,
                    ]}
                    onPress={() => setEditingItem(prev => prev ? { ...prev, category } : null)}
                  >
                    <Text style={[
                      styles.categoryButtonModalText,
                      editingItem?.category === category && styles.categoryButtonModalTextActive,
                    ]}>
                      {category.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Effect (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editingItem?.effect || ''}
                onChangeText={(text) => setEditingItem(prev => prev ? { ...prev, effect: text } : null)}
                placeholder="Item effect"
                placeholderTextColor="#666"
                multiline
                numberOfLines={2}
              />

              <Text style={styles.inputLabel}>Requirements (Optional)</Text>
              <TextInput
                style={styles.input}
                value={editingItem?.requirements?.level?.toString() || ''}
                onChangeText={(text) => setEditingItem(prev => prev ? {
                  ...prev,
                  requirements: { ...prev.requirements, level: parseInt(text) || undefined }
                } : null)}
                placeholder="Required level"
                placeholderTextColor="#666"
                keyboardType="numeric"
              />
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveItem}>
              <Save size={20} color="#000" />
              <Text style={styles.saveButtonText}>SAVE ITEM</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  itemsContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  storeCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 2,
  },
  storeGradient: {
    padding: 16,
    borderRadius: 16,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  storeIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 17,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  storeRarity: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 1,
  },
  storeDescription: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#AAA',
    lineHeight: 18,
    marginBottom: 12,
  },
  storeEffect: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    gap: 4,
    marginBottom: 12,
  },
  effectLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFD700',
    letterSpacing: 1,
  },
  effectText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#CCC',
    lineHeight: 16,
  },
  requirements: {
    backgroundColor: 'rgba(255, 100, 100, 0.1)',
    padding: 12,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  requirementsLabel: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FF6347',
    letterSpacing: 1,
  },
  requirementText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#CCC',
  },
  storeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: '900' as const,
    color: '#FFD700',
  },
  priceCurrency: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#999',
  },
  purchaseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  purchaseButtonDisabled: {
    backgroundColor: '#333',
  },
  purchaseText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#000',
    letterSpacing: 1,
  },
  purchaseTextDisabled: {
    fontSize: 11,
    fontWeight: '800' as const,
    color: '#666',
    letterSpacing: 1,
  },
  headerTop: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  editButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#999',
    letterSpacing: 1,
  },
  editButtonTextActive: {
    color: '#FFD700',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#000',
    letterSpacing: 1,
  },
  editControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10,
  },
  editControlButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  reorderButtons: {
    flexDirection: 'column',
    gap: 4,
  },
  moveButton: {
    width: 28,
    height: 28,
    padding: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900' as const,
    color: '#FFD700',
    letterSpacing: 1,
  },
  modalScroll: {
    maxHeight: '70%',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#999',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFF',
    fontWeight: '600' as const,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  rarityButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  rarityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  rarityButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  rarityButtonText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 1,
  },
  rarityButtonTextActive: {
    color: '#FFD700',
  },
  categoryButtonsModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryButtonModal: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryButtonModalActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderColor: '#FFD700',
  },
  categoryButtonModalText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 1,
  },
  categoryButtonModalTextActive: {
    color: '#FFD700',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFD700',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#000',
    letterSpacing: 1,
  },
});
