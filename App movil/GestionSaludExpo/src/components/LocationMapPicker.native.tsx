/**
 * @file App movil/GestionSaludExpo/src/components/LocationMapPicker.native.tsx
 * @description TypeScript module implementation.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { AppText } from './AppText';
import { appColors } from '../theme/colors';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  onLocationChange: (latitude: number, longitude: number) => void;
};

const NICARAGUA_CENTER = { latitude: 12.1364, longitude: -86.2514 };

export function LocationMapPicker({ latitude, longitude, onLocationChange }: Props) {
  const region = useMemo<Region>(() => ({
    latitude: latitude ?? NICARAGUA_CENTER.latitude,
    longitude: longitude ?? NICARAGUA_CENTER.longitude,
    latitudeDelta: latitude ? 0.018 : 3.2,
    longitudeDelta: longitude ? 0.018 : 3.2,
  }), [latitude, longitude]);
  const hasPin = typeof latitude === 'number' && typeof longitude === 'number';

  return <View style={styles.wrapper}>
    <MapView style={styles.map} initialRegion={region} region={hasPin ? region : undefined} onPress={(event) => onLocationChange(event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude)}>
      {hasPin ? <Marker coordinate={{ latitude: latitude!, longitude: longitude! }} draggable onDragEnd={(event) => onLocationChange(event.nativeEvent.coordinate.latitude, event.nativeEvent.coordinate.longitude)} title="Ubicación de la clínica" description="Arrastra el pin para ajustar la ubicación" /> : null}
    </MapView>
    <View style={styles.hint}><AppText style={styles.hintText}>{hasPin ? 'Toca el mapa o arrastra el pin para ajustar la ubicación.' : 'Toca el mapa para colocar la ubicación de la clínica.'}</AppText></View>
  </View>;
}

const styles = StyleSheet.create({
  wrapper: { overflow: 'hidden', borderRadius: 14, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted },
  map: { height: 210, width: '100%' },
  hint: { paddingHorizontal: 11, paddingVertical: 8, backgroundColor: appColors.surface },
  hintText: { color: appColors.textMuted, fontSize: 12, lineHeight: 16 },
});
