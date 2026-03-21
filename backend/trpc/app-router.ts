import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import healthStatus from "./routes/health/status";
import systemSnapshot from "./routes/system/snapshot";
import systemSync from "./routes/system/sync";
import { getSnapshotBuildStatusProcedure } from "./routes/builds/get-snapshot-build-status";
import questsList from "./routes/quests/list";
import questsCreateDraft from "./routes/quests/create-draft";
import questsApprove from "./routes/quests/approve";
import memoryGetGlobal from "./routes/memory/get-global";
import memoryUpsertFact from "./routes/memory/upsert-fact";
import councilListMembers from "./routes/council/list-members";
import councilUpsertMember from "./routes/council/upsert-member";
import aiGetRuntimeContext from "./routes/ai/get-runtime-context";
import aiWebSearch from "./routes/ai/web-search";
import dataListEntries from "./routes/data/list-entries";
import dataUpsertEntry from "./routes/data/upsert-entry";
import dataDeleteEntry from "./routes/data/delete-entry";

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
  builds: createTRPCRouter({
    getSnapshotBuildStatus: getSnapshotBuildStatusProcedure,
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
  ai: createTRPCRouter({
    getRuntimeContext: aiGetRuntimeContext,
    webSearch: aiWebSearch,
  }),
  data: createTRPCRouter({
    listEntries: dataListEntries,
    upsertEntry: dataUpsertEntry,
    deleteEntry: dataDeleteEntry,
  }),
});

export type AppRouter = typeof appRouter;
