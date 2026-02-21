import { useGame } from '@/contexts/GameContext';
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Keyboard, TouchableWithoutFeedback, KeyboardAvoidingView, Platform } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Edit2, X, Search, Package, Medal, TowerControl, Zap, Sparkles, BookLock, ShoppingCart, Settings } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function StatusScreen() {
  const router = useRouter();
  const { gameState, isLoading, updateStat, updateArcStory, updateIdentity, updateAllStats } = useGame();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editSection, setEditSection] = useState<'identity' | 'stats' | 'state' | 'arc' | null>(null);
  const [editedData, setEditedData] = useState<any>({});

  const quickAccessPages = [
    { name: 'Scouter', icon: Search, route: '/scouter', color: '#08C284' },
    { name: 'Inventory', icon: Package, route: '/inventory', color: '#FFD700' },
    { name: 'Rankings', icon: Medal, route: '/rankings', color: '#FF6B35' },
    { name: 'Tower', icon: TowerControl, route: '/tower', color: '#9400D3' },
    { name: 'Energy', icon: Zap, route: '/energy', color: '#00D9FF' },
    { name: 'Skills', icon: Sparkles, route: '/all-skills', color: '#FF1493' },
    { name: 'Vault', icon: BookLock, route: '/vault-codex', color: '#DC143C' },
    { name: 'Store', icon: ShoppingCart, route: '/store', color: '#FFD700' },
    { name: 'Settings', icon: Settings, route: '/settings', color: '#8E8E93' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { identity, stats, currentForm, currentBPM, currentFloor } = gameState;

  const openEditModal = (section: 'identity' | 'stats' | 'state' | 'arc') => {
    if (section === 'identity') {
      setEditedData({
        inscribedName: identity.inscribedName,
        title: identity.titles[0],
        species: identity.speciesLineage[identity.speciesLineage.length - 1],
        territoryClass: identity.territory.class,
        territoryFloors: identity.territory.towerFloorsInfluence,
      });
    } else if (section === 'stats') {
      setEditedData({
        level: stats.level,
        xp: stats.xp,
        xpToNextLevel: stats.xpToNextLevel,
        rank: stats.rank,
        STR: stats.STR,
        AGI: stats.AGI,
        VIT: stats.VIT,
        INT: stats.INT,
        WIS: stats.WIS,
        CHA: stats.CHA,
        LCK: stats.LCK,
        fullCowlSync: stats.fullCowlSync,
        codexIntegrity: stats.codexIntegrity,
      });
    } else if (section === 'state') {
      setEditedData({
        fatigue: stats.fatigue,
      });
    } else if (section === 'arc') {
      setEditedData({ arc: gameState.arcStory || 'Forge of Equilibrium (Phase III Evolution)' });
    }
    setEditSection(section);
    setEditModalVisible(true);
  };

  const saveEdits = () => {
    if (editSection === 'identity') {
      updateIdentity({
        inscribedName: editedData.inscribedName,
        titles: [editedData.title, ...identity.titles.slice(1)],
        speciesLineage: [...identity.speciesLineage.slice(0, -1), editedData.species],
        territory: {
          towerFloorsInfluence: editedData.territoryFloors,
          class: editedData.territoryClass,
        },
      });
    } else if (editSection === 'stats') {
      updateAllStats({
        level: Number(editedData.level),
        xp: Number(editedData.xp),
        xpToNextLevel: Number(editedData.xpToNextLevel),
        rank: editedData.rank,
        STR: Number(editedData.STR),
        AGI: Number(editedData.AGI),
        VIT: Number(editedData.VIT),
        INT: Number(editedData.INT),
        WIS: Number(editedData.WIS),
        CHA: Number(editedData.CHA),
        LCK: Number(editedData.LCK),
        fullCowlSync: Number(editedData.fullCowlSync),
        codexIntegrity: Number(editedData.codexIntegrity),
      });
    } else if (editSection === 'state') {
      updateStat('fatigue', Number(editedData.fatigue));
    } else if (editSection === 'arc') {
      updateArcStory(editedData.arc);
    }
    setEditModalVisible(false);
    setEditSection(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Black Sun Monarch</Text>
          <Text style={styles.subtitle}>CodexOS v21.1</Text>
          <CopyButton
            text={`${identity.inscribedName} — Level ${stats.level} ${stats.rank} Rank\nXP: ${stats.xp}/${stats.xpToNextLevel}\nForm: ${currentForm} (${currentBPM} BPM)\nFloor: ${currentFloor} | Sync: ${stats.fullCowlSync}%\nSTR ${stats.STR} AGI ${stats.AGI} VIT ${stats.VIT} INT ${stats.INT} WIS ${stats.WIS} CHA ${stats.CHA} LCK ${stats.LCK}`}
            label="Copy Stats"
            color="#08C284"
            size={12}
            style={{ marginTop: 10 }}
          />
        </View>

        <View style={styles.currenciesCard}>
          <Text style={styles.cardTitle}>Currencies</Text>
          <View style={styles.currenciesGrid}>
            {gameState.currencies.map((currency) => (
              <View key={currency.name} style={styles.currencyItem}>
                <Text style={styles.currencyIcon}>{currency.icon}</Text>
                <View style={styles.currencyInfo}>
                  <Text style={styles.currencyAmount}>{currency.amount.toLocaleString()}</Text>
                  <Text style={styles.currencyName}>{currency.name}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.quickAccessCard}>
          <Text style={styles.cardTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            {quickAccessPages.map((page) => {
              const Icon = page.icon;
              return (
                <TouchableOpacity
                  key={page.route}
                  style={styles.quickAccessButton}
                  onPress={() => router.push(page.route as any)}
                >
                  <View style={[styles.quickAccessIcon, { backgroundColor: `${page.color}20` }]}>
                    <Icon size={24} color={page.color} />
                  </View>
                  <Text style={styles.quickAccessText}>{page.name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Identity</Text>
            <TouchableOpacity onPress={() => openEditModal('identity')} style={styles.editButton}>
              <Edit2 size={18} color="#08C284" />
            </TouchableOpacity>
          </View>
          <Text style={styles.nameText}>{identity.inscribedName}</Text>
          <Text style={styles.titleText}>{identity.titles[0]}</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Species:</Text>
            <Text style={styles.value}>{identity.speciesLineage[identity.speciesLineage.length - 1]}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Territory:</Text>
            <Text style={styles.value}>{identity.territory.class}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Floors:</Text>
            <Text style={styles.value}>{identity.territory.towerFloorsInfluence}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Stats</Text>
            <TouchableOpacity onPress={() => openEditModal('stats')} style={styles.editButton}>
              <Edit2 size={18} color="#08C284" />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Level:</Text>
            <Text style={styles.value}>{stats.level}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rank:</Text>
            <Text style={styles.value}>{stats.rank}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>XP:</Text>
            <Text style={styles.value}>{stats.xp} / {stats.xpToNextLevel}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(stats.xp / stats.xpToNextLevel) * 100}%` }]} />
          </View>
          <View style={styles.attributesGrid}>
            <View style={styles.attributeItem}>
              <Text style={styles.attrLabel}>STR</Text>
              <Text style={styles.attrValue}>{stats.STR}</Text>
            </View>
            <View style={styles.attributeItem}>
              <Text style={styles.attrLabel}>AGI</Text>
              <Text style={styles.attrValue}>{stats.AGI}</Text>
            </View>
            <View style={styles.attributeItem}>
              <Text style={styles.attrLabel}>VIT</Text>
              <Text style={styles.attrValue}>{stats.VIT}</Text>
            </View>
            <View style={styles.attributeItem}>
              <Text style={styles.attrLabel}>INT</Text>
              <Text style={styles.attrValue}>{stats.INT}</Text>
            </View>
            <View style={styles.attributeItem}>
              <Text style={styles.attrLabel}>WIS</Text>
              <Text style={styles.attrValue}>{stats.WIS}</Text>
            </View>
            <View style={styles.attributeItem}>
              <Text style={styles.attrLabel}>CHA</Text>
              <Text style={styles.attrValue}>{stats.CHA}</Text>
            </View>
            <View style={styles.attributeItem}>
              <Text style={styles.attrLabel}>LCK</Text>
              <Text style={styles.attrValue}>{stats.LCK}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Current State</Text>
            <TouchableOpacity onPress={() => openEditModal('state')} style={styles.editButton}>
              <Edit2 size={18} color="#08C284" />
            </TouchableOpacity>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Form:</Text>
            <Text style={styles.value}>{currentForm}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>BPM:</Text>
            <Text style={styles.value}>{currentBPM}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Floor:</Text>
            <Text style={styles.value}>{currentFloor}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Sync:</Text>
            <Text style={styles.value}>{stats.fullCowlSync}%</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fatigue:</Text>
            <Text style={styles.value}>{stats.fatigue}/100</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Arc</Text>
            <TouchableOpacity onPress={() => openEditModal('arc')} style={styles.editButton}>
              <Edit2 size={18} color="#08C284" />
            </TouchableOpacity>
          </View>
          <Text style={styles.arcText}>{gameState.arcStory || 'Forge of Equilibrium (Phase III Evolution)'}</Text>
        </View>
      </ScrollView>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1 }} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Edit {editSection === 'identity' ? 'Identity' : editSection === 'stats' ? 'Stats' : editSection === 'arc' ? 'Arc' : 'State'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {editSection === 'identity' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Name</Text>
                    <TextInput
                      style={styles.input}
                      value={editedData.inscribedName || ''}
                      onChangeText={(val) => setEditedData({ ...editedData, inscribedName: val })}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Title</Text>
                    <TextInput
                      style={styles.input}
                      value={editedData.title || ''}
                      onChangeText={(val) => setEditedData({ ...editedData, title: val })}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Species</Text>
                    <TextInput
                      style={styles.input}
                      value={editedData.species || ''}
                      onChangeText={(val) => setEditedData({ ...editedData, species: val })}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Territory Class</Text>
                    <TextInput
                      style={styles.input}
                      value={editedData.territoryClass || ''}
                      onChangeText={(val) => setEditedData({ ...editedData, territoryClass: val })}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Territory Floors</Text>
                    <TextInput
                      style={styles.input}
                      value={editedData.territoryFloors || ''}
                      onChangeText={(val) => setEditedData({ ...editedData, territoryFloors: val })}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholderTextColor="#666"
                    />
                  </View>
                </>
              )}
              {editSection === 'stats' && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Level</Text>
                    <TextInput
                      style={styles.input}
                      value={String(editedData.level || 0)}
                      onChangeText={(val) => setEditedData({ ...editedData, level: val })}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Rank</Text>
                    <TextInput
                      style={styles.input}
                      value={editedData.rank || ''}
                      onChangeText={(val) => setEditedData({ ...editedData, rank: val })}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholderTextColor="#666"
                      placeholder="F, E, D, C, B, A, S, SS, SSS, Sovereign"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>XP</Text>
                    <TextInput
                      style={styles.input}
                      value={String(editedData.xp || 0)}
                      onChangeText={(val) => setEditedData({ ...editedData, xp: val })}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>XP To Next Level</Text>
                    <TextInput
                      style={styles.input}
                      value={String(editedData.xpToNextLevel || 0)}
                      onChangeText={(val) => setEditedData({ ...editedData, xpToNextLevel: val })}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholderTextColor="#666"
                    />
                  </View>
                  {['STR', 'AGI', 'VIT', 'INT', 'WIS', 'CHA', 'LCK'].map((stat) => (
                    <View key={stat} style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{stat}</Text>
                      <TextInput
                        style={styles.input}
                        value={String(editedData[stat] || 0)}
                        onChangeText={(val) => setEditedData({ ...editedData, [stat]: val })}
                        keyboardType="numeric"
                        returnKeyType="done"
                        onSubmitEditing={Keyboard.dismiss}
                        placeholderTextColor="#666"
                      />
                    </View>
                  ))}
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Cowl Sync</Text>
                    <TextInput
                      style={styles.input}
                      value={String(editedData.fullCowlSync || 0)}
                      onChangeText={(val) => setEditedData({ ...editedData, fullCowlSync: val })}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholderTextColor="#666"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Codex Integrity</Text>
                    <TextInput
                      style={styles.input}
                      value={String(editedData.codexIntegrity || 0)}
                      onChangeText={(val) => setEditedData({ ...editedData, codexIntegrity: val })}
                      keyboardType="numeric"
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                      placeholderTextColor="#666"
                    />
                  </View>
                </>
              )}
              {editSection === 'state' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Fatigue</Text>
                  <TextInput
                    style={styles.input}
                    value={String(editedData.fatigue || 0)}
                    onChangeText={(val) => setEditedData({ ...editedData, fatigue: val })}
                    keyboardType="numeric"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    placeholderTextColor="#666"
                  />
                </View>
              )}
              {editSection === 'arc' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Arc Story</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={editedData.arc || ''}
                    onChangeText={(val) => setEditedData({ ...editedData, arc: val })}
                    multiline
                    numberOfLines={4}
                    placeholderTextColor="#666"
                  />
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={saveEdits}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#08C284',
    fontSize: 18,
    fontWeight: '600',
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#08C284',
    marginBottom: 12,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 14,
    color: '#08C284',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#888',
  },
  value: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#08C284',
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  attributeItem: {
    width: '22%',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  attrLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  attrValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  arcText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButton: {
    padding: 4,
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
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#08C284',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#08C284',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#08C284',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#08C284',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  quickAccessCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickAccessButton: {
    width: '30%',
    alignItems: 'center',
    gap: 8,
  },
  quickAccessIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#CCC',
    textAlign: 'center',
  },
  currenciesCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  currenciesGrid: {
    gap: 12,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  currencyIcon: {
    fontSize: 28,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#FFD700',
    marginBottom: 2,
  },
  currencyName: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600' as const,
  },
});
