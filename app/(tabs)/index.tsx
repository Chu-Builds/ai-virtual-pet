import { useEffect, useState } from 'react'
import {
  View, ScrollView, StyleSheet, RefreshControl, ActivityIndicator,
  Pressable, Modal, KeyboardAvoidingView, Platform, Alert, FlatList,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated'
import PetAvatar from '@/components/PetAvatar'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import TextInputField from '@/components/ui/TextInputField'
import { useToast } from '@/contexts/ToastContext'
import { useMyPet, useMyPets, useSetActivePet, usePetActions } from '@/hooks/usePet'
import { getMoodLabel } from '@/lib/petTypes'
import { BG, SURFACE, TEXT_SECONDARY, TEXT_TERTIARY, BORDER, ACCENT } from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { supabase } from '@/lib/supabase'

const MOOD_COLORS: Record<string, string> = {
  happy: '#dcfce7',
  starving: '#ffedd5',
  lonely: '#f3e8ff',
  tired: '#dbeafe',
  content: '#f3f4f6',
}

const MOOD_AURA_COLORS: Record<string, string> = {
  happy: '#22c55e',
  starving: '#f97316',
  lonely: '#a855f7',
  tired: '#3b82f6',
  content: '#9ca3af',
}

const MOOD_EMOJIS: Record<string, string> = {
  happy: '😊',
  starving: '😋',
  lonely: '🥺',
  tired: '😴',
  content: '😌',
}

const SPECIES_EMOJIS: Record<string, string> = {
  cat: '🐱',
  dog: '🐶',
  bunny: '🐰',
}

const GROWTH_STAGES: Record<number, string> = {
  1: 'Baby',
  2: 'Teen',
  3: 'Adult',
}

function StatBar({ label, value, color }: { label: string; value: number; color: string }) {
  const progress = useSharedValue(0)

  useEffect(() => {
    progress.value = withTiming(value, { duration: 1000, easing: Easing.out(Easing.cubic) })
  }, [value])

  const animatedStyle = useAnimatedStyle(() => ({ width: progress.value + '%' }))

  return (
    <View style={s.statContainer}>
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets()
  const { showToast } = useToast()
  const { data: pet, isLoading, error, refetch } = useMyPet()
  const { data: allPets = [] } = useMyPets()
  const { mutate: setActivePet } = useSetActivePet()
  const { feedPet, playWithPet, talkToPet, applyStatDecay, releasePet } = usePetActions()

  const [refreshing, setRefreshing] = useState(false)
  const [talkVisible, setTalkVisible] = useState(false)
  const [message, setMessage] = useState('')
  const [isTalking, setIsTalking] = useState(false)
  const [aiResponse, setAiResponse] = useState('')
  const [currentAction, setCurrentAction] = useState<'idle' | 'feed' | 'play' | 'talk' | null>(null)

  const auraOpacity = useSharedValue(0.05)
  const auraAnimStyle = useAnimatedStyle(() => ({ opacity: auraOpacity.value }))

  useEffect(() => {
    if (pet) {
      applyStatDecay(pet).catch(console.error)
    }
  }, [pet?.id])

  useEffect(() => {
    auraOpacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    )
  }, [])

  useEffect(() => {
    if (error) {
      showToast('Failed to load pet data', 'error')
    }
  }, [error])

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleFeed = async () => {
    if (!pet) return;
    setCurrentAction('feed');
    setTimeout(() => setCurrentAction(null), 600);
    try {
      await feedPet(pet.id);
    } catch (e) {
      showToast('Failed to feed', 'error');
    }
  }

  const handlePlay = async () => {
    if (!pet) return;
    setCurrentAction('play');
    setTimeout(() => setCurrentAction(null), 600);
    try {
      await playWithPet(pet.id);
    } catch (e) {
      showToast('Failed to play', 'error');
    }
  }

  const handleTalk = async () => {
    if (!pet || !message.trim()) return
    const currentMessage = message.trim()
    setMessage('')
    setIsTalking(true)
    setAiResponse('')
    setCurrentAction('talk')
    setTimeout(() => setCurrentAction(null), 700)
    try {
      const resp = await talkToPet(pet.id, currentMessage)
      setAiResponse(resp)
    } catch (e) {
      showToast('Failed to talk', 'error')
      setMessage(currentMessage)
    } finally {
      setIsTalking(false)
    }
  }

  const handleReleasePet = async () => {
    if (!pet) return;
    const { data: { user } } = await supabase.auth.getUser();
    const isOwner = pet.owner_id === user?.id;
    const message = isOwner
      ? 'Release ' + pet.name + '? This is permanent and your co-parent will also lose access.'
      : 'Leave co-parenting ' + pet.name + '? The owner will keep their pet.';
    const confirmText = isOwner ? 'Release' : 'Leave';
    
    if (window.confirm(message)) {
      try {
        await releasePet(pet.id);
        router.replace('/adopt');
      } catch (e) {
        showToast('Something went wrong', 'error');
      }
    }
  };

  if (isLoading) {
    return (
      <View style={[s.centerContainer, { backgroundColor: BG }]}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    )
  }

  if (!pet) {
    return (
      <View style={[s.centerContainer, { backgroundColor: BG, paddingHorizontal: 20 }]}>
        <Card style={s.emptyCard}>
          <Text style={{ fontSize: 60 }}>🐾</Text>
          <Text style={s.emptyTitle}>You don't have a pet yet</Text>
          <Button label="Adopt a Pet" onPress={() => router.push('/adopt')} />
        </Card>
      </View>
    )
  }

  const moodLabel = getMoodLabel({ energy: pet.energy, affection: pet.affection, hunger: pet.hunger })
  const auraColor = MOOD_AURA_COLORS[moodLabel] || '#9ca3af'

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <ScrollView
        contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Pet Switcher — shown only when user has multiple pets */}
        {allPets.length > 1 && (
          <FlatList
            horizontal
            data={allPets}
            keyExtractor={p => p.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.switcherList}
            renderItem={({ item: p }) => {
              const isActive = p.id === pet.id
              return (
                <Pressable
                  onPress={() => setActivePet(p.id)}
                  style={[s.switcherPill, isActive && s.switcherPillActive]}
                >
                  <Text style={s.switcherEmoji}>{SPECIES_EMOJIS[p.species]}</Text>
                  <Text style={[s.switcherName, isActive && s.switcherNameActive]}>{p.name}</Text>
                </Pressable>
              )
            }}
          />
        )}

        {/* Section 1: Top */}
        <View style={s.header}>
          {/* Co-Parent button top-right */}
          <Pressable
            onPress={() => router.push('/coparent')}
            style={s.coparentBtn}
            hitSlop={8}
          >
            <Text style={s.coparentBtnText}>👫 Co-Parent</Text>
          </Pressable>

          <Text style={s.petName}>{pet.name}</Text>
          <View style={s.badges}>
            <View style={s.badge}>
              <Text style={s.badgeText}>{pet.species.toUpperCase()}</Text>
            </View>
            <View style={s.badge}>
              <Text style={s.badgeText}>{GROWTH_STAGES[pet.growth_stage]}</Text>
            </View>
            <View style={s.badge}>
              <Text style={s.badgeText}>{moodLabel.toUpperCase()} {MOOD_EMOJIS[moodLabel]}</Text>
            </View>
          </View>
        </View>

        {/* Section 2: Middle (Animated Avatar) */}
        <View style={s.avatarSection}>
          {/* Mood aura */}
          <Animated.View
            style={[
              s.aura,
              { backgroundColor: auraColor },
              auraAnimStyle,
            ]}
          />
          <PetAvatar
            species={pet.species}
            mood={moodLabel}
            growthStage={pet.growth_stage}
            size={140}
            action={currentAction}
          />
        </View>

        {/* Section 3: Stat Bars */}
        <Card style={s.statsCard}>
          <StatBar label="Energy" value={pet.energy} color="#3b82f6" />
          <StatBar label="Affection" value={pet.affection} color="#ec4899" />
          <StatBar label="Fullness" value={pet.hunger} color="#f97316" />
        </Card>

        {/* Section 4: Bottom (Action Buttons) */}
        <View style={s.actionsSection}>
          <View style={{ flex: 1 }}><Button label="Feed 🍖" onPress={handleFeed} fullWidth /></View>
          <View style={{ flex: 1 }}><Button label="Play 🎾" onPress={handlePlay} fullWidth /></View>
          <View style={{ flex: 1 }}><Button label="Talk 💬" onPress={() => setTalkVisible(true)} fullWidth /></View>
        </View>

        {/* Release pet */}
        <Pressable onPress={handleReleasePet} style={s.releaseBtn} hitSlop={8}>
          <Text style={s.releaseBtnText}>Release Pet 🌈</Text>
        </Pressable>
      </ScrollView>

      {/* TALK MODAL */}
      <Modal visible={talkVisible} transparent animationType="slide" onRequestClose={() => setTalkVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalContainer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setTalkVisible(false)} />
          <View style={[s.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Talk to {pet.name}</Text>

            <View style={s.inputRow}>
              <View style={{ flex: 1 }}>
                <TextInputField
                  value={message}
                  onChangeText={setMessage}
                  placeholder={'Say something to ' + pet.name + '...'}
                  onSubmitEditing={handleTalk}
                  returnKeyType="send"
                />
              </View>
              <Button label="Send" onPress={handleTalk} loading={isTalking} />
            </View>

            {aiResponse ? (
              <View style={s.responseWrap}>
                <Text style={s.responseLabel}>{pet.name} says:</Text>
                <Text style={s.responseText}>{aiResponse}</Text>
              </View>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { paddingHorizontal: 20, gap: 0 },
  emptyCard: { alignItems: 'center', gap: 16, paddingVertical: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },

  // Pet switcher
  switcherList: { gap: 8, paddingBottom: 16 },
  switcherPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  switcherPillActive: {
    borderColor: ACCENT,
    backgroundColor: ACCENT + '22',
  },
  switcherEmoji: { fontSize: 16 },
  switcherName: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY },
  switcherNameActive: { color: ACCENT },

  header: { alignItems: 'center', gap: 12 },
  coparentBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: ACCENT,
    zIndex: 1,
  },
  coparentBtnText: { fontSize: 12, fontWeight: '700', color: ACCENT },
  petName: { fontSize: 36, fontWeight: '800', color: '#fff' },
  badges: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },

  avatarSection: { marginTop: 24, marginBottom: 0, alignItems: 'center', justifyContent: 'center' },
  aura: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    zIndex: -1,
  },

  statsCard: { gap: 16, padding: 16, marginTop: 16 },
  statContainer: { gap: 6 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  statLabel: { fontSize: 13, fontWeight: '600', color: TEXT_SECONDARY },
  statValue: { fontSize: 13, fontWeight: '700', color: TEXT_SECONDARY },
  statTrack: { height: 8, backgroundColor: BORDER, borderRadius: 4, overflow: 'hidden' },
  statFill: { height: '100%', borderRadius: 4 },

  actionsSection: { flexDirection: 'row', gap: 8, marginTop: 16 },

  releaseBtn: { alignItems: 'center', paddingVertical: 16, marginTop: 4 },
  releaseBtnText: { fontSize: 13, color: '#ef4444', fontWeight: '600' },

  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalSheet: {
    backgroundColor: SURFACE,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  inputRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  responseWrap: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  responseLabel: { fontSize: 12, color: TEXT_TERTIARY, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  responseText: { fontSize: 16, color: '#fff', lineHeight: 24 },
})
