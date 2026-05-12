import { useState } from 'react'
import { View, ScrollView, StyleSheet, ActivityIndicator, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import TextInputField from '@/components/ui/TextInputField'
import { useToast } from '@/contexts/ToastContext'
import { useMyPet } from '@/hooks/usePet'
import { supabase } from '@/lib/supabase'
import { BG, SURFACE, TEXT_SECONDARY, TEXT_TERTIARY, BORDER, ACCENT } from '@/lib/theme'
import { useQueryClient } from '@tanstack/react-query'

export default function CoParentScreen() {
  const insets = useSafeAreaInsets()
  const { showToast } = useToast()
  const { data: pet, isLoading } = useMyPet()
  const queryClient = useQueryClient()

  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddCoparent = async () => {
    if (!pet || !email.trim()) return
    setIsSubmitting(true)

    try {
      // Look up user by email via secure RPC (queries auth.users)
      const { data: foundUserId, error: lookupError } = await supabase
        .rpc('get_user_id_by_email', { user_email: email.trim().toLowerCase() })

      if (lookupError || !foundUserId) {
        showToast('No PawPal user found with that email', 'error')
        setIsSubmitting(false)
        return
      }

      // Set coparent_id on the pet
      const { error: updateError } = await supabase
        .from('pets')
        .update({ coparent_id: foundUserId })
        .eq('id', pet.id)

      if (updateError) throw updateError

      showToast('Co-parent added! They can now care for ' + pet.name + ' too 🐾', 'success')
      queryClient.invalidateQueries({ queryKey: ['my-pet'] })
      setEmail('')
    } catch (e) {
      showToast('Something went wrong. Please try again.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveCoparent = async () => {
    if (!pet) return
    setIsSubmitting(true)
    try {
      const { error } = await supabase
        .from('pets')
        .update({ coparent_id: null })
        .eq('id', pet.id)

      if (error) throw error

      showToast('Co-parent removed.', 'success')
      queryClient.invalidateQueries({ queryKey: ['my-pet'] })
    } catch (e) {
      showToast('Failed to remove co-parent.', 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <View style={[s.root, { backgroundColor: BG }]}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [s.backBtn, pressed && { opacity: 0.6 }]}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <Text style={s.headerTitle}>Co-Parent 👫</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <ActivityIndicator color={ACCENT} style={{ marginTop: 40 }} />
        ) : !pet ? (
          <Card style={s.emptyCard}>
            <Text style={s.emptyText}>No pet found. Adopt one first! 🐾</Text>
          </Card>
        ) : pet.coparent_id ? (
          /* ── Already has a co-parent ── */
          <Card style={s.infoCard}>
            <Text style={s.heartEmoji}>💕</Text>
            <Text style={s.infoTitle}>You are co-parenting with a friend</Text>
            <Text style={s.infoEmail}>A PawPal friend 🐾</Text>
            <Text style={s.infoDesc}>
              {'They can feed, play with, and talk to ' + pet.name + ' too.'}
            </Text>
            <Button
              label="Remove Co-Parent"
              onPress={handleRemoveCoparent}
              loading={isSubmitting}
              fullWidth
            />
          </Card>
        ) : (
          /* ── No co-parent yet ── */
          <>
            <Text style={s.sectionTitle}>
              {'Invite a friend to co-parent ' + pet.name}
            </Text>
            <Text style={s.sectionDesc}>
              {'Enter their email address below. They\'ll gain access to ' + pet.name + ' immediately.'}
            </Text>

            <Card style={s.formCard}>
              <TextInputField
                label="Friend's email"
                value={email}
                onChangeText={setEmail}
                placeholder="friend@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Button
                label="Send Invite 💌"
                onPress={handleAddCoparent}
                loading={isSubmitting}
                fullWidth
              />
            </Card>

            <View style={s.infoRow}>
              <Ionicons name="information-circle-outline" size={16} color={TEXT_TERTIARY} />
              <Text style={s.infoHint}>Your friend needs a PawPal account first</Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },

  container: { paddingHorizontal: 20, paddingTop: 28, gap: 16 },

  emptyCard: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: TEXT_SECONDARY, textAlign: 'center' },

  // Has co-parent
  infoCard: { alignItems: 'center', gap: 12, paddingVertical: 32 },
  heartEmoji: { fontSize: 48 },
  infoTitle: { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  infoEmail: { fontSize: 14, color: ACCENT, fontWeight: '600' },
  infoDesc: { fontSize: 13, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 20 },

  // No co-parent
  sectionTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  sectionDesc: { fontSize: 14, color: TEXT_SECONDARY, lineHeight: 20 },
  formCard: { gap: 16 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  infoHint: { fontSize: 12, color: TEXT_TERTIARY },
})
