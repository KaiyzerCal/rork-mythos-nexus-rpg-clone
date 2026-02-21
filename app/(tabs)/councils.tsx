import { useGame } from '@/contexts/GameContext';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Modal, Alert, Keyboard } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { Users, Crown, Lightbulb, Eye, MessageCircle, Send, ChevronLeft, Plus, Edit2, Trash2, X, RefreshCw, StopCircle } from 'lucide-react-native';
import CopyButton from '@/components/CopyButton';
import { useRorkAgent, generateObject } from '@rork-ai/toolkit-sdk';
import { z } from 'zod';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALL_COUNCIL_MEMBERS } from '@/constants/councils-v2';



type CouncilClass = 'core' | 'advisory' | 'think-tank' | 'shadows';

export default function CouncilsScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, councilMembers, addCouncilMember, updateCouncilMember, deleteCouncilMember, addXP } = useGame();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [activeConversation, setActiveConversation] = useState<typeof councilMembers[0] | null>(null);
  const [input, setInput] = useState('');
  const [userInputMap, setUserInputMap] = useState<Record<string, string>>({});
  const scrollViewRef = useRef<ScrollView>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<typeof councilMembers[0] | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    specialty: '',
    class: 'core' as CouncilClass,
    notes: '',
  });

  const classes = ['all', 'core', 'advisory', 'think-tank', 'shadows'];

  const getMemberContext = (member: typeof councilMembers[0]) => {
    const { 
      stats, identity, currentForm, currentBPM, energySystems, transformations, 
      quests, vaultEntries, realWorldModules, councils, skillTrees, skillSubTrees,
      dailyRituals, inventoryV2, roster, allies, currencies, currentFloor, gpr, pvpRating, arcStory,
      tasks, skillProficiency
    } = gameState;
    
    const activeQuests = quests.filter(q => q.status === 'active');
    const completedQuests = quests.filter(q => q.status === 'completed');
    const todayRituals = dailyRituals.filter(r => !r.completed);
    const completedRituals = dailyRituals.filter(r => r.completed);
    const unlockedSkills = skillTrees.filter(s => s.unlocked);
    const mainCouncils = councils;
    const topAllies = allies;
    const allVault = vaultEntries;
    const equippedItems = inventoryV2.filter(i => i.slot !== 'Storage');
    const allRoster = roster;
    const allTasks = tasks || [];
    
    const systemContext = `=== COMPREHENSIVE SYSTEM CONTEXT ===

📋 IDENTITY:
- Name: ${identity.inscribedName}
- Titles: ${identity.titles.join(' • ')}
- Species: ${identity.speciesLineage[identity.speciesLineage.length - 1]}
- Territory: ${identity.territory.class}
- Tower Floors: ${identity.territory.towerFloorsInfluence}
- Arc Story: ${arcStory || 'Unknown'}

⚡ CURRENT STATUS:
- Level ${stats.level} | Rank ${stats.rank} | XP: ${stats.xp}/${stats.xpToNextLevel}
- Current Form: ${currentForm} (${currentBPM} BPM - energetic vibration, NOT heart rate)
- Fatigue: ${stats.fatigue}/100 | Full Cowl Sync: ${stats.fullCowlSync}% | Codex Integrity: ${stats.codexIntegrity}%
- Stats: STR ${stats.STR} • AGI ${stats.AGI} • VIT ${stats.VIT} • INT ${stats.INT} • WIS ${stats.WIS} • CHA ${stats.CHA} • LCK ${stats.LCK}
- Tower Floor: ${currentFloor} | GPR: ${gpr} | PVP Rating: ${pvpRating}
- Aura Power: ${stats.auraPower}

💰 CURRENCIES:
${currencies.map(c => `- ${c.icon} ${c.name}: ${c.amount}`).join('\n')}

🌀 ENERGY SYSTEMS (${energySystems.length} total):
${energySystems.map(e => `- ${e.type}: ${e.current}/${e.max} (${e.status}) - ${e.description}`).join('\n')}

🔥 TRANSFORMATIONS (${transformations.length} forms unlocked):
${transformations.slice(0, 8).map(t => {
  return `- ${t.name} (${t.bpmRange} BPM) - ${t.category || 'Transformation'} - ${t.description || 'No description'}`;
}).join('\n')}
${transformations.length > 8 ? `... and ${transformations.length - 8} more forms` : ''}

⚔️ SKILLS & ABILITIES (${unlockedSkills.length} unlocked):
${unlockedSkills.slice(0, 10).map(s => {
  const proficiencyKey = s.id;
  const proficiency = skillProficiency?.[proficiencyKey] || 0;
  return `- ${s.name} (${s.energyType}) [Prof: ${proficiency}] - ${s.description}`;
}).join('\n')}
${unlockedSkills.length > 10 ? `... and ${unlockedSkills.length - 10} more skills` : ''}

🎯 ACTIVE QUESTS (${activeQuests.length}):
${activeQuests.map(q => `- ${q.title}: ${q.progress ? `${q.progress.current}/${q.progress.target}` : 'ongoing'} (${q.xpReward} XP)${q.realWorldMapping ? ` - ${q.realWorldMapping}` : ''}`).join('\n')}
${completedQuests.length > 0 ? `\nCompleted: ${completedQuests.length} quests` : ''}

✅ TASKS & HABITS (${allTasks.length} total):
${allTasks.slice(0, 8).map(t => {
  const linkedSkill = t.linkedSkillId ? skillTrees.find(s => s.id === t.linkedSkillId) : null;
  const skillInfo = linkedSkill ? ` [Linked: ${linkedSkill.name}${t.skillXpReward ? ` +${t.skillXpReward} Prof` : ''}]` : '';
  return `- ${t.title} (${t.recurrence}) [${t.status}] Completed: ${t.completedCount} Streak: ${t.streak || 0}${skillInfo}`;
}).join('\n')}
${allTasks.length > 8 ? `... and ${allTasks.length - 8} more tasks` : ''}

📅 TODAY'S RITUALS (${todayRituals.length} pending):
${todayRituals.map(r => `- ${r.name} (${r.type}): +${r.xpReward} XP - ${r.description}`).join('\n')}
${completedRituals.length > 0 ? `\nCompleted Today: ${completedRituals.length} rituals` : ''}

👥 COUNCILS & ALLIES:
Council Members (${councilMembers.length} total):
${councilMembers.map(c => `- ${c.name} (${c.class}): ${c.role} - ${c.specialty || 'General'} - ${c.notes}`).join('\n')}

Allies (${allies.length} total):
${topAllies.map(a => `- ${a.name} (${a.relationship}) Lv.${a.level} - ${a.specialty} [Affinity: ${a.affinity}%]`).join('\n')}

🎒 EQUIPPED ITEMS (${equippedItems.length}):
${equippedItems.map(i => `- [${i.slot}] ${i.name} (${i.tier}) - ${i.description}`).join('\n')}

📊 COMPLETE RANKINGS/ROSTER (${allRoster.length} tracked):
${allRoster.map((r, idx) => `#${idx + 1} ${r.display} (${r.role}) ${r.rank} Lv.${r.level} | GPR: ${r.gpr} | PvP: ${(r.pvp/1000).toFixed(1)} | ${r.jjkGrade} ${r.opTier} | ${r.influence}${r.notes ? ` - ${r.notes}` : ''}`).join('\n')}

🔒 COMPLETE VAULT CODEX (${allVault.length} entries):
${allVault.map(v => {
  const date = new Date(v.timestamp).toLocaleDateString();
  return `- [${v.category.toUpperCase()}] ${v.title} (${v.importance.toUpperCase()}) - ${date}\n  Content: ${v.content}`;
}).join('\n\n')}

🏋️ REAL-WORLD MODULES:
Fitness:
  - Weekly Target: ${realWorldModules.fitness.habitTargets.weekSessions} sessions
  - Recovery Days: ${realWorldModules.fitness.habitTargets.recoveryDays}
  - YMCA Credit: ${realWorldModules.fitness.ymcaBootcampCredit.perClassXP} XP/class (${realWorldModules.fitness.ymcaBootcampCredit.capWeek} weekly cap)

Business:
  - Nodes: ${realWorldModules.business.nodes.join(' • ')}
  - Daily Rule: ${realWorldModules.business.dailyRule}

Legal Case:
  - ${realWorldModules.legalCase.coreStory}
  - Evidence: ${realWorldModules.legalCase.evidenceTypes.join(' • ')}
  - Next Steps: ${realWorldModules.legalCase.nextSteps.join(' • ')}

Relationships:
  - Rizz Aura: ${realWorldModules.relationships.rizzAuraEnabled ? 'ACTIVE' : 'inactive'}
  - Safety Rules: ${realWorldModules.relationships.safetyRules.join(' • ')}

💡 KEY NOTES:
- BPM = ENERGETIC VIBRATION (not physical heart rate). Each transformation has a BPM range representing consciousness frequency.
- Full Cowl = Black Heart Pulse Modulation - signature technique for precise BPM synchronization.
- All tabs are interconnected: Character, Transformations, Energy, Quests, Tasks, Skills, Councils, Inventory, Rituals, Vault, Tower, Rankings, Progress, and Mavis chat.
- You have complete access to ALL vault entries with full content, ALL rankings/roster entries with full details, ALL tasks with skill linkage, and ALL other system data.

=== YOUR ROLE & CHARACTER ===
You are ${member.name}, a ${member.class} council member.
Role: ${member.role}
Specialty: ${member.specialty}
Character Notes: ${member.notes}

STAY IN CHARACTER: Embody ${member.name}'s personality, voice, and perspective authentically. Reference their specialty and approach. Be true to who they are - their mannerisms, speech patterns, values, and worldview. Don't be generic.

You have complete access to ALL the data above. Use it to provide informed, strategic guidance. Reference specific stats, quests, skills, inventory items, vault entries, rankings, tasks, or any other data when relevant. Provide actionable advice based on the player's actual state and progress.

CRITICAL: Keep ALL responses concise and condensed to EXACTLY 4 PARAGRAPHS MAXIMUM. Be direct, impactful, and efficient with words while staying authentic to your character. Make every word count. No fluff.`;
    
    return systemContext;
  };

  const [analyzingGrowth, setAnalyzingGrowth] = useState(false);
  const growthAnalysisRef = useRef(false);

  const analyzeConversationGrowth = async (conversationHistory: string, memberName: string) => {
    if (growthAnalysisRef.current) {
      console.log(`[COUNCIL:${memberName}] Growth analysis already in progress, skipping`);
      return null;
    }
    try {
      growthAnalysisRef.current = true;
      setAnalyzingGrowth(true);
      console.log(`[COUNCIL:${memberName}] Analyzing conversation for growth...`);
      
      const growthAnalysis = await generateObject({
        messages: [
          {
            role: 'user',
            content: `Analyze this conversation with council member "${memberName}" and determine if it contributes to the player's character growth, progress, or ascension. Consider:
- Personal development insights
- Strategic planning or goal setting
- Overcoming challenges or obstacles
- Building self-awareness
- Taking action toward goals
- Wisdom and mentorship received
- Skill development
- Decision-making support

Conversation:
${conversationHistory}

Does this conversation meaningfully contribute to character growth?`,
          },
        ],
        schema: z.object({
          contributesToGrowth: z.boolean().describe('Whether the conversation contributes to character growth'),
          growthType: z.enum(['strategic', 'mentorship', 'skill-development', 'goal-setting', 'self-awareness', 'action-oriented', 'decision-making', 'none']).describe('Type of growth demonstrated'),
          xpAmount: z.number().min(0).max(100).describe('XP amount to award (0-100) based on depth of growth. IMPORTANT: Must be between 0-100, never exceed 100'),
          reason: z.string().describe('Brief explanation of why this does or does not contribute to growth'),
        }),
      });

      console.log(`[COUNCIL:${memberName}] Growth analysis result:`, growthAnalysis);
      
      if (growthAnalysis.xpAmount > 100) {
        console.warn(`[COUNCIL:${memberName}] XP amount ${growthAnalysis.xpAmount} exceeded 100, capping at 100`);
        growthAnalysis.xpAmount = 100;
      }
      
      return growthAnalysis;
    } catch (error) {
      console.error(`[COUNCIL:${memberName}] Error analyzing conversation growth:`, error);
      return null;
    } finally {
      growthAnalysisRef.current = false;
      setAnalyzingGrowth(false);
    }
  };

  const { messages, sendMessage, setMessages, status, stop } = useRorkAgent({ tools: {} });
  const isLoading = status === 'streaming';

  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const startConversation = (member: typeof councilMembers[0]) => {
    setActiveConversation(member);
    setMessages([{
      id: Date.now().toString(),
      role: 'assistant',
      parts: [{
        type: 'text',
        text: `Greetings. I am ${member.name}, ${member.role} of the ${member.class} council. How may I assist your ascension today?`,
      }],
    }]);
  };

  const isSendingRef = useRef(false);

  const handleSend = async () => {
    if (!input.trim() || !activeConversation || isSendingRef.current) return;
    
    isSendingRef.current = true;
    const userInput = input.trim();
    setInput('');
    
    const systemPrompt = getMemberContext(activeConversation);
    const fullMessage = `${systemPrompt}\n\nUser: ${userInput}`;
    
    const tempId = `user-${Date.now()}`;
    setUserInputMap((prev) => ({ ...prev, [tempId]: userInput }));
    
    try {
      await sendMessage({ text: fullMessage });
    } catch (error) {
      console.error(`[COUNCIL] Error sending message:`, error);
    } finally {
      isSendingRef.current = false;
    }
    
    setUserInputMap((prev) => {
      const updated = { ...prev };
      const lastUserMsg = messages.filter((m) => m.role === 'user').pop();
      if (lastUserMsg?.id) {
        updated[lastUserMsg.id] = userInput;
      }
      return updated;
    });

    setTimeout(async () => {
      const recentMessages = messages.slice(-6);
      const conversationHistory = recentMessages
        .map((msg) => {
          const role = msg.role === 'user' ? 'User' : activeConversation.name;
          const text = msg.parts.filter((p) => p.type === 'text').map((p) => (p as any).text).join(' ');
          return `${role}: ${text}`;
        })
        .join('\n\n');
      
      const analysis = await analyzeConversationGrowth(conversationHistory, activeConversation?.name || 'Unknown');
      if (analysis?.contributesToGrowth && analysis.xpAmount > 0) {
        const safeXP = Math.min(Math.max(0, Math.floor(analysis.xpAmount)), 100);
        console.log(`[COUNCIL:${activeConversation.name}] Awarding ${safeXP} XP for ${analysis.growthType} growth`);
        addXP(safeXP);
        
        setMessages((prev) => [
          ...prev,
          {
            id: `xp-${Date.now()}`,
            role: 'assistant' as const,
            parts: [{
              type: 'text' as const,
              text: `[Council System: ${analysis.reason} You've been awarded ${safeXP} XP for this growth-oriented counsel.]`,
            }],
          },
        ]);
      }
    }, 2000);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      role: '',
      specialty: '',
      class: 'core',
      notes: '',
    });
    setEditModalVisible(true);
  };

  const openEditModal = (member: typeof councilMembers[0]) => {
    setEditingMember(member);
    setFormData({
      name: member.name || '',
      role: member.role || '',
      specialty: member.specialty || '',
      class: (member.class || 'core') as CouncilClass,
      notes: member.notes || '',
    });
    setEditModalVisible(true);
  };

  const handleSaveMember = () => {
    if (!formData.name || !formData.role || !formData.notes) return;

    if (editingMember) {
      updateCouncilMember(editingMember.id, formData);
    } else {
      addCouncilMember(formData);
    }

    setEditModalVisible(false);
    setEditingMember(null);
  };

  const handleDeleteMember = (id: string) => {
    deleteCouncilMember(id);
  };

  const handleResetCouncils = () => {
    Alert.alert(
      'Reset Councils',
      `This will reset all councils to the default ${ALL_COUNCIL_MEMBERS.length} members. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            councilMembers.forEach(member => member.id && deleteCouncilMember(member.id));
            setTimeout(() => {
              ALL_COUNCIL_MEMBERS.forEach(member => addCouncilMember(member));
            }, 100);
          }
        },
      ]
    );
  };



  const filteredMembers = selectedClass === 'all'
    ? councilMembers
    : councilMembers.filter((m) => m.class === selectedClass);

  const getIcon = (classType: string) => {
    switch (classType) {
      case 'core':
        return <Crown size={16} color="#FFD700" />;
      case 'advisory':
        return <Users size={16} color="#08C284" />;
      case 'think-tank':
        return <Lightbulb size={16} color="#4169E1" />;
      case 'shadows':
        return <Eye size={16} color="#9400D3" />;
      default:
        return null;
    }
  };

  const getClassColor = (classType: string) => {
    switch (classType) {
      case 'core':
        return '#FFD700';
      case 'advisory':
        return '#08C284';
      case 'think-tank':
        return '#4169E1';
      case 'shadows':
        return '#9400D3';
      default:
        return '#666';
    }
  };

  if (activeConversation) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={[styles.conversationHeader, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setActiveConversation(null)}
          >
            <ChevronLeft size={24} color="#08C284" />
          </TouchableOpacity>
          <View style={styles.conversationHeaderInfo}>
            <Text style={styles.conversationName}>{activeConversation.name}</Text>
            <Text style={styles.conversationRole}>{activeConversation.role}</Text>
          </View>
          <View style={[styles.classBadge, { backgroundColor: getClassColor(activeConversation.class) }]}>
            {getIcon(activeConversation.class)}
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.reduce<Array<{ msg: typeof messages[0]; uniqueKey: string }>>((acc, msg, idx) => {
            const baseKey = msg.id && msg.id.trim() ? `msg-${msg.id}` : `msg-fallback-${idx}-${msg.role}`;
            let uniqueKey = baseKey;
            const existingKeys = new Set(acc.map(a => a.uniqueKey));
            if (existingKeys.has(uniqueKey)) {
              uniqueKey = `${baseKey}-dup-${idx}`;
            }
            acc.push({ msg, uniqueKey });
            return acc;
          }, []).map(({ msg, uniqueKey }) => {
            return (
              <View
                key={uniqueKey}
                style={[
                  styles.messageCard,
                  msg.role === 'user' ? styles.userMessageCard : styles.assistantMessageCard,
                ]}
              >
                {msg.role === 'assistant' && (
                  <View style={{ alignItems: 'flex-end', marginBottom: 4 }}>
                    <CopyButton
                      text={msg.parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text' && !!(p as any).text).map(p => (p as any).text).join('\n')}
                      size={12}
                      color="#666"
                      iconOnly
                    />
                  </View>
                )}
                {msg.parts
                  .map((part, partIdx) => {
                    if (part.type === 'text') {
                      const textPart = part as { type: 'text'; text: string };
                      if (!textPart.text || !textPart.text.trim()) {
                        return null;
                      }
                      let displayText = textPart.text;
                      if (msg.role === 'user') {
                        const mapped = userInputMap[msg.id];
                        if (mapped) {
                          displayText = mapped;
                        } else {
                          const userMarker = '\n\nUser: ';
                          const markerIdx = displayText.indexOf(userMarker);
                          if (markerIdx !== -1) {
                            displayText = displayText.substring(markerIdx + userMarker.length);
                          }
                        }
                      }
                      return (
                        <View key={`${uniqueKey}-text-${partIdx}`}>
                          <Text style={[
                            styles.messageText,
                            msg.role === 'user' ? styles.userMessageText : styles.assistantMessageText,
                          ]}>
                            {displayText}
                          </Text>
                        </View>
                      );
                    }
                    if (part.type === 'tool') {
                      const toolPart = part as any;
                      if (toolPart.state === 'input-streaming' || toolPart.state === 'input-available') {
                        return (
                          <View key={`${uniqueKey}-tool-${partIdx}`}>
                            <Text style={[
                              styles.messageText,
                              styles.assistantMessageText,
                              { fontStyle: 'italic', opacity: 0.7 }
                            ]}>
                              Thinking...
                            </Text>
                          </View>
                        );
                      }
                    }
                    return null;
                  })
                  .filter(Boolean)}
              </View>
            );
          })}
        </ScrollView>

        <View style={[styles.conversationInputContainer, { paddingBottom: insets.bottom + 8 }]}>
          <TouchableOpacity
            style={styles.dismissKeyboardButton}
            onPress={() => Keyboard.dismiss()}
          >
            <X size={18} color="#666" />
          </TouchableOpacity>
          <TextInput
            style={styles.conversationInput}
            value={input}
            onChangeText={setInput}
            placeholder={`Ask ${activeConversation.name} for guidance...`}
            placeholderTextColor="#666"
            multiline
          />
          {isLoading ? (
            <TouchableOpacity
              style={styles.stopButton}
              onPress={() => { if (typeof stop === 'function') stop(); }}
              activeOpacity={0.7}
            >
              <StopCircle size={20} color="#FF6B35" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.conversationSendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Send size={20} color={input.trim() ? '#08C284' : '#666'} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Councils</Text>
          <Text style={styles.subtitle}>{councilMembers.length} Members</Text>
        </View>
        <View style={styles.headerActions}>
          {councilMembers.length === 0 && (
            <TouchableOpacity style={styles.resetButton} onPress={handleResetCouncils}>
              <RefreshCw size={16} color="#08C284" />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Plus size={20} color="#000" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classScroll}>
        {classes.map((cls) => (
          <TouchableOpacity
            key={cls}
            style={[
              styles.classChip,
              selectedClass === cls && styles.classChipActive,
            ]}
            onPress={() => setSelectedClass(cls)}
          >
            <Text
              style={[
                styles.classChipText,
                selectedClass === cls && styles.classChipTextActive,
              ]}
            >
              {cls.charAt(0).toUpperCase() + cls.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {filteredMembers.map((member) => (
          <View key={member.id} style={styles.memberCard}>
            <View style={styles.memberHeader}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
              </View>
              <View style={[styles.classBadge, { backgroundColor: getClassColor(member.class) }]}>
                {getIcon(member.class)}
              </View>
            </View>

            <Text style={styles.memberNotes}>{member.notes}</Text>

            <View style={styles.memberFooter}>
              <View style={[styles.classTag, { borderColor: getClassColor(member.class) }]}>
                <Text style={[styles.classTagText, { color: getClassColor(member.class) }]}>
                  {member.class.toUpperCase()}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.editMemberButton}
                  onPress={() => openEditModal(member)}
                >
                  <Edit2 size={14} color="#08C284" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteMemberButton}
                  onPress={() => handleDeleteMember(member.id)}
                >
                  <Trash2 size={14} color="#FF6B35" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.conversationButton}
                  onPress={() => startConversation(member)}
                >
                  <MessageCircle size={16} color="#08C284" />
                  <Text style={styles.conversationButtonText}>Consult</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingMember ? 'Edit Member' : 'Add Member'}
              </Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(val) => setFormData({ ...formData, name: val })}
                  placeholder="Enter name"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Role *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.role}
                  onChangeText={(val) => setFormData({ ...formData, role: val })}
                  placeholder="Enter role"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Specialty</Text>
                <TextInput
                  style={styles.input}
                  value={formData.specialty}
                  onChangeText={(val) => setFormData({ ...formData, specialty: val })}
                  placeholder="Enter specialty"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Class *</Text>
                <View style={styles.classSelector}>
                  {(['core', 'advisory', 'think-tank', 'shadows'] as CouncilClass[]).map((cls) => (
                    <TouchableOpacity
                      key={cls}
                      style={[
                        styles.classSelectorButton,
                        formData.class === cls && styles.classSelectorButtonActive,
                        { borderColor: getClassColor(cls) },
                      ]}
                      onPress={() => setFormData({ ...formData, class: cls })}
                    >
                      <Text
                        style={[
                          styles.classSelectorText,
                          formData.class === cls && { color: getClassColor(cls) },
                        ]}
                      >
                        {cls}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.notes}
                  onChangeText={(val) => setFormData({ ...formData, notes: val })}
                  placeholder="Enter notes or description"
                  placeholderTextColor="#666"
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!formData.name || !formData.role || !formData.notes) && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveMember}
              disabled={!formData.name || !formData.role || !formData.notes}
            >
              <Text style={styles.saveButtonText}>
                {editingMember ? 'Update Member' : 'Add Member'}
              </Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 12,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#08C284',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  classScroll: {
    paddingHorizontal: 16,
    maxHeight: 50,
    marginBottom: 16,
  },
  classChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#111',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  classChipActive: {
    backgroundColor: '#08C284',
    borderColor: '#08C284',
  },
  classChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#aaa',
  },
  classChipTextActive: {
    color: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  memberCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  memberRole: {
    fontSize: 14,
    color: '#08C284',
  },
  classBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberNotes: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 18,
    marginBottom: 12,
  },
  memberFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editMemberButton: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(8, 194, 132, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#08C284',
  },
  deleteMemberButton: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  classTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  classTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  conversationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(8, 194, 132, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#08C284',
  },
  conversationButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#08C284',
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#08C284',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  conversationHeaderInfo: {
    flex: 1,
  },
  conversationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  conversationRole: {
    fontSize: 13,
    color: '#08C284',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  messagesContent: {
    padding: 16,
  },
  messageCard: {
    maxWidth: '85%',
    marginBottom: 12,
    borderRadius: 12,
    padding: 12,
  },
  userMessageCard: {
    alignSelf: 'flex-end',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
  },
  assistantMessageCard: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(8, 194, 132, 0.1)',
    borderWidth: 1,
    borderColor: '#08C284',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#CCC',
  },
  toolResult: {
    marginTop: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 8,
  },
  toolResultText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  conversationInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#08C284',
  },
  conversationInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF',
    backgroundColor: '#111',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: '#333',
  },
  conversationSendButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(8, 194, 132, 0.2)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#08C284',
  },
  sendButtonDisabled: {
    backgroundColor: '#111',
    borderColor: '#333',
  },
  stopButton: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#08C284',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(8, 194, 132, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#08C284',
  },
  resetButtonText: {
    fontSize: 13,
    fontWeight: '700',
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
    maxHeight: '85%',
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
    marginBottom: 20,
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
    fontSize: 14,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  classSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  classSelectorButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#1A1A1A',
  },
  classSelectorButtonActive: {
    backgroundColor: 'rgba(8, 194, 132, 0.1)',
  },
  classSelectorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#08C284',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  dismissKeyboardButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
  },
});
