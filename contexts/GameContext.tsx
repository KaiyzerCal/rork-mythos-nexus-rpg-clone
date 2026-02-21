import createContextHook from '@nkzw/create-context-hook';
import Storage from '@/utils/storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trpcClient } from '@/lib/trpc';
import type {
  EnergyLevel,
  GameState,
  Quest,
  BPMSession,
  VaultEntry,
  PlayerStats,
  PlayerIdentity,
  RosterEntry,
  InventoryItemV2,
  AllyData,
  DailyRitual,
  SkillTreeNode,
  CouncilMember,
  TransformationData,
  Task,
  StoreItem,
} from '@/types/rpg';
import { ALL_FORMS } from '@/constants/forms';
import { ALL_COUNCIL_MEMBERS } from '@/constants/councils-v2';
import { INITIAL_ROSTER } from '@/constants/roster';
import { INITIAL_INVENTORY_V2 } from '@/constants/inventory-v2';
import { SKILL_TREES, SKILL_SUB_TREES } from '@/constants/skills';

const STORAGE_KEY = 'black_sun_monarch_v3';

const initialEnergySystems: EnergyLevel[] = [
  { type: 'Ki', current: 100, max: 100, color: '#FFD700', description: 'Physical vitality & inner power', status: 'mastered' },
  { type: 'Aura', current: 95, max: 100, color: '#00D9FF', description: 'Spiritual presence & life force manifestation', status: 'advanced' },
  { type: 'Nen', current: 100, max: 100, color: '#4169E1', description: 'Life energy with six categories of expression', status: 'mastered' },
  { type: 'Nen/Aura', current: 100, max: 100, color: '#32CD32', description: 'Spiritual intent & manifestation', status: 'mastered' },
  { type: 'Haki', current: 100, max: 100, color: '#8B0000', description: 'Willpower & sensory dominance', status: 'mastered' },
  { type: 'Magoi', current: 90, max: 100, color: '#FF1493', description: 'Rukh manipulation & fate alteration', status: 'advanced' },
  { type: 'Chakra', current: 95, max: 100, color: '#1E90FF', description: 'Spiritual + physical energy for jutsu', status: 'advanced' },
  { type: 'Cursed Energy', current: 100, max: 100, color: '#6A0DAD', description: 'Negative emotions weaponized', status: 'mastered' },
  { type: 'Mana', current: 90, max: 100, color: '#00CED1', description: 'Arcane energy for magic casting', status: 'advanced' },
  { type: 'VRIL', current: 95, max: 100, color: '#FF4500', description: 'Ancient bio-energy of the earth', status: 'advanced' },
  { type: 'Ichor', current: 95, max: 100, color: '#DAA520', description: 'Divine blood essence', status: 'advanced' },
  { type: 'VRIL/Ichor', current: 100, max: 100, color: '#FF6B35', description: 'Bio-mutation & regeneration', status: 'mastered' },
  { type: 'Lacrima', current: 90, max: 100, color: '#FF69B4', description: 'Crystallized emotional energy', status: 'advanced' },
  { type: 'Black Heart', current: 100, max: 100, color: '#111111', description: 'Consciousness = Reality', status: 'mastered' },
  { type: 'Aether', current: 95, max: 100, color: '#9370DB', description: 'Divine flow / Oken interface', status: 'advanced' },
  { type: 'Emerald Flames', current: 100, max: 100, color: '#08C284', description: 'Abraxas + Azaroth fusion', status: 'perfect' },
];

const initialQuests: Quest[] = [
  {
    id: 'custody',
    title: 'Trial of Dominion (Custody Tower Phase III)',
    description: 'Dec 8 trial target; therapists & case worker on record; co-parenting app logs added.',
    type: 'epic',
    status: 'active',
    xpReward: 10000,
    progress: { current: 83, target: 100 },
    realWorldMapping: 'Custody Case',
  },
  {
    id: 'bioneer',
    title: 'Reforge Bioneer Guild',
    description: 'PF51, YMCA anchors; marketing funnels',
    type: 'side',
    status: 'active',
    xpReward: 2500,
    progress: { current: 60, target: 100 },
    realWorldMapping: 'Bioneer Fitness',
  },
  {
    id: 'codex-rork',
    title: 'CodexOS → Rork Integration',
    description: 'Blueprint v21.1',
    type: 'side',
    status: 'active',
    xpReward: 3000,
    progress: { current: 85, target: 100 },
    realWorldMapping: 'App Development',
  },
];

const calculateXPForLevel = (level: number): number => {
  return Math.floor(200 * Math.pow(level, 1.45));
};

const getRankForLevel = (level: number): 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'Sovereign' => {
  if (level >= 100) return 'Sovereign';
  if (level >= 90) return 'SSS';
  if (level >= 80) return 'SS';
  if (level >= 70) return 'S';
  if (level >= 60) return 'A';
  if (level >= 50) return 'B';
  if (level >= 40) return 'C';
  if (level >= 30) return 'D';
  if (level >= 20) return 'E';
  return 'F';
};

