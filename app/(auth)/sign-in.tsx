import { useState } from 'react';
import { View, Pressable, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Text } from '@/components/ui/Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { BG, ACCENT, TEXT_SECONDARY } from '@/lib/theme';
import TextInputField from '@/components/ui/TextInputField';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

export default function SignInScreen() {
    const insets = useSafeAreaInsets();
    const { showToast } = useToast();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignIn = async () => {
        if (!email.trim() || !password) return;
        setLoading(true);
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password,
        });
        setLoading(false);
        
        if (error) {
            showToast(error.message, 'error');
        } else {
            router.replace('/(tabs)');
        }
    };

    return (
        <View style={s.root}>
            <KeyboardAvoidingView style={s.kav} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <ScrollView contentContainerStyle={[s.form, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 }]} keyboardShouldPersistTaps="handled">
                    <View style={s.titleBlock}>
                        <Text style={s.titleBold}>Welcome back</Text>
                        <Text style={s.sub}>Sign in to your account.</Text>
                    </View>

                    <View style={s.stepWrap}>
                        <TextInputField 
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="you@example.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <TextInputField 
                            label="Password"
                            value={password}
                            onChangeText={setPassword}
                            placeholder="••••••••"
                            secureTextEntry
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <Button 
                            label="Sign In"
                            onPress={handleSignIn}
                            loading={loading}
                            disabled={!email.trim() || !password}
                            fullWidth
                            style={{ marginTop: 8 }}
                        />

                        <Pressable onPress={() => router.push('/(auth)/sign-up')} style={s.linkWrap}>
                            <Text style={s.linkText}>Don't have an account? Sign Up</Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: BG },
    kav: { flex: 1 },
    form: { flexGrow: 1, paddingHorizontal: 24 },
    titleBlock: { gap: 10, marginBottom: 32 },
    titleBold: { fontSize: 30, fontWeight: '800', color: '#fff', letterSpacing: -0.8 },
    sub: { fontSize: 14, color: TEXT_SECONDARY },
    stepWrap: { gap: 16 },
    linkWrap: { alignItems: 'center', marginTop: 16, padding: 8 },
    linkText: { fontSize: 14, color: ACCENT, fontWeight: '600' },
});
