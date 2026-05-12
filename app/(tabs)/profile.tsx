import { useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet, Pressable, Switch } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Text } from '@/components/ui/Text'
import { Card } from '@/components/ui/Card'
import { AlertModal } from '@/components/ui/AppModal'
import SettingsRow from '@/components/ui/SettingsRow'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { logoutRevenueCat } from '@/lib/purchases'
import { supabase } from '@/lib/supabase'
import { track } from '@/lib/analytics'
import { adjustBrightness } from '@/lib/utils'
import {
    ACCENT,
    ACCENT_BORDER,
    BG,
    TEXT_PRIMARY,
    TEXT_SECONDARY,
    TEXT_TERTIARY,
} from '@/lib/theme'
import { TAB_BAR_CLEARANCE } from '@/components/TabBar'
import { demoUser } from '@/lib/mockData'
import { useProfile } from '@/hooks/useProfile'
import { useMyPets, useSetActivePet, useActivePet, getTotalInteractions, getSlotLimit } from '@/hooks/usePet'

const SPECIES_EMOJIS: Record<string, string> = {
    cat: '🐱',
    dog: '🐶',
    bunny: '🐰',
}

function getPetParentTitle(interactions: number): string {
    if (interactions <= 10) return 'New Pet Parent 🌱'
    if (interactions <= 30) return 'Caring Companion 💛'
    if (interactions <= 60) return 'Devoted Pet Parent 🐾'
    return 'Legendary Pet Parent ⭐'
}

function daysSince(iso: string): number {
    return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    })
}

