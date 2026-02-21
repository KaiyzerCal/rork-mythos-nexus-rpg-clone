import { useGame } from '@/contexts/GameContext';
import { CheckSquare, Plus, Check, X, Trash2, Repeat, Flame, Target, Edit } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Task, TaskType, TaskRecurrence } from '@/types/rpg';

export default function TasksScreen() {
  const { gameState, addTask, updateTask, completeTask, deleteTask } = useGame();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'task' | 'habit'>('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'task' as TaskType,
    recurrence: 'once' as TaskRecurrence,
    xpReward: 50,
    skillXpReward: 10,
    linkedSkillId: '',
    linkedSubSkillId: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'task',
      recurrence: 'once',
      xpReward: 50,
      skillXpReward: 10,
      linkedSkillId: '',
      linkedSubSkillId: '',
    });
    setEditingTask(null);
  };

  const allSkills = useMemo(() => {
    const skills = gameState.skillTrees.map(s => ({ id: s.id, name: s.name, isParent: true }));
    const subSkills: Array<{ id: string; name: string; isParent: false; parentId: string }> = [];
    
    Object.entries(gameState.skillSubTrees || {}).forEach(([parentId, subTree]) => {
      subTree.forEach(sub => {
        subSkills.push({
          id: sub.id,
          name: `${gameState.skillTrees.find(s => s.id === parentId)?.name} → ${sub.name}`,
          isParent: false,
          parentId,
        });
      });
    });
    
    return { skills, subSkills };
  }, [gameState.skillTrees, gameState.skillSubTrees]);

  const handleAddTask = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    if (editingTask) {
      updateTask(editingTask.id, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        recurrence: formData.recurrence,
        xpReward: formData.xpReward,
        skillXpReward: formData.linkedSkillId ? formData.skillXpReward : undefined,
        linkedSkillId: formData.linkedSkillId || undefined,
        linkedSubSkillId: formData.linkedSubSkillId || undefined,
      });
    } else {
      addTask({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: 'active',
        recurrence: formData.recurrence,
        xpReward: formData.xpReward,
        skillXpReward: formData.linkedSkillId ? formData.skillXpReward : undefined,
        linkedSkillId: formData.linkedSkillId || undefined,
        linkedSubSkillId: formData.linkedSubSkillId || undefined,
        completedCount: 0,
        streak: 0,
      });
    }

    resetForm();
    setModalVisible(false);
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTask(taskId),
        },
      ]
    );
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      type: task.type,
      recurrence: task.recurrence,
      xpReward: task.xpReward,
      skillXpReward: task.skillXpReward || 10,
      linkedSkillId: task.linkedSkillId || '',
      linkedSubSkillId: task.linkedSubSkillId || '',
    });
    setModalVisible(true);
  };

  const handleToggleArchive = (task: Task) => {
    updateTask(task.id, {
      status: task.status === 'archived' ? 'active' : 'archived',
    });
  };

  const filteredTasks = useMemo(() => {
    let tasks = gameState.tasks;
    if (filterType !== 'all') {
      tasks = tasks.filter(t => t.type === filterType);
    }
    return tasks.filter(t => t.status !== 'archived');
  }, [gameState.tasks, filterType]);

  const activeTasks = filteredTasks.filter(t => t.status === 'active');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  const getSkillName = (task: Task): string | null => {
    if (!task.linkedSkillId) return null;
    
    if (task.linkedSubSkillId) {
      const parentSkill = gameState.skillTrees.find(s => s.id === task.linkedSkillId);
      const subSkill = gameState.skillSubTrees?.[task.linkedSkillId]?.find(s => s.id === task.linkedSubSkillId);
      if (parentSkill && subSkill) {
        return `${parentSkill.name} → ${subSkill.name}`;
      }
    } else {
      const skill = gameState.skillTrees.find(s => s.id === task.linkedSkillId);
      if (skill) {
        return skill.name;
      }
    }
    
    return null;
  };

  const getSkillProficiency = (task: Task): number => {
    if (!task.linkedSkillId) return 0;
    const skillKey = task.linkedSubSkillId 
      ? `${task.linkedSkillId}:${task.linkedSubSkillId}` 
      : task.linkedSkillId;
    return gameState.skillProficiency?.[skillKey] || 0;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            <CheckSquare size={28} color="#08C284" />
            <Text style={styles.title}>Tasks & Habits</Text>
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
          contentContainerStyle={styles.filterContainer}
        >
          <Pressable
            onPress={() => setFilterType('all')}
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filterType === 'all' && styles.filterTextActive]}>
              All ({filteredTasks.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterType('task')}
            style={[styles.filterChip, filterType === 'task' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filterType === 'task' && styles.filterTextActive]}>
              Tasks ({gameState.tasks.filter(t => t.type === 'task' && t.status !== 'archived').length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilterType('habit')}
            style={[styles.filterChip, filterType === 'habit' && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filterType === 'habit' && styles.filterTextActive]}>
              Habits ({gameState.tasks.filter(t => t.type === 'habit' && t.status !== 'archived').length})
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckSquare size={48} color="#333" />
            <Text style={styles.emptyText}>No tasks or habits yet</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first task</Text>
          </View>
        ) : (
          <>
            {activeTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Active</Text>
                {activeTasks.map((task) => (
                  <View key={task.id} style={styles.taskCard}>
                    <View style={styles.taskHeader}>
                      <Pressable
                        onPress={() => completeTask(task.id)}
                        style={styles.checkButton}
                      >
                        <View style={styles.checkCircle}>
                          <Check size={16} color="#08C284" />
                        </View>
                      </Pressable>
                      <View style={styles.taskInfo}>
                        <View style={styles.taskTitleRow}>
                          <Text style={styles.taskTitle}>{task.title}</Text>
                          {task.type === 'habit' && (
                            <Repeat size={14} color="#5EA7FF" />
                          )}
                        </View>
                        {task.description && (
                          <Text style={styles.taskDescription}>{task.description}</Text>
                        )}
                        {task.linkedSkillId && (
                          <View style={styles.skillBadge}>
                            <Target size={12} color="#08C284" />
                            <Text style={styles.skillText}>
                              {getSkillName(task)} ({getSkillProficiency(task)} XP)
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.taskActions}>
                        <Pressable
                          onPress={() => handleEditTask(task)}
                          style={styles.iconButton}
                        >
                          <Edit size={16} color="#5EA7FF" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteTask(task.id)}
                          style={styles.iconButton}
                        >
                          <Trash2 size={16} color="#E75757" />
                        </Pressable>
                      </View>
                    </View>

                    <View style={styles.taskFooter}>
                      <View style={styles.rewardsRow}>
                        <Text style={styles.xpReward}>+{task.xpReward} XP</Text>
                        {task.skillXpReward && task.linkedSkillId && (
                          <Text style={styles.skillXpReward}>+{task.skillXpReward} Skill XP</Text>
                        )}
                      </View>
                      {task.type === 'habit' && task.streak && task.streak > 0 && (
                        <View style={styles.streakBadge}>
                          <Flame size={12} color="#FF6B35" />
                          <Text style={styles.streakText}>{task.streak} day streak</Text>
                        </View>
                      )}
                      {task.completedCount > 0 && (
                        <Text style={styles.completedCount}>
                          Completed {task.completedCount}x
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {completedTasks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Completed</Text>
                {completedTasks.map((task) => (
                  <View key={task.id} style={[styles.taskCard, styles.taskCardCompleted]}>
                    <View style={styles.taskHeader}>
                      <View style={[styles.checkButton, styles.checkButtonCompleted]}>
                        <Check size={16} color="#08C284" />
                      </View>
                      <View style={styles.taskInfo}>
                        <Text style={[styles.taskTitle, styles.taskTitleCompleted]}>
                          {task.title}
                        </Text>
                        {task.completedCount > 0 && (
                          <Text style={styles.completedCount}>
                            Completed {task.completedCount}x
                          </Text>
                        )}
                      </View>
                      <View style={styles.taskActions}>
                        <Pressable
                          onPress={() => handleEditTask(task)}
                          style={styles.iconButton}
                        >
                          <Edit size={16} color="#5EA7FF" />
                        </Pressable>
                        <Pressable
                          onPress={() => handleDeleteTask(task.id)}
                          style={styles.iconButton}
                        >
                          <Trash2 size={16} color="#E75757" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
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
                <Text style={styles.modalTitle}>{editingTask ? 'Edit Task/Habit' : 'Add Task/Habit'}</Text>
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
                  <Text style={styles.formLabel}>Title *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.title}
                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                    placeholder="Enter task title"
                    placeholderTextColor="#666"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Description</Text>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea]}
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Enter description"
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Type</Text>
                  <View style={styles.typeButtons}>
                    <Pressable
                      onPress={() => setFormData({ ...formData, type: 'task', recurrence: 'once' })}
                      style={[
                        styles.typeButton,
                        formData.type === 'task' && styles.typeButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formData.type === 'task' && styles.typeButtonTextActive,
                        ]}
                      >
                        Task
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setFormData({ ...formData, type: 'habit', recurrence: 'daily' })}
                      style={[
                        styles.typeButton,
                        formData.type === 'habit' && styles.typeButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.typeButtonText,
                          formData.type === 'habit' && styles.typeButtonTextActive,
                        ]}
                      >
                        Habit
                      </Text>
                    </Pressable>
                  </View>
                </View>

                {formData.type === 'habit' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Recurrence</Text>
                    <View style={styles.typeButtons}>
                      {(['daily', 'weekly', 'monthly'] as TaskRecurrence[]).map((rec) => (
                        <Pressable
                          key={rec}
                          onPress={() => setFormData({ ...formData, recurrence: rec })}
                          style={[
                            styles.typeButton,
                            formData.recurrence === rec && styles.typeButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeButtonText,
                              formData.recurrence === rec && styles.typeButtonTextActive,
                            ]}
                          >
                            {rec.charAt(0).toUpperCase() + rec.slice(1)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Character XP Reward</Text>
                  <TextInput
                    style={styles.formInput}
                    value={formData.xpReward.toString()}
                    onChangeText={(text) => setFormData({ ...formData, xpReward: parseInt(text) || 0 })}
                    placeholder="50"
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.formLabel}>Link to Skill (Optional)</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.skillSelector}
                  >
                    <Pressable
                      onPress={() => setFormData({ ...formData, linkedSkillId: '', linkedSubSkillId: '' })}
                      style={[
                        styles.skillChip,
                        !formData.linkedSkillId && styles.skillChipActive,
                      ]}
                    >
                      <Text style={[
                        styles.skillChipText,
                        !formData.linkedSkillId && styles.skillChipTextActive,
                      ]}>None</Text>
                    </Pressable>
                    {allSkills.skills.map((skill) => (
                      <Pressable
                        key={skill.id}
                        onPress={() => setFormData({ ...formData, linkedSkillId: skill.id, linkedSubSkillId: '' })}
                        style={[
                          styles.skillChip,
                          formData.linkedSkillId === skill.id && !formData.linkedSubSkillId && styles.skillChipActive,
                        ]}
                      >
                        <Text style={[
                          styles.skillChipText,
                          formData.linkedSkillId === skill.id && !formData.linkedSubSkillId && styles.skillChipTextActive,
                        ]}>{skill.name}</Text>
                      </Pressable>
                    ))}
                    {allSkills.subSkills.map((subSkill) => (
                      <Pressable
                        key={subSkill.id}
                        onPress={() => setFormData({ ...formData, linkedSkillId: subSkill.parentId, linkedSubSkillId: subSkill.id })}
                        style={[
                          styles.skillChip,
                          formData.linkedSkillId === subSkill.parentId && formData.linkedSubSkillId === subSkill.id && styles.skillChipActive,
                        ]}
                      >
                        <Text style={[
                          styles.skillChipText,
                          formData.linkedSkillId === subSkill.parentId && formData.linkedSubSkillId === subSkill.id && styles.skillChipTextActive,
                        ]}>{subSkill.name}</Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>

                {formData.linkedSkillId && (
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Skill XP Reward</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.skillXpReward.toString()}
                      onChangeText={(text) => setFormData({ ...formData, skillXpReward: parseInt(text) || 0 })}
                      placeholder="10"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                    />
                  </View>
                )}
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
                  onPress={handleAddTask}
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                >
                  <Text style={styles.modalButtonText}>{editingTask ? 'Update' : 'Add'}</Text>
                </Pressable>
              </View>
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
    backgroundColor: '#08C284',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#08C284',
    marginBottom: 12,
    textTransform: 'uppercase' as const,
  },
  taskCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  taskCardCompleted: {
    opacity: 0.6,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#08C284',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkButtonCompleted: {
    backgroundColor: '#08C284',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskInfo: {
    flex: 1,
  },
  taskTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through' as const,
    color: '#666',
  },
  taskDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  skillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F1F1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  skillText: {
    fontSize: 11,
    color: '#08C284',
    fontWeight: '600' as const,
  },
  taskActions: {
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
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  xpReward: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#08C284',
  },
  skillXpReward: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#5EA7FF',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1F1008',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FF6B35',
  },
  completedCount: {
    fontSize: 11,
    color: '#666',
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
    textAlignVertical: 'top',
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  typeButtonActive: {
    backgroundColor: '#08C284',
    borderColor: '#08C284',
  },
  typeButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#0A0A0A',
  },
  skillSelector: {
    maxHeight: 120,
  },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222',
    marginRight: 8,
    marginBottom: 8,
  },
  skillChipActive: {
    backgroundColor: '#08C284',
    borderColor: '#08C284',
  },
  skillChipText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600' as const,
  },
  skillChipTextActive: {
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
