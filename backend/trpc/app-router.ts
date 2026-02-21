import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import healthStatus from "./routes/health/status";
import systemSnapshot from "./routes/system/snapshot";
import systemSync from "./routes/system/sync";
import questsList from "./routes/quests/list";
import questsCreateDraft from "./routes/quests/create-draft";
import questsApprove from "./routes/quests/approve";
import memoryGetGlobal from "./routes/memory/get-global";
import memoryUpsertFact from "./routes/memory/upsert-fact";
import councilListMembers from "./routes/council/list-members";
import councilUpsertMember from "./routes/council/upsert-member";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  health: createTRPCRouter({
    getStatus: healthStatus,
  }),
  system: createTRPCRouter({
    getSystemSnapshot: systemSnapshot,
    syncNow: systemSync,
  }),
  quests: createTRPCRouter({
    list: questsList,
    createDraftFromNavi: questsCreateDraft,
    approve: questsApprove,
  }),
  memory: createTRPCRouter({
    getGlobalMemory: memoryGetGlobal,
    upsertMemoryFact: memoryUpsertFact,
  }),
  council: createTRPCRouter({
    listMembers: councilListMembers,
    upsertMember: councilUpsertMember,
  }),
});

export type AppRouter = typeof appRouter;
