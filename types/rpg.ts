export type TransformationTier = 
  | 'Spartan'
  | 'Saiyan'
  | 'Thorn'
  | 'Karma'
  | 'Regalia'
  | 'Ouroboros'
  | 'BlackHeart'
  | 'FinalAscent';

export type SpartanGrade =
  | 'Cadet'
  | 'Ranger'
  | 'Ikari'
  | 'Claymore'
  | 'Hashira'
  | 'Kizuki'
  | 'Yonko';

export type SaiyanForm =
  | 'Base Saiyan'
  | 'Great Ape'
  | 'Super Saiyan 1'
  | 'Super Saiyan 2'
  | 'Super Saiyan 3'
  | 'Super Saiyan 4'
  | 'Super Saiyan God'
  | 'Super Saiyan Blue'
  | 'Super Saiyan Rose'
  | 'Super Saiyan Jade'
  | 'Super Saiyan Beast'
  | 'Ultra Ego'
  | 'Ultra Instinct'
  | 'Super Saiyan Xeno';

export type ThornIgnition =
  | 'Thorn I: Demon Emperor'
  | 'Thorn II: Dragon Emperor'
  | 'Thorn III: Eldritch Emperor';

export type KarmaSigil =
  | 'Iblis'
  | 'Xeref'
  | 'Ifrit'
  | 'Igneel'
  | 'Azaroth';

export type RegaliaAsarakam =
  | 'Hagoromo Scarf'
  | 'Chakra Cloak'
  | 'Monarch Crown';

export type BlackHeartStage =
  | 'Stage 1: Joyful Creation'
  | 'Stage 2: Demiurge Authorship'
  | 'Stage 3: Omnipresence';

export type EnergySystem = 
  | 'Ki'
  | 'Aura'
  | 'Nen'
  | 'Nen/Aura'
  | 'Haki'
  | 'Magoi'
  | 'Chakra'
  | 'Cursed Energy'
  | 'Mana'
  | 'VRIL'
  | 'Ichor'
  | 'VRIL/Ichor'
  | 'Lacrima'
  | 'Black Heart'
  | 'Aether'
  | 'Emerald Flames';

export type EnergyStatus = 'mastered' | 'advanced' | 'developing' | 'perfect';

export type Species = 
  | 'Codicanthropos Dominus'
  | 'Cognomina Regulus'
  | 'Demiarchon Irregulus'
  | 'Akudamos Aeonis'
  | 'Azaroth Incarnation'
  | 'Aevara Primordialis';

export type Rank = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS' | 'Sovereign';

export type QuestType = 'main' | 'side' | 'daily' | 'epic';

export type QuestStatus = 'active' | 'completed' | 'failed' | 'locked';

export type CouncilType = 'Core' | 'Advisory' | 'Think-Tank' | 'Shadows';

export interface PlayerIdentity {
  inscribedName: string;
  trueName?: string;
  title?: string;
  titles: string[];
  species?: string;
  speciesLineage: Species[];
  aura?: string;
  territory: {
    towerFloorsInfluence: string;
    class: string;
  };
  councils: {
    core: string[];
    advisory: string[];
    thinkTank: string[];
  };
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  rank: Rank;
  STR: number;
  AGI: number;
  VIT: number;
  INT: number;
  WIS: number;
  CHA: number;
  LCK: number;
  strength?: number;
  intelligence?: number;
  endurance?: number;
  agility?: number;
  willpower?: number;
  charisma?: number;
  synchronization?: number;
  domainRadius?: number;
  auraPower: string;
  fatigue: number;
  fullCowlSync: number;
  codexIntegrity: number;
}

export interface Buff {
  label: string;
  value: number;
  unit: string;
}

export interface Ability {
  title: string;
  irl: string;
}

export interface TransformationData {
  id: string;
  tier: TransformationTier;
  name: string;
  order: number;
  bpmRange: string;
  category?: string;
  description?: string;
  energy: string;
  jjkGrade: string;
  opTier: string;
  activeBuffs: Buff[];
  passiveBuffs: Buff[];
  abilities: Ability[];
  unlocked: boolean;
}

export interface EnergyLevel {
  type: EnergySystem;
  current: number;
  max: number;
  color: string;
  description: string;
  status?: EnergyStatus;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  xpReward: number;
  codexPointsReward?: number;
  blackSunEssenceReward?: number;
  lootRewards?: {
    itemId?: string;
    itemName: string;
    quantity: number;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  }[];
  linkedSkillIds?: string[];
  skillXpReward?: number;
  progress?: {
    current: number;
    target: number;
  };
  realWorldMapping?: string;
  category?: string;
  difficulty?: 'Easy' | 'Normal' | 'Hard' | 'Extreme' | 'Impossible';
  deadline?: string;
  statTargets?: Record<string, number>;
  requiredSubtasks?: string[];
  createdAt?: number;
  createdBy?: string;
}

