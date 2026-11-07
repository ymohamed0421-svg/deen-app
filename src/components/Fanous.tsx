import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export type FanousMood = 'happy' | 'cheer' | 'worried' | 'sleepy';

/** Fanous, the lantern mascot. Its flame grows with the user's streak. */
export function Fanous({ mood = 'happy', size = 96, flame = 1 }: { mood?: FanousMood; size?: number; flame?: number }) {
  const s = size / 96;
  const flameSize = (18 + 14 * Math.min(1, Math.max(0.2, flame))) * s;
  const eyeH = mood === 'sleepy' ? 2 * s : 8 * s;
  return (
    <View style={{ width: size, height: size * 1.25, alignItems: 'center' }}>
      {/* hanging ring */}
      <View style={[styles.ring, { width: 18 * s, height: 14 * s, borderWidth: 3 * s, borderRadius: 9 * s }]} />
      {/* cap */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 30 * s,
          borderRightWidth: 30 * s,
          borderBottomWidth: 18 * s,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: colors.gold,
        }}
      />
      <View style={[styles.band, { width: 66 * s, height: 8 * s, borderRadius: 4 * s }]} />
      {/* glass body */}
      <View
        style={[
          styles.body,
          { width: 72 * s, height: 66 * s, borderRadius: 18 * s, borderWidth: 4 * s },
        ]}
      >
        <View
          style={{
            position: 'absolute',
            bottom: 8 * s,
            width: flameSize,
            height: flameSize * 1.3,
            borderRadius: flameSize,
            borderTopLeftRadius: flameSize * 0.2,
            transform: [{ rotate: '45deg' }],
            backgroundColor: mood === 'worried' ? '#F4B860' : '#F7A531',
            opacity: 0.85,
          }}
        />
        <View style={{ flexDirection: 'row', gap: 16 * s, marginTop: 4 * s }}>
          <View style={[styles.eye, { width: 8 * s, height: eyeH, borderRadius: 4 * s }]} />
          <View style={[styles.eye, { width: 8 * s, height: eyeH, borderRadius: 4 * s }]} />
        </View>
        <View
          style={{
            marginTop: 6 * s,
            width: (mood === 'cheer' ? 20 : 14) * s,
            height: (mood === 'cheer' ? 10 : 6) * s,
            borderBottomLeftRadius: 10 * s,
            borderBottomRightRadius: 10 * s,
            borderTopLeftRadius: mood === 'worried' ? 10 * s : 0,
            borderTopRightRadius: mood === 'worried' ? 10 * s : 0,
            backgroundColor: colors.ink,
          }}
        />
      </View>
      <View style={[styles.band, { width: 60 * s, height: 10 * s, borderRadius: 5 * s }]} />
    </View>
  );
}

export function SpeechBubble({ text }: { text: string }) {
  return (
    <View style={styles.bubble}>
      <Text style={styles.bubbleText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderColor: colors.gold, backgroundColor: 'transparent' },
  band: { backgroundColor: '#C98F22' },
  body: {
    backgroundColor: '#FFF6DF',
    borderColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 12,
    overflow: 'hidden',
  },
  eye: { backgroundColor: colors.ink },
  bubble: {
    flexShrink: 1,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 2,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  bubbleText: { color: colors.ink, fontSize: 15, lineHeight: 21 },
});

// ---------- what Fanous says ----------
// Playful about the app and the streak. Never about anyone's worship or faith.

function pick(lines: string[], seed: number) {
  return lines[Math.abs(seed) % lines.length];
}

export function greetingLine(opts: { streak: number; doneToday: boolean; seed: number }) {
  if (opts.doneToday) {
    return pick(
      [
        'Today’s flame is lit. MashaAllah! Come back tomorrow and we’ll make it brighter.',
        'You’re done for today. I’ll be glowing right here until tomorrow.',
        'One more lesson? I won’t stop you. I’m a lantern, not a bouncer.',
      ],
      opts.seed,
    );
  }
  if (opts.streak === 0) {
    return pick(
      [
        'Assalamu alaikum! I’m Fanous. Shall we light the first flame together?',
        'A small lesson a day, and I glow a little brighter. Ready?',
      ],
      opts.seed,
    );
  }
  return pick(
    [
      `${opts.streak} days in a row! My flame is getting small though. Top it up?`,
      `Day ${opts.streak + 1} is waiting. Three minutes, that’s all I ask.`,
      'I’ve been polishing my glass all morning. Don’t make me polish it alone.',
    ],
    opts.seed,
  );
}

export const correctLines = ['MashaAllah!', 'Spot on!', 'Bright as a full moon!', 'Exactly right!', 'You’ve got it!'];
export const wrongLines = ['Not quite. Here’s the answer.', 'Close! Let’s look at it again.', 'Learning is the point. Here’s why.'];
