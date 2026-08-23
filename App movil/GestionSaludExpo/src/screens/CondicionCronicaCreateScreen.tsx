/**
 * @file App movil/GestionSaludExpo/src/screens/CondicionCronicaCreateScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { CondicionCronicaFormScreen } from './CondicionCronicaFormScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'CondicionCronicaCreate'>;

export function CondicionCronicaCreateScreen({ route }: Props) {
  return (
    <CondicionCronicaFormScreen
      mode="create"
      selectedTipoCondicion={route.params?.selectedTipoCondicion}
      typedConditionName={route.params?.typedConditionName}
    />
  );
}