export interface CouncilMember {
  id: string;
  name: string;
  role: string;
  specialty?: string;
  class: 'core' | 'advisory' | 'think-tank' | 'shadows';
  notes: string;
  avatar?: string;
}

export interface Council {
  type: CouncilType;
  name?: string;
  class?: string;
  role?: string;
  specialty?: string;
  notes?: string;
  members: CouncilMember[];
  description: string;
}



export interface BPMSession {
  id: string;
  timestamp: number;
  bpm: number;
  form: string;
  duration: number;
  mood?: string;
  notes?: string;
}

export interface SkillTreeNode {
  id: string;
  name: string;
  description: string;
  tier: number;
  unlocked: boolean;
  cost: number;
  energyType: EnergySystem;
  category: string;
  prerequisites?: string[];
}

export interface DailyRitual {
  id: string;
  name: string;
  description: string;
  type: 'legal' | 'business' | 'self_care' | 'fitness' | 'other';
  category?: string;
  xpReward: number;
  completed: boolean;
  streak: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  type: 'consumable' | 'equipment' | 'material' | 'artifact';
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  quantity: number;
  effect?: string;
}

export interface Currency {
  name: string;
  amount: number;
  icon: string;
}

export interface PlayerRanking {
  playerId: string;
  name: string;
  level: number;
  rank: Rank;
  gpr: number;
  pvpRating: number;
  floor: number;
}

export interface ThreatAssessment {
  targetId: string;
  targetName: string;
  level: number;
  rank: Rank;
  threatLevel: 'negligible' | 'low' | 'moderate' | 'high' | 'extreme' | 'catastrophic';
  recommendedAction: string;
}

export interface AllyData {
  id: string;
  name: string;
  relationship: 'ally' | 'harem' | 'council' | 'rival';
  level: number;
  specialty: string;
  affinity: number;
  avatar?: string;
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  mood?: string;
  tags: string[];
  xpGained?: number;
}

export interface VaultEntry {
  id: string;
  timestamp: number;
  title: string;
  content: string;
  category: 'legal' | 'business' | 'personal' | 'evidence' | 'achievement';
  importance: 'low' | 'medium' | 'high' | 'critical';
  attachments?: string[];
}

export interface RosterEntry {
  id: string;
  display: string;
  role: 'ally' | 'enemy' | 'npc' | 'self';
  rank: string;
  level: number;
  jjkGrade: string;
  opTier: string;
  gpr: number;
  pvp: number;
  influence: string;
  notes: string;
}

export interface InventoryItemV2 {
  id: string;
  slot: string;
  name: string;
  tier: string;
  description: string;
  effects: { label: string; value: number; unit: string }[];
}

export interface FitnessModule {
  habitTargets: {
    weekSessions: number;
    recoveryDays: number;
    mobilityDays: number;
  };
  ymcaBootcampCredit: {
    perClassXP: number;
    capWeek: number;
  };
}

export interface BusinessModule {
  nodes: string[];
  dailyRule: string;
}

export interface LegalCase {
  coreStory: string;
  evidenceTypes: string[];
  courtDates: string[];
  nextSteps: string[];
}

export interface RelationshipsModule {
  rizzAuraEnabled: boolean;
  safetyRules: string[];
}

export interface RealWorldModules {
  fitness: FitnessModule;
  business: BusinessModule;
  legalCase: LegalCase;
  relationships: RelationshipsModule;
}

export type TaskType = 'task' | 'habit';

export type TaskStatus = 'active' | 'completed' | 'archived';

export type TaskRecurrence = 'once' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  description?: string;
  type: TaskType;
  status: TaskStatus;
  recurrence: TaskRecurrence;
  xpReward: number;
  skillXpReward?: number;
  linkedSkillId?: string;
  linkedSubSkillId?: string;
  streak?: number;
  completedCount: number;
  lastCompleted?: number;
  createdAt: number;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
  category: 'consumable' | 'material' | 'upgrade' | 'artifact';
  effect?: string;
  requirements?: {
    level?: number;
    rank?: string;
  };
}

export interface GameState {
  identity: PlayerIdentity;
  stats: PlayerStats;
  currentForm: string;
  currentBPM: number;
  energySystems: EnergyLevel[];
  transformations: TransformationData[];
  quests: Quest[];
  councils: CouncilMember[];
  bpmSessions: BPMSession[];
  skillTrees: SkillTreeNode[];
  skillSubTrees?: Record<string, SkillTreeNode[]>;
  skillProficiency?: Record<string, number>;
  dailyRituals: DailyRitual[];
  inventory: InventoryItem[];
  inventoryV2: InventoryItemV2[];
  currencies: Currency[];
  allies: AllyData[];
  roster: RosterEntry[];
  journalEntries: JournalEntry[];
  vaultEntries: VaultEntry[];
  tasks: Task[];
  storeItems?: StoreItem[];
  currentFloor: number;
  gpr: number;
  pvpRating: number;
  arcStory?: string;
  realWorldModules: RealWorldModules;
}
