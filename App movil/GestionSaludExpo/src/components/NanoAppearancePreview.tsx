import React from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SvgUri } from 'react-native-svg';

export type NanoAppearance = {
  id: string;
  label: string;
  description: string;
  source: ImageSourcePropType;
  format: 'png' | 'svg';
};

const NANO_APPEARANCE_KEY = 'nano-appearance-v1';

export const NANO_APPEARANCES: NanoAppearance[] = [
  {
    id: 'base',
    label: 'Nano Base',
    description: 'Diseño clásico',
    source: require('../svg/Nano Base.png'),
    format: 'png',
  },
  {
    id: 'valentin',
    label: '14 de febrero',
    description: 'Edición de San Valentín',
    source: require('../svg/Nano 14 de febrero.svg'),
    format: 'svg',
  },
  {
    id: 'gladiador',
    label: 'Gladiador',
    description: 'Edición guerrera',
    source: require('../svg/Nano Gladiador.svg'),
    format: 'svg',
  },
  {
    id: 'halloween',
    label: 'Halloween',
    description: 'Edición de temporada',
    source: require('../svg/Nano Hallowen.svg'),
    format: 'svg',
  },
  {
    id: 'navideno',
    label: 'Navideño',
    description: 'Edición navideña',
    source: require('../svg/Nano Navideño.svg'),
    format: 'svg',
  },
  {
    id: 'patriota',
    label: 'Patriota',
    description: 'Edición nacional',
    source: require('../svg/Nano Patriota.svg'),
    format: 'svg',
  },
];

export const getNanoAppearance = (appearanceId?: string | null) =>
  NANO_APPEARANCES.find((item) => item.id === appearanceId) ?? NANO_APPEARANCES[0]!;

export const loadNanoAppearanceId = async () => {
  const savedId = await AsyncStorage.getItem(NANO_APPEARANCE_KEY);
  return getNanoAppearance(savedId).id;
};

export const saveNanoAppearanceId = (appearanceId: string) =>
  AsyncStorage.setItem(NANO_APPEARANCE_KEY, getNanoAppearance(appearanceId).id);

export function NanoAppearancePreview({
  appearance,
  size,
}: {
  appearance: NanoAppearance;
  size: number;
}) {
  if (appearance.format === 'png') {
    return (
      <Image
        source={appearance.source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
        accessibilityLabel={appearance.label}
      />
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.svgBackground, { width: size, height: size, borderRadius: size / 2 }]}>
        <Image
          source={appearance.source}
          style={{ width: size, height: size }}
          resizeMode="contain"
          accessibilityLabel={appearance.label}
        />
      </View>
    );
  }

  const sourceUri = Image.resolveAssetSource(appearance.source)?.uri;
  return (
    <View style={[styles.svgBackground, { width: size, height: size, borderRadius: size / 2 }]}>
      {sourceUri ? <SvgUri uri={sourceUri} width={size} height={size} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  svgBackground: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
