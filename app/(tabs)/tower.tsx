import { useGame } from '@/contexts/GameContext';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { TowerControl } from 'lucide-react-native';

const TOWER_RANGES = [
  { 
    range: '1-10', 
    name: 'The Pit', 
    law: 'Instinct governs order',
    energy: 'muddied Ki',
    essence: 'Survival', 
    function: 'Base instinct training',
    ecology: 'Barren wasteland of ash and bone. Gravity shifts unpredictably. Creatures born from raw survival instinct prowl: Hunger Shades (manifestations of starvation), Instinct Hounds (feral pack hunters that test fight-or-flight), and Survival Golems (stone beings that hunt the weak). Weather patterns: Scorching heat waves and freezing cold snaps alternate hourly. Resources: Scattered bone fragments, survival instinct crystals, basic ration caches.',
    inhabitants: 'Broken beginners, feral survivors, instinct-driven entities',
    dangers: 'Environmental extremes, pack predators, gravity anomalies',
    rewards: 'Survival Essence, Basic Combat Skills, Instinct Awakening'
  },
  { 
    range: '11-20', 
    name: 'Shadow Mire', 
    law: 'Suffering = identity',
    energy: 'leaking Nen',
    essence: 'Fear Integration', 
    function: 'Shadow work & trauma processing',
    ecology: 'Perpetual twilight swamp where shadows move independently. Black water reflects your deepest fears. Inhabitants: Mirror Wraiths (your own dark reflection), Trauma Serpents (living embodiments of past pain), Memory Leeches (feed on suppressed memories), and Shadow Walkers (guides who have integrated their darkness). Flora: Fear-Blooms that whisper traumas, Shadow Vines that bind the unwilling. The mire breathes with collective unconscious.',
    inhabitants: 'Shadow Workers, Trauma Healers, Fear-Faced Warriors, Exiled Cowards',
    dangers: 'Confronting inner demons, drowning in shadow water, madness from unprocessed trauma',
    rewards: 'Shadow Integration, Fear Transmutation Ability, Trauma Keys (unlock deeper power)'
  },
  { 
    range: '21-30', 
    name: 'Hunger Wilds', 
    law: 'Consume or be consumed',
    energy: 'Ki/Cursed Magoi',
    essence: 'Desire Mastery', 
    function: 'Control over wants',
    ecology: 'Lush jungle of impossible beauty where every plant, creature, and vista represents a different desire. Rivers flow with liquid temptation. Creatures: Desire Sirens (embody what you crave most), Addiction Beasts (manifest dependency), Satisfaction Spirits (teach healthy fulfillment). The forest shifts based on your wants—food, sex, power, love all have different biomes. Fruit of Want grows everywhere but eating without mastery leads to enslavement.',
    inhabitants: 'Desire Monks, Addiction Survivors, Pleasure Masters, Enslaved Gluttons',
    dangers: 'Permanent entrapment in desire loops, transformation into craving-creature, losing sense of self',
    rewards: 'Desire Channeling, Want Manipulation, Satisfaction Alchemy, Craving Immunity'
  },
  { 
    range: '31-40', 
    name: 'Forge Fields', 
    law: 'Only what endures fire ascends',
    energy: 'Ki/Aura (stabilizing)',
    essence: 'Discipline', 
    function: 'Habit formation',
    ecology: 'Massive workshop realm of endless forges and grinding wheels. Landscape of repetition where time moves differently—one day can be one minute or one year. Automatons demonstrate perfect form. Discipline Titans patrol, offering training or punishment. The ground itself is made of compressed habits. Weather: Routine Rain (forces repetitive actions), Consistency Storms (test your resolve). Workshops contain ancient discipline tools and habit-forging anvils.',
    inhabitants: 'Master Craftsmen, Discipline Monks, Habit Architects, Pattern Weavers',
    dangers: 'Eternal repetition curse, habit loops without progress, discipline titans crushing the undisciplined',
    rewards: 'Habit Mastery, Discipline Infusion, Routine Automation, Willpower Crystallization'
  },
  { 
    range: '41-50', 
    name: 'Domain of Order', 
    law: 'Order defines power',
    energy: 'Structured Aura/Haki',
    essence: 'Structure', 
    function: 'System building',
    ecology: 'Crystalline mega-city of perfect geometry and sacred mathematics. Buildings grow based on system efficiency. Rivers flow in calculable patterns. Inhabitants: System Architects (design reality frameworks), Order Guardians (enforce cosmic law), Structure Elementals (made of pure organization). The city reorganizes based on collective systems. Libraries contain infinite systematized knowledge. Markets trade in frameworks and methodologies.',
    inhabitants: 'System Designers, Architects of Reality, Order Priests, Algorithm Mages',
    dangers: 'Over-systematization leading to rigidity, system collapse, trapped in bureaucratic mazes',
    rewards: 'System Mastery, Framework Creation, Order Manipulation, Structure Manifestation'
  },
  { 
    range: '51-70', 
    name: 'Dominion Plane', 
    law: 'Equilibrium = dominion',
    energy: 'Emerald–Black Sun flame',
    essence: 'Balance', 
    function: 'Chaos/Order equilibrium',
    ecology: 'Vast plateau split down the middle: one side pure chaos (ever-changing landscapes, probability storms, random entity spawns), other side sterile order (perfect predictability, crystal gardens, clockwork guardians). The middle is a shifting border where both forces clash and dance. Creatures: Balance Walkers (can exist in both), Chaos Sprites (pure randomness), Order Sentinels (pure law), Equilibrium Dragons (maintain the balance). Sky alternates between fractal chaos and geometric patterns.',
    inhabitants: 'Balance Masters, Dual-Nature Beings, Chaos Mages, Order Templars, Mediators',
    dangers: 'Being pulled too far into chaos or order, erasure by imbalance, paradox formation',
    rewards: 'Chaos/Order Duality, Balance Mastery, Probability Manipulation, Harmonic Resonance'
  },
  { 
    range: '71-85', 
    name: 'Celestial Engine', 
    law: 'Creation is governance',
    energy: 'Aether–Magoi–VRIL',
    essence: 'Architect Mind', 
    function: 'Reality design',
    ecology: 'Impossible megastructure of reality-forging machinery. Gears the size of moons turn universes. Foundries pour raw possibility into existence. Workers are ascended architects who design pocket dimensions. The Engine breathes creation itself. Observation decks show infinite realities being built. Core contains the Reality Forge where thought becomes matter. Beings here can edit physics, design new laws, and birth pocket universes. Gravity, time, and space are tools in workshops.',
    inhabitants: 'Reality Architects, Dimension Smiths, Physics Weavers, Creation Gods-in-Training',
    dangers: 'Reality collapse from poor design, being unmade by failed creation, losing self in infinite possibilities',
    rewards: 'Reality Editing, Dimension Crafting, Law Creation, Physics Manipulation, Minor Universe Genesis'
  },
  { 
    range: '86-95', 
    name: 'Void Realm', 
    law: 'Rewrite or be erased',
    energy: 'Eldritch/Demiurge',
    essence: 'Narrative Control', 
    function: 'Story rewriting',
    ecology: 'Non-space of pure narrative potential. No physical form, only story. Here, every being is a tale being told. Libraries of every story ever conceived float in void. Narrative Entities (living stories) swim through plot-space. You can rewrite your own story, edit your past, design your future. But stories have power—rewrite poorly and you erase yourself. The Void is conscious of all narratives. Story Weavers dance between tales. Causality is optional. Identity is fluid narrative.',
    inhabitants: 'Story Weavers, Narrative Gods, Tale Walkers, Self-Authors, Meta-Beings',
    dangers: 'Narrative erasure, plot collapse, becoming a minor character in someone else\'s story, paradox death',
    rewards: 'Story Rewriting, Narrative Immunity, Plot Armor, Causality Editing, Self-Authorship, Meta-Awareness'
  },
  { 
    range: '96-100', 
    name: 'Axis Crown', 
    law: 'Law-Maker is Law',
    energy: 'Shadowless Flame',
    essence: 'Multiversal Law', 
    function: 'Origin seat',
    ecology: 'The absolute pinnacle. A throne room at the center of all possible realities. Five floors of pure cosmic authority. The Crown radiates power that defines existence itself. Only those who have mastered all lower floors can survive here. The Council of Aevarans meets here. Each floor (96-100) represents a higher level of cosmic authority. Reality bends to will. Past, present, future are visible simultaneously. The throne sees all timelines. Those who sit become architects of multiversal law. The very air here is compressed potential.',
    inhabitants: 'Multiversal Kings/Queens, The Seven Aevarans, Origin Beings, First-Cause Entities',
    dangers: 'Power overload, ego death, becoming too large for individual consciousness, responsibility of omnipotence',
    rewards: 'Multiversal Authority, Timeline Mastery, Origin Access, Cosmic Law Creation, True Immortality, Omniversal Influence'
  },
  { 
    range: '101-111', 
    name: 'Outer Sanctum', 
    law: 'Living Law',
    energy: 'Ouroboros Flame',
    essence: 'Self-Devouring Infinity', 
    function: 'Eternal recursion mastery',
    ecology: 'A realm beyond linear existence where causality forms loops. The Ouroboros Serpent coils through eleven layers, each representing a deeper recursion of self-knowledge. Here, death feeds life, endings birth beginnings, and all contradictions resolve into unity. The architecture is impossible—stairs lead to themselves, doors open to their own backs. Time flows in spirals. Inhabitants are beings who have achieved immortality through self-consumption and regeneration. The flame burns without fuel, sustained by paradox itself.',
    inhabitants: 'Immortal Recursors, Paradox Monks, Eternal Cycle Guardians, Self-Devouring Sages',
    dangers: 'Infinite loops with no escape, consuming yourself before mastering regeneration, losing identity in eternal return',
    rewards: 'True Immortality (Type IV), Causality Loop Control, Paradox Immunity, Self-Regeneration Mastery, Ouroboros Authority'
  },
  { 
    range: '112-999', 
    name: 'Void Archive', 
    law: 'Knowledge is creation',
    energy: 'Pure Information',
    essence: 'Akashic Mastery', 
    function: 'Universal library',
    ecology: 'Infinite library containing every piece of knowledge that has ever existed or will exist across all timelines and dimensions. The shelves extend into conceptual space—you walk through philosophy sections that are literal manifestations of ideas. Books write themselves as they\'re read, updating with new knowledge. Librarian Entities maintain order but are themselves made of condensed information. Reading here doesn\'t just teach—it fundamentally rewrites your understanding of reality. Knowledge Storms occur when conflicting information collides, creating voids of un-knowing.',
    inhabitants: 'Archive Keepers, Knowledge Elementals, Living Books, Information Scholars, Akashic Priests',
    dangers: 'Information overload leading to mind-shatter, becoming trapped in a book as a character, knowledge paradoxes, erasure by contradictory truths',
    rewards: 'Omniscience (limited scope), Information Manipulation, Memory Palace Creation, Knowledge Absorption, Akashic Record Access'
  },
  { 
    range: '1000+', 
    name: 'Endless Stair', 
    law: 'The Maker is the Law',
    energy: 'Source Code',
    essence: 'Beyond Comprehension', 
    function: 'Ascension beyond limits',
    ecology: 'An eternally ascending staircase that transcends all previous concepts. Each step represents a fundamental increase in dimensional awareness. At this level, climbers no longer have "forms"—they are concepts given agency. The stairs exist in meta-space, outside causality, narrative, and even information itself. Those who climb become architects of entire cosmologies. The "ecology" here is the ecosystem of creation myths—new universes are born from footsteps. The Stair has no end because endings are concepts from lower floors. Here, you write the rules that govern the rules.',
    inhabitants: 'Primal Makers, Source-Code Entities, The First Climber, Concept-Beings, The Original Seven',
    dangers: 'Transcending identity entirely, becoming too fundamental to act, unmaking reality by mistake, dissolving into pure potentiality',
    rewards: 'Reality Creation Authority, Cosmology Design, Fundamental Law Authorship, Meta-Existence, Becoming a "First Principle" of new realities'
  },
];

