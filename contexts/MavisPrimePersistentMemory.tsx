import Storage from '@/utils/storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { trpcClient } from '@/lib/trpc';

export interface PrimeMemoryEntry {
  id: string;
  timestamp: number;
  memoryType: 'court_arc' | 'business_arc' | 'family' | 'health' | 'identity' | 'preference' | 'breakthrough' | 'council_insight' | 'board_decision';
  memoryKey: string;
  memoryValue: string;
  lastUpdated: number;
  importance: 1 | 2 | 3;
  arc?: string;
  relatedQuests?: string[];
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  timestamp: number;
  userMessage: string;
  mavisReply: string;
  mode: string;
  arcTag?: string;
  sessionId: string;
  memoryFlag: boolean;
}

export interface ArcIndex {
  id: string;
  arcName: string;
  status: 'active' | 'paused' | 'completed';
  lastEvent: number;
  notes: string;
}

export interface CouncilProfile {
  id: string;
  councilId: string;
  name: string;
  class: 'core' | 'advisory' | 'think-tank' | 'shadows';
  episodicMemory: string[];
  semanticMemory: Record<string, string>;
  growthLevel: number;
  lastUpdated: number;
  domainAuthority: string[];
}

export interface SystemSnapshot {
  id: string;
  timestamp: number;
  level: number;
  rank: string;
  currentForm: string;
  activeQuests: number;
  completedQuests: number;
  unlockedSkills: number;
  vaultEntries: number;
  councilMembers: number;
  identity: string;
}

interface CompressedMemorySummary {
  id: string;
  timestamp: number;
  period: string;
  keyFacts: string[];
  importantDecisions: string[];
  emotionalPatterns: string[];
  activeArcs: string[];
  compressedFrom: number;
}

