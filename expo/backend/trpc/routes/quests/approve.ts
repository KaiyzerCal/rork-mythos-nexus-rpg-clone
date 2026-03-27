import { publicProcedure } from '../../create-context';
import { z } from 'zod';

const inputSchema = z.object({
  approval_id: z.string(),
  quest_id: z.string(),
  approved: z.boolean(),
  notes: z.string().nullable().optional(),
});

export default publicProcedure
  .input(inputSchema)
  .mutation(async ({ input }) => {
    console.log('[QUEST] Processing approval:', {
      quest_id: input.quest_id,
      approved: input.approved,
    });

    const newStatus = input.approved ? 'ACTIVE' : 'DRAFT';

    return {
      quest_id: input.quest_id,
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
  });
