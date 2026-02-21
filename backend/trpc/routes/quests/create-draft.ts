import { publicProcedure } from '../../create-context';
import { z } from 'zod';

const inputSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  difficulty: z.number().min(1).max(10),
  xp_reward: z.number(),
  stat_targets: z.array(z.object({
    stat: z.string(),
    value: z.number(),
  })).optional().default([]),
  skill_links: z.array(z.string()).optional().default([]),
  due_at: z.string().nullable().optional(),
  source_thread_id: z.string().nullable().optional(),
});

export default publicProcedure
  .input(inputSchema)
  .mutation(async ({ input }) => {
    const questId = `quest_${Date.now()}`;

    console.log('[QUEST] Creating draft quest from Navi:', {
      questId,
      title: input.title,
      difficulty: input.difficulty,
      xp_reward: input.xp_reward,
    });

    return {
      quest_id: questId,
      status: 'DRAFT' as const,
      title: input.title,
      description: input.description,
      category: input.category,
      difficulty: input.difficulty,
      xp_reward: input.xp_reward,
      created_at: new Date().toISOString(),
    };
  });
