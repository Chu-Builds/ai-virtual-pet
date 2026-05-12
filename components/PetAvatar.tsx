import { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { Text } from '@/components/ui/Text'
import { MoodLabel } from '@/lib/petTypes'

// ─── Types ────────────────────────────────────────────────────────────────────

type Species = 'cat' | 'dog' | 'bunny'
type ActionType = 'idle' | 'feed' | 'play' | 'talk' | null

interface PetAvatarProps {
  species: Species
  mood: MoodLabel
  growthStage?: number
  size?: number // retained for backward compatibility, but overridden by stage
  action?: ActionType
}

// ─── Constants ────────────────────────────────────────────────────────────────

const getSpeciesEmoji = (species: Species, stage: number) => {
  if (species === 'cat') return stage === 1 ? '🐱' : stage === 2 ? '😺' : '😸';
  if (species === 'dog') return stage === 1 ? '🐶' : stage === 2 ? '🐕' : '🦮';
  if (species === 'bunny') return stage === 1 ? '🐰' : stage === 2 ? '🐇' : '🐇';
  return '🐾';
}

const MOOD_BG: Record<MoodLabel, string> = {
  happy: '#d1fae5',
  starving: '#ffedd5',
  lonely: '#ede9fe',
  tired: '#dbeafe',
  content: '#f3f4f6',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PetAvatar({
  species,
  mood,
  growthStage = 1,
  size,
  action = null,
}: PetAvatarProps) {
  // Shared animation values
  const translateY = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(1)).current
  const rotate = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current
  const glowOpacity = useRef(new Animated.Value(0)).current

  const avatarSize = growthStage === 1 ? 120 : growthStage === 2 ? 140 : 160;
  const avatarFontSize = growthStage === 1 ? 55 : growthStage === 2 ? 65 : 75;
  const radius = avatarSize / 2;

  // ── Idle bounce (always running) ──────────────────────────────────────────
  useEffect(() => {
    translateY.setValue(0);
    const bounceHeight = growthStage === 2 ? -14 : growthStage === 3 ? -6 : -10;
    const bounceDuration = growthStage === 3 ? 900 : 500;
    
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: bounceHeight, duration: bounceDuration, useNativeDriver: false }),
        Animated.timing(translateY, { toValue: 0, duration: bounceDuration, useNativeDriver: false })
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [growthStage, translateY])

  // ── Mood-based animation ──────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(scale, { toValue: 1, duration: 200, useNativeDriver: false }).start()
    Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: false }).start()
  }, [mood, scale, opacity])

  // ── Action animations ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!action || action === 'idle') return

    if (action === 'feed') {
      Animated.sequence([
        Animated.spring(translateY, { toValue: -25, useNativeDriver: false }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: false })
      ]).start()
    } else if (action === 'play') {
      Animated.timing(rotate, { toValue: 1, duration: 400, useNativeDriver: false }).start(() => {
        rotate.setValue(0)
      })
    } else if (action === 'talk') {
      Animated.sequence([
        Animated.timing(rotate, { toValue: -0.1, duration: 80, useNativeDriver: false }),
        Animated.timing(rotate, { toValue: 0.1, duration: 80, useNativeDriver: false }),
        Animated.timing(rotate, { toValue: 0, duration: 80, useNativeDriver: false })
      ]).start()
    }
  }, [action, translateY, rotate])

  // ── Growth glow animation ─────────────────────────────────────────────────
  useEffect(() => {
    glowOpacity.stopAnimation();
    if (growthStage === 3) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 1.0, duration: 750, useNativeDriver: false }),
          Animated.timing(glowOpacity, { toValue: 0.6, duration: 750, useNativeDriver: false })
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      glowOpacity.setValue(0);
    }
  }, [growthStage, glowOpacity])

  // ── Animated styles ───────────────────────────────────────────────────────
  
  const rotateInterpolate = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-100deg', '0deg', '360deg']
  })

  const avatarAnimatedStyle = {
    transform: [
      { translateY: translateY },
      { scale: scale },
      { rotate: rotateInterpolate },
    ],
    opacity: opacity,
  }

  const glowAnimatedStyle = {
    opacity: glowOpacity,
  }

  const bgColor = MOOD_BG[mood] || MOOD_BG.content;
  const showGlow = growthStage === 3;
  
  const borderWidth = growthStage === 1 ? 0 : growthStage === 2 ? 2 : 3;
  const borderColor = growthStage === 2 ? '#f59e0b' : growthStage === 3 ? '#eab308' : 'transparent';
  
  const stageLabel = growthStage === 1 ? '🌱 Baby' : growthStage === 2 ? '⚡ Teen' : '👑 Adult';
  const stageColor = growthStage === 1 ? '#9ca3af' : growthStage === 2 ? '#f59e0b' : '#eab308';

  return (
    <View style={styles.wrapper}>
      {/* Container for avatar circle to center it nicely */}
      <View style={{ width: avatarSize, height: avatarSize, alignItems: 'center', justifyContent: 'center' }}>
        {/* Growth glow ring */}
        {showGlow && (
          <Animated.View
            style={[
              styles.glowRing,
              {
                width: avatarSize + 24,
                height: avatarSize + 24,
                borderRadius: radius + 12,
                borderColor: '#eab308',
                shadowColor: '#eab308',
                shadowRadius: 16,
                shadowOpacity: 1,
                shadowOffset: { width: 0, height: 0 },
                elevation: 8,
              },
              glowAnimatedStyle,
            ]}
          />
        )}

        {/* Avatar circle */}
        <Animated.View
          style={[
            styles.circle,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: radius,
              backgroundColor: bgColor,
              borderWidth,
              borderColor,
            },
            avatarAnimatedStyle,
          ]}
        >
          <Text style={[styles.emoji, { fontSize: avatarFontSize }]}>
            {getSpeciesEmoji(species, growthStage)}
          </Text>
        </Animated.View>
      </View>
      
      {/* Stage Label */}
      <Text style={{ marginTop: 16, fontSize: 14, fontWeight: '700', color: stageColor }}>
        {stageLabel}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 3,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  emoji: {
    textAlign: 'center',
  },
})
