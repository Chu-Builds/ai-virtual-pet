import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { useActivePet } from '@/hooks/usePet'
import { BG, SURFACE, TEXT_SECONDARY, TEXT_TERTIARY, BORDER, ACCENT } from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function JournalScreen() {
  const insets = useSafeAreaInsets()
  const { data: pet, isLoading } = useActivePet()

  if (isLoading) {
    return (
      <View style={[s.center, { backgroundColor: BG }]}>
        <ActivityIndicator color={ACCENT} />
      </View>
    )
  }

  if (!pet) {
    return (
      <View style={[s.center, { backgroundColor: BG, paddingHorizontal: 20 }]}>
        <Card style={s.emptyCard}>
          <Text style={{ fontSize: 48 }}>📖</Text>
          <Text style={s.emptyTitle}>Adopt a pet to see their journal</Text>
        </Card>
      </View>
    )
  }

  const memories = [...(pet.memory || [])].reverse()

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        contentContainerStyle={[
          s.container,
          { paddingTop: insets.top + 20, paddingBottom: TAB_BAR_CLEARANCE + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.screenTitle}>Journal 📖</Text>

        {/* Personality card */}
        <Card style={s.personalityCard}>
          <Text style={s.cardLabel}>Personality So Far</Text>
          <Text style={s.personalityText}>
            {pet.personality_summary && pet.personality_summary.trim()
              ? pet.personality_summary
              : 'Still getting to know you...'}
          </Text>
        </Card>

        {/* Memories list */}
        <Text style={s.sectionHeader}>Memories</Text>
        {memories.length === 0 ? (
          <Card style={s.emptyCard}>
            <Text style={s.emptyTitle}>
              No memories yet — start talking to your pet!
            </Text>
          </Card>
        ) : (
          memories.map((mem, i) => (
            <Card key={i} style={s.memoryCard}>
              <Text style={s.memorySummary}>{mem.summary}</Text>
              <Text style={s.memoryTime}>{formatTimestamp(mem.timestamp)}</Text>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { paddingHorizontal: 20, gap: 12 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },

  personalityCard: { gap: 8, paddingVertical: 18 },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_TERTIARY,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  personalityText: { fontSize: 15, color: '#fff', lineHeight: 22 },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_TERTIARY,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: -4,
  },

  emptyCard: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyTitle: { fontSize: 15, color: TEXT_SECONDARY, textAlign: 'center' },

  memoryCard: { gap: 6, paddingVertical: 14 },
  memorySummary: { fontSize: 14, color: '#fff', lineHeight: 20 },
  memoryTime: { fontSize: 11, color: TEXT_TERTIARY },
})
