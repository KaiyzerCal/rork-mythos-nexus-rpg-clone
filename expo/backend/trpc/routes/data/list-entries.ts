import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { dbGet } from '../../../db';

const sectionSchema = z.enum(['vault', 'quests', 'skills', 'tasks', 'council']);

const inputSchema = z.object({
  section: sectionSchema,
  id: z.string().optional(),
  limit: z.number().int().min(1).max(500).optional().default(100),
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
  .query(async ({ input }) => {
    const gameStateData = await dbGet('system_state', 'current_game_state');
    const gameState = gameStateData?.state ?? {};
    const key = sectionMap[input.section];
    const entries = Array.isArray(gameState?.[key]) ? gameState[key] : [];

    if (input.id) {
      const item = entries.find((entry: any) => entry?.id === input.id) ?? null;
      return { item };
    }

    return {
      items: entries.slice(0, input.limit),
      total: entries.length,
    };
  });