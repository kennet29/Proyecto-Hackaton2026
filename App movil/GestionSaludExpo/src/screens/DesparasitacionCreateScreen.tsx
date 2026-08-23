/**
 * @file App movil/GestionSaludExpo/src/screens/DesparasitacionCreateScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { DesparasitacionScreen } from './DesparasitacionScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'DesparasitacionCreate'>;

export function DesparasitacionCreateScreen(_props: Props) {
  return <DesparasitacionScreen mode="create" />;
}
