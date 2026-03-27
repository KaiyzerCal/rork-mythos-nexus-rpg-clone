import { useGame } from '@/contexts/GameContext';
import { Target, Plus, Check, X, Trash2, CheckSquare, Repeat, Flame, Edit } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import CopyButton from '@/components/CopyButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Quest, QuestType, QuestStatus, Task, TaskType, TaskRecurrence } from '@/types/rpg';

export default function QuestsScreen() {
  const { gameState, addQuest, updateQuestProgress, completeQuest, deleteQuest, updateQuest, addTask, updateTask, completeTask, deleteTask } = useGame();
  const [activeTab, setActiveTab] = useState<'quests' | 'tasks'>('quests');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuest, setEditingQuest] = useState<Quest | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | QuestStatus>('all');
  const [filterTaskType, setFilterTaskType] = useState<'all' | 'task' | 'habit'>('all');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'side' as QuestType,
    xpReward: 100,
    codexPointsReward: 0,
    blackSunEssenceReward: 0,
    skillXpReward: 0,
    targetProgress: 100,
    linkedSkillIds: [] as string[],
    lootRewards: [] as { itemName: string; quantity: number; rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic' }[],
  });

  const [taskFormData, setTaskFormData] = useState({
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
      type: 'side',
      xpReward: 100,
      codexPointsReward: 0,
      blackSunEssenceReward: 0,
      skillXpReward: 0,
      targetProgress: 100,
      linkedSkillIds: [],
      lootRewards: [],
    });
    setTaskFormData({
      title: '',
      description: '',
      type: 'task',
      recurrence: 'once',
      xpReward: 50,
      skillXpReward: 10,
      linkedSkillId: '',
      linkedSubSkillId: '',
    });
    setEditingQuest(null);
    setEditingTask(null);
  };

  const handleAddQuest = () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Quest title is required');
      return;
    }

    if (editingQuest) {
      updateQuest(editingQuest.id, {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        xpReward: formData.xpReward,
        codexPointsReward: formData.codexPointsReward > 0 ? formData.codexPointsReward : undefined,
        blackSunEssenceReward: formData.blackSunEssenceReward > 0 ? formData.blackSunEssenceReward : undefined,
        skillXpReward: formData.skillXpReward > 0 ? formData.skillXpReward : undefined,
        linkedSkillIds: formData.linkedSkillIds.length > 0 ? formData.linkedSkillIds : undefined,
        lootRewards: formData.lootRewards.length > 0 ? formData.lootRewards : undefined,
        progress: editingQuest.progress ? {
          ...editingQuest.progress,
          target: formData.targetProgress,
        } : { current: 0, target: formData.targetProgress },
      });
    } else {
      addQuest({
        title: formData.title,
        description: formData.description,
        type: formData.type,
        status: 'active',
        xpReward: formData.xpReward,
        codexPointsReward: formData.codexPointsReward > 0 ? formData.codexPointsReward : undefined,
        blackSunEssenceReward: formData.blackSunEssenceReward > 0 ? formData.blackSunEssenceReward : undefined,
        skillXpReward: formData.skillXpReward > 0 ? formData.skillXpReward : undefined,
        linkedSkillIds: formData.linkedSkillIds.length > 0 ? formData.linkedSkillIds : undefined,
        lootRewards: formData.lootRewards.length > 0 ? formData.lootRewards : undefined,
        progress: { current: 0, target: formData.targetProgress },
      });
    }

    resetForm();
    setModalVisible(false);
  };

  const handleDeleteQuest = (questId: string) => {
    Alert.alert(
      'Delete Quest',
      'Are you sure you want to delete this quest?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteQuest(questId),
        },
      ]
    );
  };

  const allSkills = useMemo(() => {
    const skills = gameState.skillTrees.map(s => ({ id: s.id, name: s.name, isParent: true }));
    const subSkills: { id: string; name: string; isParent: false; parentId: string }[] = [];
    
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
    if (!taskFormData.title.trim()) {
      Alert.alert('Error', 'Task title is required');
      return;
    }

    if (editingTask) {
      updateTask(editingTask.id, {
        title: taskFormData.title,
        description: taskFormData.description,
        type: taskFormData.type,
        recurrence: taskFormData.recurrence,
        xpReward: taskFormData.xpReward,
        skillXpReward: taskFormData.linkedSkillId ? taskFormData.skillXpReward : undefined,
        linkedSkillId: taskFormData.linkedSkillId || undefined,
        linkedSubSkillId: taskFormData.linkedSubSkillId || undefined,
      });
    } else {
      addTask({
        title: taskFormData.title,
        description: taskFormData.description,
        type: taskFormData.type,
        status: 'active',
        recurrence: taskFormData.recurrence,
        xpReward: taskFormData.xpReward,
        skillXpReward: taskFormData.linkedSkillId ? taskFormData.skillXpReward : undefined,
        linkedSkillId: taskFormData.linkedSkillId || undefined,
        linkedSubSkillId: taskFormData.linkedSubSkillId || undefined,
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

  const handleEditQuest = (quest: Quest) => {
    setEditingQuest(quest);
    setFormData({
      title: quest.title,
      description: quest.description || '',
      type: quest.type,
      xpReward: quest.xpReward,
      codexPointsReward: quest.codexPointsReward || 0,
      blackSunEssenceReward: quest.blackSunEssenceReward || 0,
      skillXpReward: quest.skillXpReward || 0,
      targetProgress: quest.progress?.target || 100,
      linkedSkillIds: quest.linkedSkillIds || [],
      lootRewards: quest.lootRewards || [],
    });
    setModalVisible(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setTaskFormData({
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



  const filteredTasks = useMemo(() => {
    let tasks = gameState.tasks;
    if (filterTaskType !== 'all') {
      tasks = tasks.filter(t => t.type === filterTaskType);
    }
    return tasks.filter(t => t.status !== 'archived');
  }, [gameState.tasks, filterTaskType]);

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

  const filteredQuests = filterStatus === 'all' 
    ? gameState.quests 
    : gameState.quests.filter(q => q.status === filterStatus);

  const questsByStatus = {
    active: filteredQuests.filter(q => q.status === 'active'),
    completed: filteredQuests.filter(q => q.status === 'completed'),
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleRow}>
            {activeTab === 'quests' ? (
              <Target size={28} color="#08C284" />
            ) : (
              <CheckSquare size={28} color="#08C284" />
            )}
            <Text style={styles.title}>{activeTab === 'quests' ? 'Quest Log' : 'Tasks & Habits'}</Text>
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

        <View style={styles.tabButtons}>
          <Pressable
            onPress={() => setActiveTab('quests')}
            style={[styles.tabButton, activeTab === 'quests' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeTab === 'quests' && styles.tabButtonTextActive]}>
              Quests ({gameState.quests.length})
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setActiveTab('tasks')}
            style={[styles.tabButton, activeTab === 'tasks' && styles.tabButtonActive]}
          >
            <Text style={[styles.tabButtonText, activeTab === 'tasks' && styles.tabButtonTextActive]}>
              Tasks ({gameState.tasks.filter(t => t.status !== 'archived').length})
            </Text>
          </Pressable>
        </View>

        {activeTab === 'quests' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <Pressable
              onPress={() => setFilterStatus('all')}
              style={[styles.filterChip, filterStatus === 'all' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filterStatus === 'all' && styles.filterTextActive]}>
                All ({gameState.quests.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterStatus('active')}
              style={[styles.filterChip, filterStatus === 'active' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filterStatus === 'active' && styles.filterTextActive]}>
                Active ({questsByStatus.active.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterStatus('completed')}
              style={[styles.filterChip, filterStatus === 'completed' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filterStatus === 'completed' && styles.filterTextActive]}>
                Completed ({questsByStatus.completed.length})
              </Text>
            </Pressable>
          </ScrollView>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <Pressable
              onPress={() => setFilterTaskType('all')}
              style={[styles.filterChip, filterTaskType === 'all' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filterTaskType === 'all' && styles.filterTextActive]}>
                All ({filteredTasks.length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterTaskType('task')}
              style={[styles.filterChip, filterTaskType === 'task' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filterTaskType === 'task' && styles.filterTextActive]}>
                Tasks ({gameState.tasks.filter(t => t.type === 'task' && t.status !== 'archived').length})
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFilterTaskType('habit')}
              style={[styles.filterChip, filterTaskType === 'habit' && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, filterTaskType === 'habit' && styles.filterTextActive]}>
                Habits ({gameState.tasks.filter(t => t.type === 'habit' && t.status !== 'archived').length})
              </Text>
            </Pressable>
          </ScrollView>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'quests' ? (
          filteredQuests.length === 0 ? (
            <View style={styles.emptyState}>
              <Target size={48} color="#333" />
              <Text style={styles.emptyText}>No quests found</Text>
              <Text style={styles.emptySubtext}>Tap + to add a new quest</Text>
            </View>
          ) : (
            filteredQuests.map((quest) => (
            <View key={quest.id} style={styles.questCard}>
              <View style={styles.questHeader}>
                <View style={styles.questTitleRow}>
                  <View style={[styles.questTypeBadge, { backgroundColor: getTypeColor(quest.type) }]}>
                    <Text style={styles.questTypeText}>{quest.type.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.questTitle}>{quest.title}</Text>
                </View>
                <View style={styles.questActions}>
                  <CopyButton
                    text={`${quest.title} [${quest.type.toUpperCase()}]\n${quest.description || ''}\nStatus: ${quest.status}${quest.progress ? ` | Progress: ${quest.progress.current}/${quest.progress.target}` : ''}\nXP: ${quest.xpReward}`}
                    size={14}
                    color="#08C284"
                    iconOnly
                  />
                  {quest.status === 'active' && (
                    <Pressable
                      onPress={() => completeQuest(quest.id)}
                      style={styles.iconButton}
                    >
                      <Check size={18} color="#08C284" />
                    </Pressable>
                  )}
                  <Pressable
                    onPress={() => handleEditQuest(quest)}
                    style={styles.iconButton}
                  >
                    <Edit size={18} color="#5EA7FF" />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteQuest(quest.id)}
                    style={styles.iconButton}
                  >
                    <Trash2 size={18} color="#E75757" />
                  </Pressable>
                </View>
              </View>

              {quest.description && (
                <Text style={styles.questDescription}>{quest.description}</Text>
              )}

              {quest.progress && (
                <View style={styles.progressSection}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Progress</Text>
                    <Text style={styles.progressValue}>
                      {quest.progress.current} / {quest.progress.target}
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${(quest.progress.current / quest.progress.target) * 100}%`,
                          backgroundColor: quest.status === 'completed' ? '#08C284' : '#5EA7FF',
                        },
                      ]}
                    />
                  </View>
                  {quest.status === 'active' && (
                    <View style={styles.progressControls}>
                      <Pressable
                        onPress={() => updateQuestProgress(quest.id, Math.max(0, quest.progress!.current - 5))}
                        style={styles.progressButton}
                      >
                        <Text style={styles.progressButtonText}>-5</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => updateQuestProgress(quest.id, Math.min(quest.progress!.target, quest.progress!.current + 5))}
                        style={styles.progressButton}
                      >
                        <Text style={styles.progressButtonText}>+5</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.questFooter}>
                {quest.status === 'completed' && (
                  <View style={styles.completedBadge}>
                    <Check size={12} color="#0A0A0A" />
                    <Text style={styles.completedText}>COMPLETED</Text>
                  </View>
                )}
                <Text style={styles.xpReward}>+{quest.xpReward} XP</Text>
              </View>
            </View>
          ))
          )
        ) : (
          filteredTasks.length === 0 ? (
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
          )
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
              <Text style={styles.modalTitle}>
                {activeTab === 'quests' 
                  ? (editingQuest ? 'Edit Quest' : 'Add New Quest')
                  : (editingTask ? 'Edit Task/Habit' : 'Add Task/Habit')
                }
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
              {activeTab === 'quests' ? (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Title *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.title}
                      onChangeText={(text) => setFormData({ ...formData, title: text })}
                      placeholder="Enter quest title"
                      placeholderTextColor="#666"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextArea]}
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      placeholder="Enter quest description"
                      placeholderTextColor="#666"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Type</Text>
                    <View style={styles.typeButtons}>
                      {(['main', 'side', 'daily', 'epic'] as QuestType[]).map((type) => (
                        <Pressable
                          key={type}
                          onPress={() => setFormData({ ...formData, type })}
                          style={[
                            styles.typeButton,
                            formData.type === type && styles.typeButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeButtonText,
                              formData.type === type && styles.typeButtonTextActive,
                            ]}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>XP Reward</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.xpReward.toString()}
                      onChangeText={(text) => setFormData({ ...formData, xpReward: parseInt(text) || 0 })}
                      placeholder="100"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Target Progress</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.targetProgress.toString()}
                      onChangeText={(text) => setFormData({ ...formData, targetProgress: parseInt(text) || 0 })}
                      placeholder="100"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Codex Points Reward</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.codexPointsReward.toString()}
                      onChangeText={(text) => setFormData({ ...formData, codexPointsReward: parseInt(text) || 0 })}
                      placeholder="0"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Black Sun Essence Reward</Text>
                    <TextInput
                      style={styles.formInput}
                      value={formData.blackSunEssenceReward.toString()}
                      onChangeText={(text) => setFormData({ ...formData, blackSunEssenceReward: parseInt(text) || 0 })}
                      placeholder="0"
                      placeholderTextColor="#666"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Associated Skills (Multi-Select)</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.skillSelector}
                    >
                      {allSkills.skills.map((skill) => (
                        <Pressable
                          key={skill.id}
                          onPress={() => {
                            const isSelected = formData.linkedSkillIds.includes(skill.id);
                            setFormData({
                              ...formData,
                              linkedSkillIds: isSelected
                                ? formData.linkedSkillIds.filter(id => id !== skill.id)
                                : [...formData.linkedSkillIds, skill.id]
                            });
                          }}
                          style={[
                            styles.skillChip,
                            formData.linkedSkillIds.includes(skill.id) && styles.skillChipActive,
                          ]}>
                          <Text style={[
                            styles.skillChipText,
                            formData.linkedSkillIds.includes(skill.id) && styles.skillChipTextActive,
                          ]}>{skill.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                    {formData.linkedSkillIds.length > 0 && (
                      <Text style={styles.helperText}>
                        {formData.linkedSkillIds.length} skill{formData.linkedSkillIds.length > 1 ? 's' : ''} selected
                      </Text>
                    )}
                  </View>

                  {formData.linkedSkillIds.length > 0 && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Skill XP Reward (per skill)</Text>
                      <TextInput
                        style={styles.formInput}
                        value={formData.skillXpReward.toString()}
                        onChangeText={(text) => setFormData({ ...formData, skillXpReward: parseInt(text) || 0 })}
                        placeholder="0"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </>
              ) : (
                <>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Title *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={taskFormData.title}
                      onChangeText={(text) => setTaskFormData({ ...taskFormData, title: text })}
                      placeholder="Enter task title"
                      placeholderTextColor="#666"
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description</Text>
                    <TextInput
                      style={[styles.formInput, styles.formTextArea]}
                      value={taskFormData.description}
                      onChangeText={(text) => setTaskFormData({ ...taskFormData, description: text })}
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
                        onPress={() => setTaskFormData({ ...taskFormData, type: 'task', recurrence: 'once' })}
                        style={[
                          styles.typeButton,
                          taskFormData.type === 'task' && styles.typeButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            taskFormData.type === 'task' && styles.typeButtonTextActive,
                          ]}
                        >
                          Task
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setTaskFormData({ ...taskFormData, type: 'habit', recurrence: 'daily' })}
                        style={[
                          styles.typeButton,
                          taskFormData.type === 'habit' && styles.typeButtonActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.typeButtonText,
                            taskFormData.type === 'habit' && styles.typeButtonTextActive,
                          ]}
                        >
                          Habit
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {taskFormData.type === 'habit' && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Recurrence</Text>
                      <View style={styles.typeButtons}>
                        {(['daily', 'weekly', 'monthly'] as TaskRecurrence[]).map((rec) => (
                          <Pressable
                            key={rec}
                            onPress={() => setTaskFormData({ ...taskFormData, recurrence: rec })}
                            style={[
                              styles.typeButton,
                              taskFormData.recurrence === rec && styles.typeButtonActive,
                            ]}
                          >
                            <Text
                              style={[
                                styles.typeButtonText,
                                taskFormData.recurrence === rec && styles.typeButtonTextActive,
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
                      value={taskFormData.xpReward.toString()}
                      onChangeText={(text) => setTaskFormData({ ...taskFormData, xpReward: parseInt(text) || 0 })}
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
                        onPress={() => setTaskFormData({ ...taskFormData, linkedSkillId: '', linkedSubSkillId: '' })}
                        style={[
                          styles.skillChip,
                          !taskFormData.linkedSkillId && styles.skillChipActive,
                        ]}
                      >
                        <Text style={[
                          styles.skillChipText,
                          !taskFormData.linkedSkillId && styles.skillChipTextActive,
                        ]}>None</Text>
                      </Pressable>
                      {allSkills.skills.map((skill) => (
                        <Pressable
                          key={skill.id}
                          onPress={() => setTaskFormData({ ...taskFormData, linkedSkillId: skill.id, linkedSubSkillId: '' })}
                          style={[
                            styles.skillChip,
                            taskFormData.linkedSkillId === skill.id && !taskFormData.linkedSubSkillId && styles.skillChipActive,
                          ]}
                        >
                          <Text style={[
                            styles.skillChipText,
                            taskFormData.linkedSkillId === skill.id && !taskFormData.linkedSubSkillId && styles.skillChipTextActive,
                          ]}>{skill.name}</Text>
                        </Pressable>
                      ))}
                      {allSkills.subSkills.map((subSkill) => (
                        <Pressable
                          key={subSkill.id}
                          onPress={() => setTaskFormData({ ...taskFormData, linkedSkillId: subSkill.parentId, linkedSubSkillId: subSkill.id })}
                          style={[
                            styles.skillChip,
                            taskFormData.linkedSkillId === subSkill.parentId && taskFormData.linkedSubSkillId === subSkill.id && styles.skillChipActive,
                          ]}
                        >
                          <Text style={[
                            styles.skillChipText,
                            taskFormData.linkedSkillId === subSkill.parentId && taskFormData.linkedSubSkillId === subSkill.id && styles.skillChipTextActive,
                          ]}>{subSkill.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>

                  {taskFormData.linkedSkillId && (
                    <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Skill XP Reward</Text>
                      <TextInput
                        style={styles.formInput}
                        value={taskFormData.skillXpReward.toString()}
                        onChangeText={(text) => setTaskFormData({ ...taskFormData, skillXpReward: parseInt(text) || 0 })}
                        placeholder="10"
                        placeholderTextColor="#666"
                        keyboardType="numeric"
                      />
                    </View>
                  )}
                </>
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
                onPress={activeTab === 'quests' ? handleAddQuest : handleAddTask}
                style={[styles.modalButton, styles.modalButtonPrimary]}
              >
                <Text style={styles.modalButtonText}>
                  {activeTab === 'quests' 
                    ? (editingQuest ? 'Update' : 'Add Quest')
                    : (editingTask ? 'Update' : 'Add')
                  }
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

function getTypeColor(type: QuestType): string {
  switch (type) {
    case 'main':
      return '#E75757';
    case 'epic':
      return '#E7A857';
    case 'daily':
      return '#5EA7FF';
    default:
      return '#08C284';
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
    backgroundColor: '#08C284',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#111',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  tabButtonActive: {
    backgroundColor: '#08C284',
    borderColor: '#08C284',
  },
  tabButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#666',
  },
  tabButtonTextActive: {
    color: '#0A0A0A',
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
  questCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questTitleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  questTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  questTypeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
  questTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  questActions: {
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
  questDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
    marginBottom: 12,
  },
  progressSection: {
    marginTop: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#888',
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  progressControls: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  progressButton: {
    flex: 1,
    backgroundColor: '#1A1A1A',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  progressButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#08C284',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#0A0A0A',
  },
  xpReward: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#08C284',
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
  helperText: {
    fontSize: 11,
    color: '#08C284',
    marginTop: 8,
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
