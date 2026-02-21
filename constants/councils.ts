import type { Council, CouncilMember } from '@/types/rpg';

export const COUNCILS: Council[] = [
  {
    type: 'Core',
    description: 'Primary advisors for strategic decisions and personal growth',
    members: [
      { id: '1', name: 'Arthur', role: 'Leadership', specialty: 'Noble authority and strategic command', class: 'core', notes: 'Noble authority and strategic command' },
      { id: '2', name: 'Kaiyzer', role: 'Innovation', specialty: 'Revolutionary thinking and change', class: 'core', notes: 'Revolutionary thinking and change' },
      { id: '3', name: 'Toji/Kai118', role: 'Discipline', specialty: 'Mastery through limitation', class: 'core', notes: 'Mastery through limitation' },
      { id: '4', name: 'Yato/Raizo118', role: 'Adaptability', specialty: 'Survival and transformation', class: 'core', notes: 'Survival and transformation' },
      { id: '5', name: 'Kratos', role: 'Strength', specialty: 'Overcoming insurmountable odds', class: 'core', notes: 'Overcoming insurmountable odds' },
      { id: '6', name: 'Skar', role: 'Resilience', specialty: 'Endurance through hardship', class: 'core', notes: 'Endurance through hardship' },
      { id: '7', name: 'Caliburn', role: 'Precision', specialty: 'Perfect execution and focus', class: 'core', notes: 'Perfect execution and focus' },
    ],
  },
  {
    type: 'Advisory',
    description: 'Tactical guidance for specific challenges and situations',
    members: [
      { id: '8', name: 'Homelander', role: 'Dominance', specialty: 'Absolute power and presence', class: 'advisory', notes: 'Absolute power and presence' },
      { id: '9', name: 'Billy Butcher', role: 'Cunning', specialty: 'Strategic ruthlessness', class: 'advisory', notes: 'Strategic ruthlessness' },
      { id: '10', name: 'Ghost', role: 'Stealth', specialty: 'Invisible operations', class: 'advisory', notes: 'Invisible operations' },
      { id: '11', name: 'Jinwoo', role: 'Evolution', specialty: 'Exponential growth', class: 'advisory', notes: 'Exponential growth' },
      { id: '12', name: 'Baam', role: 'Ascension', specialty: 'Tower climbing mentality', class: 'advisory', notes: 'Tower climbing mentality' },
      { id: '13', name: 'Eren', role: 'Freedom', specialty: 'Breaking chains at any cost', class: 'advisory', notes: 'Breaking chains at any cost' },
      { id: '14', name: 'All Might', role: 'Hope', specialty: 'Symbol of peace and justice', class: 'advisory', notes: 'Symbol of peace and justice' },
      { id: '15', name: 'Madara', role: 'Vision', specialty: 'Long-term planning', class: 'advisory', notes: 'Long-term planning' },
      { id: '16', name: 'Tyler Durden', role: 'Destruction', specialty: 'Chaos as catalyst', class: 'advisory', notes: 'Chaos as catalyst' },
      { id: '17', name: 'Evan', role: 'Synthesis', specialty: 'Integration of opposing forces', class: 'advisory', notes: 'Integration of opposing forces' },
      { id: '18', name: 'Magneto', role: 'Revolution', specialty: 'Righteous cause through force', class: 'advisory', notes: 'Righteous cause through force' },
    ],
  },
  {
    type: 'Think-Tank',
    description: 'Intellectual foundation for innovation and legacy',
    members: [
      { id: '19', name: 'Steve Jobs', role: 'Design', specialty: 'Simplicity and elegance', class: 'think-tank', notes: 'Simplicity and elegance' },
      { id: '20', name: 'Nikola Tesla', role: 'Innovation', specialty: 'Visionary technology', class: 'think-tank', notes: 'Visionary technology' },
      { id: '21', name: 'Benjamin Franklin', role: 'Wisdom', specialty: 'Practical philosophy', class: 'think-tank', notes: 'Practical philosophy' },
      { id: '22', name: 'Bruce Lee', role: 'Philosophy', specialty: 'Adaptive martial arts', class: 'think-tank', notes: 'Adaptive martial arts' },
      { id: '23', name: 'Elon Musk', role: 'Ambition', specialty: 'Impossible made possible', class: 'think-tank', notes: 'Impossible made possible' },
      { id: '24', name: 'Muhammad Ali', role: 'Confidence', specialty: 'Self-belief and showmanship', class: 'think-tank', notes: 'Self-belief and showmanship' },
      { id: '25', name: 'Robert Kiyosaki', role: 'Wealth', specialty: 'Financial intelligence', class: 'think-tank', notes: 'Financial intelligence' },
      { id: '26', name: 'Leonardo Da Vinci', role: 'Renaissance', specialty: 'Multi-disciplinary mastery', class: 'think-tank', notes: 'Multi-disciplinary mastery' },
    ],
  },
  {
    type: 'Shadows',
    description: 'Hidden council for dark operations and shadow work',
    members: [
      { id: '27', name: 'Shadow Self', role: 'Integration', specialty: 'Unconscious material', class: 'shadows', notes: 'Unconscious material' },
      { id: '28', name: 'Anima/Animus', role: 'Balance', specialty: 'Inner opposite', class: 'shadows', notes: 'Inner opposite' },
      { id: '29', name: 'The Trickster', role: 'Disruption', specialty: 'Breaking patterns', class: 'shadows', notes: 'Breaking patterns' },
      { id: '30', name: 'The Void', role: 'Emptiness', specialty: 'Ego dissolution', class: 'shadows', notes: 'Ego dissolution' },
    ],
  },
];
