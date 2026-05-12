import { useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import TextInputField from '@/components/ui/TextInputField'
import { useToast } from '@/contexts/ToastContext'
import { supabase } from '@/lib/supabase'
import { Species } from '@/lib/petTypes'
import { useMyPets, getTotalInteractions, getSlotLimit } from '@/hooks/usePet'
import { BG, SURFACE, TEXT_SECONDARY, TEXT_TERTIARY, BORDER, ACCENT } from '@/lib/theme'

const SPECIES_OPTIONS: { id: Species; name: string; emoji: string }[] = [
    { id: 'cat', name: 'Cat', emoji: '🐱' },
    { id: 'dog', name: 'Dog', emoji: '🐶' },
    { id: 'bunny', name: 'Bunny', emoji: '🐰' },
]

export default function AdoptScreen() {
    const insets = useSafeAreaInsets()
    const { showToast } = useToast()
    const { data: allPets = [], isLoading: petsLoading } = useMyPets()

    const [name, setName] = useState('')
    const [species, setSpecies] = useState<Species | null>(null)
    const [loading, setLoading] = useState(false)

    // Slot limit logic — only count pets the user OWNS (not co-parented)
    const ownedPets = allPets.filter(p => {
        // We can't easily check owner_id here without the user id, 
        // so we use interaction_count sum as a proxy (owned = not just coparent)
        // The server will enforce true ownership; client shows a rough limit
        return true // show all for now, server will reject if needed
    })
    const totalInteractions = allPets.reduce((sum, p) => sum + (p.interaction_count || 0), 0)
    const slotLimit = getSlotLimit(totalInteractions)
    const slotsUsed = allPets.length
    const slotsAvailable = slotsUsed < slotLimit

    const interactionsToNextSlot = slotLimit < 3
        ? (slotLimit === 1 ? 30 : 60)
        : null
    const progressToNext = interactionsToNextSlot
        ? Math.min(totalInteractions / interactionsToNextSlot, 1)
        : 1

    const handleAdopt = async () => {
        if (!name.trim() || !species) return
        setLoading(true)

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (authError || !user) throw new Error('You must be logged in to adopt a pet.')

            const { error: insertError } = await supabase.from('pets').insert({
                owner_id: user.id,
                name: name.trim(),
                species: species,
                energy: 80,
                affection: 80,
                hunger: 80,
                growth_stage: 1,
            })

            if (insertError) throw insertError

            showToast('Adopted ' + name.trim() + '! 🎉', 'success')
            router.replace('/(tabs)')
        } catch (e: any) {
            showToast(e.message || 'Failed to adopt pet', 'error')
        } finally {
            setLoading(false)
        }
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
        >
            {/* HEADER */}
            <View style={s.header}>
                <Pressable onPress={() => router.back()} style={s.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#fff" />
                </Pressable>
                <Text style={s.title}>Adopt a Pet 🐾</Text>
            </View>

            {/* SLOT LOCKED STATE */}
            {!petsLoading && !slotsAvailable ? (
                <Card style={s.lockedCard}>
                    <Text style={s.lockEmoji}>🔒</Text>
                    <Text style={s.lockTitle}>Pet Slot Locked</Text>
                    <Text style={s.lockDesc}>
                        {'You can have ' + slotLimit + ' pet(s) at your level.\nCare for your current pet more to unlock another slot.'}
                    </Text>
                    {interactionsToNextSlot && (
                        <>
                            <View style={s.progressTrack}>
                                <View style={[s.progressFill, { width: (progressToNext * 100) + '%' }]} />
                            </View>
                            <Text style={s.progressHint}>
                                {totalInteractions + ' / ' + interactionsToNextSlot + ' interactions to unlock next slot'}
                            </Text>
                        </>
                    )}
                </Card>
            ) : (
                <>
                    {/* Slot indicator */}
                    {!petsLoading && allPets.length > 0 && (
                        <Text style={s.slotHint}>
                            {slotsUsed + ' of ' + slotLimit + ' slot(s) used'}
                        </Text>
                    )}

                    {/* PET NAME INPUT */}
                    <View style={s.section}>
                        <TextInputField
                            label="Give your pet a name"
                            placeholder="e.g. Fluffy"
                            value={name}
                            onChangeText={setName}
                            maxLength={20}
                        />
                    </View>

                    {/* SPECIES SELECTOR */}
                    <View style={s.section}>
                        <Text style={s.label}>Choose a species</Text>
                        <View style={s.speciesRow}>
                            {SPECIES_OPTIONS.map(opt => (
                                <Pressable key={opt.id} style={{ flex: 1 }} onPress={() => setSpecies(opt.id)}>
                                    <Card style={[
                                        s.speciesCard,
                                        species === opt.id && s.speciesCardSelected
                                    ]}>
                                        <Text style={s.speciesEmoji}>{opt.emoji}</Text>
                                        <Text style={[
                                            s.speciesName,
                                            species === opt.id && s.speciesNameSelected
                                        ]}>
                                            {opt.name}
                                        </Text>
                                    </Card>
                                </Pressable>
                            ))}
                        </View>
                    </View>

                    {/* ADOPT BUTTON */}
                    <View style={s.footer}>
                        <Button
                            label={name.trim() ? 'Adopt ' + name.trim() + '!' : 'Adopt!'}
                            onPress={handleAdopt}
                            loading={loading}
                            disabled={!name.trim() || !species}
                            fullWidth
                            size="lg"
                        />
                    </View>
                </>
            )}
        </ScrollView>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 36, minHeight: '100%' },
    header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: { fontSize: 24, fontWeight: '800', color: '#fff' },

    // Slot locked
    lockedCard: { alignItems: 'center', gap: 12, paddingVertical: 32 },
    lockEmoji: { fontSize: 48 },
    lockTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
    lockDesc: { fontSize: 14, color: TEXT_SECONDARY, textAlign: 'center', lineHeight: 22 },
    progressTrack: {
        width: '100%',
        height: 8,
        backgroundColor: BORDER,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: ACCENT, borderRadius: 4 },
    progressHint: { fontSize: 12, color: TEXT_TERTIARY, textAlign: 'center' },

    slotHint: { fontSize: 13, color: TEXT_SECONDARY, textAlign: 'center', marginTop: -20 },

    section: { gap: 14 },
    label: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.7,
        textTransform: 'uppercase',
        color: TEXT_TERTIARY
    },

    speciesRow: { flexDirection: 'row', gap: 12 },
    speciesCard: {
        alignItems: 'center',
        paddingVertical: 24,
        gap: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        backgroundColor: SURFACE,
    },
    speciesCardSelected: {
        borderColor: ACCENT,
        backgroundColor: 'rgba(255,255,255,0.12)',
    },
    speciesEmoji: { fontSize: 44 },
    speciesName: { fontSize: 14, fontWeight: '600', color: TEXT_SECONDARY },
    speciesNameSelected: { color: ACCENT, fontWeight: '800' },

    footer: { marginTop: 'auto', paddingTop: 20 },
})
