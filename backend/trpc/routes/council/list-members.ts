import { publicProcedure } from '../../create-context';
import { z } from 'zod';

const inputSchema = z.object({
  class: z.enum(['core', 'advisory', 'think-tank', 'shadows']).nullable().optional(),
});

export default publicProcedure
  .input(inputSchema)
  .query(async ({ input }) => {
    console.log('[COUNCIL] Fetching members:', { class: input.class });

    return {
      members: [],
    };
  });
