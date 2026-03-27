import createContextHook from '@nkzw/create-context-hook';
import Storage from '@/utils/storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { trpcClient } from '@/lib/trpc';

export interface MemoryItem {
  id: string;
  type: 'identity' | 'goal' | 'project' | 'pattern' | 'relationship' | 'court_event' | 'business_event' | 'emotional_state' | 'breakthrough' | 'preference' | 'conversation' | 'quest_memory' | 'insight';
  content: string;
  createdAt: number;
  updatedAt: number;
  importanceScore: 1 | 2 | 3;
  domains: string[];
  tags?: string[];
  conversationId?: string;
  relatedQuests?: string[];
}

export interface ConversationThread {
  id: string;
  title: string;
  summary: string;
  startedAt: number;
  lastMessageAt: number;
  messageCount: number;
  keyTopics: string[];
  emotionalTone: string;
  arcs: string[];
}

interface MavisMemoryState {
  memoryItems: MemoryItem[];
  conversationThreads: ConversationThread[];
  isLoaded: boolean;
}

const MAVIS_MEMORY_KEY = 'mavis_prime_memory_v2';
const MAVIS_CONVERSATIONS_KEY = 'mavis_conversation_threads_v1';
const LTM_BACKEND_SYNC_DEBOUNCE_MS = 12000;

