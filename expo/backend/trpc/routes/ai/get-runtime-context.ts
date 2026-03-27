import { publicProcedure } from '../../create-context';
import { z } from 'zod';
import { dbGet } from '../../../db';

const inputSchema = z.object({
  section: z.enum(['overview', 'vault', 'quests', 'skills', 'tasks', 'council', 'all']).optional().default('overview'),
  includeFullEntries: z.boolean().optional().default(false),
  limit: z.number().int().min(1).max(500).optional().default(50),
}).optional();

function sliceItems<T>(items: T[], limit: number, includeFullEntries: boolean): T[] {
  if (includeFullEntries) {
    return items.slice(0, limit);
  }
  return items.slice(0, Math.min(limit, 20));
}

export default publicProcedure
  .input(inputSchema)
  .query(async ({ input }) => {
    const gameStateData = await dbGet('system_state', 'current_game_state');
    const memoryEntriesData = await dbGet('system_state', 'prime_memory_entries');
    const longTermMemoryData = await dbGet('system_state', 'long_term_memory');
    const conversationThreadsData = await dbGet('system_state', 'conversation_threads');
    const gameState = gameStateData?.state ?? null;

    if (!gameState) {
      return {
        prompt: 'State is backend-backed and condensed. Read overview first, then retrieve the exact section you need. Require explicit user approval before any create, update, or delete.',
        retrieval: {
          source: 'backend_database',
          instructions: [
            'Read overview first.',
            'Retrieve the exact section only when needed.',
            'Use full entries only for exact wording or edits.',
          ],
        },
        overview: null,
        sections: {},
      };
    }

    const quests = Array.isArray(gameState.quests) ? gameState.quests : [];
    const skills = Array.isArray(gameState.skillTrees) ? gameState.skillTrees : [];
    const tasks = Array.isArray(gameState.tasks) ? gameState.tasks : [];
    const council = Array.isArray(gameState.councils) ? gameState.councils : [];
    const vault = Array.isArray(gameState.vaultEntries) ? gameState.vaultEntries : [];
    const memoryEntries = Array.isArray(memoryEntriesData?.entries) ? memoryEntriesData.entries : [];
    const longTermMemory = Array.isArray(longTermMemoryData?.items) ? longTermMemoryData.items : [];
    const conversationThreads = Array.isArray(conversationThreadsData?.threads) ? conversationThreadsData.threads : [];

    const overview = {
      identity: gameState.identity?.inscribedName ?? 'Unknown',
      level: gameState.stats?.level ?? 1,
      rank: gameState.stats?.rank ?? 'F',
      currentForm: gameState.currentForm ?? 'Unknown',
      currentBPM: gameState.currentBPM ?? 0,
      currentFloor: gameState.currentFloor ?? 0,
      activeQuestCount: quests.filter((quest: any) => quest.status === 'active').length,
      taskCount: tasks.length,
      unlockedSkillCount: skills.filter((skill: any) => skill.unlocked).length,
      vaultEntryCount: vault.length,
      councilCount: council.length,
      memoryEntryCount: memoryEntries.length,
      longTermMemoryCount: longTermMemory.length,
      conversationThreadCount: conversationThreads.length,
      arcStory: gameState.arcStory ?? '',
    };

    const prompt = [
      'CONDENSED BACKEND STATE:',
      `Operator ${overview.identity} • L${overview.level} ${overview.rank} • Form ${overview.currentForm} • Floor ${overview.currentFloor}`,
      `Counts q:${overview.activeQuestCount}/${quests.length} t:${overview.taskCount} s:${overview.unlockedSkillCount}/${skills.length} v:${overview.vaultEntryCount} c:${overview.councilCount} m:${overview.memoryEntryCount}`,
      'Read overview first. Retrieve exact sections only when needed. Use full entries only for exact wording or edits.',
      'All tabs are connected through the backend database. Require explicit user approval before any create, update, or delete.',
    ].join('\n');

    const allSections = {
      overview,
      identity: gameState.identity ?? null,
      stats: gameState.stats ?? null,
      forms: {
        currentForm: gameState.currentForm ?? null,
        currentBPM: gameState.currentBPM ?? null,
        transformations: sliceItems(Array.isArray(gameState.transformations) ? gameState.transformations : [], input?.limit ?? 50, input?.includeFullEntries ?? false),
      },
      vault: sliceItems(vault, input?.limit ?? 50, input?.includeFullEntries ?? false),
      quests: sliceItems(quests, input?.limit ?? 50, input?.includeFullEntries ?? false),
      tasks: sliceItems(tasks, input?.limit ?? 50, input?.includeFullEntries ?? false),
      skills: sliceItems(skills, input?.limit ?? 50, input?.includeFullEntries ?? false),
      council: sliceItems(council, input?.limit ?? 50, input?.includeFullEntries ?? false),
      memory: sliceItems(memoryEntries, input?.limit ?? 50, input?.includeFullEntries ?? false),
      long_term_memory: sliceItems(longTermMemory, input?.limit ?? 50, input?.includeFullEntries ?? false),
      recent_threads: sliceItems(conversationThreads, input?.limit ?? 50, input?.includeFullEntries ?? false),
    };

    const requestedSections = input?.section === 'all'
      ? allSections
      : input?.section === 'overview'
        ? { overview: allSections.overview }
        : { overview: allSections.overview, [input?.section ?? 'overview']: allSections[input?.section ?? 'overview' as keyof typeof allSections] };

    return {
      prompt,
      retrieval: {
        source: 'backend_database',
        instructions: [
          'Read overview to understand the current state.',
          'Retrieve vault with includeFullEntries=true only when exact wording is needed.',
          'Retrieve quests, tasks, skills, or council only when making recommendations or edits.',
          'Use writes only after explicit user authorization.',
        ],
      },
      overview,
      sections: requestedSections,
    };
  });