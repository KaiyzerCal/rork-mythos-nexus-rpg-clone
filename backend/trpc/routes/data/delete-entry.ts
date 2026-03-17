import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { dbDelete, dbGet, dbSet } from '../../../db';

const sectionSchema = z.enum(['vault', 'quests', 'skills', 'tasks', 'council']);

const inputSchema = z.object({
  section: sectionSchema,
  id: z.string(),
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
      throw new Error('User authorization is required for deletes.');
    }

    const gameStateData = await dbGet('system_state', 'current_game_state');
    const gameState = gameStateData?.state ?? {};
    const key = sectionMap[input.section];
    const entries = Array.isArray(gameState?.[key]) ? gameState[key] : [];
    const nextEntries = entries.filter((entry: any) => entry?.id !== input.id);

    const nextGameState = {
      ...gameState,
      [key]: nextEntries,
    };

    await dbSet('system_state', 'current_game_state', {
      ...(gameStateData ?? {}),
      state: nextGameState,
      lastCrudActor: input.actor,
      lastCrudSection: input.section,
      lastCrudAt: new Date().toISOString(),
    });

    await dbDelete(`crud_${input.section}`, input.id).catch(() => false);

    return {
      ok: true,
      id: input.id,
      operation: 'delete',
    };
  });