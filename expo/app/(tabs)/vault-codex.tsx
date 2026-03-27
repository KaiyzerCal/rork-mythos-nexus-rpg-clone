import { useGame } from '@/contexts/GameContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Plus, Lock, Calendar, AlertCircle, Edit2, Trash2, Image as ImageIcon, FileText, Upload, X } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, TextInput, Alert, Modal, Image, Platform } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import type { VaultEntry } from '@/types/rpg';

interface AttachmentPreview {
  uri: string;
  name: string;
  type: 'image' | 'file';
  mimeType?: string;
}

export default function VaultCodexScreen() {
  const { gameState, addVaultEntry, updateVaultEntry, deleteVaultEntry } = useGame();
  const insets = useSafeAreaInsets();
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<VaultEntry | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewingEntry, setViewingEntry] = useState<VaultEntry | null>(null);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [newEntry, setNewEntry] = useState<{
    title: string;
    content: string;
    category: VaultEntry['category'];
    importance: VaultEntry['importance'];
  }>({
    title: '',
    content: '',
    category: 'personal',
    importance: 'medium',
  });

  const categories: Array<{ value: string; label: string }> = [
    { value: 'all', label: 'ALL' },
    { value: 'legal', label: 'LEGAL' },
    { value: 'business', label: 'BUSINESS' },
    { value: 'personal', label: 'PERSONAL' },
    { value: 'evidence', label: 'EVIDENCE' },
    { value: 'achievement', label: 'ACHIEVEMENT' },
  ];

  const importanceLevels: Array<{ value: VaultEntry['importance']; label: string }> = [
    { value: 'low', label: 'LOW' },
    { value: 'medium', label: 'MEDIUM' },
    { value: 'high', label: 'HIGH' },
    { value: 'critical', label: 'CRITICAL' },
  ];

  const pickImage = useCallback(async () => {
    try {
      console.log('[VAULT] Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets) {
        const newAttachments: AttachmentPreview[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `image_${Date.now()}`,
          type: 'image' as const,
          mimeType: asset.mimeType || 'image/jpeg',
        }));
        setAttachments((prev) => [...prev, ...newAttachments]);
        console.log(`[VAULT] Added ${newAttachments.length} images`);
      }
    } catch (error) {
      console.error('[VAULT] Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, []);

  const pickDocument = useCallback(async () => {
    try {
      console.log('[VAULT] Launching document picker...');
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments: AttachmentPreview[] = result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.name || `file_${Date.now()}`,
          type: 'file' as const,
          mimeType: asset.mimeType || 'application/octet-stream',
        }));
        setAttachments((prev) => [...prev, ...newAttachments]);
        console.log(`[VAULT] Added ${newAttachments.length} files`);
      }
    } catch (error) {
      console.error('[VAULT] Document picker error:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Needed', 'Camera permission is required to take photos.');
        return;
      }

      console.log('[VAULT] Launching camera...');
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        setAttachments((prev) => [
          ...prev,
          {
            uri: asset.uri,
            name: asset.fileName || `photo_${Date.now()}`,
            type: 'image' as const,
            mimeType: asset.mimeType || 'image/jpeg',
          },
        ]);
        console.log('[VAULT] Added camera photo');
      }
    } catch (error) {
      console.error('[VAULT] Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleCreateEntry = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) {
      Alert.alert('Missing Information', 'Please enter both a title and content');
      return;
    }

    const attachmentUris = attachments.length > 0 ? attachments.map((a) => a.uri) : undefined;

    if (editingEntry) {
      updateVaultEntry(editingEntry.id, {
        title: newEntry.title,
        content: newEntry.content,
        category: newEntry.category,
        importance: newEntry.importance,
        attachments: attachmentUris || editingEntry.attachments,
      });
      setEditingEntry(null);
      Alert.alert('Vault Entry Updated', 'Data updated successfully');
    } else {
      addVaultEntry(newEntry.title, newEntry.content, newEntry.category, newEntry.importance, attachmentUris);
      Alert.alert('Vault Entry Created', 'Important data secured');
    }
    setNewEntry({ title: '', content: '', category: 'personal', importance: 'medium' });
    setAttachments([]);
    setIsCreating(false);
  };

  const filteredEntries = selectedCategory === 'all'
    ? gameState.vaultEntries
    : gameState.vaultEntries.filter((e) => e.category === selectedCategory);

  const getCategoryColor = (category: VaultEntry['category']) => {
    switch (category) {
      case 'legal': return '#DC143C';
      case 'business': return '#FFD700';
      case 'personal': return '#4169E1';
      case 'evidence': return '#FF4500';
      case 'achievement': return '#32CD32';
      default: return '#999';
    }
  };

  const getImportanceColor = (importance: VaultEntry['importance']) => {
    switch (importance) {
      case 'critical': return '#FF0000';
      case 'high': return '#FF6347';
      case 'medium': return '#FFA500';
      default: return '#999';
    }
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
          <Shield size={32} color="#DC143C" />
          <Text style={styles.title}>VAULT CODEX</Text>
          <Text style={styles.subtitle}>Secure important data</Text>
        </View>

        <TouchableOpacity
          style={styles.createButton}
          onPress={() => {
            if (isCreating || editingEntry) {
              setIsCreating(false);
              setEditingEntry(null);
              setNewEntry({ title: '', content: '', category: 'personal', importance: 'medium' });
              setAttachments([]);
            } else {
              setIsCreating(true);
            }
          }}
        >
          <LinearGradient
            colors={['rgba(220, 20, 60, 0.3)', 'rgba(220, 20, 60, 0.1)']}
            style={styles.createGradient}
          >
            <Plus size={20} color="#DC143C" />
            <Text style={styles.createText}>
              {isCreating || editingEntry ? 'CANCEL' : 'NEW ENTRY'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {(isCreating || editingEntry) && (
          <View style={styles.createForm}>
            <LinearGradient
              colors={['rgba(220, 20, 60, 0.15)', 'rgba(220, 20, 60, 0.05)']}
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
                placeholder="Secure information... (no character limit)"
                placeholderTextColor="#666"
                multiline
                scrollEnabled
                textAlignVertical="top"
              />

              <Text style={styles.formLabel}>Attachments</Text>
              <View style={styles.uploadSection}>
                <View style={styles.uploadButtons}>
                  <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                    <ImageIcon size={18} color="#DC143C" />
                    <Text style={styles.uploadButtonText}>Gallery</Text>
                  </TouchableOpacity>
                  {Platform.OS !== 'web' && (
                    <TouchableOpacity style={styles.uploadButton} onPress={takePhoto}>
                      <Upload size={18} color="#DC143C" />
                      <Text style={styles.uploadButtonText}>Camera</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.uploadButton} onPress={pickDocument}>
                    <FileText size={18} color="#DC143C" />
                    <Text style={styles.uploadButtonText}>File</Text>
                  </TouchableOpacity>
                </View>

                {attachments.length > 0 && (
                  <View style={styles.attachmentsList}>
                    {attachments.map((att, idx) => (
                      <View key={`att-${idx}-${att.name}`} style={styles.attachmentItem}>
                        {att.type === 'image' ? (
                          <Image source={{ uri: att.uri }} style={styles.attachmentThumb} />
                        ) : (
                          <View style={styles.fileThumb}>
                            <FileText size={20} color="#DC143C" />
                          </View>
                        )}
                        <Text style={styles.attachmentName} numberOfLines={1}>
                          {att.name}
                        </Text>
                        <TouchableOpacity
                          style={styles.removeAttachment}
                          onPress={() => removeAttachment(idx)}
                        >
                          <X size={14} color="#FF453A" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <Text style={styles.formLabel}>Category</Text>
              <View style={styles.selectRow}>
                {categories.slice(1).map((cat) => (
                  <TouchableOpacity
                    key={cat.value}
                    style={[
                      styles.selectButton,
                      newEntry.category === cat.value && styles.selectButtonActive,
                    ]}
                    onPress={() => setNewEntry({ ...newEntry, category: cat.value as VaultEntry['category'] })}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        newEntry.category === cat.value && styles.selectTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Importance</Text>
              <View style={styles.selectRow}>
                {importanceLevels.map((imp) => (
                  <TouchableOpacity
                    key={imp.value}
                    style={[
                      styles.selectButton,
                      newEntry.importance === imp.value && styles.selectButtonActive,
                    ]}
                    onPress={() => setNewEntry({ ...newEntry, importance: imp.value })}
                  >
                    <Text
                      style={[
                        styles.selectText,
                        newEntry.importance === imp.value && styles.selectTextActive,
                      ]}
                    >
                      {imp.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleCreateEntry}>
                <Text style={styles.submitText}>{editingEntry ? 'UPDATE ENTRY' : 'SECURE ENTRY'}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        <View style={styles.categoriesContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.categoriesRow}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.value}
                  style={[
                    styles.categoryButton,
                    selectedCategory === category.value && styles.categoryButtonActive,
                  ]}
                  onPress={() => setSelectedCategory(category.value)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      selectedCategory === category.value && styles.categoryTextActive,
                    ]}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.entriesContainer}>
          <Text style={styles.sectionTitle}>
            VAULT ENTRIES ({filteredEntries.length})
          </Text>
          {filteredEntries.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Lock size={48} color="#666" />
              <Text style={styles.emptyText}>No vault entries</Text>
              <Text style={styles.emptySubtext}>Secure important information</Text>
            </View>
          ) : (
            filteredEntries.map((entry) => {
              const categoryColor = getCategoryColor(entry.category);
              const importanceColor = getImportanceColor(entry.importance);
              const hasAttachments = entry.attachments && entry.attachments.length > 0;

              return (
                <TouchableOpacity 
                  key={entry.id} 
                  style={[styles.vaultCard, { borderLeftColor: categoryColor }]}
                  onPress={() => setViewingEntry(entry)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={[`${categoryColor}10`, `${categoryColor}05`]}
                    style={styles.vaultGradient}
                  >
                    <View style={styles.vaultHeader}>
                      <View style={[styles.vaultIcon, { backgroundColor: `${categoryColor}30` }]}>
                        <Shield size={20} color={categoryColor} />
                      </View>
                      <View style={styles.vaultInfo}>
                        <Text style={[styles.vaultTitle, { color: categoryColor }]}>{entry.title}</Text>
                        <View style={styles.vaultMeta}>
                          <Calendar size={12} color="#999" />
                          <Text style={styles.vaultDate}>{formatDate(entry.timestamp)}</Text>
                          {hasAttachments && (
                            <View style={styles.attachmentBadge}>
                              <ImageIcon size={10} color="#DC143C" />
                              <Text style={styles.attachmentBadgeText}>{entry.attachments!.length}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.vaultBadges}>
                      <View style={[styles.badge, { backgroundColor: `${categoryColor}20` }]}>
                        <Text style={[styles.badgeText, { color: categoryColor }]}>
                          {entry.category.toUpperCase()}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: `${importanceColor}20` }]}>
                        <AlertCircle size={10} color={importanceColor} />
                        <Text style={[styles.badgeText, { color: importanceColor }]}>
                          {entry.importance.toUpperCase()}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.vaultContent} numberOfLines={3}>
                      {entry.content}
                    </Text>

                    {hasAttachments && (
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.entryAttachmentsRow}>
                        {entry.attachments!.map((uri, aIdx) => (
                          <Image
                            key={`${entry.id}-att-${aIdx}`}
                            source={{ uri }}
                            style={styles.entryAttachmentThumb}
                          />
                        ))}
                      </ScrollView>
                    )}

                    <View style={styles.vaultActions}>
                      <CopyButton
                        text={`${entry.title}\n[${entry.category.toUpperCase()}] [${entry.importance.toUpperCase()}]\n${entry.content}`}
                        size={14}
                        color={categoryColor}
                        iconOnly
                        style={{ marginRight: 4 }}
                      />
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: `${categoryColor}20` }]}
                        onPress={() => {
                          setEditingEntry(entry);
                          setNewEntry({
                            title: entry.title,
                            content: entry.content,
                            category: entry.category,
                            importance: entry.importance,
                          });
                          setAttachments(
                            (entry.attachments || []).map((uri, i) => ({
                              uri,
                              name: `attachment_${i + 1}`,
                              type: 'image' as const,
                            }))
                          );
                          setIsCreating(true);
                        }}
                      >
                        <Edit2 size={16} color={categoryColor} />
                        <Text style={[styles.actionText, { color: categoryColor }]}>EDIT</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: 'rgba(255, 69, 58, 0.2)' }]}
                        onPress={() => {
                          Alert.alert(
                            'Delete Entry',
                            'Are you sure you want to delete this vault entry? This action cannot be undone.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => deleteVaultEntry(entry.id),
                              },
                            ]
                          );
                        }}
                      >
                        <Trash2 size={16} color="#FF453A" />
                        <Text style={[styles.actionText, { color: '#FF453A' }]}>DELETE</Text>
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={viewingEntry !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setViewingEntry(null)}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#0A0A0A', '#1A0A0A', '#0A0A0A']}
            style={StyleSheet.absoluteFill}
          />
          
          <View style={[styles.modalHeader, { paddingTop: insets.top + 20 }]}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setViewingEntry(null)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {viewingEntry && (
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}
              showsVerticalScrollIndicator={false}
            >
              <View style={[styles.modalIconContainer, { backgroundColor: `${getCategoryColor(viewingEntry.category)}30` }]}>
                <Shield size={32} color={getCategoryColor(viewingEntry.category)} />
              </View>

              <Text style={[styles.modalTitle, { color: getCategoryColor(viewingEntry.category) }]}>
                {viewingEntry.title}
              </Text>

              <View style={styles.modalMeta}>
                <View style={styles.modalMetaRow}>
                  <Calendar size={14} color="#999" />
                  <Text style={styles.modalMetaText}>{formatDate(viewingEntry.timestamp)}</Text>
                </View>
              </View>

              <View style={styles.modalBadges}>
                <View style={[styles.modalBadge, { backgroundColor: `${getCategoryColor(viewingEntry.category)}20` }]}>
                  <Text style={[styles.modalBadgeText, { color: getCategoryColor(viewingEntry.category) }]}>
                    {viewingEntry.category.toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.modalBadge, { backgroundColor: `${getImportanceColor(viewingEntry.importance)}20` }]}>
                  <AlertCircle size={12} color={getImportanceColor(viewingEntry.importance)} />
                  <Text style={[styles.modalBadgeText, { color: getImportanceColor(viewingEntry.importance) }]}>
                    {viewingEntry.importance.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.modalContentContainer}>
                <Text style={styles.modalContentLabel}>CONTENT</Text>
                <Text style={styles.modalContentText}>{viewingEntry.content}</Text>
              </View>

              {viewingEntry.attachments && viewingEntry.attachments.length > 0 && (
                <View style={styles.modalAttachments}>
                  <Text style={styles.modalContentLabel}>ATTACHMENTS ({viewingEntry.attachments.length})</Text>
                  {viewingEntry.attachments.map((uri, idx) => (
                    <Image
                      key={`modal-att-${idx}`}
                      source={{ uri }}
                      style={styles.modalAttachmentImage}
                      resizeMode="contain"
                    />
                  ))}
                </View>
              )}

              <CopyButton
                text={`${viewingEntry.title}\n[${viewingEntry.category.toUpperCase()}] [${viewingEntry.importance.toUpperCase()}]\n\n${viewingEntry.content}`}
                label="Copy Entry"
                color={getCategoryColor(viewingEntry.category)}
                style={{ marginBottom: 16 }}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: `${getCategoryColor(viewingEntry.category)}20`, borderColor: getCategoryColor(viewingEntry.category) }]}
                  onPress={() => {
                    setEditingEntry(viewingEntry);
                    setNewEntry({
                      title: viewingEntry.title,
                      content: viewingEntry.content,
                      category: viewingEntry.category,
                      importance: viewingEntry.importance,
                    });
                    setAttachments(
                      (viewingEntry.attachments || []).map((uri, i) => ({
                        uri,
                        name: `attachment_${i + 1}`,
                        type: 'image' as const,
                      }))
                    );
                    setIsCreating(true);
                    setViewingEntry(null);
                  }}
                >
                  <Edit2 size={18} color={getCategoryColor(viewingEntry.category)} />
                  <Text style={[styles.modalActionText, { color: getCategoryColor(viewingEntry.category) }]}>EDIT</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalActionButton, { backgroundColor: 'rgba(255, 69, 58, 0.2)', borderColor: '#FF453A' }]}
                  onPress={() => {
                    setViewingEntry(null);
                    Alert.alert(
                      'Delete Entry',
                      'Are you sure you want to delete this vault entry? This action cannot be undone.',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => deleteVaultEntry(viewingEntry.id),
                        },
                      ]
                    );
                  }}
                >
                  <Trash2 size={18} color="#FF453A" />
                  <Text style={[styles.modalActionText, { color: '#FF453A' }]}>DELETE</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
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
    color: '#DC143C',
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
    borderColor: '#DC143C',
    borderRadius: 12,
  },
  createText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#DC143C',
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
    borderColor: '#DC143C',
    borderRadius: 16,
    gap: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#DC143C',
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
    minHeight: 150,
    maxHeight: 400,
    textAlignVertical: 'top',
  },
  uploadSection: {
    gap: 12,
  },
  uploadButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(220, 20, 60, 0.4)',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#DC143C',
    letterSpacing: 0.5,
  },
  attachmentsList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  attachmentThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#222',
  },
  fileThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: 'rgba(220, 20, 60, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#CCC',
  },
  removeAttachment: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  selectButtonActive: {
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    borderColor: '#DC143C',
  },
  selectText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 0.5,
  },
  selectTextActive: {
    color: '#DC143C',
  },
  submitButton: {
    backgroundColor: '#DC143C',
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
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    borderColor: '#DC143C',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 1,
  },
  categoryTextActive: {
    color: '#DC143C',
  },
  entriesContainer: {
    gap: 16,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#DC143C',
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
  vaultCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderLeftWidth: 4,
  },
  vaultGradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 16,
  },
  vaultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  vaultIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultInfo: {
    flex: 1,
  },
  vaultTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    marginBottom: 4,
  },
  vaultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vaultDate: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#999',
  },
  attachmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 6,
    backgroundColor: 'rgba(220, 20, 60, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  attachmentBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#DC143C',
  },
  vaultBadges: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  vaultContent: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: '#AAA',
    lineHeight: 20,
    marginBottom: 12,
  },
  entryAttachmentsRow: {
    marginBottom: 12,
  },
  entryAttachmentThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    marginRight: 8,
    backgroundColor: '#222',
  },
  vaultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#DC143C',
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#DC143C',
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '900' as const,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
  },
  modalMeta: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalMetaText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#999',
  },
  modalBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  modalContentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalContentLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#DC143C',
    letterSpacing: 1,
    marginBottom: 12,
  },
  modalContentText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: '#CCC',
    lineHeight: 24,
  },
  modalAttachments: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
    gap: 12,
  },
  modalAttachmentImage: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    backgroundColor: '#222',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    borderWidth: 2,
  },
  modalActionText: {
    fontSize: 13,
    fontWeight: '800' as const,
    letterSpacing: 1,
  },
});