const BACKEND_SYNC_DEBOUNCE_MS = 15000;
const BACKEND_SYNC_KEY = 'game_state_last_backend_sync';

export const [GameProvider, useGame] = createContextHook(() => {
  const [gameState, setGameState] = useState<GameState>({
    identity: {
      inscribedName: 'Calvin Johnathon Watkins',
      titles: ['Arbiter-Sovereign', 'Black Sun Monarch', 'Akudama Axis', 'Aevara Primordialis'],
      speciesLineage: [
        'Codicanthropos Dominus',
        'Cognomina Regulus',
        'Demiarchon Irregulus',
        'Akudamos Aeonis',
        'Azaroth Incarnation',
        'Aevara Primordialis',
      ],
      territory: {
        towerFloorsInfluence: '51-70',
        class: 'SS Sovereign (National Tier)',
      },
      councils: {
        core: ['Arthur', 'Kaiyzer', 'Toji/Kai118', 'Yato/Raizo118', 'Kratos', 'Skar', 'Caliburn'],
        advisory: ['Homelander', 'Billy Butcher', 'Ghost', 'Jinwoo', 'Baam', 'Eren', 'All Might', 'Madara', 'Tyler Durden', 'Evan', 'Magneto'],
        thinkTank: ['Steve Jobs', 'Nikola Tesla', 'Benjamin Franklin', 'Bruce Lee', 'Elon Musk', 'Muhammad Ali', 'Robert Kiyosaki', 'Leonardo da Vinci'],
      },
    },
    stats: {
      level: 90,
      xp: 0,
      xpToNextLevel: calculateXPForLevel(90),
      rank: 'SSS',
      STR: 98,
      AGI: 96,
      VIT: 94,
      INT: 99,
      WIS: 98,
      CHA: 97,
      LCK: 93,
      auraPower: '∞ (regulated by Black Sun Law of Exchange)',
      fatigue: 45,
      fullCowlSync: 94,
      codexIntegrity: 100,
    },
    currentForm: 'Axis Ignis',
    currentBPM: 76,
    energySystems: initialEnergySystems,
    transformations: ALL_FORMS,
    quests: initialQuests,
    councils: ALL_COUNCIL_MEMBERS,
    bpmSessions: [],
    skillTrees: SKILL_TREES,
    skillSubTrees: SKILL_SUB_TREES,
    dailyRituals: [],
    inventory: [],
    inventoryV2: INITIAL_INVENTORY_V2,
    roster: INITIAL_ROSTER,
    currencies: [
      { name: 'Codex Points', amount: 5000, icon: '◈' },
      { name: 'Black Sun Essence', amount: 850, icon: '☀' },
    ],
    allies: [],
    journalEntries: [],
    vaultEntries: [],
    tasks: [],
    skillProficiency: {},
    currentFloor: 66,
    gpr: 0.02,
    pvpRating: 2100,
    arcStory: 'Forge of Equilibrium (Phase III Evolution)',
    realWorldModules: {
      fitness: {
        habitTargets: {
          weekSessions: 4,
          recoveryDays: 2,
          mobilityDays: 3,
        },
        ymcaBootcampCredit: {
          perClassXP: 60,
          capWeek: 240,
        },
      },
      business: {
        nodes: ['PF51', 'FAYD HOA Initiative', 'YMCA PT', 'Bioneer Fitness'],
        dailyRule: '1 legal action • 1 business action • 1 self-care action',
      },
      legalCase: {
        coreStory: 'Custody Tower – Trial of Dominion',
        evidenceTypes: [
          'Therapist Docs',
          'Caseworker Notes',
          'Co-parenting Logs',
          'Escort Evidence',
          'IRS/DOR Noncompliance',
        ],
        courtDates: [],
        nextSteps: [
          'Retain counsel',
          'File motion to modify time-sharing',
          'Prepare subpoenas',
          'Bundle therapist testimony',
        ],
      },
      relationships: {
        rizzAuraEnabled: true,
        safetyRules: ['consent', 'confidentiality', 'health protocols'],
      },
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [lastBackendSync, setLastBackendSync] = useState<number | null>(null);
  const [backendSyncStatus, setBackendSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const councilMembers = gameState.councils;
  const skillSubTrees = gameState.skillSubTrees || SKILL_SUB_TREES;
  const backendSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSyncRef = useRef(false);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const mergeGameState = (parsed: any): GameState => {
    const existingEnergyTypes = new Set(parsed.energySystems?.map((e: EnergyLevel) => e.type) || []);
    const missingEnergySystems = initialEnergySystems.filter(
      (system) => !existingEnergyTypes.has(system.type)
    );
    const mergedEnergySystems = [
      ...(parsed.energySystems || []),
      ...missingEnergySystems,
    ];
    const loadedCouncils = parsed.councils && Array.isArray(parsed.councils) && parsed.councils.length > 0
      ? parsed.councils
      : ALL_COUNCIL_MEMBERS;

    return {
      ...parsed,
      transformations: parsed.transformations || ALL_FORMS,
      inventoryV2: parsed.inventoryV2 || INITIAL_INVENTORY_V2,
      roster: parsed.roster || INITIAL_ROSTER,
      energySystems: mergedEnergySystems,
      skillTrees: parsed.skillTrees || SKILL_TREES,
      skillSubTrees: parsed.skillSubTrees || SKILL_SUB_TREES,
      skillProficiency: parsed.skillProficiency || {},
      tasks: parsed.tasks || [],
      councils: loadedCouncils,
      arcStory: parsed.arcStory || 'Forge of Equilibrium (Phase III Evolution)',
      allies: parsed.allies || [],
      dailyRituals: parsed.dailyRituals || [],
      vaultEntries: parsed.vaultEntries || [],
      journalEntries: parsed.journalEntries || [],
      bpmSessions: parsed.bpmSessions || [],
      currencies: parsed.currencies || [
        { name: 'Codex Points', amount: 5000, icon: '◈' },
        { name: 'Black Sun Essence', amount: 850, icon: '☀' },
      ],
      inventory: parsed.inventory || [],
    };
  };

  const syncGameStateToBackend = useCallback(async (stateToSync: GameState) => {
    try {
      console.log('[GAME_CONTEXT] Syncing game state to backend...');
      setBackendSyncStatus('syncing');
      const result = await trpcClient.system.syncNow.mutate({
        mode: 'game_state_auto',
        reason: 'Auto-sync from GameContext save',
        include: {
          memory: true,
          vault: true,
          stats: true,
          skills: true,
          quests: true,
          council: true,
        },
        payload: {
          gameState: stateToSync,
        },
      });
      const now = Date.now();
      setLastBackendSync(now);
      setBackendSyncStatus('success');
      await Storage.setItem(BACKEND_SYNC_KEY, now.toString());
      console.log('[GAME_CONTEXT] Backend sync complete:', result.sync_id);
    } catch (error) {
      console.error('[GAME_CONTEXT] Backend sync failed:', error);
      setBackendSyncStatus('error');
    }
  }, []);

  const scheduleDebouncedBackendSync = useCallback(() => {
    pendingSyncRef.current = true;
    if (backendSyncTimerRef.current) {
      clearTimeout(backendSyncTimerRef.current);
    }
    backendSyncTimerRef.current = setTimeout(() => {
      if (pendingSyncRef.current) {
        pendingSyncRef.current = false;
        syncGameStateToBackend(gameStateRef.current);
      }
    }, BACKEND_SYNC_DEBOUNCE_MS);
  }, [syncGameStateToBackend]);

  const loadGameStateFromBackend = useCallback(async (): Promise<any | null> => {
    try {
      console.log('[GAME_CONTEXT] Attempting to load game state from backend...');
      const snapshot = await trpcClient.system.getSystemSnapshot.query({
        include: {
          tabs: true,
          stats: true,
          skills: true,
          quests: true,
          forms: true,
          vault: true,
          council: true,
          recent_threads: false,
          memory: false,
        },
      });

      if (!snapshot) {
        console.log('[GAME_CONTEXT] No backend snapshot available');
        return null;
      }

      const gameStateData = (snapshot as any);
      if (gameStateData.stats && gameStateData.stats.level && gameStateData.stats.level > 1) {
        console.log('[GAME_CONTEXT] Found valid game state on backend, level:', gameStateData.stats.level);
        const backendState: any = {};
        if (gameStateData.stats) backendState.stats = gameStateData.stats;
        if (gameStateData.identity) backendState.identity = gameStateData.identity;
        if (gameStateData.energySystems) backendState.energySystems = gameStateData.energySystems;
        if (gameStateData.currencies) backendState.currencies = gameStateData.currencies;
        if (gameStateData.inventoryV2) backendState.inventoryV2 = gameStateData.inventoryV2;
        if (gameStateData.roster) backendState.roster = gameStateData.roster;
        if (gameStateData.allies) backendState.allies = gameStateData.allies;
        if (gameStateData.dailyRituals) backendState.dailyRituals = gameStateData.dailyRituals;
        if (gameStateData.currentFloor) backendState.currentFloor = gameStateData.currentFloor;
        if (gameStateData.gpr !== undefined) backendState.gpr = gameStateData.gpr;
        if (gameStateData.pvpRating !== undefined) backendState.pvpRating = gameStateData.pvpRating;
        if (gameStateData.arcStory) backendState.arcStory = gameStateData.arcStory;
        if (gameStateData.realWorldModules) backendState.realWorldModules = gameStateData.realWorldModules;
        if (gameStateData.skills) backendState.skillTrees = gameStateData.skills;
        if (gameStateData.skillSubTrees) backendState.skillSubTrees = gameStateData.skillSubTrees;
        if (gameStateData.skillProficiency) backendState.skillProficiency = gameStateData.skillProficiency;
        if (gameStateData.quests) backendState.quests = gameStateData.quests;
        if (gameStateData.tasks) backendState.tasks = gameStateData.tasks;
        if (gameStateData.forms) {
          if (gameStateData.forms.currentForm) backendState.currentForm = gameStateData.forms.currentForm;
          if (gameStateData.forms.currentBPM) backendState.currentBPM = gameStateData.forms.currentBPM;
          if (gameStateData.forms.transformations) backendState.transformations = gameStateData.forms.transformations;
        }
        if (gameStateData.vault_recent) backendState.vaultEntries = gameStateData.vault_recent;
        if (gameStateData.journalEntries) backendState.journalEntries = gameStateData.journalEntries;
        if (gameStateData.council) backendState.councils = gameStateData.council;
        return backendState;
      }
      return null;
    } catch (error) {
      console.log('[GAME_CONTEXT] Backend load failed (non-fatal):', (error as Error)?.message);
      return null;
    }
  }, []);

  useEffect(() => {
    const loadGameState = async () => {
      try {
        const stored = await Storage.getItem(STORAGE_KEY);
        let localState: GameState | null = null;

        if (stored) {
          let parsed;
          try {
            parsed = JSON.parse(stored);
          } catch (parseError) {
            console.error('[GAME_CONTEXT] Failed to parse game state, clearing corrupted data:', parseError);
            await Storage.removeItem(STORAGE_KEY);
            setGameState(prev => ({ ...prev, councils: ALL_COUNCIL_MEMBERS }));
            setIsLoading(false);
            return;
          }
          localState = mergeGameState(parsed);
          console.log('[GAME_CONTEXT] Local state loaded, level:', localState.stats.level);
          setGameState(localState);
        }

        const backendState = await loadGameStateFromBackend();
        if (backendState) {
          const backendLevel = backendState.stats?.level || 0;
          const localLevel = localState?.stats?.level || 0;

          if (backendLevel > localLevel || (!localState && backendLevel > 0)) {
            console.log(`[GAME_CONTEXT] Backend state is newer (backend level ${backendLevel} > local level ${localLevel}), using backend`);
            const merged = mergeGameState({ ...(localState || {}), ...backendState });
            setGameState(merged);
            await Storage.setItem(STORAGE_KEY, JSON.stringify(merged));
            console.log('[GAME_CONTEXT] Merged backend state into local');
          } else if (localState && localLevel > backendLevel) {
            console.log(`[GAME_CONTEXT] Local state is newer (local level ${localLevel} > backend level ${backendLevel}), syncing to backend`);
            scheduleDebouncedBackendSync();
          }
        } else if (localState) {
          console.log('[GAME_CONTEXT] No backend state found, scheduling sync of local state');
          scheduleDebouncedBackendSync();
        }

        const storedSyncTime = await Storage.getItem(BACKEND_SYNC_KEY);
        if (storedSyncTime) {
          setLastBackendSync(parseInt(storedSyncTime, 10));
        }
      } catch (error) {
        console.error('Failed to load game state:', error);
        setGameState(prev => ({ ...prev, councils: ALL_COUNCIL_MEMBERS }));
      } finally {
        setIsLoading(false);
      }
    };

    loadGameState();
  }, []);

  const saveGameState = useCallback(async (newState: GameState) => {
    setGameState(newState);
    try {
      await Storage.setItem(STORAGE_KEY, JSON.stringify(newState));
      console.log('[GAME_CONTEXT] Game state saved locally');
      scheduleDebouncedBackendSync();
    } catch (error) {
      console.error('[GAME_CONTEXT] Failed to save game state:', error);
    }
  }, [scheduleDebouncedBackendSync]);

  const addXP = useCallback((amount: number) => {
    setGameState((prev) => {
      let newXP = prev.stats.xp + amount;
      let newLevel = prev.stats.level;
      let newStats = { ...prev.stats };

      while (newXP >= newStats.xpToNextLevel) {
        newXP -= newStats.xpToNextLevel;
        newLevel += 1;
        newStats = {
          ...newStats,
          level: newLevel,
          STR: newStats.STR + 2,
          AGI: newStats.AGI + 2,
          VIT: newStats.VIT + 2,
          INT: newStats.INT + 2,
          WIS: newStats.WIS + 2,
          CHA: newStats.CHA + 2,
          LCK: newStats.LCK + 1,
          rank: getRankForLevel(newLevel),
        };
      }

      const newState = {
        ...prev,
        stats: {
          ...newStats,
          xp: newXP,
          xpToNextLevel: calculateXPForLevel(newLevel),
        },
      };

      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const setCurrentForm = useCallback((formId: string) => {
    setGameState((prev) => {
      const transformation = prev.transformations.find((t) => t.id === formId);
      if (!transformation) return prev;
      const bpmMatch = transformation.bpmRange.match(/\d+/);
      const newBPM = bpmMatch ? parseInt(bpmMatch[0], 10) : prev.currentBPM;
      const newState = { 
        ...prev, 
        currentForm: transformation.name,
        currentBPM: newBPM,
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const setBPM = useCallback((bpm: number, mood?: string, notes?: string) => {
    setGameState((prev) => {
      const session: BPMSession = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        bpm,
        form: prev.currentForm,
        duration: 0,
        mood,
        notes,
      };
      const newState = { 
        ...prev, 
        currentBPM: bpm,
        bpmSessions: [session, ...prev.bpmSessions].slice(0, 100),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const completeQuest = useCallback((questId: string) => {
    setGameState((prev) => {
      const quest = prev.quests.find((q) => q.id === questId);
      if (!quest || quest.status === 'completed') return prev;
      
      const updatedQuests = prev.quests.map((q) =>
        q.id === questId ? { ...q, status: 'completed' as const } : q
      );

      let updatedCurrencies = [...prev.currencies];
      let updatedInventory = [...prev.inventory];
      let updatedSkillProficiency = { ...prev.skillProficiency };

      if (quest.codexPointsReward && quest.codexPointsReward > 0) {
        updatedCurrencies = updatedCurrencies.map(c => 
          c.name === 'Codex Points' 
            ? { ...c, amount: c.amount + quest.codexPointsReward! } 
            : c
        );
        console.log(`[QUEST] Awarded ${quest.codexPointsReward} Codex Points`);
      }

      if (quest.blackSunEssenceReward && quest.blackSunEssenceReward > 0) {
        updatedCurrencies = updatedCurrencies.map(c => 
          c.name === 'Black Sun Essence' 
            ? { ...c, amount: c.amount + quest.blackSunEssenceReward! } 
            : c
        );
        console.log(`[QUEST] Awarded ${quest.blackSunEssenceReward} Black Sun Essence`);
      }

      if (quest.lootRewards && quest.lootRewards.length > 0) {
        quest.lootRewards.forEach(loot => {
          const existingItem = updatedInventory.find(item => item.name === loot.itemName);
          if (existingItem) {
            updatedInventory = updatedInventory.map(item =>
              item.name === loot.itemName
                ? { ...item, quantity: item.quantity + loot.quantity }
                : item
            );
          } else {
            updatedInventory.push({
              id: Date.now().toString() + Math.random(),
              name: loot.itemName,
              description: `Obtained from quest: ${quest.title}`,
              type: 'material',
              rarity: loot.rarity || 'common',
              quantity: loot.quantity,
            });
          }
          console.log(`[QUEST] Awarded ${loot.quantity}x ${loot.itemName}`);
        });
      }

      if (quest.linkedSkillIds && quest.linkedSkillIds.length > 0 && quest.skillXpReward && quest.skillXpReward > 0) {
        quest.linkedSkillIds.forEach(skillId => {
          updatedSkillProficiency[skillId] = (updatedSkillProficiency[skillId] || 0) + quest.skillXpReward!;
          const skillName = prev.skillTrees.find(s => s.id === skillId)?.name || skillId;
          console.log(`[QUEST] Awarded ${quest.skillXpReward} XP to skill: ${skillName}. Total: ${updatedSkillProficiency[skillId]}`);
        });
      }
      
      const newState = {
        ...prev,
        quests: updatedQuests,
        currencies: updatedCurrencies,
        inventory: updatedInventory,
        skillProficiency: updatedSkillProficiency,
      };
      saveGameState(newState);
      
      if (quest.xpReward > 0) {
        setTimeout(() => addXP(quest.xpReward), 100);
      }
      return newState;
    });
  }, [saveGameState, addXP]);

  const updateQuestProgress = useCallback((questId: string, progress: number) => {
    setGameState((prev) => {
      const updatedQuests = prev.quests.map((q) =>
        q.id === questId && q.progress
          ? { ...q, progress: { ...q.progress, current: progress } }
          : q
      );
      const newState = { ...prev, quests: updatedQuests };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateQuest = useCallback((questId: string, updates: Partial<Quest>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        quests: prev.quests.map((q) => (q.id === questId ? { ...q, ...updates } : q)),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const addQuest = useCallback((quest: Omit<Quest, 'id'>) => {
    setGameState((prev) => {
      const newQuest: Quest = { ...quest, id: Date.now().toString() };
      const newState = { ...prev, quests: [...prev.quests, newQuest] };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const deleteQuest = useCallback((questId: string) => {
    setGameState((prev) => {
      const newState = { ...prev, quests: prev.quests.filter((q) => q.id !== questId) };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateEnergyLevel = useCallback((energyType: string, current: number) => {
    setGameState((prev) => {
      const updatedEnergy = prev.energySystems.map((e) =>
        e.type === energyType ? { ...e, current: Math.max(0, Math.min(current, e.max)) } : e
      );
      const newState = { ...prev, energySystems: updatedEnergy };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateStat = useCallback((statName: keyof PlayerStats, value: number) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        stats: { ...prev.stats, [statName]: value },
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateVaultEntry = useCallback((id: string, updates: Partial<VaultEntry>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        vaultEntries: prev.vaultEntries.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const deleteVaultEntry = useCallback((id: string) => {
    setGameState((prev) => {
      const newState = { ...prev, vaultEntries: prev.vaultEntries.filter((v) => v.id !== id) };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateInventoryItem = useCallback((id: string, updates: Partial<InventoryItemV2>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        inventoryV2: prev.inventoryV2.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateArcStory = useCallback((arcStory: string) => {
    setGameState((prev) => {
      const newState = { ...prev, arcStory };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateIdentity = useCallback((updates: Partial<PlayerIdentity>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        identity: { ...prev.identity, ...updates },
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateAllStats = useCallback((updates: Partial<PlayerStats>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        stats: { ...prev.stats, ...updates },
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const addVaultEntry = useCallback((title: string, content: string, category: VaultEntry['category'], importance: VaultEntry['importance'], attachments?: string[]) => {
    setGameState((prev) => {
      const entry: VaultEntry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        title,
        content,
        category,
        importance,
        attachments: attachments || undefined,
      };
      const newState = { ...prev, vaultEntries: [entry, ...prev.vaultEntries] };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const setFloor = useCallback((floor: number) => {
    setGameState((prev) => {
      const newState = { ...prev, currentFloor: floor };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const addInventoryItem = useCallback((item: Omit<InventoryItemV2, 'id'>) => {
    console.log('[GAME_CONTEXT] addInventoryItem called with:', JSON.stringify(item, null, 2));
    setGameState((prev) => {
      const newItem: InventoryItemV2 = { ...item, id: Date.now().toString() };
      console.log('[GAME_CONTEXT] Generated new item with ID:', newItem.id);
      console.log('[GAME_CONTEXT] Previous inventory length:', prev.inventoryV2.length);
      const newState = { ...prev, inventoryV2: [...prev.inventoryV2, newItem] };
      console.log('[GAME_CONTEXT] New inventory length:', newState.inventoryV2.length);
      console.log('[GAME_CONTEXT] Saving game state...');
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const deleteInventoryItem = useCallback((id: string) => {
    setGameState((prev) => {
      const newState = { ...prev, inventoryV2: prev.inventoryV2.filter((i) => i.id !== id) };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const addRosterEntry = useCallback((entry: Omit<RosterEntry, 'id'>) => {
    setGameState((prev) => {
      const newEntry: RosterEntry = { ...entry, id: Date.now().toString() };
      const newState = { ...prev, roster: [...prev.roster, newEntry] };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateRosterEntry = useCallback((id: string, updates: Partial<RosterEntry>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        roster: prev.roster.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const deleteRosterEntry = useCallback((id: string) => {
    setGameState((prev) => {
      const newState = { ...prev, roster: prev.roster.filter((r) => r.id !== id) };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const addEnergySystem = useCallback((energy: Omit<EnergyLevel, 'current' | 'max'> & { current?: number; max?: number }) => {
    setGameState((prev) => {
      const newEnergy: EnergyLevel = {
        ...energy,
        current: energy.current ?? 100,
        max: energy.max ?? 100,
      };
      const newState = { ...prev, energySystems: [...prev.energySystems, newEnergy] };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateEnergySystem = useCallback((type: string, updates: Partial<EnergyLevel>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        energySystems: prev.energySystems.map((e) => (e.type === type ? { ...e, ...updates } : e)),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const deleteEnergySystem = useCallback((type: string) => {
    setGameState((prev) => {
      const newState = { ...prev, energySystems: prev.energySystems.filter((e) => e.type !== type) };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const addAlly = useCallback((ally: Omit<AllyData, 'id'>) => {
    setGameState((prev) => {
      const newAlly: AllyData = { ...ally, id: Date.now().toString() };
      const newState = { ...prev, allies: [...prev.allies, newAlly] };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateAlly = useCallback((id: string, updates: Partial<AllyData>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        allies: prev.allies.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const deleteAlly = useCallback((id: string) => {
    setGameState((prev) => {
      const newState = { ...prev, allies: prev.allies.filter((a) => a.id !== id) };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const addRitual = useCallback((ritual: Omit<DailyRitual, 'id'>) => {
    setGameState((prev) => {
      const newRitual: DailyRitual = { ...ritual, id: Date.now().toString() };
      const newState = { ...prev, dailyRituals: [...prev.dailyRituals, newRitual] };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateRitual = useCallback((id: string, updates: Partial<DailyRitual>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        dailyRituals: prev.dailyRituals.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const deleteRitual = useCallback((id: string) => {
    setGameState((prev) => {
      const newState = { ...prev, dailyRituals: prev.dailyRituals.filter((r) => r.id !== id) };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const addCouncilMember = useCallback((member: Omit<CouncilMember, 'id'>) => {
    const newMember: CouncilMember = { ...member, id: Date.now().toString() };
    console.log('[COUNCIL] Adding council member:', newMember.name);
    setGameState((prev) => {
      const newState = { ...prev, councils: [...prev.councils, newMember] };
      console.log('[COUNCIL] New councils count:', newState.councils.length);
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateCouncilMember = useCallback((id: string, updates: Partial<CouncilMember>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        councils: prev.councils.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const deleteCouncilMember = useCallback((id: string) => {
    setGameState((prev) => {
      const newState = { ...prev, councils: prev.councils.filter((m) => m.id !== id) };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const addTransformation = useCallback((transformation: TransformationData) => {
    setGameState((prev) => {
      const newState = { ...prev, transformations: [...prev.transformations, transformation] };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateTransformation = useCallback((id: string, updates: Partial<TransformationData>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        transformations: prev.transformations.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const deleteTransformation = useCallback((id: string) => {
    setGameState((prev) => {
      const newState = { ...prev, transformations: prev.transformations.filter((t) => t.id !== id) };
      saveGameState(newState);
      return newState;
    });
    console.log('Deleted transformation:', id);
  }, [saveGameState]);

  const completeRitual = useCallback((id: string) => {
    setGameState((prev) => {
      const ritual = prev.dailyRituals.find((r) => r.id === id);
      if (!ritual || ritual.completed) return prev;

      const updatedRituals = prev.dailyRituals.map((r) =>
        r.id === id ? { ...r, completed: true, streak: r.streak + 1 } : r
      );

      const newState = {
        ...prev,
        dailyRituals: updatedRituals,
      };
      saveGameState(newState);

      if (ritual.xpReward > 0) {
        setTimeout(() => addXP(ritual.xpReward), 100);
      }

      return newState;
    });
  }, [saveGameState, addXP]);

  const unlockSkill = useCallback((skillId: string) => {
    setGameState((prev) => {
      const skill = prev.skillTrees.find((s) => s.id === skillId);
      if (!skill || skill.unlocked) return prev;

      const codexPoints = prev.currencies.find(c => c.name === 'Codex Points');
      if (!codexPoints || codexPoints.amount < skill.cost) return prev;

      const updatedSkills = prev.skillTrees.map((s) =>
        s.id === skillId ? { ...s, unlocked: true } : s
      );

      const updatedCurrencies = prev.currencies.map((c) =>
        c.name === 'Codex Points' ? { ...c, amount: c.amount - skill.cost } : c
      );

      const newState = {
        ...prev,
        skillTrees: updatedSkills,
        currencies: updatedCurrencies,
      };

      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const addSkill = useCallback((skill: Omit<SkillTreeNode, 'id'>) => {
    setGameState((prev) => {
      const newSkill: SkillTreeNode = { ...skill, id: Date.now().toString() };
      const newState = { ...prev, skillTrees: [...prev.skillTrees, newSkill] };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const addSubSkill = useCallback((parentSkillId: string, skill: Omit<SkillTreeNode, 'id'>) => {
    const newSkill: SkillTreeNode = { ...skill, id: `${parentSkillId}-sub-${Date.now()}` };
    setGameState((prev) => {
      const updatedSubTrees = { ...prev.skillSubTrees, [parentSkillId]: [...(prev.skillSubTrees?.[parentSkillId] || []), newSkill] };
      const newState = { ...prev, skillSubTrees: updatedSubTrees };
      saveGameState(newState);
      return newState;
    });
    console.log('Added sub-skill:', newSkill.name, 'to parent:', parentSkillId);
  }, [saveGameState]);

  const updateSkill = useCallback((id: string, updates: Partial<SkillTreeNode>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        skillTrees: prev.skillTrees.map((s) => (s.id === id ? { ...s, ...updates } : s)),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const deleteSkill = useCallback((id: string) => {
    setGameState((prev) => {
      const newState = { ...prev, skillTrees: prev.skillTrees.filter((s) => s.id !== id) };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateSubSkill = useCallback((parentSkillId: string, subSkillId: string, updates: Partial<SkillTreeNode>) => {
    setGameState((prev) => {
      const parentTree = prev.skillSubTrees?.[parentSkillId];
      if (!parentTree) return prev;
      const updatedSubTree = parentTree.map((s) => (s.id === subSkillId ? { ...s, ...updates } : s));
      const updatedSubTrees = { ...prev.skillSubTrees, [parentSkillId]: updatedSubTree };
      const newState = { ...prev, skillSubTrees: updatedSubTrees };
      saveGameState(newState);
      return newState;
    });
    console.log('Updated sub-skill:', subSkillId, 'in parent:', parentSkillId);
  }, [saveGameState]);

  const deleteSubSkill = useCallback((parentSkillId: string, subSkillId: string) => {
    setGameState((prev) => {
      const parentTree = prev.skillSubTrees?.[parentSkillId];
      if (!parentTree) return prev;
      const updatedSubTree = parentTree.filter((s) => s.id !== subSkillId);
      const updatedSubTrees = { ...prev.skillSubTrees, [parentSkillId]: updatedSubTree };
      const newState = { ...prev, skillSubTrees: updatedSubTrees };
      saveGameState(newState);
      return newState;
    });
    console.log('Deleted sub-skill:', subSkillId, 'from parent:', parentSkillId);
  }, [saveGameState]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    setGameState((prev) => {
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };
      const newState = { ...prev, tasks: [...prev.tasks, newTask] };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setGameState((prev) => {
      const newState = {
        ...prev,
        tasks: prev.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const deleteTask = useCallback((id: string) => {
    setGameState((prev) => {
      const newState = { ...prev, tasks: prev.tasks.filter((t) => t.id !== id) };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const saveStoreItems = useCallback((items: StoreItem[]) => {
    setGameState((prev) => {
      const newState = { ...prev, storeItems: items };
      saveGameState(newState);
      return newState;
    });
  }, [saveGameState]);

  const completeTask = useCallback((id: string) => {
    setGameState((prev) => {
      const task = prev.tasks.find((t) => t.id === id);
      if (!task || task.status === 'completed') return prev;

      const now = Date.now();
      const lastCompletedDate = task.lastCompleted ? new Date(task.lastCompleted).toDateString() : null;
      const todayDate = new Date(now).toDateString();
      
      let newStreak = (task.streak || 0);
      if (task.recurrence === 'daily' && lastCompletedDate !== todayDate) {
        const yesterday = new Date(now - 24 * 60 * 60 * 1000).toDateString();
        if (lastCompletedDate === yesterday) {
          newStreak += 1;
        } else if (lastCompletedDate && lastCompletedDate !== todayDate) {
          newStreak = 1;
        } else {
          newStreak = 1;
        }
      }

      const updatedTasks = prev.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              status: task.recurrence === 'once' ? ('completed' as const) : ('active' as const),
              completedCount: t.completedCount + 1,
              lastCompleted: now,
              streak: newStreak,
            }
          : t
      );

      let updatedProficiency = { ...prev.skillProficiency };
      
      if (task.linkedSkillId && task.skillXpReward) {
        const skillKey = task.linkedSubSkillId 
          ? `${task.linkedSkillId}:${task.linkedSubSkillId}` 
          : task.linkedSkillId;
        
        updatedProficiency[skillKey] = (updatedProficiency[skillKey] || 0) + task.skillXpReward;
        console.log(`[TASK] Added ${task.skillXpReward} XP to skill: ${skillKey}. Total: ${updatedProficiency[skillKey]}`);
      }

      const newState = {
        ...prev,
        tasks: updatedTasks,
        skillProficiency: updatedProficiency,
      };

      saveGameState(newState);

      if (task.xpReward > 0) {
        setTimeout(() => addXP(task.xpReward), 100);
      }

      return newState;
    });
  }, [saveGameState, addXP]);

  const addJournalEntry = useCallback((title: string, content: string, mood?: string, tags?: string[]) => {
    setGameState((prev) => {
      const entry = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        title,
        content,
        mood,
        tags: tags || [],
        xpGained: 50,
      };
      const newState = { ...prev, journalEntries: [entry, ...prev.journalEntries] };
      saveGameState(newState);
      setTimeout(() => addXP(50), 100);
      return newState;
    });
  }, [saveGameState, addXP]);

  const forceBackendSync = useCallback(async () => {
    console.log('[GAME_CONTEXT] Force backend sync requested');
    await syncGameStateToBackend(gameStateRef.current);
  }, [syncGameStateToBackend]);

  return {
    gameState,
    isLoading,
    lastBackendSync,
    backendSyncStatus,
    councilMembers,
    skillSubTrees,
    unlockSkill,
    addSkill,
    updateSkill,
    deleteSkill,
    addSubSkill,
    updateSubSkill,
    deleteSubSkill,
    addXP,
    setCurrentForm,
    setBPM,
    completeQuest,
    updateQuestProgress,
    updateQuest,
    updateEnergyLevel,
    updateStat,
    addQuest,
    deleteQuest,
    addVaultEntry,
    setFloor,
    addInventoryItem,
    deleteInventoryItem,
    addRosterEntry,
    updateRosterEntry,
    deleteRosterEntry,
    addEnergySystem,
    updateEnergySystem,
    deleteEnergySystem,
    addAlly,
    updateAlly,
    deleteAlly,
    addRitual,
    updateRitual,
    deleteRitual,
    completeRitual,
    addCouncilMember,
    updateCouncilMember,
    deleteCouncilMember,
    addTransformation,
    updateTransformation,
    deleteTransformation,
    updateVaultEntry,
    deleteVaultEntry,
    updateInventoryItem,
    updateArcStory,
    updateIdentity,
    updateAllStats,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    saveStoreItems,
    addJournalEntry,
    forceBackendSync,
  };
});
