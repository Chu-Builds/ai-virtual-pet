import { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { useActivePet } from '@/hooks/usePet'
import { BG, TEXT_SECONDARY, TEXT_TERTIARY, ACCENT, BORDER } from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'

function daysSince(iso: string): number {
  const createdAt = new Date(iso)
  const today = new Date()
  const diffTime = Math.abs(today.getTime() - createdAt.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function growthProgress(stage: number, interactions: number): { label: string; progress: number; next: number } {
  if (stage === 1) return { label: 'Baby', progress: Math.min(interactions / 20, 1), next: 20 }
  if (stage === 2) return { label: 'Teen', progress: Math.min((interactions - 20) / 30, 1), next: 50 }
  return { label: 'Adult', progress: 1, next: 50 }
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(value, { duration: 1000, easing: Easing.out(Easing.cubic) })
  }, [value])

  const animatedStyle = useAnimatedStyle(() => ({ width: progress.value + '%' }))

  return (
    <View style={s.statRow}>
      <View style={s.statHeader}>
        <Text style={s.statLabel}>{label}</Text>
        <Text style={s.statValue}>{value}</Text>
      </View>
      <View style={s.statTrack}>
        <Animated.View style={[s.statFill, { backgroundColor: color }, animatedStyle]} />
      </View>
    </View>
  )
}

export default function StatsScreen() {
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
          <Text style={{ fontSize: 48 }}>📊</Text>
          <Text style={s.emptyTitle}>Adopt a pet to see your stats</Text>
        </Card>
      </View>
    )
  }

  const days = daysSince(pet.created_at)
  const growth = growthProgress(pet.growth_stage, pet.interaction_count)

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        contentContainerStyle={[
          s.container,
          { paddingTop: insets.top + 20, paddingBottom: TAB_BAR_CLEARANCE + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.screenTitle}>Stats 📊</Text>

        {/* Stat cards grid */}
        <View style={s.grid}>
          <Card style={s.statCard}>
            <Text style={s.statCardEmoji}>🐾</Text>
            <Text style={s.statCardValue}>{pet.interaction_count}</Text>
            <Text style={s.statCardLabel}>Total Interactions</Text>
          </Card>
          <Card style={s.statCard}>
            <Text style={s.statCardEmoji}>📅</Text>
            <Text style={s.statCardValue}>{days === 0 ? 'Today' : days}</Text>
            <Text style={s.statCardLabel}>Days Together</Text>
          </Card>
        </View>

        {/* Growth stage */}
        <Card style={s.growthCard}>
          <View style={s.growthHeader}>
            <Text style={s.cardLabel}>🌱 Growth Stage</Text>
            <Text style={s.growthStageText}>{growth.label}</Text>
          </View>
          {pet.growth_stage < 3 ? (
            <>
              <View style={s.growthTrack}>
                <Animated.View
                  style={[
                    s.growthFill,
                    { width: (growth.progress * 100) + '%' },
                  ]}
                />
              </View>
              <Text style={s.growthHint}>
                {pet.interaction_count} / {growth.next} interactions to next stage
              </Text>
            </>
          ) : (
            <Text style={s.growthHint}>Fully grown! ⭐</Text>
          )}
        </Card>

        {/* Co-parent */}
        <Card style={s.coparentCard}>
          <Text style={s.cardLabel}>💕 Co-Parent</Text>
          <Text style={s.coparentText}>
            {pet.coparent_id ? 'Co-parenting with a friend 👫' : 'Solo parenting'}
          </Text>
        </Card>

        {/* Live stat bars */}
        <Text style={s.sectionHeader}>Current Stats</Text>
        <Card style={s.barsCard}>
          <StatBar label="Energy" value={pet.energy} color="#3b82f6" />
          <StatBar label="Affection" value={pet.affection} color="#ec4899" />
          <StatBar label="Fullness" value={pet.hunger} color="#f97316" />
        </Card>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { paddingHorizontal: 20, gap: 12 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: '#fff', marginBottom: 4 },

  emptyCard: { alignItems: 'center', paddingVertical: 32, gap: 12 },
  emptyTitle: { fontSize: 15, color: TEXT_SECONDARY, textAlign: 'center' },

  // Grid of small stat cards
  grid: { flexDirection: 'row', gap: 12 },
  statCard: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 20 },
  statCardEmoji: { fontSize: 28 },
  statCardValue: { fontSize: 28, fontWeight: '800', color: '#fff' },
  statCardLabel: { fontSize: 12, color: TEXT_SECONDARY, textAlign: 'center' },

  // Growth card
  growthCard: { gap: 10 },
  growthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  growthStageText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  growthTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  growthFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: ACCENT,
  },
  growthHint: { fontSize: 12, color: TEXT_TERTIARY },

  // Co-parent card
  coparentCard: { gap: 6 },
  coparentText: { fontSize: 15, color: '#fff', fontWeight: '600' },

  // Bars card
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_TERTIARY,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: -4,
  },
  barsCard: { gap: 16 },
  statRow: { gap: 6 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY },
  statValue: { fontSize: 13, fontWeight: '700', color: '#fff' },
  statTrack: { height: 8, backgroundColor: BORDER, borderRadius: 4, overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 4 },

  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: TEXT_TERTIARY,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
})
