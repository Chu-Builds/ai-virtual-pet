import { ScrollView, StyleSheet, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Text } from '@/components/ui/Text'
import { BG, TEXT_PRIMARY, TEXT_SECONDARY, TEXT_TERTIARY } from '@/lib/theme'

export default function PrivacyScreen() {
    const insets = useSafeAreaInsets()

    return (
        <View style={{ flex: 1, backgroundColor: BG }}>
            <View style={[s.header, { paddingTop: insets.top + 8 }]}>
                <Pressable onPress={() => router.back()} hitSlop={12}>
                    <Ionicons name="chevron-back" size={24} color="rgba(255,255,255,0.6)" />
                </Pressable>
                <Text style={s.title}>Privacy Policy</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={[s.body, { paddingBottom: insets.bottom + 32 }]}
                showsVerticalScrollIndicator={false}
            >
                <Text style={s.updated}>Last updated: May 2026</Text>

                <Text style={s.paragraph}>
                    PawPal is built and maintained by Chu Builds (chubuilds@gmail.com).
                </Text>

                <Text style={s.heading}>Data we collect:</Text>
                <Text style={s.paragraph}>
                    - Email address (used for account creation only){'\n'}
                    - Pet interaction data (stored in your account to power the AI personality){'\n'}
                    - We do not sell your data to third parties
                </Text>

                <Text style={s.paragraph}>
                    Your pet's conversation history is stored securely in Supabase and 
                    is only accessible by you and anyone you invite as a co-parent.
                </Text>

                <Text style={s.paragraph}>
                    To delete your account and all associated data, email 
                    chubuilds@gmail.com with the subject "Delete my account".
                </Text>
            </ScrollView>
        </View>
    )
}

const s = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(255,255,255,0.08)',
    },
    title: { color: TEXT_PRIMARY, fontSize: 17, fontWeight: '700' },
    body: { padding: 24, gap: 10 },
    updated: { color: TEXT_TERTIARY, fontSize: 12, marginBottom: 4 },
    heading: { color: TEXT_PRIMARY, fontSize: 14.5, fontWeight: '700', marginTop: 5 },
    paragraph: { color: TEXT_SECONDARY, fontSize: 13.5, lineHeight: 21 },
})
