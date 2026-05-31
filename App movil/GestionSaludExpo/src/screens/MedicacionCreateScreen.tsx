import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { MedicacionFormScreen } from './MedicacionFormScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicacionCreate'>;

export function MedicacionCreateScreen({ route }: Props) {
  return <MedicacionFormScreen mode="create" initialMedication={route.params?.medicacion} />;
}