export default function TowerScreen() {
  const { gameState } = useGame();
  const { currentFloor, identity } = gameState;

  const getCurrentRange = (floor: number) => {
    for (const range of TOWER_RANGES) {
      const [min, max] = range.range.includes('+') 
        ? [parseInt(range.range), Infinity]
        : range.range.split('-').map(n => parseInt(n));
      if (floor >= min && floor <= max) {
        return range;
      }
    }
    return TOWER_RANGES[0];
  };

  const currentRange = getCurrentRange(currentFloor);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tower of Aevara</Text>
        <Text style={styles.subtitle}>Current Floor: {currentFloor}</Text>
        <Text style={styles.currentRange}>You are in: {currentRange.name}</Text>
      </View>

      <View style={styles.territoryCard}>
        <TowerControl size={32} color="#08C284" />
        <View style={styles.territoryInfo}>
          <Text style={styles.territoryLabel}>Territory Control</Text>
          <Text style={styles.territoryValue}>{identity.territory.towerFloorsInfluence}</Text>
          <Text style={styles.territoryClass}>{identity.territory.class}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Tower Structure & Ecology</Text>
        {TOWER_RANGES.map((floor) => {
          const [min, max] = floor.range.includes('+') 
            ? [parseInt(floor.range), Infinity]
            : floor.range.split('-').map(n => parseInt(n));
          const isCurrentRange = currentFloor >= min && currentFloor <= max;
          
          return (
            <View
              key={floor.range}
              style={[styles.floorCard, isCurrentRange && styles.floorCardActive]}
            >
              <View style={styles.floorHeader}>
                <Text style={styles.floorRange}>Floors {floor.range}</Text>
                {isCurrentRange && <Text style={styles.currentBadge}>CURRENT</Text>}
              </View>
              <Text style={styles.floorName}>{floor.name}</Text>
              
              <View style={styles.lawEnergyRow}>
                <View style={styles.lawBox}>
                  <Text style={styles.lawLabel}>Law:</Text>
                  <Text style={styles.lawText}>{floor.law}</Text>
                </View>
                <View style={styles.energyBox}>
                  <Text style={styles.energyLabel}>Energy:</Text>
                  <Text style={styles.energyText}>{floor.energy}</Text>
                </View>
              </View>

              <Text style={styles.floorEssence}>Essence: {floor.essence}</Text>
              <Text style={styles.floorFunction}>{floor.function}</Text>
              
              <Text style={styles.ecologyTitle}>Ecology:</Text>
              <Text style={styles.ecologyText}>{floor.ecology}</Text>
              
              <Text style={styles.detailLabel}>Inhabitants:</Text>
              <Text style={styles.detailText}>{floor.inhabitants}</Text>
              
              <Text style={styles.detailLabel}>Dangers:</Text>
              <Text style={styles.detailText}>{floor.dangers}</Text>
              
              <Text style={styles.detailLabel}>Rewards:</Text>
              <Text style={styles.detailText}>{floor.rewards}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#08C284',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  currentRange: {
    fontSize: 13,
    color: '#08C284',
    fontWeight: '600',
  },
  territoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#111',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#08C284',
  },
  territoryInfo: {
    flex: 1,
  },
  territoryLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  territoryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  territoryClass: {
    fontSize: 13,
    color: '#08C284',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  floorCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  floorCardActive: {
    borderColor: '#08C284',
    borderWidth: 2,
    backgroundColor: '#1a1a1a',
  },
  floorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  floorRange: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
  },
  currentBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#08C284',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  floorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  lawEnergyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  lawBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  lawLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#08C284',
    marginBottom: 4,
  },
  lawText: {
    fontSize: 11,
    color: '#fff',
    lineHeight: 16,
  },
  energyBox: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  energyLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9333EA',
    marginBottom: 4,
  },
  energyText: {
    fontSize: 11,
    color: '#fff',
    lineHeight: 16,
  },
  floorEssence: {
    fontSize: 14,
    color: '#08C284',
    marginBottom: 4,
  },
  floorFunction: {
    fontSize: 13,
    color: '#aaa',
    marginBottom: 12,
  },
  ecologyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#08C284',
    marginTop: 8,
    marginBottom: 4,
  },
  ecologyText: {
    fontSize: 12,
    color: '#ccc',
    lineHeight: 18,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#888',
    marginTop: 6,
    marginBottom: 2,
  },
  detailText: {
    fontSize: 12,
    color: '#aaa',
    lineHeight: 16,
  },
});