interface MavisPrimeMemoryState {
  memoryEntries: PrimeMemoryEntry[];
  chatHistory: ChatMessage[];
  arcIndex: ArcIndex[];
  councilProfiles: CouncilProfile[];
  systemSnapshots: SystemSnapshot[];
  compressedSummaries: CompressedMemorySummary[];
  isLoaded: boolean;
  lastBackendSync: number | null;
  backendSyncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

const PRIME_MEMORY_KEY = 'mavis_prime_memory_core_v7_5';
const PRIME_CHAT_KEY = 'mavis_prime_chat_history_v7_5';
const PRIME_ARCS_KEY = 'mavis_prime_arc_index_v7_5';
const PRIME_COUNCIL_PROFILES_KEY = 'mavis_prime_council_profiles_v7_5';
const PRIME_SNAPSHOTS_KEY = 'mavis_prime_system_snapshots_v7_5';
const PRIME_COMPRESSED_KEY = 'mavis_prime_compressed_summaries_v1';
const PRIME_BACKEND_SYNC_KEY = 'mavis_prime_last_backend_sync';

const COMPRESSION_THRESHOLD = 5000;
const COMPRESSION_TARGET = 3000;
const AUTO_SYNC_INTERVAL_MS = 60000;
const MEMORY_SYNC_DEBOUNCE_MS = 10000;

export const [MavisPrimeMemoryProvider, useMavisPrimeMemory] = createContextHook(() => {
  const [state, setState] = useState<MavisPrimeMemoryState>({
    memoryEntries: [],
    chatHistory: [],
    arcIndex: [],
    councilProfiles: [],
    systemSnapshots: [],
    compressedSummaries: [],
    isLoaded: false,
    lastBackendSync: null,
    backendSyncStatus: 'idle',
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const memorySyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSyncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingMemorySyncRef = useRef(false);

  useEffect(() => {
    loadAllMemory();
  }, []);

  const loadAllMemory = async () => {
    try {
      console.log('[PRIME-MEMORY] Loading all memory systems...');
      const [
        storedMemory,
        storedChat,
        storedArcs,
        storedCouncils,
        storedSnapshots,
        storedCompressed,
        storedLastSync,
      ] = await Promise.all([
        Storage.getItem(PRIME_MEMORY_KEY),
        Storage.getItem(PRIME_CHAT_KEY),
        Storage.getItem(PRIME_ARCS_KEY),
        Storage.getItem(PRIME_COUNCIL_PROFILES_KEY),
        Storage.getItem(PRIME_SNAPSHOTS_KEY),
        Storage.getItem(PRIME_COMPRESSED_KEY),
        Storage.getItem(PRIME_BACKEND_SYNC_KEY),
      ]);

      let memoryEntries: PrimeMemoryEntry[] = [];
      let chatHistory: ChatMessage[] = [];
      let arcIndex: ArcIndex[] = [];
      let councilProfiles: CouncilProfile[] = [];
      let systemSnapshots: SystemSnapshot[] = [];
      let compressedSummaries: CompressedMemorySummary[] = [];
      let lastBackendSync: number | null = null;

      try { memoryEntries = storedMemory ? JSON.parse(storedMemory) : []; } catch { memoryEntries = []; }
      try { chatHistory = storedChat ? JSON.parse(storedChat) : []; } catch { chatHistory = []; }
      try { arcIndex = storedArcs ? JSON.parse(storedArcs) : []; } catch { arcIndex = []; }
      try { councilProfiles = storedCouncils ? JSON.parse(storedCouncils) : []; } catch { councilProfiles = []; }
      try { systemSnapshots = storedSnapshots ? JSON.parse(storedSnapshots) : []; } catch { systemSnapshots = []; }
      try { compressedSummaries = storedCompressed ? JSON.parse(storedCompressed) : []; } catch { compressedSummaries = []; }
      try { lastBackendSync = storedLastSync ? parseInt(storedLastSync, 10) : null; } catch { lastBackendSync = null; }

      console.log('[PRIME-MEMORY] Loaded from local storage:');
      console.log(`  - ${memoryEntries.length} memory entries`);
      console.log(`  - ${chatHistory.length} chat messages`);
      console.log(`  - ${arcIndex.length} arc indexes`);
      console.log(`  - ${councilProfiles.length} council profiles`);
      console.log(`  - ${systemSnapshots.length} system snapshots`);
      console.log(`  - ${compressedSummaries.length} compressed summaries`);
      console.log(`  - Last backend sync: ${lastBackendSync ? new Date(lastBackendSync).toISOString() : 'never'}`);

      setState({
        memoryEntries,
        chatHistory,
        arcIndex,
        councilProfiles,
        systemSnapshots,
        compressedSummaries,
        isLoaded: true,
        lastBackendSync,
        backendSyncStatus: 'idle',
      });

      tryLoadFromBackend(memoryEntries, chatHistory, arcIndex, councilProfiles, systemSnapshots);
    } catch (error) {
      console.error('[PRIME-MEMORY] Failed to load memory:', error);
      setState({
        memoryEntries: [],
        chatHistory: [],
        arcIndex: [],
        councilProfiles: [],
        systemSnapshots: [],
        compressedSummaries: [],
        isLoaded: true,
        lastBackendSync: null,
        backendSyncStatus: 'idle',
      });
    }
  };

  const tryLoadFromBackend = async (
    localMemory: PrimeMemoryEntry[],
    localChat: ChatMessage[],
    localArcs: ArcIndex[],
    localCouncils: CouncilProfile[],
    localSnapshots: SystemSnapshot[],
  ) => {
    try {
      console.log('[PRIME-MEMORY] Attempting to load ALL data from backend...');
      const snapshot = await trpcClient.system.getSystemSnapshot.query({
        include: { memory: true, recent_threads: true, tabs: false, stats: false, skills: false, quests: false, forms: false, vault: false, council: false },
      });

      if (!snapshot) {
        console.log('[PRIME-MEMORY] No backend snapshot available');
        return;
      }

      const snapshotData = snapshot as any;
      const backendMemory: PrimeMemoryEntry[] = snapshotData.memory_entries || [];
      const backendLTM: any[] = snapshotData.long_term_memory || [];
      const backendThreads: any[] = snapshotData.threads_recent || [];
      let hasUpdates = false;

      if (backendMemory.length > 0) {
        const localIds = new Set(localMemory.map(m => m.id));
        const newEntries = backendMemory.filter((m: any) => !localIds.has(m.id));
        if (newEntries.length > 0) {
          const merged = [...localMemory, ...newEntries].sort((a, b) => b.lastUpdated - a.lastUpdated);
          setState(prev => ({ ...prev, memoryEntries: merged }));
          await saveMemoryEntries(merged);
          console.log(`[PRIME-MEMORY] Merged ${newEntries.length} new memory entries from backend. Total: ${merged.length}`);
          hasUpdates = true;
        }
      }

      if (backendLTM.length > 0) {
        console.log(`[PRIME-MEMORY] Backend has ${backendLTM.length} long-term memory items`);
        const ltmAsMemory: PrimeMemoryEntry[] = backendLTM
          .filter((item: any) => item.memoryKey || item.key)
          .map((item: any) => ({
            id: item.id || `ltm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: item.timestamp || Date.now(),
            memoryType: item.memoryType || 'preference' as const,
            memoryKey: item.memoryKey || item.key || '',
            memoryValue: item.memoryValue || item.value || '',
            lastUpdated: item.lastUpdated || Date.now(),
            importance: item.importance || 2 as const,
            arc: item.arc,
            tags: item.tags || [],
          }));

        if (ltmAsMemory.length > 0) {
          const currentEntries = stateRef.current.memoryEntries;
          const existingIds = new Set(currentEntries.map(m => m.id));
          const newLTM = ltmAsMemory.filter(m => !existingIds.has(m.id));
          if (newLTM.length > 0) {
            const merged = [...currentEntries, ...newLTM].sort((a, b) => b.lastUpdated - a.lastUpdated);
            setState(prev => ({ ...prev, memoryEntries: merged }));
            await saveMemoryEntries(merged);
            console.log(`[PRIME-MEMORY] Merged ${newLTM.length} long-term memory items from backend`);
            hasUpdates = true;
          }
        }
      }

      if (backendThreads.length > 0 && backendThreads.length > localChat.length) {
        console.log(`[PRIME-MEMORY] Backend has ${backendThreads.length} thread records`);
      }

      console.log('[PRIME-MEMORY] Backend load complete. Had updates:', hasUpdates);
    } catch (error) {
      console.log('[PRIME-MEMORY] Backend load skipped (not available):', (error as Error)?.message || 'unknown');
    }
  };

  const saveMemoryEntries = async (entries: PrimeMemoryEntry[]) => {
    try {
      const sorted = entries
        .sort((a, b) => {
          if (a.importance !== b.importance) return b.importance - a.importance;
          return b.lastUpdated - a.lastUpdated;
        });
      await Storage.setItem(PRIME_MEMORY_KEY, JSON.stringify(sorted));
      console.log('[PRIME-MEMORY] Saved', sorted.length, 'memory entries locally (unlimited)');
    } catch (error) {
      console.error('[PRIME-MEMORY] Failed to save memory entries:', error);
    }
  };

  const saveChatHistory = async (chat: ChatMessage[]) => {
    try {
      const sorted = chat
        .sort((a, b) => b.timestamp - a.timestamp);
      await Storage.setItem(PRIME_CHAT_KEY, JSON.stringify(sorted));
      console.log('[PRIME-MEMORY] Saved', sorted.length, 'chat messages locally (unlimited)');
    } catch (error) {
      console.error('[PRIME-MEMORY] Failed to save chat history:', error);
    }
  };

  const saveArcIndex = async (arcs: ArcIndex[]) => {
    try {
      const sorted = arcs
        .sort((a, b) => b.lastEvent - a.lastEvent);
      await Storage.setItem(PRIME_ARCS_KEY, JSON.stringify(sorted));
      console.log('[PRIME-MEMORY] Saved', sorted.length, 'arc indexes locally (unlimited)');
    } catch (error) {
      console.error('[PRIME-MEMORY] Failed to save arc index:', error);
    }
  };

  const saveCouncilProfiles = async (profiles: CouncilProfile[]) => {
    try {
      await Storage.setItem(PRIME_COUNCIL_PROFILES_KEY, JSON.stringify(profiles));
      console.log('[PRIME-MEMORY] Saved', profiles.length, 'council profiles locally (unlimited)');
    } catch (error) {
      console.error('[PRIME-MEMORY] Failed to save council profiles:', error);
    }
  };

  const saveSystemSnapshots = async (snapshots: SystemSnapshot[]) => {
    try {
      const sorted = snapshots
        .sort((a, b) => b.timestamp - a.timestamp);
      await Storage.setItem(PRIME_SNAPSHOTS_KEY, JSON.stringify(sorted));
      console.log('[PRIME-MEMORY] Saved', sorted.length, 'system snapshots locally (unlimited)');
    } catch (error) {
      console.error('[PRIME-MEMORY] Failed to save system snapshots:', error);
    }
  };

  const saveCompressedSummaries = async (summaries: CompressedMemorySummary[]) => {
    try {
      await Storage.setItem(PRIME_COMPRESSED_KEY, JSON.stringify(summaries));
      console.log('[PRIME-MEMORY] Saved', summaries.length, 'compressed summaries');
    } catch (error) {
      console.error('[PRIME-MEMORY] Failed to save compressed summaries:', error);
    }
  };

  const compressMemory = useCallback(async () => {
    const currentEntries = stateRef.current.memoryEntries;
    if (currentEntries.length < COMPRESSION_THRESHOLD) {
      console.log('[MEMORY-COMPRESS] Below threshold, no compression needed');
      return;
    }

    console.log(`[MEMORY-COMPRESS] Compressing memory: ${currentEntries.length} entries -> target ${COMPRESSION_TARGET}`);

    const sorted = [...currentEntries].sort((a, b) => {
      const importanceWeight = (b.importance - a.importance) * 1000000000;
      const recencyWeight = b.lastUpdated - a.lastUpdated;
      return importanceWeight + recencyWeight;
    });

    const kept = sorted.slice(0, COMPRESSION_TARGET);
    const compressed = sorted.slice(COMPRESSION_TARGET);

    const groupedByType: Record<string, PrimeMemoryEntry[]> = {};
    for (const entry of compressed) {
      const key = entry.memoryType || 'general';
      if (!groupedByType[key]) groupedByType[key] = [];
      groupedByType[key].push(entry);
    }

    const summary: CompressedMemorySummary = {
      id: `compressed-${Date.now()}`,
      timestamp: Date.now(),
      period: `${new Date(compressed[compressed.length - 1]?.timestamp || Date.now()).toLocaleDateString()} - ${new Date(compressed[0]?.timestamp || Date.now()).toLocaleDateString()}`,
      keyFacts: [],
      importantDecisions: [],
      emotionalPatterns: [],
      activeArcs: [],
      compressedFrom: compressed.length,
    };

    for (const [type, entries] of Object.entries(groupedByType)) {
      const summaryLine = `[${type.toUpperCase()}] ${entries.length} entries: ${entries.map(e => e.memoryKey).slice(0, 5).join(', ')}${entries.length > 5 ? ` (+${entries.length - 5} more)` : ''}`;

      if (type === 'breakthrough' || type === 'board_decision') {
        summary.importantDecisions.push(summaryLine);
      } else if (type === 'health') {
        summary.emotionalPatterns.push(summaryLine);
      } else {
        summary.keyFacts.push(summaryLine);
      }
    }

    const activeArcNames = [...new Set(compressed.filter(e => e.arc).map(e => e.arc!))];
    summary.activeArcs = activeArcNames;

    const updatedSummaries = [summary, ...stateRef.current.compressedSummaries];

    setState(prev => ({
      ...prev,
      memoryEntries: kept,
      compressedSummaries: updatedSummaries,
    }));

    await Promise.all([
      saveMemoryEntries(kept),
      saveCompressedSummaries(updatedSummaries),
    ]);

    console.log(`[MEMORY-COMPRESS] Compressed ${compressed.length} entries into summary. Kept ${kept.length} entries.`);
  }, []);

  const scheduleDebouncedMemorySync = useCallback(() => {
    pendingMemorySyncRef.current = true;
    if (memorySyncTimerRef.current) {
      clearTimeout(memorySyncTimerRef.current);
    }
    memorySyncTimerRef.current = setTimeout(async () => {
      if (pendingMemorySyncRef.current) {
        pendingMemorySyncRef.current = false;
        const currentState = stateRef.current;
        console.log('[PRIME-MEMORY] Debounced memory sync to backend triggered');
        try {
          await trpcClient.system.syncNow.mutate({
            mode: 'memory_auto',
            reason: 'Auto-sync memory from MavisPrimeMemory',
            include: { memory: true, vault: false, stats: false, skills: false, quests: false, council: false },
            payload: {
              memoryEntries: currentState.memoryEntries,
              chatHistory: currentState.chatHistory,
              arcIndex: currentState.arcIndex,
              councilProfiles: currentState.councilProfiles,
              systemSnapshots: currentState.systemSnapshots,
            },
          });
          const now = Date.now();
          await Storage.setItem(PRIME_BACKEND_SYNC_KEY, now.toString());
          setState(prev => ({ ...prev, lastBackendSync: now, backendSyncStatus: 'success' }));
          console.log('[PRIME-MEMORY] Auto memory sync to backend complete');
        } catch (error) {
          console.warn('[PRIME-MEMORY] Auto memory sync failed (non-fatal):', (error as Error)?.message);
        }
      }
    }, MEMORY_SYNC_DEBOUNCE_MS);
  }, []);

  const addMemoryEntry = useCallback(async (entry: Omit<PrimeMemoryEntry, 'id' | 'timestamp' | 'lastUpdated'>) => {
    const newEntry: PrimeMemoryEntry = {
      ...entry,
      id: `mem-prime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      lastUpdated: Date.now(),
    };
    let updated: PrimeMemoryEntry[] = [];
    setState(prev => {
      updated = [newEntry, ...prev.memoryEntries];
      return { ...prev, memoryEntries: updated };
    });
    await saveMemoryEntries(updated);

    console.log('[PRIME-MEMORY] Added memory entry:', newEntry.memoryType, '-', newEntry.memoryKey);
    console.log('[PRIME-MEMORY] Total entries:', updated.length, '(compression threshold: ' + COMPRESSION_THRESHOLD + ')');

    trpcClient.memory.upsertMemoryFact.mutate({
      key: newEntry.memoryKey,
      value: newEntry.memoryValue,
      confidence: newEntry.importance / 3,
      source: newEntry.memoryType,
      scope: 'prime_memory',
    }).catch(err => console.warn('[PRIME-MEMORY] Failed to sync new entry to backend:', err));

    scheduleDebouncedMemorySync();
    
    if (updated.length >= COMPRESSION_THRESHOLD) {
      console.log('[PRIME-MEMORY] Compression threshold reached. Call compressMemory() manually if needed.');
    }
    return newEntry;
  }, [compressMemory, scheduleDebouncedMemorySync]);

  const updateMemoryEntry = useCallback(async (id: string, updates: Partial<PrimeMemoryEntry>) => {
    let updated: PrimeMemoryEntry[] = [];
    setState(prev => {
      updated = prev.memoryEntries.map(e =>
        e.id === id ? { ...e, ...updates, lastUpdated: Date.now() } : e
      );
      return { ...prev, memoryEntries: updated };
    });
    await saveMemoryEntries(updated);
    console.log('[PRIME-MEMORY] Updated memory entry:', id);
    scheduleDebouncedMemorySync();
  }, [scheduleDebouncedMemorySync]);

  const addChatMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `chat-prime-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    let updated: ChatMessage[] = [];
    setState(prev => {
      updated = [newMessage, ...prev.chatHistory];
      return { ...prev, chatHistory: updated };
    });
    await saveChatHistory(updated);
    console.log('[PRIME-MEMORY] Added chat message');
    scheduleDebouncedMemorySync();
    return newMessage;
  }, [scheduleDebouncedMemorySync]);

  const updateArc = useCallback(async (arcName: string, updates: Partial<ArcIndex>) => {
    let updated: ArcIndex[] = [];
    setState(prev => {
      const existing = prev.arcIndex.find(a => a.arcName === arcName);
      if (existing) {
        updated = prev.arcIndex.map(a =>
          a.arcName === arcName ? { ...a, ...updates, lastEvent: Date.now() } : a
        );
      } else {
        const newArc: ArcIndex = {
          id: `arc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          arcName,
          status: 'active',
          lastEvent: Date.now(),
          notes: '',
          ...updates,
        };
        updated = [newArc, ...prev.arcIndex];
      }
      return { ...prev, arcIndex: updated };
    });
    await saveArcIndex(updated);
    console.log('[PRIME-MEMORY] Updated arc:', arcName);
    scheduleDebouncedMemorySync();
  }, [scheduleDebouncedMemorySync]);

  const updateCouncilProfile = useCallback(async (councilId: string, updates: Partial<CouncilProfile>) => {
    let updated: CouncilProfile[] = [];
    setState(prev => {
      const existing = prev.councilProfiles.find(p => p.councilId === councilId);
      if (existing) {
        updated = prev.councilProfiles.map(p =>
          p.councilId === councilId ? { ...p, ...updates, lastUpdated: Date.now(), growthLevel: (updates.growthLevel ?? p.growthLevel) + 0.1 } : p
        );
      } else {
        const newProfile: CouncilProfile = {
          id: `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          councilId,
          name: '',
          class: 'core',
          episodicMemory: [],
          semanticMemory: {},
          growthLevel: 1.0,
          lastUpdated: Date.now(),
          domainAuthority: [],
          ...updates,
        };
        updated = [newProfile, ...prev.councilProfiles];
      }
      return { ...prev, councilProfiles: updated };
    });
    await saveCouncilProfiles(updated);
    console.log('[PRIME-MEMORY] Updated council profile:', councilId);
    scheduleDebouncedMemorySync();
  }, [scheduleDebouncedMemorySync]);

  const createSystemSnapshot = useCallback(async (snapshot: Omit<SystemSnapshot, 'id' | 'timestamp'>) => {
    const newSnapshot: SystemSnapshot = {
      ...snapshot,
      id: `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };
    let updated: SystemSnapshot[] = [];
    setState(prev => {
      updated = [newSnapshot, ...prev.systemSnapshots];
      return { ...prev, systemSnapshots: updated };
    });
    await saveSystemSnapshots(updated);
    console.log('[PRIME-MEMORY] Created system snapshot');
    return newSnapshot;
  }, []);

  const getMemoryContext = useCallback((domains?: string[], maxItems: number = 30): string => {
    const currentState = stateRef.current;
    let relevant = currentState.memoryEntries;

    if (domains && domains.length > 0) {
      relevant = relevant.filter(e =>
        (e.arc && domains.includes(e.arc)) ||
        (e.memoryType && domains.includes(e.memoryType)) ||
        (e.tags && e.tags.some(t => domains.includes(t)))
      );
    }

    const top = relevant
      .sort((a, b) => {
        if (a.importance !== b.importance) return b.importance - a.importance;
        return b.lastUpdated - a.lastUpdated;
      })
      .slice(0, maxItems);

    const parts: string[] = [];

    if (top.length > 0) {
      const context = top.map(item => {
        const age = Math.floor((Date.now() - item.lastUpdated) / (1000 * 60 * 60 * 24));
        const ageStr = age === 0 ? 'today' : age === 1 ? 'yesterday' : `${age} days ago`;
        return `[${item.memoryType.toUpperCase()}] ${item.memoryKey} (${ageStr}, importance: ${item.importance}/3)\n${item.memoryValue}`;
      }).join('\n\n');
      parts.push(`ACTIVE MEMORY (${top.length} items):\n\n${context}`);
    }

    if (currentState.compressedSummaries.length > 0) {
      const compressedContext = currentState.compressedSummaries.slice(0, 5).map(s => {
        const lines: string[] = [`[COMPRESSED PERIOD: ${s.period}] (${s.compressedFrom} entries summarized)`];
        if (s.keyFacts.length > 0) lines.push(`Key Facts: ${s.keyFacts.join('; ')}`);
        if (s.importantDecisions.length > 0) lines.push(`Decisions: ${s.importantDecisions.join('; ')}`);
        if (s.emotionalPatterns.length > 0) lines.push(`Patterns: ${s.emotionalPatterns.join('; ')}`);
        if (s.activeArcs.length > 0) lines.push(`Active Arcs: ${s.activeArcs.join(', ')}`);
        return lines.join('\n');
      }).join('\n\n');
      parts.push(`COMPRESSED LONG-TERM MEMORY (${currentState.compressedSummaries.length} summaries):\n\n${compressedContext}`);
    }

    if (currentState.arcIndex.length > 0) {
      const arcContext = currentState.arcIndex.slice(0, 10).map(a => {
        const age = Math.floor((Date.now() - a.lastEvent) / (1000 * 60 * 60 * 24));
        const ageStr = age === 0 ? 'today' : age === 1 ? 'yesterday' : `${age} days ago`;
        return `• ${a.arcName} [${a.status.toUpperCase()}] (last: ${ageStr})${a.notes ? ` - ${a.notes}` : ''}`;
      }).join('\n');
      parts.push(`ARC INDEX (${currentState.arcIndex.length} arcs):\n${arcContext}`);
    }

    if (parts.length === 0) {
      return 'No long-term memory loaded. Fresh session.';
    }

    const syncStatus = currentState.lastBackendSync
      ? `Last backend sync: ${new Date(currentState.lastBackendSync).toLocaleString()}`
      : 'Never synced to backend';

    return `PRIME MEMORY SYSTEM [${syncStatus}]\n\n${parts.join('\n\n---\n\n')}`;
  }, []);

  const getCompressedMemoryContext = useCallback((): string => {
    const currentState = stateRef.current;
    if (currentState.compressedSummaries.length === 0) {
      return 'No compressed memory available.';
    }

    return currentState.compressedSummaries.map(s => {
      const lines: string[] = [`=== MEMORY PERIOD: ${s.period} (${s.compressedFrom} entries) ===`];
      if (s.keyFacts.length > 0) lines.push(`Facts: ${s.keyFacts.join('; ')}`);
      if (s.importantDecisions.length > 0) lines.push(`Decisions: ${s.importantDecisions.join('; ')}`);
      if (s.emotionalPatterns.length > 0) lines.push(`Patterns: ${s.emotionalPatterns.join('; ')}`);
      if (s.activeArcs.length > 0) lines.push(`Arcs: ${s.activeArcs.join(', ')}`);
      return lines.join('\n');
    }).join('\n\n');
  }, []);

  const clearAllMemory = useCallback(async () => {
    await Promise.all([
      Storage.removeItem(PRIME_MEMORY_KEY),
      Storage.removeItem(PRIME_CHAT_KEY),
      Storage.removeItem(PRIME_ARCS_KEY),
      Storage.removeItem(PRIME_COUNCIL_PROFILES_KEY),
      Storage.removeItem(PRIME_SNAPSHOTS_KEY),
      Storage.removeItem(PRIME_COMPRESSED_KEY),
    ]);
    setState({
      memoryEntries: [],
      chatHistory: [],
      arcIndex: [],
      councilProfiles: [],
      systemSnapshots: [],
      compressedSummaries: [],
      isLoaded: true,
      lastBackendSync: state.lastBackendSync,
      backendSyncStatus: 'idle',
    });
    console.log('[PRIME-MEMORY] Cleared ALL Prime memory systems');
  }, [state.lastBackendSync]);

  const syncToBackend = useCallback(async (gameState: any, longTermMemory: any[], conversationThreads: any[]) => {
    console.log('[BACKEND-SYNC] Starting backend synchronization...');
    setState(prev => ({ ...prev, backendSyncStatus: 'syncing' }));

    try {
      const currentState = stateRef.current;

      const result = await trpcClient.system.syncNow.mutate({
        mode: 'omnisync',
        reason: 'OmniSync from frontend',
        include: {
          memory: true,
          vault: true,
          stats: true,
          skills: true,
          quests: true,
          council: true,
        },
        payload: {
          gameState: gameState || null,
          memoryEntries: currentState.memoryEntries,
          chatHistory: currentState.chatHistory,
          arcIndex: currentState.arcIndex,
          councilProfiles: currentState.councilProfiles,
          systemSnapshots: currentState.systemSnapshots,
          longTermMemory: longTermMemory,
          conversationThreads: conversationThreads,
        },
      });

      const now = Date.now();
      await Storage.setItem(PRIME_BACKEND_SYNC_KEY, now.toString());
      setState(prev => ({
        ...prev,
        lastBackendSync: now,
        backendSyncStatus: 'success',
      }));

      console.log('[BACKEND-SYNC] Backend sync complete:', result);

      const allMemoryEntries = currentState.memoryEntries;
      console.log(`[BACKEND-SYNC] Syncing ALL ${allMemoryEntries.length} memory entries as individual facts...`);
      const batchSize = 50;
      for (let i = 0; i < allMemoryEntries.length; i += batchSize) {
        const batch = allMemoryEntries.slice(i, i + batchSize);
        const promises = batch.map(entry =>
          trpcClient.memory.upsertMemoryFact.mutate({
            key: entry.memoryKey,
            value: entry.memoryValue,
            confidence: entry.importance / 3,
            source: entry.memoryType,
            scope: 'prime_memory',
          }).catch(err => console.warn('[BACKEND-SYNC] Failed to sync memory fact:', entry.memoryKey, err))
        );
        await Promise.all(promises);
      }
      console.log(`[BACKEND-SYNC] All ${allMemoryEntries.length} memory facts synced to backend`);

      return result;
    } catch (error) {
      console.error('[BACKEND-SYNC] Backend sync failed:', error);
      setState(prev => ({ ...prev, backendSyncStatus: 'error' }));
      return null;
    }
  }, []);

  useEffect(() => {
    if (!state.isLoaded) return;
    autoSyncIntervalRef.current = setInterval(() => {
      const currentState = stateRef.current;
      if (currentState.memoryEntries.length > 0 || currentState.chatHistory.length > 0) {
        console.log('[PRIME-MEMORY] Periodic auto-sync triggered');
        scheduleDebouncedMemorySync();
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
      }
    };
  }, [state.isLoaded, scheduleDebouncedMemorySync]);

  const omniSync = useCallback(async (
    gameStateSnapshot: Omit<SystemSnapshot, 'id' | 'timestamp'>,
    fullGameState?: any,
    longTermMemory?: any[],
    conversationThreads?: any[],
  ) => {
    console.log('[OMNI-SYNC] Initiating master synchronization...');

    await createSystemSnapshot(gameStateSnapshot);

    const currentState = stateRef.current;

    await Promise.all([
      saveMemoryEntries(currentState.memoryEntries),
      saveChatHistory(currentState.chatHistory),
      saveArcIndex(currentState.arcIndex),
      saveCouncilProfiles(currentState.councilProfiles),
      saveSystemSnapshots(currentState.systemSnapshots),
    ]);

    console.log('[OMNI-SYNC] Local save complete:');
    console.log(`  - ${currentState.memoryEntries.length} memory entries`);
    console.log(`  - ${currentState.chatHistory.length} chat messages`);
    console.log(`  - ${currentState.arcIndex.length} arcs`);
    console.log(`  - ${currentState.councilProfiles.length} council profiles`);
    console.log(`  - ${currentState.systemSnapshots.length} snapshots`);

    let backendResult = null;
    try {
      backendResult = await syncToBackend(
        fullGameState || null,
        longTermMemory || [],
        conversationThreads || [],
      );
      console.log('[OMNI-SYNC] Backend sync result:', backendResult ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.error('[OMNI-SYNC] Backend sync error (non-fatal):', error);
    }

    if (currentState.memoryEntries.length >= COMPRESSION_THRESHOLD) {
      console.log('[OMNI-SYNC] Memory entries exceed compression threshold. Consider calling compressMemory() if needed.');
    }

    console.log('[OMNI-SYNC] Complete. All systems synchronized.');

    return {
      success: true,
      timestamp: Date.now(),
      memorySynced: currentState.memoryEntries.length,
      chatSynced: currentState.chatHistory.length,
      arcsSynced: currentState.arcIndex.length,
      councilsSynced: currentState.councilProfiles.length,
      snapshotsSynced: currentState.systemSnapshots.length,
      backendSynced: !!backendResult,
      backendSyncId: backendResult?.sync_id || null,
    };
  }, [createSystemSnapshot, syncToBackend, compressMemory]);

  return {
    ...state,
    addMemoryEntry,
    updateMemoryEntry,
    addChatMessage,
    updateArc,
    updateCouncilProfile,
    createSystemSnapshot,
    getMemoryContext,
    getCompressedMemoryContext,
    clearAllMemory,
    omniSync,
    syncToBackend,
    compressMemory,
    reloadMemory: loadAllMemory,
    compressionThreshold: COMPRESSION_THRESHOLD,
    compressionTarget: COMPRESSION_TARGET,
  };
});
