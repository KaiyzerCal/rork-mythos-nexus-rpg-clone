import { useGame } from '@/contexts/GameContext';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Keyboard, TouchableWithoutFeedback, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Search, TrendingUp, Edit2, X, User, Brain, Zap, Heart, Shield, Save } from 'lucide-react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ScouterScreen() {
  const { gameState, addRosterEntry } = useGame();
  const [scoutMode, setScoutMode] = useState<'self' | 'other'>('self');
  const [questionnaireVisible, setQuestionnaireVisible] = useState(false);
  const [scoutName, setScoutName] = useState('');
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState('');
  const [scoutedProfile, setScoutedProfile] = useState<any>(null);
  const { stats, currentFloor, gpr, pvpRating, currentForm } = gameState;

  const handleScout = () => {
    const estimatedLevel = 50 + (q1.length + q2.length + q3.length) / 10;
    const estimatedPower = Math.floor(estimatedLevel * 1000);
    const estimatedGPR = Math.max(0.01, Math.min(0.5, (100 - estimatedLevel) / 200));
    const estimatedPvP = Math.floor(1000 + estimatedLevel * 20);
    
    const profile = {
      name: scoutName,
      level: Math.floor(estimatedLevel),
      power: estimatedPower,
      gpr: estimatedGPR,
      pvpRating: estimatedPvP,
      rank: estimatedLevel >= 80 ? 'SS' : estimatedLevel >= 60 ? 'S' : estimatedLevel >= 40 ? 'A' : 'B',
      threatLevel: estimatedLevel >= 70 ? 'HIGH' : estimatedLevel >= 50 ? 'MEDIUM' : 'LOW',
      jjkGrade: estimatedLevel >= 80 ? 'Special Grade' : estimatedLevel >= 60 ? 'Grade 1' : 'Grade 2',
      opTier: estimatedLevel >= 80 ? 'Yonko' : estimatedLevel >= 60 ? 'Commander' : 'Officer',
      influence: estimatedLevel >= 80 ? 'National' : estimatedLevel >= 60 ? 'Regional' : 'Local',
      notes: `Strengths: ${q1}\nMotivations: ${q2}\nWeaknesses: ${q3}\nConflict Style: ${q4}\nPhilosophy: ${q5}`,
    };
    
    setScoutedProfile(profile);
    setQuestionnaireVisible(false);
  };

  const handleSaveToRoster = () => {
    if (!scoutedProfile) return;

    Alert.alert(
      'Save to Roster',
      `Save ${scoutedProfile.name} as enemy, ally, or NPC?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Enemy',
          style: 'destructive',
          onPress: () => {
            addRosterEntry({
              display: scoutedProfile.name,
              role: 'enemy',
              rank: scoutedProfile.rank,
              level: scoutedProfile.level,
              jjkGrade: scoutedProfile.jjkGrade,
              opTier: scoutedProfile.opTier,
              gpr: Math.floor(scoutedProfile.gpr * 1000),
              pvp: scoutedProfile.pvpRating,
              influence: scoutedProfile.influence,
              notes: scoutedProfile.notes,
            });
            Alert.alert('Success', `${scoutedProfile.name} added to roster as Enemy`);
          },
        },
        {
          text: 'Ally',
          onPress: () => {
            addRosterEntry({
              display: scoutedProfile.name,
              role: 'ally',
              rank: scoutedProfile.rank,
              level: scoutedProfile.level,
              jjkGrade: scoutedProfile.jjkGrade,
              opTier: scoutedProfile.opTier,
              gpr: Math.floor(scoutedProfile.gpr * 1000),
              pvp: scoutedProfile.pvpRating,
              influence: scoutedProfile.influence,
              notes: scoutedProfile.notes,
            });
            Alert.alert('Success', `${scoutedProfile.name} added to roster as Ally`);
          },
        },
        {
          text: 'NPC',
          onPress: () => {
            addRosterEntry({
              display: scoutedProfile.name,
              role: 'npc',
              rank: scoutedProfile.rank,
              level: scoutedProfile.level,
              jjkGrade: scoutedProfile.jjkGrade,
              opTier: scoutedProfile.opTier,
              gpr: Math.floor(scoutedProfile.gpr * 1000),
              pvp: scoutedProfile.pvpRating,
              influence: scoutedProfile.influence,
              notes: scoutedProfile.notes,
            });
            Alert.alert('Success', `${scoutedProfile.name} added to roster as NPC`);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Search size={32} color="#08C284" />
        <View style={styles.headerText}>
          <Text style={styles.title}>Scouter</Text>
          <Text style={styles.subtitle}>Power Analysis & Rankings</Text>
        </View>
      </View>

      <View style={styles.modeSelector}>
        <TouchableOpacity
          style={[styles.modeButton, scoutMode === 'self' && styles.modeButtonActive]}
          onPress={() => { setScoutMode('self'); setScoutedProfile(null); }}
        >
          <User size={18} color={scoutMode === 'self' ? '#08C284' : '#666'} />
          <Text style={[styles.modeButtonText, scoutMode === 'self' && styles.modeButtonTextActive]}>My Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeButton, scoutMode === 'other' && styles.modeButtonActive]}
          onPress={() => { setScoutMode('other'); setQuestionnaireVisible(true); }}
        >
          <Search size={18} color={scoutMode === 'other' ? '#08C284' : '#666'} />
          <Text style={[styles.modeButtonText, scoutMode === 'other' && styles.modeButtonTextActive]}>Scout Someone</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {scoutMode === 'self' && (
          <>
            <View style={styles.powerCard}>
              <Text style={styles.cardTitle}>Combat Power Level</Text>
              <Text style={styles.powerLevel}>{(stats.level * 1000 + stats.STR * 100).toLocaleString()}</Text>
              <Text style={styles.powerRank}>Rank: {stats.rank}</Text>
              <Text style={styles.formText}>Current Form: {currentForm}</Text>
            </View>

            <View style={styles.statsCard}>
              <Text style={styles.cardTitle}>Power Breakdown</Text>
              <View style={styles.statRow}>
                <Text style={styles.statName}>Physical Power</Text>
                <View style={styles.statBar}>
                  <View style={[styles.statFill, { width: `${stats.STR}%`, backgroundColor: '#FF6B35' }]} />
                </View>
                <Text style={styles.statValue}>{stats.STR}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statName}>Speed</Text>
                <View style={styles.statBar}>
                  <View style={[styles.statFill, { width: `${stats.AGI}%`, backgroundColor: '#FFD700' }]} />
                </View>
                <Text style={styles.statValue}>{stats.AGI}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statName}>Durability</Text>
                <View style={styles.statBar}>
                  <View style={[styles.statFill, { width: `${stats.VIT}%`, backgroundColor: '#32CD32' }]} />
                </View>
                <Text style={styles.statValue}>{stats.VIT}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statName}>Intelligence</Text>
                <View style={styles.statBar}>
                  <View style={[styles.statFill, { width: `${stats.INT}%`, backgroundColor: '#4169E1' }]} />
                </View>
                <Text style={styles.statValue}>{stats.INT}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statName}>Wisdom</Text>
                <View style={styles.statBar}>
                  <View style={[styles.statFill, { width: `${stats.WIS}%`, backgroundColor: '#9400D3' }]} />
                </View>
                <Text style={styles.statValue}>{stats.WIS}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statName}>Charisma</Text>
                <View style={styles.statBar}>
                  <View style={[styles.statFill, { width: `${stats.CHA}%`, backgroundColor: '#FF69B4' }]} />
                </View>
                <Text style={styles.statValue}>{stats.CHA}</Text>
              </View>
            </View>

            <View style={styles.rankingCard}>
              <View style={styles.rankingHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={20} color="#08C284" />
                  <Text style={styles.cardTitle}>Global Rankings</Text>
                </View>
              </View>
              
              <View style={styles.rankingRow}>
                <Text style={styles.rankingLabel}>Tower Floor</Text>
                <Text style={styles.rankingValue}>Floor {currentFloor}</Text>
              </View>
              
              <View style={styles.rankingRow}>
                <Text style={styles.rankingLabel}>Global Percentile (GPR)</Text>
                <Text style={styles.rankingValue}>Top {(gpr * 100).toFixed(1)}%</Text>
              </View>
              
              <View style={styles.rankingRow}>
                <Text style={styles.rankingLabel}>PvP Rating</Text>
                <Text style={styles.rankingValue}>{pvpRating}</Text>
              </View>
              
              <View style={styles.rankingRow}>
                <Text style={styles.rankingLabel}>Threat Class</Text>
                <Text style={[styles.rankingValue, { color: '#FF6B35' }]}>National Level</Text>
              </View>
            </View>

            <View style={styles.threatCard}>
              <Text style={styles.cardTitle}>Threat Assessment</Text>
              <Text style={styles.threatLevel}>EXTREME</Text>
              <Text style={styles.threatDescription}>
                Subject possesses SSS-rank capabilities. Approach with extreme caution. 
                Diplomatic engagement recommended over confrontation.
              </Text>
            </View>
          </>
        )}

        {scoutMode === 'other' && scoutedProfile && (
          <>
            <View style={styles.powerCard}>
              <Text style={styles.cardTitle}>Scouted Target: {scoutedProfile.name}</Text>
              <Text style={styles.powerLevel}>{scoutedProfile.power.toLocaleString()}</Text>
              <Text style={styles.powerRank}>Rank: {scoutedProfile.rank}</Text>
              <Text style={styles.formText}>Level: {scoutedProfile.level}</Text>
            </View>

            <View style={styles.rankingCard}>
              <View style={styles.rankingHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TrendingUp size={20} color="#08C284" />
                  <Text style={styles.cardTitle}>Scouted Rankings</Text>
                </View>
              </View>
              
              <View style={styles.rankingRow}>
                <Text style={styles.rankingLabel}>Global Percentile (GPR)</Text>
                <Text style={styles.rankingValue}>Top {(scoutedProfile.gpr * 100).toFixed(1)}%</Text>
              </View>
              
              <View style={styles.rankingRow}>
                <Text style={styles.rankingLabel}>PvP Rating</Text>
                <Text style={styles.rankingValue}>{scoutedProfile.pvpRating}</Text>
              </View>
              
              <View style={styles.rankingRow}>
                <Text style={styles.rankingLabel}>Threat Class</Text>
                <Text style={[styles.rankingValue, { color: scoutedProfile.threatLevel === 'HIGH' ? '#FF6B35' : '#FFD700' }]}>
                  {scoutedProfile.threatLevel}
                </Text>
              </View>
            </View>

            <View style={styles.threatCard}>
              <Text style={styles.cardTitle}>Threat Assessment</Text>
              <Text style={styles.threatLevel}>{scoutedProfile.threatLevel}</Text>
              <Text style={styles.threatDescription}>
                Based on provided information, this target is classified as {scoutedProfile.threatLevel} threat. 
                {scoutedProfile.threatLevel === 'HIGH' ? 'Proceed with extreme caution.' : 'Standard protocols recommended.'}
              </Text>
            </View>

            <TouchableOpacity style={styles.saveToRosterButton} onPress={handleSaveToRoster}>
              <Save size={20} color="#000" />
              <Text style={styles.saveToRosterText}>Save to PvP Roster</Text>
            </TouchableOpacity>
          </>
        )}

        {scoutMode === 'other' && !scoutedProfile && (
          <View style={styles.emptyCard}>
            <Search size={48} color="#333" />
            <Text style={styles.emptyText}>Scout someone to see their profile</Text>
            <TouchableOpacity style={styles.scoutButton} onPress={() => setQuestionnaireVisible(true)}>
              <Text style={styles.scoutButtonText}>Start Questionnaire</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={questionnaireVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setQuestionnaireVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Scout Questionnaire</Text>
                <TouchableOpacity 
                  onPress={() => setQuestionnaireVisible(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ zIndex: 1000 }}
                >
                  <X size={24} color="#fff" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Target Name</Text>
                  <TextInput
                    style={styles.input}
                    value={scoutName}
                    onChangeText={setScoutName}
                    placeholder="Who are you scouting?"
                    placeholderTextColor="#666"
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}><Brain size={14} color="#08C284" /> What are their main strengths?</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={q1}
                    onChangeText={setQ1}
                    placeholder="Physical, mental, social abilities..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}><Zap size={14} color="#08C284" /> What motivates them?</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={q2}
                    onChangeText={setQ2}
                    placeholder="Goals, desires, values..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}><Shield size={14} color="#08C284" /> What are their weaknesses?</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={q3}
                    onChangeText={setQ3}
                    placeholder="Vulnerabilities, blind spots..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}><Heart size={14} color="#08C284" /> How do they handle conflict?</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={q4}
                    onChangeText={setQ4}
                    placeholder="Fight, flight, negotiate..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}><User size={14} color="#08C284" /> What{"'"}s their overall approach to life?</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={q5}
                    onChangeText={setQ5}
                    placeholder="Philosophy, worldview, strategy..."
                    placeholderTextColor="#666"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.saveButton} onPress={handleScout}>
                <Text style={styles.saveButtonText}>Generate Profile</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerText: {
    flex: 1,
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  powerCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#08C284',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#08C284',
    marginBottom: 8,
  },
  powerLevel: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  powerRank: {
    fontSize: 16,
    color: '#888',
  },
  statsCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statName: {
    width: 100,
    fontSize: 13,
    color: '#aaa',
  },
  statBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
  },
  statFill: {
    height: '100%',
  },
  statValue: {
    width: 40,
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'right',
  },
  rankingCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  rankingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  rankingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  rankingLabel: {
    fontSize: 14,
    color: '#aaa',
  },
  rankingValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  threatCard: {
    backgroundColor: '#1a0a0a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  threatLevel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 12,
  },
  threatDescription: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 20,
  },
  formText: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  modeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  modeButtonActive: {
    backgroundColor: 'rgba(8, 194, 132, 0.1)',
    borderColor: '#08C284',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  modeButtonTextActive: {
    color: '#08C284',
  },
  emptyCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#222',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 24,
  },
  scoutButton: {
    backgroundColor: '#08C284',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  scoutButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#08C284',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#08C284',
  },
  modalBody: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#08C284',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#FFF',
    borderWidth: 1,
    borderColor: '#333',
  },
  saveButton: {
    backgroundColor: '#08C284',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  saveToRosterButton: {
    backgroundColor: '#08C284',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  saveToRosterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});
