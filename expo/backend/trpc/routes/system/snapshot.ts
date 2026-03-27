import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { dbGet } from '../../../db';

const inputSchema = z.object({
  include: z.object({
    tabs: z.boolean().optional().default(true),
    stats: z.boolean().optional().default(true),
    skills: z.boolean().optional().default(true),
    quests: z.boolean().optional().default(true),
    forms: z.boolean().optional().default(true),
    vault: z.boolean().optional().default(true),
    council: z.boolean().optional().default(true),
    recent_threads: z.boolean().optional().default(false),
    memory: z.boolean().optional().default(true),
  }).optional(),
}).optional();

export default publicProcedure
  .input(inputSchema)
  .query(async ({ input }) => {
    const snapshotId = `snap_${Date.now()}`;
    const generatedAt = new Date().toISOString();

    console.log('[SNAPSHOT] Generating system snapshot...');

    const snapshot: Record<string, any> = {
      snapshot_id: snapshotId,
      generated_at: generatedAt,
    };

    try {
      const gameStateData = await dbGet('system_state', 'current_game_state');
      const gameState = gameStateData?.state || null;

      if (gameState) {
        console.log('[SNAPSHOT] Found persisted game state');

        if (input?.include?.stats) {
          snapshot.stats = {
            level: gameState.stats?.level || 1,
            xp: gameState.stats?.xp || 0,
            xpToNextLevel: gameState.stats?.xpToNextLevel || 200,
            rank: gameState.stats?.rank || 'F',
            STR: gameState.stats?.STR || 0,
            AGI: gameState.stats?.AGI || 0,
            VIT: gameState.stats?.VIT || 0,
            INT: gameState.stats?.INT || 0,
            WIS: gameState.stats?.WIS || 0,
            CHA: gameState.stats?.CHA || 0,
            LCK: gameState.stats?.LCK || 0,
            fatigue: gameState.stats?.fatigue || 0,
            fullCowlSync: gameState.stats?.fullCowlSync || 0,
            codexIntegrity: gameState.stats?.codexIntegrity || 0,
            auraPower: gameState.stats?.auraPower || '0',
          };
        }

        if (input?.include?.skills) {
          snapshot.skills = gameState.skillTrees || [];
          snapshot.skillSubTrees = gameState.skillSubTrees || {};
          snapshot.skillProficiency = gameState.skillProficiency || {};
        }

        if (input?.include?.quests) {
          snapshot.quests = gameState.quests || [];
          snapshot.tasks = gameState.tasks || [];
        }

        if (input?.include?.forms) {
          snapshot.forms = {
            currentForm: gameState.currentForm || '',
            currentBPM: gameState.currentBPM || 0,
            transformations: gameState.transformations || [],
          };
        }

        if (input?.include?.vault) {
          snapshot.vault_recent = gameState.vaultEntries || [];
          snapshot.journalEntries = gameState.journalEntries || [];
        }

        if (input?.include?.council) {
          snapshot.council = gameState.councils || [];
        }

        if (input?.include?.tabs) {
          snapshot.identity = gameState.identity || {};
          snapshot.energySystems = gameState.energySystems || [];
          snapshot.currencies = gameState.currencies || [];
          snapshot.inventoryV2 = gameState.inventoryV2 || [];
          snapshot.roster = gameState.roster || [];
          snapshot.allies = gameState.allies || [];
          snapshot.dailyRituals = gameState.dailyRituals || [];
          snapshot.currentFloor = gameState.currentFloor || 1;
          snapshot.gpr = gameState.gpr || 0;
          snapshot.pvpRating = gameState.pvpRating || 0;
          snapshot.arcStory = gameState.arcStory || '';
          snapshot.realWorldModules = gameState.realWorldModules || {};
        }
      } else {
        console.log('[SNAPSHOT] No persisted game state, returning defaults');
        if (input?.include?.stats) snapshot.stats = { level: 1, xp: 0, rank: 'F' };
        if (input?.include?.skills) snapshot.skills = [];
        if (input?.include?.quests) snapshot.quests = [];
        if (input?.include?.forms) snapshot.forms = {};
        if (input?.include?.vault) snapshot.vault_recent = [];
        if (input?.include?.council) snapshot.council = [];
      }

      if (input?.include?.memory) {
        const memoryData = await dbGet('system_state', 'prime_memory_entries');
        snapshot.memory_entries = memoryData?.entries || [];
        snapshot.memory_count = memoryData?.count || 0;

        const ltmData = await dbGet('system_state', 'long_term_memory');
        snapshot.long_term_memory = ltmData?.items || [];
        snapshot.ltm_count = ltmData?.count || 0;
      }

      if (input?.include?.recent_threads) {
        const threadsData = await dbGet('system_state', 'conversation_threads');
        snapshot.threads_recent = threadsData?.threads || [];
      }

      const lastSync = await dbGet('system_state', 'last_sync');
      snapshot.last_sync = lastSync ? {
        sync_id: lastSync.syncId,
        synced_at: lastSync.completedAt,
        mode: lastSync.mode,
      } : null;

    } catch (error) {
      console.error('[SNAPSHOT] Error generating snapshot:', error);
      if (input?.include?.stats) snapshot.stats = { level: 1, xp: 0, rank: 'F' };
      if (input?.include?.skills) snapshot.skills = [];
      if (input?.include?.quests) snapshot.quests = [];
      if (input?.include?.forms) snapshot.forms = {};
      if (input?.include?.vault) snapshot.vault_recent = [];
      if (input?.include?.council) snapshot.council = [];
    }

    console.log('[SNAPSHOT] Generated snapshot:', snapshotId);
    return snapshot;
  });
