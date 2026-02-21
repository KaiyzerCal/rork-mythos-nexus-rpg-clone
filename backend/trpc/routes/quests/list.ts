import { publicProcedure } from '../../create-context';
import { z } from 'zod';

const inputSchema = z.object({
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  limit: z.number().optional().default(50),
  cursor: z.string().nullable().optional(),
});

export default publicProcedure
  .input(inputSchema)
  .query(async ({ input }) => {
    console.log('[QUEST] Fetching quests:', {
      status: input.status,
      limit: input.limit,
    });

    return {
      items: [],
      next_cursor: null,
    };
  });
