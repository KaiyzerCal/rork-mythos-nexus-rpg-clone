export interface DBThread {
  id: string;
  title: string;
  contextTags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DBMessage {
  id: string;
  threadId: string;
  role: 'user' | 'assistant' | 'system';
  contentFull: string;
  contentDisplay: string;
  attachments: string[];
  meta: {
    mode?: string;
    form?: string | null;
    bpmState?: string | null;
  };
  modelMeta?: {
    engine?: string;
    latencyMs?: number;
    tokensIn?: number;
    tokensOut?: number;
  };
  createdAt: string;
  deletedAt: string | null;
}

export interface DBMemorySummary {
  id: string;
  threadId: string;
  summary: string;
  strategy: string;
  maxTokens: number;
  createdAt: string;
  updatedAt: string;
}

export interface DBMemoryFact {
  id: string;
  key: string;
  value: string;
  confidence: number;
  source: string;
  scope: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type QuestStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface DBQuest {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: number;
  xpReward: number;
  statTargets: Array<{ stat: string; value: number }>;
  skillLinks: string[];
  dueAt: string | null;
  status: QuestStatus;
  sourceThreadId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  completionNotes: string | null;
  evidence: string[];
  deletedAt: string | null;
}

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface DBQuestApproval {
  id: string;
  questId: string;
  requestedBy: string;
  status: ApprovalStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DBSkill {
  id: string;
  name: string;
  tree: string;
  rank: string;
  description: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DBUserSkill {
  id: string;
  userId: string;
  skillId: string;
  proficiency: number;
  lastPracticed: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DBStatBlock {
  id: string;
  userId: string;
  stats: Record<string, number>;
  updatedAt: string;
}

export interface DBVaultEntry {
  id: string;
  title: string;
  body: string;
  tags: string[];
  linkedQuestId: string | null;
  linkedThreadId: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DBCouncilMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  class: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface DBCouncilProfile {
  id: string;
  memberId: string;
  emotionalState: string;
  behaviorDelta: string;
  wins: string[];
  failures: string[];
  insights: string[];
  updatedAt: string;
}

export interface DBCouncilMemory {
  id: string;
  memberId: string;
  threadId: string;
  messageId: string;
  content: string;
  createdAt: string;
}

export interface DBAuditEvent {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  userId: string;
  payload: Record<string, any>;
  createdAt: string;
}

export interface DBSyncState {
  id: string;
  syncId: string;
  mode: string;
  reason: string;
  includedSystems: string[];
  status: 'STARTED' | 'COMPLETED' | 'FAILED';
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}
