/**
 * @file App movil/GestionSaludExpo/src/components/NanoAppearancePreview.tsx
 * @description Implementa los elementos TypeScript de este módulo.
 */
import React from 'react';
import { Image, ImageSourcePropType, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SvgProps } from 'react-native-svg';
import NanoValentin from '../svg/Nano 14 de febrero.svg';
import NanoGladiador from '../svg/Nano Gladiador.svg';
import NanoHalloween from '../svg/Nano Hallowen.svg';
import NanoNavideno from '../svg/Nano Navideño.svg';
import NanoPatriota from '../svg/Nano Patriota.svg';
import {
  cacheUnlockedNanoAppearanceIds,
  fetchNanoAppearanceState,
  loadUnlockedNanoAppearanceIds,
  NanoAppearanceState,
  selectNanoAppearanceOnServer,
} from '../utils/nanoAppearanceUnlocks';

export type NanoAppearance = {
  id: string;
  label: string;
  description: string;
  source?: ImageSourcePropType;
  format: 'png' | 'svg';
  svgComponent?: React.ComponentType<SvgProps> | { default: React.ComponentType<SvgProps> };
};

const resolveSvgComponent = (moduleValue: NanoAppearance['svgComponent']) => {
  let candidate: unknown = moduleValue;
  // Algunos bundlers envuelven el default más de una vez al compilar para web.
  while (candidate && typeof candidate === 'object' && 'default' in candidate) {
    candidate = (candidate as { default: unknown }).default;
  }
  // React.memo y React.forwardRef también son tipos de elemento válidos, aunque
  // JavaScript los representa como objetos en vez de funciones.
  const isReactComponentObject = Boolean(
    candidate && typeof candidate === 'object' && '$$typeof' in candidate,
  );
  return typeof candidate === 'function' || isReactComponentObject
    ? candidate as React.ComponentType<SvgProps>
    : null;
};

const nanoAppearanceKey = (userId: number) => `nano-appearance-v2-${userId}`;

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
    format: 'svg',
    svgComponent: NanoValentin,
  },
  {
    id: 'gladiador',
    label: 'Gladiador',
    description: 'Edición guerrera',
    format: 'svg',
    svgComponent: NanoGladiador,
  },
  {
    id: 'halloween',
    label: 'Halloween',
    description: 'Edición de temporada',
    format: 'svg',
    svgComponent: NanoHalloween,
  },
  {
    id: 'navideno',
    label: 'Navideño',
    description: 'Edición navideña',
    format: 'svg',
    svgComponent: NanoNavideno,
  },
  {
    id: 'patriota',
    label: 'Patriota',
    description: 'Edición nacional',
    format: 'svg',
    svgComponent: NanoPatriota,
  },
];

export const getNanoAppearance = (appearanceId?: string | null) =>
  NANO_APPEARANCES.find((item) => item.id === appearanceId) ?? NANO_APPEARANCES[0]!;

export const loadNanoAppearanceState = async (
  userId?: number | null,
  token?: string | null,
): Promise<NanoAppearanceState> => {
  if (!userId) return { selectedId: 'base', unlockedIds: new Set(['base']) };

  if (token) {
    try {
      const serverState = await fetchNanoAppearanceState(token);
      try {
        await Promise.all([
          AsyncStorage.setItem(nanoAppearanceKey(userId), serverState.selectedId),
          cacheUnlockedNanoAppearanceIds(userId, serverState.unlockedIds),
        ]);
      } catch (error) {
        console.warn('[nano] no se pudo actualizar la caché local', error);
      }
      return serverState;
    } catch (error) {
      console.warn('[nano] usando la configuración local sin conexión', error);
    }
  }

  const savedId = await AsyncStorage.getItem(nanoAppearanceKey(userId));
  const appearanceId = getNanoAppearance(savedId).id;
  const unlockedIds = await loadUnlockedNanoAppearanceIds(userId);
  return {
    selectedId: unlockedIds.has(appearanceId) ? appearanceId : 'base',
    unlockedIds,
  };
};

export const loadNanoAppearanceId = async (
  userId?: number | null,
  token?: string | null,
) => {
  const state = await loadNanoAppearanceState(userId, token);
  return state.selectedId;
};

export const saveNanoAppearanceId = async (
  appearanceId: string,
  userId?: number | null,
  token?: string | null,
) => {
  if (!userId || !token) {
    throw new Error('Se necesita una sesión para guardar la apariencia.');
  }

  const normalizedId = getNanoAppearance(appearanceId).id;
  const serverState = await selectNanoAppearanceOnServer(token, normalizedId);
  try {
    await Promise.all([
      AsyncStorage.setItem(nanoAppearanceKey(userId), serverState.selectedId),
      cacheUnlockedNanoAppearanceIds(userId, serverState.unlockedIds),
    ]);
  } catch (error) {
    console.warn('[nano] la selección se guardó en el servidor, pero no en la caché', error);
  }
  return serverState;
};

export function NanoAppearancePreview({
  appearance,
  size,
}: {
  appearance: NanoAppearance;
  size: number;
}) {
  if (appearance.format === 'png' && appearance.source) {
    return (
      <Image
        source={appearance.source}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        resizeMode="cover"
        accessibilityLabel={appearance.label}
      />
    );
  }

  const SvgComponent = resolveSvgComponent(appearance.svgComponent);
  return (
    <View style={[styles.svgBackground, { width: size, height: size, borderRadius: size / 2 }]}>
      {SvgComponent ? <SvgComponent width={size} height={size} /> : null}
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
