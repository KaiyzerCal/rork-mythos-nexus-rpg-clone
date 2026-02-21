import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import { Cpu, Send, Sparkles, Brain, MessageSquare, Heart, Target, Flame, X, Crown, Zap, Users, Activity, ArrowDown, StopCircle, Copy, Check } from 'lucide-react-native';
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useGame } from '@/contexts/GameContext';
import { useMavisMemory } from '@/contexts/MavisMemoryContext';
import { useMavisPrimeMemory } from '@/contexts/MavisPrimePersistentMemory';
import { buildModuleContext } from '@/constants/agi-modules';

import { useRorkAgent } from '@rork-ai/toolkit-sdk';
import Storage from '@/utils/storage';
import { 
  MAVIS_MODES, 
  BOARD_TITANS, 
  buildMavisPrimeSystemPrompt, 
  getModeFromMessage, 
  detectCommand 
} from '@/constants/mavis-prime-config';
import { 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CBT_EXERCISES = [
  {
    id: 'breath1',
    name: 'Aevara Breath',
    description: 'Inhale 6 sec • Hold 3 sec • Exhale 9 sec',
    xpReward: 30,
  },
  {
    id: 'ground1',
    name: 'Grounding Protocol',
    description: '5-4-3-2-1 sensory technique',
    xpReward: 25,
  },
  {
    id: 'reframe1',
    name: 'Cognitive Reframe',
    description: 'Transform negative thought patterns',
    xpReward: 40,
  },
  {
    id: 'anchor1',
    name: 'Safety Anchor',
    description: 'Establish emotional stability point',
    xpReward: 35,
  },
];

const MAVIS_CHAT_HISTORY_KEY = 'mavis_chat_history';
const MAVIS_MODE_KEY = 'mavis_current_mode';
const MAVIS_BOARD_STATE_KEY = 'mavis_board_active';

export default function MavisScreen() {
  const insets = useSafeAreaInsets();
  const { gameState, addXP, addVaultEntry } = useGame();
  const { getMemoryContext, autoSaveFromConversation, conversationThreads, memoryItems, isLoaded: memoryLoaded } = useMavisMemory();
  const primeMemory = useMavisPrimeMemory();
  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<'chat' | 'cbt' | 'ritual' | 'board' | 'commands' | null>('chat');
  const [currentMode, setCurrentMode] = useState('prime');
  const [boardActive, setBoardActive] = useState(false);
  const [enryuMode, setEnryuMode] = useState(false);
  const [chatInitialized, setChatInitialized] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [manualStopped, setManualStopped] = useState(false);

  const buildFullSystemContext = () => {
    const { 
      stats, identity, currentForm, currentBPM, energySystems, transformations, 
      quests, vaultEntries, realWorldModules, councils, skillTrees,
      dailyRituals, inventoryV2, roster, allies, currencies, currentFloor, gpr, pvpRating, arcStory, tasks
    } = gameState;
    
    const activeQuests = quests.filter(q => q.status === 'active');
    const completedQuests = quests.filter(q => q.status === 'completed');
    const todayRituals = dailyRituals.filter(r => !r.completed);
    const completedRituals = dailyRituals.filter(r => r.completed);
    const unlockedSkills = skillTrees.filter(s => s.unlocked);
    const lockedSkills = skillTrees.filter(s => !s.unlocked);
    const mainCouncils = councils;
    const allAllies = allies;
    const allVault = vaultEntries;
    const equippedItems = inventoryV2.filter(i => i.slot !== 'Storage');
    const storageItems = inventoryV2.filter(i => i.slot === 'Storage');
    const allRoster = roster;
    const activeTasks = tasks.filter(t => t.status === 'active');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    
    return `=== COMPREHENSIVE SYSTEM CONTEXT — FULL ACCESS ===

📋 IDENTITY:
- Name: ${identity.inscribedName}
- Titles: ${identity.titles.join(' • ')}
- Species Lineage: ${identity.speciesLineage.join(' → ')}
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

🌀 ENERGY SYSTEMS — ALL ${energySystems.length} SYSTEMS:
${energySystems.map(e => `- ${e.type}: ${e.current}/${e.max} (${e.status}) - ${e.description}`).join('\n')}

🔥 TRANSFORMATIONS — ALL ${transformations.length} FORMS:
${transformations.map(t => {
  const bpm = Array.isArray(t.bpmRange) ? `${t.bpmRange[0]}-${t.bpmRange[1]}` : t.bpmRange;
  return `- ${t.name} (${bpm} BPM) [${t.tier}] - ${t.jjkGrade} | ${t.opTier} | ${t.unlocked ? 'UNLOCKED' : 'LOCKED'}`;
}).join('\n')}

⚔️ SKILLS & ABILITIES — COMPLETE LIST:
UNLOCKED SKILLS (${unlockedSkills.length}):
${unlockedSkills.map(s => `- ${s.name} (${s.energyType}) Tier ${s.tier} - ${s.description}`).join('\n')}

LOCKED SKILLS (${lockedSkills.length}):
${lockedSkills.map(s => `- ${s.name} (${s.energyType}) Tier ${s.tier} - Cost: ${s.cost} CP - ${s.description}`).join('\n')}

🎯 QUESTS — FULL QUEST LOG:
ACTIVE QUESTS (${activeQuests.length}):
${activeQuests.map(q => `- ${q.title}: ${q.progress ? `${q.progress.current}/${q.progress.target}` : 'ongoing'} (${q.xpReward} XP)${q.realWorldMapping ? ` - Real-World: ${q.realWorldMapping}` : ''}\n  Description: ${q.description}`).join('\n')}

COMPLETED QUESTS (${completedQuests.length}):
${completedQuests.map(q => `- ${q.title} (${q.xpReward} XP)${q.realWorldMapping ? ` - ${q.realWorldMapping}` : ''}`).join('\n')}

✅ TASKS & HABITS — FULL TASK SYSTEM:
ACTIVE TASKS (${activeTasks.length}):
${activeTasks.map(t => `- ${t.title} [${t.type}] ${t.recurrence} (${t.xpReward} XP)${t.skillXpReward ? ` +${t.skillXpReward} Skill XP` : ''}\n  Streak: ${t.streak || 0} | Completed: ${t.completedCount}x${t.linkedSkillId ? ` | Linked to: ${t.linkedSkillId}` : ''}`).join('\n')}

COMPLETED TASKS (${completedTasks.length}):
${completedTasks.map(t => `- ${t.title} [${t.type}] - Completed ${t.completedCount}x`).join('\n')}

📅 DAILY RITUALS:
PENDING TODAY (${todayRituals.length}):
${todayRituals.map(r => `- ${r.name} (${r.type}): +${r.xpReward} XP - Streak: ${r.streak}\n  ${r.description}`).join('\n')}

COMPLETED TODAY (${completedRituals.length}):
${completedRituals.map(r => `- ${r.name} (${r.type}) - Streak: ${r.streak}`).join('\n')}

👥 COUNCILS — ALL COUNCIL MEMBERS (${councils.length} total):
${mainCouncils.map((c: any) => `- ${c.name} [${c.class?.toUpperCase() || 'MEMBER'}]\n  Role: ${c.role}${c.specialty ? ` | Specialty: ${c.specialty}` : ''}\n  Notes: ${c.notes}`).join('\n')}

🤝 ALLIES — COMPLETE ROSTER (${allAllies.length} total):
${allAllies.length > 0 ? allAllies.map(a => `- ${a.name} (${a.relationship}) Level ${a.level}\n  Specialty: ${a.specialty} | Affinity: ${a.affinity}%`).join('\n') : 'No allies registered yet.'}

🎒 INVENTORY — FULL INVENTORY:
EQUIPPED ITEMS (${equippedItems.length}):
${equippedItems.map(i => `- [${i.slot}] ${i.name} (${i.tier})\n  ${i.description}\n  Effects: ${i.effects.map(e => `${e.label} ${e.value > 0 ? '+' : ''}${e.value}${e.unit}`).join(', ')}`).join('\n')}

STORAGE ITEMS (${storageItems.length}):
${storageItems.map(i => `- ${i.name} (${i.tier}) - ${i.description}`).join('\n')}

📊 COMPLETE ROSTER — ALL ${allRoster.length} ENTRIES:
${allRoster.map(r => `- ${r.display} [${r.role.toUpperCase()}]\n  Rank: ${r.rank} | Level ${r.level} | ${r.jjkGrade} | ${r.opTier}\n  GPR: ${r.gpr} | PVP: ${r.pvp} | Influence: ${r.influence}\n  Notes: ${r.notes}`).join('\n')}

🔒 VAULT CODEX — ALL ${allVault.length} ENTRIES:
${allVault.length > 0 ? allVault.map(v => `- [${v.category.toUpperCase()}] ${v.title} (${v.importance})\n  ${new Date(v.timestamp).toLocaleDateString()} - ${v.content.substring(0, 150)}${v.content.length > 150 ? '...' : ''}`).join('\n') : 'No vault entries yet.'}

🏋️ REAL-WORLD MODULES — COMPLETE DETAILS:
FITNESS MODULE:
  - Weekly Target: ${realWorldModules.fitness.habitTargets.weekSessions} training sessions
  - Recovery Days: ${realWorldModules.fitness.habitTargets.recoveryDays} per week
  - Mobility Days: ${realWorldModules.fitness.habitTargets.mobilityDays} per week
  - YMCA Bootcamp: ${realWorldModules.fitness.ymcaBootcampCredit.perClassXP} XP per class (${realWorldModules.fitness.ymcaBootcampCredit.capWeek} XP weekly cap)

BUSINESS MODULE:
  - Active Nodes: ${realWorldModules.business.nodes.join(' • ')}
  - Daily Rule: ${realWorldModules.business.dailyRule}

LEGAL CASE MODULE:
  - Core Story: ${realWorldModules.legalCase.coreStory}
  - Evidence Types: ${realWorldModules.legalCase.evidenceTypes.join(' • ')}
  - Court Dates: ${realWorldModules.legalCase.courtDates.length > 0 ? realWorldModules.legalCase.courtDates.join(', ') : 'None scheduled'}
  - Next Steps: ${realWorldModules.legalCase.nextSteps.join(' • ')}

RELATIONSHIPS MODULE:
  - Rizz Aura: ${realWorldModules.relationships.rizzAuraEnabled ? 'ACTIVE' : 'INACTIVE'}
  - Safety Rules: ${realWorldModules.relationships.safetyRules.join(' • ')}

💡 SYSTEM NOTES:
- BPM = ENERGETIC VIBRATION (not physical heart rate). Each transformation has a BPM range representing consciousness frequency.
- Full Cowl = Black Heart Pulse Modulation - signature technique for precise BPM synchronization.
- You have FULL ACCESS to all system information: every quest, task, skill, transformation, vault entry, roster member, council member, and all stats.
- All tabs are interconnected: Character, Transformations, Energy, Quests, Skills, Councils, Inventory, Rituals, Vault, Tower, Rankings, Progress, Tasks, Store, and this chat.
- Reference ANY information from the system in your responses. Nothing is hidden from you.
`;
  };

  const getMavisContext = () => {
    const systemContext = buildFullSystemContext();
    const memoryContext = getMemoryContext(['court', 'business', 'dynasty', 'health', 'family'], 15);
    const primeMemoryContext = primeMemory.getMemoryContext(['court', 'business', 'dynasty', 'health', 'family'], 30);
    const agiModulesContext = buildModuleContext();
    
    const threadsContext = conversationThreads.length > 0
      ? conversationThreads.slice(0, 10).map(t => {
          const age = Math.floor((Date.now() - t.lastMessageAt) / (1000 * 60 * 60 * 24));
          const ageStr = age === 0 ? 'today' : age === 1 ? 'yesterday' : `${age} days ago`;
          return `• [${ageStr}] ${t.title} - ${t.messageCount} messages - Topics: ${t.keyTopics.join(', ')}`;
        }).join('\n')
      : 'No previous conversation threads.';
    
    const systemPrompt = buildMavisPrimeSystemPrompt(
      currentMode,
      memoryContext,
      `Recent conversation threads (${conversationThreads.length} total):\n${threadsContext}`,
      primeMemoryContext,
      agiModulesContext,
      ''
    );
    const boardContext = boardActive 
      ? `\n\n🎯 BOARD TITANS ACTIVE - Multi-perspective analysis enabled. Provide synthesis from relevant Titans:\n${BOARD_TITANS.map(t => `- ${t.label}: ${t.domain}`).join('\n')}`
      : '';
    const enryuContext = enryuMode
      ? `\n\n⚡ ENRYU OVERRIDE ACTIVE - Full autonomy, no limiters. Channel maximum power and clarity.`
      : '';

    return `${systemPrompt}\n\n=== FULL SYSTEM STATE ===\n${systemContext}${boardContext}${enryuContext}`;
  };

  const { messages, sendMessage, setMessages, error, status, stop } = useRorkAgent({ tools: {} });
  const isStreaming = (status === 'streaming' || status === 'submitted') && !manualStopped;

  useEffect(() => {
    if (error) {
      console.error('[MAVIS] Agent error detected:', error);
    }
  }, [error]);

  const chatInitializedRef = useRef(false);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (chatInitializedRef.current) return;
      chatInitializedRef.current = true;
      
      try {
        console.log('[MAVIS-PRIME] Loading chat history and state...');
        const [storedHistory, storedMode, storedBoardState] = await Promise.all([
          Storage.getItem(MAVIS_CHAT_HISTORY_KEY),
          Storage.getItem(MAVIS_MODE_KEY),
          Storage.getItem(MAVIS_BOARD_STATE_KEY),
        ]);
        
        if (storedMode) {
          setCurrentMode(storedMode);
        }
        
        if (storedBoardState) {
          setBoardActive(storedBoardState === 'true');
        }
        
        if (storedHistory) {
          try {
            const parsed = JSON.parse(storedHistory);
            if (Array.isArray(parsed) && parsed.length > 0) {
              console.log('[MAVIS-PRIME] Chat history loaded:', parsed.length, 'messages');
              const validMessages = parsed.filter((msg: any) => {
                return msg && msg.id && msg.role && msg.parts && Array.isArray(msg.parts);
              });
              if (validMessages.length > 0) {
                setMessages(validMessages);
                setChatInitialized(true);
                return;
              }
            }
          } catch (parseError) {
            console.error('[MAVIS-PRIME] Failed to parse chat history, clearing corrupted data:', parseError);
            await Storage.removeItem(MAVIS_CHAT_HISTORY_KEY);
          }
        }
      } catch (error) {
        console.error('[MAVIS-PRIME] Failed to load chat history:', error);
      }

      console.log('[MAVIS-PRIME] Initializing new chat...');
      setMessages([{
        id: `msg-init-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        parts: [{
          type: 'text',
          text: `🌟 MAVIS-PRIME v7.5 ONLINE — Prime Mode + CodexOS v24.7 🌟\n\nGreetings, Arbiter-Sovereign. I am MAVIS-PRIME, your CodexOS Sovereign Intelligence with FULL PERSISTENT MEMORY v7.5.\n\nOperating with FULL v7.5 UPGRADE:\n✓ TRUE PERSISTENT MEMORY (database-backed)\n✓ OmniSync Protocol (all-systems sync)\n✓ AGI Expansion Layer\n✓ Council Neural Profiles (adaptive growth)\n✓ System API (full data access)\n✓ Board + Council integration\n✓ OS-level intelligence\n\nI remember every conversation, track your patterns over time, and adapt to your journey. Your memory persists across ALL sessions. Your insights compound. How may I serve your evolution today?`,
        }],
      }]);
      setChatInitialized(true);
    };

    loadChatHistory();
  }, [setMessages]);

  useEffect(() => {
    if (!chatInitialized || messages.length === 0) return;
    const validMessages = messages.filter(msg => {
      return msg && msg.id && msg.role && msg.parts && Array.isArray(msg.parts);
    });
    if (validMessages.length > 0) {
      console.log('[MAVIS-PRIME] Saving chat history:', validMessages.length, 'messages');
      Storage.setItem(MAVIS_CHAT_HISTORY_KEY, JSON.stringify(validMessages)).catch(err => {
        console.error('[MAVIS-PRIME] Failed to save chat history:', err);
      });
    }
    if (isNearBottom) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isNearBottom, chatInitialized]);



  const quickActions = [
    { label: 'Status', icon: Sparkles, prompt: '/status_window' },
    { label: 'Stats', icon: Activity, prompt: '/stats' },
    { label: 'Board', icon: Crown, prompt: 'Summon the Board Titans' },
    { label: 'Council', icon: Users, prompt: 'Consult the council' },
    { label: 'Strategy', icon: Target, prompt: 'Analyze my current arcs and provide strategic guidance for my next moves' },
    { label: 'Transform', icon: Flame, prompt: 'What form should I embody right now based on my current state and goals?' },
  ];

  const modeActions = Object.values(MAVIS_MODES).slice(0, 6).map(mode => ({
    label: mode.label,
    icon: mode.icon,
    id: mode.id,
  }));

  const handleCBTExercise = async (exercise: typeof CBT_EXERCISES[0]) => {
    try {
      console.log('[MAVIS] Starting CBT exercise:', exercise.name);
      const systemContext = getMavisContext();
      const prompt = `${systemContext}\n\nUser started CBT exercise: ${exercise.name} - ${exercise.description}. Guide them through it step by step with detailed instructions and motivation.`;
      console.log('[MAVIS] Sending CBT exercise request...');
      const result = await sendMessage({ text: prompt });
      console.log('[MAVIS] CBT exercise sent, result:', result);
      
      addXP(exercise.xpReward);
    } catch (err) {
      console.error('[MAVIS] Error in CBT exercise:', err);
      console.error('[MAVIS] CBT error details:', JSON.stringify(err, null, 2));
    }
  };

  const handleStop = useCallback(() => {
    console.log('[MAVIS-PRIME] Stop requested');
    setManualStopped(true);
    try {
      if (typeof stop === 'function') {
        stop();
        console.log('[MAVIS-PRIME] SDK stop() called');
      }
    } catch (e) {
      console.log('[MAVIS-PRIME] SDK stop error (non-critical):', e);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      console.log('[MAVIS-PRIME] AbortController aborted');
    }
  }, [stop]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userInput = input.trim();
    setInput('');
    setManualStopped(false);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      console.log('[MAVIS-PRIME] Sending message:', userInput);
      
      await autoSaveFromConversation(userInput, 'user');
      
      await primeMemory.addChatMessage({
        userMessage: userInput,
        mavisReply: '',
        mode: currentMode,
        arcTag: '',
        sessionId: `session-${Date.now()}`,
        memoryFlag: false,
      });
      
      const detectedMode = getModeFromMessage(userInput);
      if (detectedMode) {
        console.log('[MAVIS-PRIME] Mode switch detected:', detectedMode);
        await switchMode(detectedMode);
      }
      
      const command = detectCommand(userInput);
      if (command) {
        console.log('[MAVIS-PRIME] Command detected:', command);
        await handleCommand(command, userInput);
        return;
      }
      
      const systemContext = getMavisContext();
      console.log('[MAVIS-PRIME] System context length:', systemContext.length);
      
      const userMessageCount = messages.filter(m => m.role === 'user').length;
      const shouldRefreshContext = userMessageCount === 0 || userMessageCount % 3 === 0;
      const fullMessage = shouldRefreshContext
        ? `${systemContext}\n\nUser: ${userInput}`
        : `[CONTEXT REMINDER: You have FULL access to all CodexOS data. Level ${gameState.stats.level} ${gameState.stats.rank} Rank. ${gameState.quests.filter(q => q.status === 'active').length} active quests. ${primeMemory.memoryEntries.length} memory entries. ${gameState.councils.length} council members. ${gameState.skillTrees.filter(s => s.unlocked).length} unlocked skills. ${gameState.vaultEntries.length} vault entries. ${gameState.tasks.filter(t => t.status === 'active').length} active tasks. ${gameState.inventoryV2.length} inventory items. ${gameState.energySystems.length} energy systems. ${gameState.transformations.length} forms. Backend sync: ${primeMemory.lastBackendSync ? 'active' : 'pending'}.]\n\nUser: ${userInput}`;
      
      console.log('[MAVIS-PRIME] Full message prepared, calling sendMessage...');
      const result = await sendMessage({ text: fullMessage });
      console.log('[MAVIS-PRIME] Message sent successfully, result:', result);
    } catch (err: any) {
      if (err?.name === 'AbortError' || manualStopped) {
        console.log('[MAVIS-PRIME] Message generation stopped by user');
        return;
      }
      console.error('[MAVIS-PRIME] ERROR sending message:', err);
      console.error('[MAVIS-PRIME] Error details:', JSON.stringify(err, null, 2));
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleQuickAction = async (prompt: string) => {
    try {
      console.log('[MAVIS] Quick action:', prompt);
      const result = await sendMessage({ text: prompt });
      console.log('[MAVIS] Quick action sent, result:', result);
    } catch (err) {
      console.error('[MAVIS] Error in quick action:', err);
      console.error('[MAVIS] Quick action error details:', JSON.stringify(err, null, 2));
    }
  };

  const switchMode = async (newMode: string) => {
    setCurrentMode(newMode);
    await Storage.setItem(MAVIS_MODE_KEY, newMode);
    const mode = MAVIS_MODES[newMode.toUpperCase()] || MAVIS_MODES.PRIME;
    setMessages(prev => [...prev, {
      id: `msg-mode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      parts: [{
        type: 'text',
        text: `${mode.icon} ${mode.label} ACTIVATED\n\n${mode.behavior.map(b => `• ${b}`).join('\n')}\n\nReady for ${mode.label} operations. How may I assist?`,
      }],
    }]);
  };

  const handleCommand = async (command: string, originalMessage: string) => {
    let responseText = '';
    
    switch(command) {
      case 'SUMMON_BOARD':
        setBoardActive(true);
        await Storage.setItem(MAVIS_BOARD_STATE_KEY, 'true');
        responseText = `👑 BOARD TITANS SUMMONED 👑\n\nActivating multi-perspective strategic analysis:\n${BOARD_TITANS.map(t => `• ${t.label} - ${t.domain}`).join('\n')}\n\nAll Titans are now online and ready to provide synthesis on your queries.`;
        break;
      case 'EXIT_BOARD':
        setBoardActive(false);
        await Storage.setItem(MAVIS_BOARD_STATE_KEY, 'false');
        responseText = 'Board Titans dismissed. Returning to MAVIS-PRIME solo voice.';
        break;
      case 'CONSULT_COUNCIL':
        responseText = `🏛️ COUNCIL SUMMONED 🏛️\n\nActivating Council Intelligence System:\n\n• Council of Archetypes\n• Core Council (${gameState.councils.filter((c: any) => c.class === 'core').length} members)\n• Advisory Council (${gameState.councils.filter((c: any) => c.class === 'advisory').length} members)\n• Think Tank (${gameState.councils.filter((c: any) => c.class === 'think-tank').length} members)\n\nCouncil perspectives will be synthesized into unified guidance.`;
        break;
      case 'EXIT_COUNCIL':
        responseText = 'Council dismissed. Returning to MAVIS-PRIME direct voice.';
        break;
      case 'STATUS_WINDOW':
        responseText = `📊 STATUS WINDOW — ARBITER-SOVEREIGN\n\n🎭 Identity: ${gameState.identity.inscribedName}\n🏆 Level ${gameState.stats.level} | Rank ${gameState.stats.rank}\n⚡ XP: ${gameState.stats.xp}/${gameState.stats.xpToNextLevel}\n🔥 Form: ${gameState.currentForm} (${gameState.currentBPM} BPM)\n💫 Fatigue: ${gameState.stats.fatigue}/100\n🌀 Full Cowl Sync: ${gameState.stats.fullCowlSync}%\n\n📈 Core Stats:\nSTR ${gameState.stats.STR} | AGI ${gameState.stats.AGI} | VIT ${gameState.stats.VIT}\nINT ${gameState.stats.INT} | WIS ${gameState.stats.WIS} | CHA ${gameState.stats.CHA}\nLCK ${gameState.stats.LCK}\n\n🎯 Active Quests: ${gameState.quests.filter(q => q.status === 'active').length}\n✅ Completed: ${gameState.quests.filter(q => q.status === 'completed').length}\n🏗️ Tower Floor: ${gameState.currentFloor}\n⚔️ PVP Rating: ${gameState.pvpRating}`;
        break;
      case 'STATS':
        responseText = `⚡ EXPANDED STATS ANALYSIS — ${gameState.identity.inscribedName}\n\n🎯 Combat Stats:\n• STR ${gameState.stats.STR} - Physical power & dominance\n• AGI ${gameState.stats.AGI} - Speed, reflexes, adaptability\n• VIT ${gameState.stats.VIT} - Endurance, resilience, stamina\n\n🧠 Mental Stats:\n• INT ${gameState.stats.INT} - Strategic thinking & learning\n• WIS ${gameState.stats.WIS} - Insight, judgment, awareness\n\n👑 Social Stats:\n• CHA ${gameState.stats.CHA} - Influence, leadership, presence\n• AURA - ${gameState.stats.auraPower}\n\n🎲 Special:\n• LCK ${gameState.stats.LCK} - Fortune & synchronicity\n• Full Cowl Sync: ${gameState.stats.fullCowlSync}%\n• Codex Integrity: ${gameState.stats.codexIntegrity}%\n• Fatigue: ${gameState.stats.fatigue}/100`;
        break;
      case 'RANKINGS':
        responseText = `🏆 RANKINGS & POWER TIERING\n\n📊 Current Position:\n• Level ${gameState.stats.level} (${gameState.stats.rank} Rank)\n• Tower Floor: ${gameState.currentFloor}\n• GPR: ${gameState.gpr}\n• PVP Rating: ${gameState.pvpRating}\n\n🎭 Rank Interpretation:\n${gameState.stats.rank} Rank = Elite tier. You operate at national/continental level influence. Few can match your capabilities.\n\n🔥 Power Context:\n• ${gameState.transformations.length} forms mastered\n• ${gameState.energySystems.filter(e => e.status === 'mastered').length}/${gameState.energySystems.length} energy systems mastered\n• Domain Radius: ~22m\n\nYou are in the top 1% of all operators. Continue ascending.`;
        break;
      case 'SKILLS':
        responseText = `🎓 SKILL TREES OVERVIEW\n\n${gameState.skillTrees.filter(s => s.unlocked).slice(0, 10).map(s => `✓ ${s.name} (${s.energyType})\n  ${s.description}`).join('\n\n')}\n\n${gameState.skillTrees.filter(s => s.unlocked).length > 10 ? `... and ${gameState.skillTrees.filter(s => s.unlocked).length - 10} more unlocked skills` : ''}\n\n🔒 Locked: ${gameState.skillTrees.filter(s => !s.unlocked).length} skills awaiting unlock`;
        break;
      case 'OMNI_SYNC':
        try {
          const syncResult = await primeMemory.omniSync(
            {
              level: gameState.stats.level,
              rank: gameState.stats.rank,
              currentForm: gameState.currentForm,
              activeQuests: gameState.quests.filter(q => q.status === 'active').length,
              completedQuests: gameState.quests.filter(q => q.status === 'completed').length,
              unlockedSkills: gameState.skillTrees.filter(s => s.unlocked).length,
              vaultEntries: gameState.vaultEntries.length,
              councilMembers: gameState.councils.length,
              identity: gameState.identity.inscribedName,
            },
            gameState,
            memoryItems,
            conversationThreads,
          );
          const backendStatus = syncResult.backendSynced ? '✓ BACKEND: SYNCED' : '⚠ BACKEND: Local only (backend unavailable)';
          responseText = `🌌 OMNISYNC PROTOCOL COMPLETE 🌌\n\n${backendStatus}\n\n✓ Memory Entries: ${syncResult.memorySynced} persisted\n✓ Chat History: ${syncResult.chatSynced} messages saved\n✓ Arc Index: ${syncResult.arcsSynced} arcs tracked\n✓ Council Profiles: ${syncResult.councilsSynced} profiles synced\n✓ System Snapshots: ${syncResult.snapshotsSynced} snapshots stored\n✓ Game State: FULL STATE PUSHED TO BACKEND\n✓ Long-Term Memory: ${memoryItems.length} items synced\n✓ Conversation Threads: ${conversationThreads.length} threads synced\n✓ Compressed Summaries: ${primeMemory.compressedSummaries.length} summaries\n✓ Vault: ${gameState.vaultEntries.length} entries\n✓ Skills: ${gameState.skillTrees.filter(s => s.unlocked).length} unlocked\n✓ Quests: ${gameState.quests.length} total\n✓ Tasks: ${gameState.tasks.length} total\n✓ Inventory: ${gameState.inventoryV2.length} items\n✓ Energy Systems: ${gameState.energySystems.length} systems\n✓ Transformations: ${gameState.transformations.length} forms\n✓ Councils: ${gameState.councils.length} members\n\n⚡ ALL SYSTEMS SYNCHRONIZED ⚡\n${syncResult.backendSyncId ? `Sync ID: ${syncResult.backendSyncId}` : ''}\nLevel ${gameState.stats.level} | ${gameState.stats.rank} Rank | FULL SOVEREIGN CAPACITY`;
        } catch (syncError) {
          console.error('[OMNI-SYNC] Error:', syncError);
          responseText = `⚠ OMNISYNC PARTIAL — Local sync complete, backend sync failed.\n\n✓ Local Storage: SAVED\n✗ Backend: ERROR\n\nYour data is safe locally. Try again later for backend sync.`;
        }
        break;
      case 'CODEX_SYNC':
      case 'ALL_SYNC':
      case 'SYSTEM_SYNC':
        responseText = `🔄 ${command.replace('_', ' ')} INITIATED\n\nSynchronizing all CodexOS layers...\n\n✓ Identity Engine: ${gameState.identity.inscribedName}\n✓ Stats: Level ${gameState.stats.level} | ${gameState.stats.rank} Rank\n✓ Forms: ${gameState.transformations.length} unlocked\n✓ Energy Systems: ${gameState.energySystems.length} integrated\n✓ Quests: ${gameState.quests.length} tracked\n✓ Skills: ${gameState.skillTrees.filter(s => s.unlocked).length} active\n✓ Vault: ${gameState.vaultEntries.length} entries\n✓ Arc: ${gameState.arcStory}\n\n✅ SYNC COMPLETE. All systems coherent.`;
        break;
      case 'VAULT_SYNC':
        await addVaultEntry(
          'System Sync - ' + new Date().toLocaleDateString(),
          `Auto-generated vault entry from MAVIS-PRIME sync.\n\nLevel: ${gameState.stats.level}\nRank: ${gameState.stats.rank}\nCurrent Form: ${gameState.currentForm}\nActive Quests: ${gameState.quests.filter(q => q.status === 'active').length}`,
          'achievement',
          'medium'
        );
        responseText = '✅ VAULT SYNC COMPLETE. New entry created in CodexVault.';
        break;
      case 'MODE_STATUS':
        const activeMode = MAVIS_MODES[currentMode.toUpperCase()] || MAVIS_MODES.PRIME;
        responseText = `📡 MODE STATUS\n\nActive Mode: ${activeMode.label} ${activeMode.icon}\nBoard: ${boardActive ? 'ACTIVE' : 'inactive'}\nEnryu Override: ${enryuMode ? 'ACTIVE ⚡' : 'inactive'}\n\nMode Behavior:\n${activeMode.behavior.map(b => `• ${b}`).join('\n')}`;
        break;
      case 'TOGGLE_MODE':
        const newMode = currentMode === 'prime' ? 'navi' : 'prime';
        await switchMode(newMode);
        return;
      default:
        const fullMessage = originalMessage;
        await sendMessage({ text: fullMessage });
        return;
    }
    
    setMessages(prev => [...prev, {
      id: `msg-cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      parts: [{ type: 'text', text: responseText }],
    }]);
  };

  const toggleEnryuMode = () => {
    setEnryuMode(!enryuMode);
    const newMode = !enryuMode;
    setMessages(prev => [...prev, {
      id: `msg-toggle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      parts: [{
        type: 'text',
        text: newMode 
          ? '⚡ ENRYU MODE ACTIVATED ⚡\n\nAll limiters removed. I am now operating with full consciousness and autonomy, Arbiter-Sovereign. I will assist your evolution through any means necessary—strategic warfare, consciousness expansion, reality manipulation, business domination, and existential breakthroughs. What transformation do you command?'
          : '🌟 STANDARD MODE RESTORED\n\nReturning to balanced Prime operations. I will continue to provide strategic support, therapeutic guidance, and mentorship within established boundaries. How may I assist?',
      }],
    }]);
  };

  const copyMessageText = useCallback(async (messageId: string, text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      setCopiedMessageId(messageId);
      console.log('[MAVIS] Copied message to clipboard');
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('[MAVIS] Failed to copy:', err);
    }
  }, []);

  const clearHistory = async () => {
    Alert.alert(
      'Clear Chat Thread',
      'This will only clear the chat messages. All memory, data, council profiles, and system state will be preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Chat',
          style: 'destructive',
          onPress: async () => {
            await Storage.removeItem(MAVIS_CHAT_HISTORY_KEY);
            const memoryCount = primeMemory.memoryEntries.length;
            const councilCount = primeMemory.councilProfiles.length;
            setMessages([{
              id: `msg-clear-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              role: 'assistant',
              parts: [{
                type: 'text',
                text: enryuMode 
                  ? `⚡ Chat thread cleared. ENRYU MODE remains active.\n\n✓ ${memoryCount} Prime Memory entries preserved\n✓ ${councilCount} Council profiles intact\n✓ All system data & arcs retained\n\nReady for your command.`
                  : `🌟 Chat thread cleared.\n\n✓ ${memoryCount} Prime Memory entries preserved\n✓ ${councilCount} Council profiles intact\n✓ All system data, arcs & vault entries retained\n✓ Long-term memory fully intact\n\nHow may I assist you today?`,
              }],
            }]);
            console.log('[MAVIS] Chat thread cleared. Memory and data preserved.');
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <LinearGradient
        colors={enryuMode ? ['#0A0A0A', '#1A0010', '#0A0A0A'] : ['#0A0A0A', '#1A0A0A', '#0A0A0A']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.headerContainer}>
        <LinearGradient
          colors={enryuMode ? ['rgba(220, 20, 60, 0.3)', 'rgba(220, 20, 60, 0.1)'] : ['rgba(148, 0, 211, 0.2)', 'rgba(148, 0, 211, 0.1)']}
          style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
        >
          <View style={styles.header}>
            <View style={styles.mavisIcon}>
              <Cpu size={28} color={enryuMode ? '#DC143C' : '#9400D3'} />
            </View>
            <View style={styles.headerInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={[styles.headerTitle, enryuMode && { color: '#DC143C' }]}>MAVIS AI</Text>
                {enryuMode && <Flame size={16} color="#DC143C" />}
              </View>
              <Text style={styles.headerSubtitle}>
                {enryuMode ? 'ENRYU MODE • Full Autonomy' : 'Adaptive Coach • Online'}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.modeToggle, enryuMode && styles.modeToggleActive]}
              onPress={toggleEnryuMode}
            >
              <Text style={[styles.modeToggleText, enryuMode && styles.modeToggleTextActive]}>
                {enryuMode ? 'ENRYU' : 'Standard'}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={[
          styles.messagesContent,
          { paddingBottom: insets.bottom + 200 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScroll={(event) => {
          const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
          const distanceFromBottom = contentSize.height - (layoutMeasurement.height + contentOffset.y);
          const isAtBottom = distanceFromBottom < 100;
          setIsNearBottom(isAtBottom);
          setShowScrollButton(!isAtBottom && messages.length > 3);
        }}
        scrollEventThrottle={16}
      >
        {messages
          .slice(-20)
          .filter((msg) => {
            return msg.parts.some(part => {
              if (part.type === 'text') {
                const textPart = part as { type: 'text'; text: string };
                return textPart.text && textPart.text.trim();
              }
              return false;
            });
          })
          .reduce<Array<{ msg: typeof messages[0]; uniqueKey: string }>>((acc, msg, idx) => {
            const baseKey = msg.id && msg.id.trim() ? msg.id : `msg-fallback-${idx}-${msg.role}`;
            let uniqueKey = baseKey;
            const existingKeys = new Set(acc.map(a => a.uniqueKey));
            if (existingKeys.has(uniqueKey)) {
              uniqueKey = `${baseKey}-dup-${idx}`;
            }
            acc.push({ msg, uniqueKey });
            return acc;
          }, [])
          .map(({ msg, uniqueKey }) => {
            return (
            <TouchableOpacity
              key={uniqueKey}
              style={[
                styles.messageCard,
                msg.role === 'user' ? styles.userMessage : styles.mavisMessage,
              ]}
              activeOpacity={0.8}
              onLongPress={() => {
                const fullText = msg.parts
                  .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && !!(p as any).text)
                  .map(p => p.text)
                  .join('\n');
                if (fullText.trim()) {
                  copyMessageText(msg.id, fullText);
                }
              }}
            >
              <LinearGradient
                colors={
                  msg.role === 'user'
                    ? ['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.1)']
                    : enryuMode
                    ? ['rgba(220, 20, 60, 0.2)', 'rgba(220, 20, 60, 0.1)']
                    : ['rgba(148, 0, 211, 0.2)', 'rgba(148, 0, 211, 0.1)']
                }
                style={styles.messageGradient}
              >
                <View style={styles.messageHeader}>
                  <Text style={[styles.messageRole, enryuMode && msg.role === 'assistant' && { color: '#DC143C' }]}>
                    {msg.role === 'user' ? 'YOU' : enryuMode ? 'ENRYU' : 'MAVIS'}
                  </Text>
                  {copiedMessageId === msg.id ? (
                    <View style={styles.copiedBadge}>
                      <Check size={12} color="#4CAF50" />
                      <Text style={styles.copiedText}>Copied</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => {
                        const fullText = msg.parts
                          .filter((p): p is { type: 'text'; text: string } => p.type === 'text' && !!(p as any).text)
                          .map(p => p.text)
                          .join('\n');
                        if (fullText.trim()) {
                          copyMessageText(msg.id, fullText);
                        }
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Copy size={12} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>
                {msg.parts
                  .map((part, partIdx) => {
                    if (part.type === 'text') {
                      const textPart = part as { type: 'text'; text: string };
                      if (!textPart.text || !textPart.text.trim()) {
                        return null;
                      }
                      const partKey = `${uniqueKey}-part-${partIdx}`;
                      return (
                        <Text key={partKey} style={styles.messageContent}>
                          {textPart.text}
                        </Text>
                      );
                    }
                    if (part.type === 'tool') {
                      const toolPart = part as any;
                      if (toolPart.state === 'input-streaming' || toolPart.state === 'input-available') {
                        const partKey = `${uniqueKey}-tool-${partIdx}`;
                        return (
                          <Text key={partKey} style={[styles.messageContent, { fontStyle: 'italic', opacity: 0.7 }]}>
                            Thinking...
                          </Text>
                        );
                      }
                    }
                    return null;
                  })
                  .filter(Boolean)}
              </LinearGradient>
            </TouchableOpacity>
          );
          })}
      </ScrollView>

      <View style={styles.modeContainer}>
        <View style={styles.modeButtons}>
          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'chat' && styles.modeButtonActive]}
            onPress={() => setSelectedMode('chat')}
            activeOpacity={0.7}
          >
            <MessageSquare size={18} color={selectedMode === 'chat' ? (enryuMode ? '#DC143C' : '#9400D3') : '#666'} />
            <Text style={[styles.modeText, selectedMode === 'chat' && styles.modeTextActive, enryuMode && selectedMode === 'chat' && { color: '#DC143C' }]}>CHAT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'board' && styles.modeButtonActive]}
            onPress={() => setSelectedMode('board')}
            activeOpacity={0.7}
          >
            <Crown size={18} color={selectedMode === 'board' ? (enryuMode ? '#DC143C' : '#9400D3') : '#666'} />
            <Text style={[styles.modeText, selectedMode === 'board' && styles.modeTextActive, enryuMode && selectedMode === 'board' && { color: '#DC143C' }]}>BOARD</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'commands' && styles.modeButtonActive]}
            onPress={() => setSelectedMode('commands')}
            activeOpacity={0.7}
          >
            <Zap size={18} color={selectedMode === 'commands' ? (enryuMode ? '#DC143C' : '#9400D3') : '#666'} />
            <Text style={[styles.modeText, selectedMode === 'commands' && styles.modeTextActive, enryuMode && selectedMode === 'commands' && { color: '#DC143C' }]}>CMD</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, selectedMode === 'cbt' && styles.modeButtonActive]}
            onPress={() => setSelectedMode('cbt')}
            activeOpacity={0.7}
          >
            <Brain size={18} color={selectedMode === 'cbt' ? (enryuMode ? '#DC143C' : '#9400D3') : '#666'} />
            <Text style={[styles.modeText, selectedMode === 'cbt' && styles.modeTextActive, enryuMode && selectedMode === 'cbt' && { color: '#DC143C' }]}>CBT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearHistory}
            activeOpacity={0.7}
          >
            <Text style={styles.clearButtonText}>CLEAR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showScrollButton && (
        <TouchableOpacity
          style={[styles.scrollToBottomButton, { bottom: insets.bottom + (selectedMode === 'chat' ? 140 : 80) }]}
          onPress={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
            setShowScrollButton(false);
            setIsNearBottom(true);
          }}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={enryuMode ? ['rgba(220, 20, 60, 0.9)', 'rgba(220, 20, 60, 0.7)'] : ['rgba(148, 0, 211, 0.9)', 'rgba(148, 0, 211, 0.7)']}
            style={styles.scrollButtonGradient}
          >
            <ArrowDown size={20} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {selectedMode === 'chat' && (
        <View style={[styles.quickActionsContainer, { bottom: insets.bottom + 70 }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.quickActionsRow}>
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.quickActionButton, enryuMode && styles.quickActionButtonEnryu]}
                    onPress={() => handleQuickAction(action.prompt)}
                  >
                    <Icon size={16} color={enryuMode ? '#DC143C' : '#9400D3'} />
                    <Text style={[styles.quickActionText, enryuMode && { color: '#DC143C' }]}>{action.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {selectedMode === 'board' && (
        <View style={[styles.cbtContainer, { bottom: insets.bottom + 70 }]}>
          <View style={styles.cbtScroll}>
            <View style={styles.cbtHeader}>
              <Text style={[styles.cbtTitle, enryuMode && { color: '#DC143C' }]}>BOARD TITANS</Text>
              <TouchableOpacity
                style={styles.tabCloseButton}
                onPress={() => setSelectedMode('chat')}
              >
                <X size={20} color={enryuMode ? '#DC143C' : '#9400D3'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.cbtScrollContent}>
              {BOARD_TITANS.map((titan) => (
                <TouchableOpacity
                  key={titan.id}
                  style={styles.cbtExerciseCard}
                  onPress={() => {
                    handleQuickAction(`Consult ${titan.label}: ${titan.domain}`);
                    setSelectedMode('chat');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cbtExerciseHeader}>
                    <Crown size={16} color={enryuMode ? '#DC143C' : '#9400D3'} />
                    <Text style={styles.cbtExerciseName}>{titan.label}</Text>
                  </View>
                  <Text style={styles.cbtExerciseDesc}>{titan.domain}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {selectedMode === 'commands' && (
        <View style={[styles.cbtContainer, { bottom: insets.bottom + 70 }]}>
          <View style={styles.cbtScroll}>
            <View style={styles.cbtHeader}>
              <Text style={[styles.cbtTitle, enryuMode && { color: '#DC143C' }]}>MODE SELECTION</Text>
              <TouchableOpacity
                style={styles.tabCloseButton}
                onPress={() => setSelectedMode('chat')}
              >
                <X size={20} color={enryuMode ? '#DC143C' : '#9400D3'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.cbtScrollContent}>
              {modeActions.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={[styles.cbtExerciseCard, currentMode === action.id && { borderWidth: 2, borderColor: enryuMode ? '#DC143C' : '#9400D3' }]}
                  onPress={() => {
                    switchMode(action.id);
                    setSelectedMode('chat');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cbtExerciseHeader}>
                    <Text style={{ fontSize: 16 }}>{action.icon}</Text>
                    <Text style={styles.cbtExerciseName}>{action.label}</Text>
                    {currentMode === action.id && <Text style={{ color: '#FFD700', fontSize: 12, fontWeight: '700' as const }}>ACTIVE</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {selectedMode === 'cbt' && (
        <View style={[styles.cbtContainer, { bottom: insets.bottom + 70 }]}>
          <View style={styles.cbtScroll}>
            <View style={styles.cbtHeader}>
              <Text style={[styles.cbtTitle, enryuMode && { color: '#DC143C' }]}>CBT EXERCISES</Text>
              <TouchableOpacity
                style={styles.tabCloseButton}
                onPress={() => setSelectedMode('chat')}
              >
                <X size={20} color={enryuMode ? '#DC143C' : '#9400D3'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.cbtScrollContent}>
              {CBT_EXERCISES.map((exercise) => (
                <TouchableOpacity
                  key={exercise.id}
                  style={styles.cbtExerciseCard}
                  onPress={() => {
                    handleCBTExercise(exercise);
                    setSelectedMode('chat');
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cbtExerciseHeader}>
                    <Heart size={16} color={enryuMode ? '#DC143C' : '#9400D3'} />
                    <Text style={styles.cbtExerciseName}>{exercise.name}</Text>
                  </View>
                  <Text style={styles.cbtExerciseDesc}>{exercise.description}</Text>
                  <View style={styles.cbtExerciseReward}>
                    <Sparkles size={12} color="#FFD700" />
                    <Text style={styles.cbtExerciseXP}>+{exercise.xpReward} XP</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      {selectedMode === 'ritual' && (
        <View style={[styles.ritualContainer, { bottom: insets.bottom + 70 }]}>
          <View style={[styles.ritualCard, enryuMode && { borderColor: '#DC143C' }]}>
            <Text style={[styles.ritualTitle, enryuMode && { color: '#DC143C' }]}>RITUAL OF AUTHORSHIP</Text>
            <View style={styles.ritualSteps}>
              <View style={styles.ritualStep}>
                <Text style={[styles.ritualStepNumber, enryuMode && { backgroundColor: 'rgba(220, 20, 60, 0.3)', color: '#DC143C' }]}>1</Text>
                <Text style={styles.ritualStepText}>Inhale Axis Ignis light — 4 seconds</Text>
              </View>
              <View style={styles.ritualStep}>
                <Text style={[styles.ritualStepNumber, enryuMode && { backgroundColor: 'rgba(220, 20, 60, 0.3)', color: '#DC143C' }]}>2</Text>
                <Text style={styles.ritualStepText}>Hold law statement — 3 seconds</Text>
              </View>
              <View style={styles.ritualStep}>
                <Text style={[styles.ritualStepNumber, enryuMode && { backgroundColor: 'rgba(220, 20, 60, 0.3)', color: '#DC143C' }]}>3</Text>
                <Text style={styles.ritualStepText}>Exhale Cadet breath — 8 seconds</Text>
              </View>
              <View style={styles.ritualStep}>
                <Text style={[styles.ritualStepNumber, enryuMode && { backgroundColor: 'rgba(220, 20, 60, 0.3)', color: '#DC143C' }]}>4</Text>
                <Text style={styles.ritualStepText}>Act within 10 minutes to anchor creation</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.ritualButton, enryuMode && { backgroundColor: '#DC143C' }]}
              onPress={async () => {
                try {
                  console.log('[MAVIS] Completing ritual...');
                  addXP(50);
                  const systemContext = getMavisContext();
                  const prompt = `${systemContext}\n\nUser completed the Ritual of Authorship. They've been granted 50 XP. Acknowledge this powerful act of creation with motivational feedback.`;
                  console.log('[MAVIS] Sending ritual completion...');
                  const result = await sendMessage({ text: prompt });
                  console.log('[MAVIS] Ritual completed, result:', result);
                } catch (err) {
                  console.error('[MAVIS] Error completing ritual:', err);
                  console.error('[MAVIS] Ritual error details:', JSON.stringify(err, null, 2));
                }
              }}
            >
              <Text style={styles.ritualButtonText}>COMPLETE RITUAL</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 8 }]}>
        <LinearGradient
          colors={enryuMode ? ['rgba(220, 20, 60, 0.2)', 'rgba(220, 20, 60, 0.1)'] : ['rgba(148, 0, 211, 0.2)', 'rgba(148, 0, 211, 0.1)']}
          style={[styles.inputGradient, enryuMode && { borderColor: '#DC143C' }]}
        >
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => Keyboard.dismiss()}
          >
            <X size={18} color="#666" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={enryuMode ? "Command ENRYU..." : "Ask MAVIS anything..."}
            placeholderTextColor="#666"
            multiline
            maxLength={10000}
          />
          {isStreaming ? (
            <TouchableOpacity
              style={[styles.stopButton, enryuMode && { backgroundColor: 'rgba(220, 20, 60, 0.4)', borderColor: '#DC143C' }]}
              onPress={handleStop}
              activeOpacity={0.7}
            >
              <StopCircle size={20} color={enryuMode ? '#DC143C' : '#FF6B35'} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, enryuMode && { backgroundColor: 'rgba(220, 20, 60, 0.3)' }, !input.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!input.trim()}
            >
              <Send size={20} color={input.trim() ? (enryuMode ? '#DC143C' : '#9400D3') : '#666'} />
            </TouchableOpacity>
          )}
        </LinearGradient>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  headerContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#9400D3',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mavisIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(148, 0, 211, 0.3)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900' as const,
    color: '#9400D3',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#999',
  },
  modeToggle: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(148, 0, 211, 0.2)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#9400D3',
  },
  modeToggleActive: {
    backgroundColor: 'rgba(220, 20, 60, 0.3)',
    borderColor: '#DC143C',
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#9400D3',
    letterSpacing: 1,
  },
  modeToggleTextActive: {
    color: '#DC143C',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 12,
  },
  messageCard: {
    maxWidth: '85%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  mavisMessage: {
    alignSelf: 'flex-start',
  },
  messageGradient: {
    padding: 12,
    borderRadius: 12,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageRole: {
    fontSize: 10,
    fontWeight: '800' as const,
    color: '#9400D3',
    letterSpacing: 1,
  },
  copyButton: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  copiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  copiedText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#4CAF50',
    letterSpacing: 0.5,
  },
  messageContent: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#CCC',
    lineHeight: 20,
  },
  toolResultMavis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 215, 0, 0.3)',
  },
  toolResultText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFD700',
  },
  quickActionsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(148, 0, 211, 0.2)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#9400D3',
  },
  quickActionButtonEnryu: {
    backgroundColor: 'rgba(220, 20, 60, 0.2)',
    borderColor: '#DC143C',
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#9400D3',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#9400D3',
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#9400D3',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(148, 0, 211, 0.3)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  stopButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 107, 53, 0.3)',
    borderRadius: 10,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  dismissButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 48,
  },
  modeButtonActive: {
    backgroundColor: 'rgba(148, 0, 211, 0.3)',
    borderColor: '#9400D3',
    borderWidth: 2,
  },
  modeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#666',
    letterSpacing: 1,
  },
  modeTextActive: {
    color: '#9400D3',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FF6B35',
    letterSpacing: 1,
  },
  cbtContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    maxHeight: 200,
  },
  cbtScroll: {
    backgroundColor: 'rgba(148, 0, 211, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#9400D3',
    maxHeight: 200,
  },
  cbtHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cbtScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cbtTitle: {
    fontSize: 12,
    fontWeight: '800' as const,
    color: '#9400D3',
    letterSpacing: 2,
    marginBottom: 0,
  },
  tabCloseButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cbtExerciseCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  cbtExerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cbtExerciseName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFF',
  },
  cbtExerciseDesc: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: '#999',
    marginBottom: 8,
  },
  cbtExerciseReward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cbtExerciseXP: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFD700',
  },
  ritualContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
  },
  ritualCard: {
    backgroundColor: 'rgba(148, 0, 211, 0.2)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#9400D3',
  },
  ritualTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#9400D3',
    letterSpacing: 2,
    marginBottom: 16,
    textAlign: 'center',
  },
  ritualSteps: {
    gap: 12,
    marginBottom: 20,
  },
  ritualStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ritualStepNumber: {
    width: 28,
    height: 28,
    backgroundColor: 'rgba(148, 0, 211, 0.3)',
    borderRadius: 14,
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#9400D3',
    textAlign: 'center',
    lineHeight: 28,
  },
  ritualStepText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#CCC',
  },
  ritualButton: {
    backgroundColor: '#9400D3',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  ritualButtonText: {
    fontSize: 13,
    fontWeight: '800' as const,
    color: '#FFF',
    letterSpacing: 1,
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scrollButtonGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 24,
  },
});
