import { StyleSheet } from 'react-native';

export type Palette = {
  bg: string;
  card: string;
  ink: string;
  muted: string;
  line: string;
  green: string;
  greenDark: string;
  /** Green used for text on cards (dark green by day, light green at night). */
  greenInk: string;
  /** Soft green background, for a picked or finished item. */
  greenLight: string;
  greenBorder: string;
  gold: string;
  goldLight: string;
  goldBorder: string;
  /** Gold used for small text and numbers. */
  goldInk: string;
  cream: string;
  red: string;
  redLight: string;
  redDark: string;
  blue: string;
  blueLight: string;
  oil: string;
  pearl: string;
  locked: string;
  lockedDark: string;
  soil: string;
  sprout: string;
  overlay: string;
};

export const lightColors: Palette = {
  bg: '#FBF7EF',
  card: '#FFFFFF',
  ink: '#1F2A24',
  muted: '#6B746E',
  line: '#E7E0D2',
  green: '#2F7D5B',
  greenDark: '#215A41',
  greenInk: '#215A41',
  greenLight: '#EEF8F2',
  greenBorder: '#BFE0CF',
  gold: '#E2A93B',
  goldLight: '#FCEFD2',
  goldBorder: '#F1D9A0',
  goldInk: '#9A6B12',
  cream: '#FBF6EA',
  red: '#C8553D',
  redLight: '#FBE3DD',
  redDark: '#9A3F2C',
  blue: '#2E6FA3',
  blueLight: '#E6F0F8',
  oil: '#D98E04',
  pearl: '#8FA9C2',
  locked: '#D9D3C6',
  lockedDark: '#BDB6A8',
  soil: '#EADFC8',
  sprout: '#D6E8C9',
  overlay: '#0006',
};

export const darkColors: Palette = {
  bg: '#111714',
  card: '#1B231F',
  ink: '#EEE8DA',
  muted: '#9BA59F',
  line: '#2D3832',
  green: '#34895F',
  greenDark: '#1F5A3F',
  greenInk: '#8FD4AF',
  greenLight: '#1D3328',
  greenBorder: '#2F5A44',
  gold: '#E2A93B',
  goldLight: '#3A2F17',
  goldBorder: '#5C4A22',
  goldInk: '#F0C46A',
  cream: '#262218',
  red: '#E06A50',
  redLight: '#3D221C',
  redDark: '#8E3A28',
  blue: '#6AA6D8',
  blueLight: '#1C2B38',
  oil: '#F0A42A',
  pearl: '#A9BFD4',
  locked: '#3A403C',
  lockedDark: '#2A2F2C',
  soil: '#3A3226',
  sprout: '#2A3D26',
  overlay: '#000A',
};

/**
 * The colours in use right now. Screens read from this object, and dark mode
 * swaps its values (see ThemeProvider), then redraws the screens.
 */
export const colors: Palette = { ...lightColors };

let version = 0;
let currentScheme: 'light' | 'dark' = 'light';

export function applyScheme(scheme: 'light' | 'dark') {
  if (scheme === currentScheme) return;
  currentScheme = scheme;
  Object.assign(colors, scheme === 'dark' ? darkColors : lightColors);
  version++;
}

/**
 * Like StyleSheet.create, but the styles follow light or dark mode.
 * Write `themed(() => ({ ... }))` and use `colors.x` inside.
 */
type Styles = Parameters<typeof StyleSheet.create>[0];

export function themed<T extends Styles>(make: () => T): Readonly<T> {
  let cache: Readonly<T> | null = null;
  let builtFor = -1;
  const get = () => {
    if (!cache || builtFor !== version) {
      cache = StyleSheet.create(make());
      builtFor = version;
    }
    return cache;
  };
  return new Proxy({} as Readonly<T>, {
    get: (_, key) => (get() as Record<string | symbol, unknown>)[key],
    has: (_, key) => key in (get() as object),
    ownKeys: () => Reflect.ownKeys(get() as object),
    getOwnPropertyDescriptor: (_, key) => Object.getOwnPropertyDescriptor(get() as object, key),
  });
}
