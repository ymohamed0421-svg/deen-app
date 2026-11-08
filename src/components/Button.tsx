import { Pressable, Text, type ViewStyle } from 'react-native';
import { colors, themed } from '../theme';

type Props = {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  shadow?: string;
  variant?: 'solid' | 'outline';
  style?: ViewStyle;
};

/** A chunky button that presses down, so every tap feels physical. */
export function Button({ title, onPress, disabled, color = colors.green, shadow = colors.greenDark, variant = 'solid', style }: Props) {
  const outline = variant === 'outline';
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        outline
          ? { backgroundColor: colors.card, borderColor: colors.line, borderWidth: 2, borderBottomWidth: 4 }
          : { backgroundColor: disabled ? colors.locked : color, borderBottomColor: disabled ? colors.lockedDark : shadow, borderBottomWidth: 4 },
        pressed && !disabled && { transform: [{ translateY: 2 }], borderBottomWidth: 2 },
        style,
      ]}
    >
      <Text style={[styles.text, { color: outline ? colors.ink : '#fff' }]}>{title}</Text>
    </Pressable>
  );
}

const styles = themed(() => ({
  base: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center' },
  text: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
}));
