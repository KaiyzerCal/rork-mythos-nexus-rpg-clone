import { trpcClient } from '@/lib/trpc';

export const SystemAPI = {
  async getQuests(status?: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED') {
    try {
      return await trpcClient.quests.list.query({ status, limit: 100 });
    } catch (error) {
      console.error('[SystemAPI] getQuests error:', error);
      return { items: [], next_cursor: null };
    }
  },

  async updateStats(delta: Record<string, number>, reason: string) {
    console.log('[SystemAPI] Updating stats:', { delta, reason });
    try {
      await trpcClient.memory.upsertMemoryFact.mutate({
        key: `stats_update_${Date.now()}`,
        value: JSON.stringify({ delta, reason, timestamp: new Date().toISOString() }),
        confidence: 1.0,
        source: 'system',
        scope: 'stats',
      });
      return { ok: true };
    } catch (error) {
      console.error('[SystemAPI] updateStats error:', error);
      return { ok: false };
    }
  },

  async getStats() {
    console.log('[SystemAPI] Getting stats');
    try {
      const snapshot = await trpcClient.system.getSystemSnapshot.query({
        include: { stats: true, tabs: false, skills: false, quests: false, forms: false, vault: false, council: false, recent_threads: false },
      });
      return snapshot?.stats || {};
    } catch (error) {
      console.error('[SystemAPI] getStats error:', error);
      return {};
    }
  },

  async saveMemory(key: string, value: string, scope: string = 'global') {
    try {
      return await trpcClient.memory.upsertMemoryFact.mutate({
        key,
        value,
        confidence: 0.9,
        source: 'user',
        scope,
      });
    } catch (error) {
      console.error('[SystemAPI] saveMemory error:', error);
      return { ok: false };
    }
  },

  async loadMemory(scope: string = 'global') {
    try {
      return await trpcClient.memory.getGlobalMemory.query({ scope });
    } catch (error) {
      console.error('[SystemAPI] loadMemory error:', error);
      return { facts: [], preferences: [], arcs: [], last_updated: new Date().toISOString() };
    }
  },

  async getCouncilProfiles(classFilter?: 'core' | 'advisory' | 'think-tank' | 'shadows') {
    try {
      return await trpcClient.council.listMembers.query({ class: classFilter || null });
    } catch (error) {
      console.error('[SystemAPI] getCouncilProfiles error:', error);
      return { members: [] };
    }
  },

  async updateCouncilProfile(memberId: string, updates: any) {
    try {
      return await trpcClient.council.upsertMember.mutate({
        member_id: memberId,
        ...updates,
      });
    } catch (error) {
      console.error('[SystemAPI] updateCouncilProfile error:', error);
      return { member_id: memberId };
    }
  },

  async writeToVault(title: string, content: string, tags: string[] = []) {
    console.log('[SystemAPI] Writing to vault:', { title, tags });
    try {
      await trpcClient.memory.upsertMemoryFact.mutate({
        key: `vault_${Date.now()}`,
        value: JSON.stringify({ title, content, tags, timestamp: new Date().toISOString() }),
        confidence: 1.0,
        source: 'vault',
        scope: 'vault',
      });
      return { ok: true };
    } catch (error) {
      console.error('[SystemAPI] writeToVault error:', error);
      return { ok: false };
    }
  },

  async readVault(limit: number = 50) {
    console.log('[SystemAPI] Reading vault');
    try {
      const data = await trpcClient.memory.getGlobalMemory.query({ scope: 'vault' });
      const items = (data?.facts || []).map((f: any) => {
        try {
          const parsed = JSON.parse(f.value);
          return { ...parsed, id: f.id || f.key };
        } catch {
          return { title: f.key, content: f.value, id: f.key };
        }
      }).slice(0, limit);
      return { items, next_cursor: null };
    } catch (error) {
      console.error('[SystemAPI] readVault error:', error);
      return { items: [], next_cursor: null };
    }
  },

  async syncFullState(gameState: any, memoryState: any, longTermMemory: any, conversationThreads: any) {
    console.log('[SystemAPI] Full state sync starting...');
    try {
      const result = await trpcClient.system.syncNow.mutate({
        mode: 'omnisync',
        reason: 'Full state synchronization from frontend',
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
          memoryEntries: memoryState?.memoryEntries || [],
          chatHistory: memoryState?.chatHistory || [],
          arcIndex: memoryState?.arcIndex || [],
          councilProfiles: memoryState?.councilProfiles || [],
          systemSnapshots: memoryState?.systemSnapshots || [],
          longTermMemory: longTermMemory || [],
          conversationThreads: conversationThreads || [],
        },
      });
      console.log('[SystemAPI] Full state sync complete:', result);
      return result;
    } catch (error) {
      console.error('[SystemAPI] syncFullState error:', error);
      return { sync_id: 'error', status: 'FAILED', started_at: new Date().toISOString(), completed_at: new Date().toISOString() };
    }
  },

  async loadFullState() {
    console.log('[SystemAPI] Loading full state from backend...');
    try {
      const snapshot = await trpcClient.system.getSystemSnapshot.query({
        include: {
          tabs: true,
          stats: true,
          skills: true,
          quests: true,
          forms: true,
          vault: true,
          council: true,
          recent_threads: true,
          memory: true,
        },
      });
      console.log('[SystemAPI] Full state loaded:', {
        hasStats: !!snapshot?.stats,
        hasMemory: !!snapshot?.memory_entries,
        hasCouncil: !!snapshot?.council,
        lastSync: snapshot?.last_sync,
      });
      return snapshot;
    } catch (error) {
      console.error('[SystemAPI] loadFullState error:', error);
      return null;
    }
  },

  async syncState(mode: string = 'omnisync', reason?: string) {
    try {
      return await trpcClient.system.syncNow.mutate({
        mode,
        reason,
        include: {
          memory: true,
          vault: true,
          stats: true,
          skills: true,
          quests: true,
          council: true,
        },
      });
    } catch (error) {
      console.error('[SystemAPI] syncState error:', error);
      return { sync_id: 'error', status: 'FAILED', started_at: new Date().toISOString(), completed_at: new Date().toISOString() };
    }
  },

  async getSystemSnapshot() {
    try {
      return await trpcClient.system.getSystemSnapshot.query({
        include: {
          tabs: true,
          stats: true,
          skills: true,
          quests: true,
          forms: true,
          vault: true,
          council: true,
          recent_threads: true,
        },
      });
    } catch (error) {
      console.error('[SystemAPI] getSystemSnapshot error:', error);
      return null;
    }
  },

  async getHealthStatus() {
    try {
      return await trpcClient.health.getStatus.query();
    } catch (error) {
      console.error('[SystemAPI] getHealthStatus error:', error);
      return { ok: false, uptime_s: 0, timestamp: new Date().toISOString(), version: 'unknown' };
    }
  },
};

export default SystemAPI;
