/**
 * @file App movil/GestionSaludExpo/src/screens/LesionCreateScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { LesionFormScreen } from './LesionFormScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'LesionCreate'>;

export function LesionCreateScreen(_props: Props) {
  return <LesionFormScreen mode="create" />;
}
