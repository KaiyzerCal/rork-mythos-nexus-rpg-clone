import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { dbGet, dbSet } from '../../../db';

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

    const gameStateData = await dbGet('system_state', 'current_game_state');
    const gameState = gameStateData?.state ?? {};
    const councils = Array.isArray(gameState.councils) ? [...gameState.councils] : [];
    const nextMember = {
      id: memberId,
      name: input.name,
      role: input.role,
      specialty: input.specialty,
      class: input.class,
      notes: input.notes,
    };
    const existingIndex = councils.findIndex((member: any) => member?.id === memberId);

    if (existingIndex >= 0) {
      councils[existingIndex] = { ...councils[existingIndex], ...nextMember };
    } else {
      councils.unshift(nextMember);
    }

    await dbSet('system_state', 'current_game_state', {
      ...(gameStateData ?? {}),
      state: {
        ...gameState,
        councils,
      },
    });

    await dbSet('crud_council', memberId, nextMember);

    return {
      member_id: memberId,
      member: nextMember,
    };
  });
