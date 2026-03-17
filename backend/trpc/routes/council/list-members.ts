import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { dbGet } from '../../../db';

const inputSchema = z.object({
  class: z.enum(['core', 'advisory', 'think-tank', 'shadows']).nullable().optional(),
});

export default publicProcedure
  .input(inputSchema)
  .query(async ({ input }) => {
    console.log('[COUNCIL] Fetching members:', { class: input.class });
    const gameStateData = await dbGet('system_state', 'current_game_state');
    const members = Array.isArray(gameStateData?.state?.councils) ? gameStateData.state.councils : [];

    return {
      members: input.class ? members.filter((member: any) => member?.class === input.class) : members,
    };
  });