export default function ProfileScreen() {
    const insets = useSafeAreaInsets()
    const { isPremium, customerInfo } = useSubscription()
    const { data: profile } = useProfile()
    const { data: allPets = [] } = useMyPets()
    const { data: activePet } = useActivePet()
    const { mutate: setActivePet } = useSetActivePet()
    const totalInteractions = allPets.reduce((s, p) => s + (p.interaction_count || 0), 0)
    const slotLimit = getSlotLimit(totalInteractions)
    const [signOutModal, setSignOutModal] = useState(false)
    const [signingOut, setSigningOut] = useState(false)
    const [errorModal, setErrorModal] = useState<string | null>(null)
    const [reminderEnabled, setReminderEnabled] = useState(false)

    useEffect(() => {
        AsyncStorage.getItem('daily_reminder_enabled').then(val => {
            if (val !== null) setReminderEnabled(val === 'true')
        })
    }, [])

    const toggleReminder = (value: boolean) => {
        setReminderEnabled(value)
        AsyncStorage.setItem('daily_reminder_enabled', value ? 'true' : 'false')
    }

    const expiryMs = customerInfo?.entitlements.active['premium']?.expirationDate
    const expiryDate = expiryMs
        ? new Date(expiryMs).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
        : null

    async function handleSignOut() {
        setSigningOut(true)
        try {
            track('logout')
            await logoutRevenueCat()
            const { error } = await supabase.auth.signOut()
            if (error) throw error
        } catch (e: any) {
            setErrorModal(e?.message ?? 'Sign out failed. Please try again.')
        } finally {
            setSigningOut(false)
        }
    }

    return (
        <ScrollView
            style={{ flex: 1, backgroundColor: BG }}
            contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: TAB_BAR_CLEARANCE + 16 }]}
            showsVerticalScrollIndicator={false}
        >
            {/* Hero card */}
            <Card style={s.heroCard}>
                <LinearGradient
                    colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFillObject}
                />
                <View style={s.avatarWrap}>
                    <Text style={s.avatarText}>{profile?.initials ?? demoUser.initials}</Text>
                    {isPremium && (
                        <View style={s.premiumDot}>
                            <Ionicons name="sparkles" size={10} color="#fff" />
                        </View>
                    )}
                </View>
                <Text style={s.name}>{profile?.fullName ?? demoUser.fullName}</Text>
                <Text style={s.metaText}>{profile?.email ?? demoUser.email}</Text>
            </Card>

            {/* Subscription card */}
            {isPremium ? (
                <Card style={[s.planCard, { borderColor: ACCENT_BORDER }]}>
                    <View style={s.planTop}>
                        <View style={s.planBadge}>
                            <Ionicons name="sparkles" size={11} color="#fff" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.planTitle}>Premium Active</Text>
                            <Text style={s.planSub}>{expiryDate ? 'Renews ' + expiryDate : 'Billing cycle active'}</Text>
                        </View>
                        <Pressable onPress={() => router.push('/upgrade')} style={s.manageBtn}>
                            <Text style={s.manageBtnText}>Manage</Text>
                        </Pressable>
                    </View>
                </Card>
            ) : (
                <Pressable onPress={() => router.push('/upgrade')} style={s.upgradeCard}>
                    <LinearGradient
                        colors={[ACCENT, adjustBrightness(ACCENT, -18)]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={StyleSheet.absoluteFillObject}
                    />
                    <Ionicons name="sparkles" size={15} color="#fff" />
                    <View style={{ flex: 1 }}>
                        <Text style={s.upgradeTitle}>Upgrade to Premium</Text>
                        <Text style={s.upgradeSub}>Advanced controls, faster support, and all modules.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color="rgba(255,255,255,0.8)" />
                </Pressable>
            )}

            {/* My Pets section */}
            {allPets.length > 0 && (
                <>
                    <Text style={s.sectionTitle}>My Pets</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
                    >
                        {allPets.map(p => {
                            const isActive = p.id === activePet?.id
                            const days = daysSince(p.created_at)
                            return (
                                <Pressable key={p.id} onPress={() => setActivePet(p.id)}>
                                    <Card style={[s.petCard, isActive && { borderColor: ACCENT, borderWidth: 2 }]}>
                                        <Text style={s.petEmoji}>{SPECIES_EMOJIS[p.species]}</Text>
                                        <Text style={s.petName}>{p.name}</Text>
                                        <Text style={s.petMeta2}>{p.interaction_count} interactions</Text>
                                        <Text style={s.petMeta2}>{days}d together</Text>
                                    </Card>
                                </Pressable>
                            )
                        })}
                    </ScrollView>
                    <Text style={s.slotText}>
                        {'Slot ' + allPets.length + ' of ' + slotLimit + ' used'}
                        {slotLimit < 3 ? ' • Care more to unlock' : ''}
                    </Text>
                </>
            )}

            {/* Personality card for active pet */}
            {activePet && activePet.personality_summary && activePet.personality_summary.trim() ? (
                <>
                    <Text style={s.sectionTitle}>{'What ' + activePet.name + ' is like'}</Text>
                    <Card style={s.personalityCard}>
                        <Text style={s.personalityText}>{activePet.personality_summary}</Text>
                    </Card>
                </>
            ) : null}
            <Text style={s.sectionTitle}>Notifications</Text>
            <Card compact style={s.notifCard}>
                <View style={s.notifRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.notifLabel}>Daily check-in reminder</Text>
                        <Text style={s.notifSub}>Remind me to care for my pet each day</Text>
                    </View>
                    <Switch
                        value={reminderEnabled}
                        onValueChange={toggleReminder}
                        trackColor={{ false: 'rgba(255,255,255,0.12)', true: ACCENT }}
                        thumbColor="#fff"
                    />
                </View>
            </Card>

            {/* Account section */}
            <Text style={s.sectionTitle}>Account</Text>
            <Card compact style={s.sectionCard}>
                <SettingsRow icon="settings-outline" label="Settings" onPress={() => router.push('/settings')} />
                <SettingsRow icon="help-buoy-outline" label="Support" onPress={() => router.push('/support')} />
                <SettingsRow icon="document-text-outline" label="Privacy Policy" onPress={() => router.push('/privacy')} />
                <SettingsRow icon="shield-checkmark-outline" label="Terms of Service" onPress={() => router.push('/terms')} last={true} />
            </Card>

            <Pressable
                onPress={() => setSignOutModal(true)}
                disabled={signingOut}
                style={({ pressed }) => [s.signOutBtn, (pressed || signingOut) && { opacity: 0.72 }]}
            >
                <Ionicons name="log-out-outline" size={17} color="rgba(255,255,255,0.45)" />
                <Text style={s.signOutText}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
            </Pressable>

            <AlertModal
                visible={signOutModal}
                title="Sign out"
                message="You will be signed out of your account."
                buttons={[
                    { text: 'Cancel', style: 'cancel', onPress: () => setSignOutModal(false) },
                    { text: 'Sign out', style: 'destructive', onPress: () => { setSignOutModal(false); handleSignOut() } },
                ]}
                onDismiss={() => setSignOutModal(false)}
            />

            <AlertModal
                visible={!!errorModal}
                title="Error"
                message={errorModal ?? ''}
                buttons={[{ text: 'OK', onPress: () => setErrorModal(null) }]}
                onDismiss={() => setErrorModal(null)}
            />
        </ScrollView>
    )
}

