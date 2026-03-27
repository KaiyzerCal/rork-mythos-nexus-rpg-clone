import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { dbGet, dbSet } from '../../../db';

const sectionSchema = z.enum(['vault', 'quests', 'skills', 'tasks', 'council']);

const inputSchema = z.object({
  section: sectionSchema,
  id: z.string().optional(),
  entry: z.record(z.string(), z.any()),
  actor: z.string().optional().default('ai_system'),
  authorized: z.boolean(),
});

const sectionMap = {
  vault: 'vaultEntries',
  quests: 'quests',
  skills: 'skillTrees',
  tasks: 'tasks',
  council: 'councils',
} as const;

export default publicProcedure
  .input(inputSchema)
  .mutation(async ({ input }) => {
    if (!input.authorized) {
      throw new Error('User authorization is required for writes.');
    }

    const gameStateData = await dbGet('system_state', 'current_game_state');
    const gameState = gameStateData?.state ?? {};
    const key = sectionMap[input.section];
    const entries = Array.isArray(gameState?.[key]) ? [...gameState[key]] : [];
    const nextId = input.id ?? input.entry.id ?? `${input.section}-${Date.now()}`;
    const currentIndex = entries.findIndex((entry: any) => entry?.id === nextId);
    const existingEntry = currentIndex >= 0 ? entries[currentIndex] : null;
    const nextEntry = {
      ...existingEntry,
      ...input.entry,
      id: nextId,
      updatedAt: Date.now(),
    };

    if (currentIndex >= 0) {
      entries[currentIndex] = nextEntry;
    } else {
      entries.unshift(nextEntry);
    }

    const nextGameState = {
      ...gameState,
      [key]: entries,
    };

    await dbSet('system_state', 'current_game_state', {
      ...(gameStateData ?? {}),
      state: nextGameState,
      lastCrudActor: input.actor,
      lastCrudSection: input.section,
      lastCrudAt: new Date().toISOString(),
    });

    await dbSet(`crud_${input.section}`, nextId, {
      ...nextEntry,
      actor: input.actor,
    });

    return {
      ok: true,
      id: nextId,
      operation: currentIndex >= 0 ? 'update' : 'create',
      item: nextEntry,
    };
  });