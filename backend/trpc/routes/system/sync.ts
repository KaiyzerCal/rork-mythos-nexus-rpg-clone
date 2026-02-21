import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { dbSet } from '../../../db';

const inputSchema = z.object({
  mode: z.string(),
  reason: z.string().optional(),
  include: z.object({
    memory: z.boolean().optional().default(true),
    vault: z.boolean().optional().default(true),
    stats: z.boolean().optional().default(true),
    skills: z.boolean().optional().default(true),
    quests: z.boolean().optional().default(true),
    council: z.boolean().optional().default(true),
  }).optional(),
  payload: z.object({
    gameState: z.any().optional(),
    memoryEntries: z.array(z.any()).optional(),
    chatHistory: z.array(z.any()).optional(),
    arcIndex: z.array(z.any()).optional(),
    councilProfiles: z.array(z.any()).optional(),
    systemSnapshots: z.array(z.any()).optional(),
    longTermMemory: z.array(z.any()).optional(),
    conversationThreads: z.array(z.any()).optional(),
  }).optional(),
}).optional();

export default publicProcedure
  .input(inputSchema)
  .mutation(async ({ input }) => {
    const syncId = `sync_${Date.now()}`;
    const startedAt = new Date().toISOString();

    console.log('[OMNISYNC] Starting synchronization:', {
      syncId,
      mode: input?.mode,
      reason: input?.reason,
      systems: input?.include,
      hasPayload: !!input?.payload,
    });

    const results: Record<string, boolean> = {};

    try {
      if (input?.payload) {
        const payload = input.payload;

        if (payload.gameState && input?.include?.stats !== false) {
          console.log('[OMNISYNC] Persisting game state...');
          results.gameState = await dbSet('system_state', 'current_game_state', {
            state: payload.gameState,
            syncId,
            syncedAt: startedAt,
          });
        }

        if (payload.memoryEntries && input?.include?.memory !== false) {
          console.log('[OMNISYNC] Persisting memory entries:', payload.memoryEntries.length);
          results.memory = await dbSet('system_state', 'prime_memory_entries', {
            entries: payload.memoryEntries,
            count: payload.memoryEntries.length,
            syncId,
            syncedAt: startedAt,
          });
        }

        if (payload.chatHistory) {
          console.log('[OMNISYNC] Persisting chat history:', payload.chatHistory.length);
          results.chat = await dbSet('system_state', 'chat_history', {
            messages: payload.chatHistory,
            count: payload.chatHistory.length,
            syncId,
            syncedAt: startedAt,
          });
        }

        if (payload.arcIndex) {
          console.log('[OMNISYNC] Persisting arc index:', payload.arcIndex.length);
          results.arcs = await dbSet('system_state', 'arc_index', {
            arcs: payload.arcIndex,
            count: payload.arcIndex.length,
            syncId,
            syncedAt: startedAt,
          });
        }

        if (payload.councilProfiles && input?.include?.council !== false) {
          console.log('[OMNISYNC] Persisting council profiles:', payload.councilProfiles.length);
          results.council = await dbSet('system_state', 'council_profiles', {
            profiles: payload.councilProfiles,
            count: payload.councilProfiles.length,
            syncId,
            syncedAt: startedAt,
          });
        }

        if (payload.systemSnapshots) {
          console.log('[OMNISYNC] Persisting system snapshots:', payload.systemSnapshots.length);
          results.snapshots = await dbSet('system_state', 'system_snapshots', {
            snapshots: payload.systemSnapshots,
            count: payload.systemSnapshots.length,
            syncId,
            syncedAt: startedAt,
          });
        }

        if (payload.longTermMemory && input?.include?.memory !== false) {
          console.log('[OMNISYNC] Persisting long-term memory:', payload.longTermMemory.length);
          results.longTermMemory = await dbSet('system_state', 'long_term_memory', {
            items: payload.longTermMemory,
            count: payload.longTermMemory.length,
            syncId,
            syncedAt: startedAt,
          });
        }

        if (payload.conversationThreads) {
          console.log('[OMNISYNC] Persisting conversation threads:', payload.conversationThreads.length);
          results.threads = await dbSet('system_state', 'conversation_threads', {
            threads: payload.conversationThreads,
            count: payload.conversationThreads.length,
            syncId,
            syncedAt: startedAt,
          });
        }

        await dbSet('system_state', 'last_sync', {
          syncId,
          mode: input?.mode,
          reason: input?.reason,
          results,
          startedAt,
          completedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('[OMNISYNC] Error during sync:', error);
    }

    const completedAt = new Date().toISOString();

    console.log('[OMNISYNC] Synchronization complete:', {
      syncId,
      results,
      duration: Date.now() - new Date(startedAt).getTime(),
    });

    return {
      sync_id: syncId,
      status: 'COMPLETED' as const,
      started_at: startedAt,
      completed_at: completedAt,
      results,
    };
  });