const s = StyleSheet.create({
    container: { paddingHorizontal: 20, gap: 14 },
    heroCard: {
        overflow: 'hidden',
        alignItems: 'center',
        gap: 5,
        paddingVertical: 16,
    },
    avatarWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.18)',
        marginBottom: 4,
    },
    avatarText: { fontSize: 24, fontWeight: '800', color: '#fff' },
    premiumDot: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 999,
        backgroundColor: ACCENT,
        borderWidth: 2,
        borderColor: BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    name: { fontSize: 22, fontWeight: '800', color: TEXT_PRIMARY, letterSpacing: -0.4 },
    metaText: { fontSize: 12.5, color: TEXT_SECONDARY },

    planCard: { borderWidth: 1, paddingVertical: 12 },
    planTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    planBadge: {
        width: 30,
        height: 30,
        borderRadius: 9,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: ACCENT,
    },
    planTitle: { color: ACCENT, fontSize: 14.5, fontWeight: '700' },
    planSub: { color: TEXT_SECONDARY, fontSize: 12 },
    manageBtn: {
        borderWidth: 1,
        borderColor: ACCENT_BORDER,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
    },
    manageBtnText: { color: ACCENT, fontSize: 12, fontWeight: '600' },
    upgradeCard: {
        minHeight: 66,
        borderRadius: 16,
        overflow: 'hidden',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
    },
    upgradeTitle: { color: '#fff', fontSize: 14.5, fontWeight: '700' },
    upgradeSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 1 },

    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        color: TEXT_TERTIARY,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginTop: 3,
        marginBottom: -4,
    },

    // Pet cards (horizontal scroll)
    petCard: { width: 130, alignItems: 'center', gap: 6, paddingVertical: 16 },
    petEmoji: { fontSize: 36 },
    petName: { fontSize: 15, fontWeight: '800', color: '#fff' },
    petMeta2: { fontSize: 11, color: TEXT_SECONDARY },
    slotText: { fontSize: 12, color: TEXT_TERTIARY, textAlign: 'center' },

    // Personality card
    personalityCard: { paddingVertical: 16 },
    personalityText: { fontSize: 14, color: '#fff', lineHeight: 22 },

    // Notifications
    notifCard: { padding: 0, overflow: 'hidden' },
    notifRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    notifLabel: { fontSize: 14, fontWeight: '600', color: '#fff' },
    notifSub: { fontSize: 12, color: TEXT_SECONDARY, marginTop: 2 },

    sectionCard: { padding: 0, overflow: 'hidden' },
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        paddingVertical: 10,
    },
    signOutText: { color: 'rgba(255,255,255,0.45)', fontSize: 14, fontWeight: '500' },
})