export const [MavisMemoryProvider, useMavisMemory] = createContextHook(() => {
  const [state, setState] = useState<MavisMemoryState>({
    memoryItems: [],
    conversationThreads: [],
    isLoaded: false,
  });
  const stateRef = useRef(state);
  stateRef.current = state;
  const ltmSyncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadMemory();
  }, []);

  const loadMemory = async () => {
    try {
      console.log('[MAVIS-MEMORY] Loading memory items and conversation threads...');
      const [storedMemory, storedConversations] = await Promise.all([
        Storage.getItem(MAVIS_MEMORY_KEY),
        Storage.getItem(MAVIS_CONVERSATIONS_KEY),
      ]);
      
      let memoryItems: MemoryItem[] = [];
      let conversationThreads: ConversationThread[] = [];
      
      if (storedMemory) {
        try {
          memoryItems = JSON.parse(storedMemory);
          console.log('[MAVIS-MEMORY] Loaded', memoryItems.length, 'memory items');
        } catch (parseError) {
          console.error('[MAVIS-MEMORY] Failed to parse memory items, clearing corrupted data:', parseError);
          await Storage.removeItem(MAVIS_MEMORY_KEY);
          memoryItems = [];
        }
      }
      
      if (storedConversations) {
        try {
          conversationThreads = JSON.parse(storedConversations);
          console.log('[MAVIS-MEMORY] Loaded', conversationThreads.length, 'conversation threads');
        } catch (parseError) {
          console.error('[MAVIS-MEMORY] Failed to parse conversation threads, clearing corrupted data:', parseError);
          await Storage.removeItem(MAVIS_CONVERSATIONS_KEY);
          conversationThreads = [];
        }
      }
      
      if (!storedMemory && !storedConversations) {
        console.log('[MAVIS-MEMORY] No stored memory found, starting fresh');
      }
      
      setState({ memoryItems, conversationThreads, isLoaded: true });

      try {
        console.log('[MAVIS-MEMORY] Attempting to load long-term memory from backend...');
        const backendData = await trpcClient.memory.getGlobalMemory.query({ scope: 'long_term_memory' });
        const backendFacts = backendData?.facts || [];
        if (backendFacts.length > 0) {
          const localIds = new Set(memoryItems.map(m => m.id));
          const newFromBackend: MemoryItem[] = backendFacts
            .filter((f: any) => !localIds.has(f.id) && !localIds.has(f.key))
            .map((f: any) => {
              let parsed: any = {};
              try { parsed = typeof f.value === 'string' ? JSON.parse(f.value) : f; } catch { parsed = { content: f.value }; }
              return {
                id: f.id || f.key || `backend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                type: (parsed.type || 'conversation') as MemoryItem['type'],
                content: parsed.content || f.value || '',
                createdAt: parsed.createdAt || Date.now(),
                updatedAt: parsed.updatedAt || Date.now(),
                importanceScore: (parsed.importanceScore || 2) as 1 | 2 | 3,
                domains: parsed.domains || ['general'],
                tags: parsed.tags || [],
              };
            });
          if (newFromBackend.length > 0) {
            const merged = [...memoryItems, ...newFromBackend];
            setState(prev => ({ ...prev, memoryItems: merged }));
            await saveMemory(merged);
            console.log(`[MAVIS-MEMORY] Merged ${newFromBackend.length} items from backend. Total: ${merged.length}`);
          }
        }

        const backendThreads = await trpcClient.memory.getGlobalMemory.query({ scope: 'conversation_threads' });
        const threadFacts = backendThreads?.facts || [];
        if (threadFacts.length > 0 && threadFacts.length > conversationThreads.length) {
          console.log(`[MAVIS-MEMORY] Backend has ${threadFacts.length} thread records`);
        }
      } catch (backendError) {
        console.log('[MAVIS-MEMORY] Backend load skipped (non-fatal):', (backendError as Error)?.message);
      }
    } catch (error) {
      console.error('[MAVIS-MEMORY] Failed to load memory:', error);
      setState({ memoryItems: [], conversationThreads: [], isLoaded: true });
    }
  };

  const saveMemory = async (items: MemoryItem[]) => {
    try {
      const sortedItems = items
        .sort((a, b) => {
          if (a.importanceScore !== b.importanceScore) {
            return b.importanceScore - a.importanceScore;
          }
          return b.updatedAt - a.updatedAt;
        });
      
      await Storage.setItem(MAVIS_MEMORY_KEY, JSON.stringify(sortedItems));
      console.log('[MAVIS-MEMORY] Saved', sortedItems.length, 'memory items (no cap)');
    } catch (error) {
      console.error('[MAVIS-MEMORY] Failed to save memory:', error);
    }
  };
  
  const saveConversationThreads = async (threads: ConversationThread[]) => {
    try {
      const sortedThreads = threads
        .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
      
      await Storage.setItem(MAVIS_CONVERSATIONS_KEY, JSON.stringify(sortedThreads));
      console.log('[MAVIS-MEMORY] Saved', sortedThreads.length, 'conversation threads (no cap)');
    } catch (error) {
      console.error('[MAVIS-MEMORY] Failed to save conversation threads:', error);
    }
  };

  const syncLTMToBackend = useCallback(() => {
    if (ltmSyncTimerRef.current) {
      clearTimeout(ltmSyncTimerRef.current);
    }
    ltmSyncTimerRef.current = setTimeout(async () => {
      const currentState = stateRef.current;
      if (currentState.memoryItems.length === 0) return;
      try {
        console.log('[MAVIS-MEMORY] Syncing long-term memory to backend...');
        await trpcClient.system.syncNow.mutate({
          mode: 'ltm_auto',
          reason: 'Auto-sync long-term memory',
          include: { memory: true, vault: false, stats: false, skills: false, quests: false, council: false },
          payload: {
            longTermMemory: currentState.memoryItems.map(item => ({
              id: item.id,
              type: item.type,
              content: item.content,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              importanceScore: item.importanceScore,
              domains: item.domains,
              tags: item.tags,
              conversationId: item.conversationId,
            })),
            conversationThreads: currentState.conversationThreads,
          },
        });

        const importantItems = currentState.memoryItems.filter(m => m.importanceScore >= 2);
        for (const item of importantItems.slice(0, 100)) {
          trpcClient.memory.upsertMemoryFact.mutate({
            key: `ltm_${item.id}`,
            value: JSON.stringify({
              type: item.type,
              content: item.content,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
              importanceScore: item.importanceScore,
              domains: item.domains,
              tags: item.tags,
            }),
            confidence: item.importanceScore / 3,
            source: item.type,
            scope: 'long_term_memory',
          }).catch(err => console.warn('[MAVIS-MEMORY] Failed to sync LTM fact:', err));
        }

        for (const thread of currentState.conversationThreads.slice(0, 50)) {
          trpcClient.memory.upsertMemoryFact.mutate({
            key: `thread_${thread.id}`,
            value: JSON.stringify(thread),
            confidence: 0.9,
            source: 'conversation',
            scope: 'conversation_threads',
          }).catch(err => console.warn('[MAVIS-MEMORY] Failed to sync thread:', err));
        }

        console.log(`[MAVIS-MEMORY] Backend sync complete: ${currentState.memoryItems.length} items, ${currentState.conversationThreads.length} threads`);
      } catch (error) {
        console.warn('[MAVIS-MEMORY] Backend sync failed (non-fatal):', (error as Error)?.message);
      }
    }, LTM_BACKEND_SYNC_DEBOUNCE_MS);
  }, []);

  const addMemoryItem = useCallback(async (item: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: MemoryItem = {
      ...item,
      id: `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    let updatedItems: MemoryItem[] = [];
    setState(prev => {
      updatedItems = [newItem, ...prev.memoryItems];
      return { ...prev, memoryItems: updatedItems };
    });
    await saveMemory(updatedItems);
    
    console.log('[MAVIS-MEMORY] Added new memory item:', newItem.type, '-', newItem.content.substring(0, 50));
    syncLTMToBackend();
    return newItem;
  }, [syncLTMToBackend]);

  const updateMemoryItem = useCallback(async (id: string, updates: Partial<MemoryItem>) => {
    let updatedItems: MemoryItem[] = [];
    setState(prev => {
      updatedItems = prev.memoryItems.map(item => 
        item.id === id 
          ? { ...item, ...updates, updatedAt: Date.now() }
          : item
      );
      return { ...prev, memoryItems: updatedItems };
    });
    await saveMemory(updatedItems);
    
    console.log('[MAVIS-MEMORY] Updated memory item:', id);
  }, []);
  
  const createConversationThread = useCallback(async (firstMessage: string, topics: string[], arcs: string[]) => {
    const thread: ConversationThread = {
      id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: firstMessage.substring(0, 50) + (firstMessage.length > 50 ? '...' : ''),
      summary: firstMessage.substring(0, 200),
      startedAt: Date.now(),
      lastMessageAt: Date.now(),
      messageCount: 1,
      keyTopics: topics,
      emotionalTone: 'neutral',
      arcs,
    };
    
    let updatedThreads: ConversationThread[] = [];
    setState(prev => {
      updatedThreads = [thread, ...prev.conversationThreads];
      return { ...prev, conversationThreads: updatedThreads };
    });
    await saveConversationThreads(updatedThreads);
    
    console.log('[MAVIS-MEMORY] Created conversation thread:', thread.id);
    syncLTMToBackend();
    return thread;
  }, [syncLTMToBackend]);
  
  const updateConversationThread = useCallback(async (threadId: string, updates: Partial<ConversationThread>) => {
    let updatedThreads: ConversationThread[] = [];
    setState(prev => {
      updatedThreads = prev.conversationThreads.map(thread =>
        thread.id === threadId
          ? { ...thread, ...updates, lastMessageAt: Date.now() }
          : thread
      );
      return { ...prev, conversationThreads: updatedThreads };
    });
    await saveConversationThreads(updatedThreads);
    
    console.log('[MAVIS-MEMORY] Updated conversation thread:', threadId);
  }, []);

  const deleteMemoryItem = useCallback(async (id: string) => {
    let updatedItems: MemoryItem[] = [];
    setState(prev => {
      updatedItems = prev.memoryItems.filter(item => item.id !== id);
      return { ...prev, memoryItems: updatedItems };
    });
    await saveMemory(updatedItems);
    
    console.log('[MAVIS-MEMORY] Deleted memory item:', id);
  }, []);

  const getMemoryContext = useCallback((domains?: string[], maxItems: number = 20): string => {
    let relevantItems = state.memoryItems;
    // Note: this reads state directly which is fine for a read-only getter

    if (domains && domains.length > 0) {
      relevantItems = relevantItems.filter(item => 
        item.domains.some(d => domains.includes(d))
      );
    }

    const topItems = relevantItems
      .sort((a, b) => {
        if (a.importanceScore !== b.importanceScore) {
          return b.importanceScore - a.importanceScore;
        }
        return b.updatedAt - a.updatedAt;
      })
      .slice(0, maxItems);

    if (topItems.length === 0) {
      return 'No long-term memory items loaded yet. This is a fresh session.';
    }

    const context = topItems.map(item => {
      const age = Math.floor((Date.now() - item.updatedAt) / (1000 * 60 * 60 * 24));
      const ageStr = age === 0 ? 'today' : age === 1 ? 'yesterday' : `${age} days ago`;
      return `[${item.type.toUpperCase()}] (${ageStr}, importance: ${item.importanceScore}/3)\n${item.content}`;
    }).join('\n\n');

    return `LONG-TERM MEMORY (${topItems.length} items):\n\n${context}`;
  }, [state.memoryItems]);

  const clearAllMemory = useCallback(async () => {
    await Promise.all([
      Storage.removeItem(MAVIS_MEMORY_KEY),
      Storage.removeItem(MAVIS_CONVERSATIONS_KEY),
    ]);
    setState({ memoryItems: [], conversationThreads: [], isLoaded: true });
    console.log('[MAVIS-MEMORY] Cleared all memory and conversation threads');
  }, []);

  const autoSaveFromConversation = useCallback(async (message: string, role: 'user' | 'assistant', threadId?: string) => {
    if (role !== 'user') return;

    const lowerMessage = message.toLowerCase();
    let savedMemory = false;
    
    if (lowerMessage.includes('court') || lowerMessage.includes('trial') || lowerMessage.includes('custody')) {
      await addMemoryItem({
        type: 'court_event',
        content: `User discussed court/custody topic: "${message.substring(0, 200)}..."`,
        importanceScore: 2,
        domains: ['court', 'legal'],
        conversationId: threadId,
      });
      savedMemory = true;
    }
    
    if (lowerMessage.includes('caliyah') || lowerMessage.includes('daughter')) {
      await addMemoryItem({
        type: 'relationship',
        content: `User mentioned Caliyah: "${message.substring(0, 200)}..."`,
        importanceScore: 3,
        domains: ['family', 'fatherhood'],
        conversationId: threadId,
      });
      savedMemory = true;
    }

    if (lowerMessage.includes('business') || lowerMessage.includes('bioneer') || lowerMessage.includes('pf51') || lowerMessage.includes('mavis') || lowerMessage.includes('codexos')) {
      await addMemoryItem({
        type: 'business_event',
        content: `User discussed business: "${message.substring(0, 200)}..."`,
        importanceScore: 2,
        domains: ['business', 'builder', 'dynasty'],
        conversationId: threadId,
      });
      savedMemory = true;
    }

    if (lowerMessage.includes('overwhelm') || lowerMessage.includes('burnout') || lowerMessage.includes('tired') || lowerMessage.includes('anxious')) {
      await addMemoryItem({
        type: 'emotional_state',
        content: `User expressed fatigue/overwhelm: "${message.substring(0, 200)}..."`,
        importanceScore: 2,
        domains: ['health', 'recovery'],
        conversationId: threadId,
      });
      savedMemory = true;
    }
    
    if (lowerMessage.includes('quest') || lowerMessage.includes('goal') || lowerMessage.includes('mission')) {
      await addMemoryItem({
        type: 'quest_memory',
        content: `User discussed quests/goals: "${message.substring(0, 200)}..."`,
        importanceScore: 2,
        domains: ['quests', 'progress'],
        conversationId: threadId,
      });
      savedMemory = true;
    }
    
    if (lowerMessage.includes('learned') || lowerMessage.includes('realized') || lowerMessage.includes('understand')) {
      await addMemoryItem({
        type: 'insight',
        content: `User had insight: "${message.substring(0, 200)}..."`,
        importanceScore: 3,
        domains: ['breakthrough', 'wisdom'],
        conversationId: threadId,
      });
      savedMemory = true;
    }
    
    if (!savedMemory && message.length > 100) {
      await addMemoryItem({
        type: 'conversation',
        content: `Conversation: "${message.substring(0, 200)}..."`,
        importanceScore: 1,
        domains: ['general'],
        conversationId: threadId,
      });
    }
  }, [addMemoryItem]);

  return {
    memoryItems: state.memoryItems,
    conversationThreads: state.conversationThreads,
    isLoaded: state.isLoaded,
    addMemoryItem,
    updateMemoryItem,
    deleteMemoryItem,
    getMemoryContext,
    clearAllMemory,
    autoSaveFromConversation,
    createConversationThread,
    updateConversationThread,
    reloadMemory: loadMemory,
    syncLTMToBackend,
  };
});
