/**
 * @file App movil/GestionSaludExpo/src/screens/AlergiaCreateScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { AlergiaScreen } from './AlergiaScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'AlergiaCreate'>;

export function AlergiaCreateScreen(_props: Props) {
  return <AlergiaScreen mode="create" />;
}
