import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { appColors } from '../theme/colors';

type Props = { latitude?: number | null; longitude?: number | null; onLocationChange: (latitude: number, longitude: number) => void };

export function LocationMapPicker({ latitude, longitude }: Props) {
  const target = latitude != null && longitude != null ? `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}` : 'https://www.openstreetmap.org/#map=7/12.2/-86.3';
  return <TouchableOpacity style={styles.wrapper} onPress={() => void Linking.openURL(target)}>
    <View style={styles.icon}><Ionicons name="map-outline" size={28} color={appColors.info} /></View>
    <View style={styles.copy}><AppText style={styles.title}>Selecciona la ubicación desde el mapa</AppText><AppText style={styles.text}>En web puedes abrir OpenStreetMap para consultar la dirección. En la app móvil toca el mapa para guardar el pin exacto.</AppText></View>
    <Ionicons name="open-outline" size={20} color={appColors.info} />
  </TouchableOpacity>;
}

const styles = StyleSheet.create({
  wrapper: { minHeight: 94, borderRadius: 14, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 14 },
  icon: { height: 46, width: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#29B6FF1A' },
  copy: { flex: 1 }, title: { color: appColors.text, fontSize: 14, fontWeight: '900' }, text: { color: appColors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
});
