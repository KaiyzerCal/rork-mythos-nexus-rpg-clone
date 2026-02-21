import { publicProcedure } from '../../create-context';
import { z } from 'zod';

const inputSchema = z.object({
  member_id: z.string().nullable().optional(),
  name: z.string(),
  role: z.string(),
  specialty: z.string(),
  class: z.enum(['core', 'advisory', 'think-tank', 'shadows']),
  notes: z.string(),
});

export default publicProcedure
  .input(inputSchema)
  .mutation(async ({ input }) => {
    const memberId = input.member_id || `member_${Date.now()}`;

    console.log('[COUNCIL] Upserting council member:', {
      member_id: memberId,
      name: input.name,
      class: input.class,
    });

    return {
      member_id: memberId,
    };
  });
