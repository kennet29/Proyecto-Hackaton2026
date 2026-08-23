/**
 * @file App movil/GestionSaludExpo/src/components/LocationMapPicker.web.tsx
 * @description TypeScript module implementation.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { appColors } from '../theme/colors';

type Props = { latitude?: number | null; longitude?: number | null; onLocationChange: (latitude: number, longitude: number) => void };

export function LocationMapPicker({ latitude, longitude, onLocationChange }: Props) {
  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const data = event.data as { type?: string; latitude?: number; longitude?: number } | undefined;
      if (data?.type !== 'gestion-salud-location' || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') return;
      onLocationChange(data.latitude, data.longitude);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, [onLocationChange]);

  const html = useMemo(() => buildMapHtml(latitude, longitude), [latitude, longitude]);
  return <View style={styles.wrapper}>
    <View style={styles.heading}><Ionicons name="location-outline" size={18} color={appColors.info} /><AppText style={styles.title}>Escoge la ubicación en el mapa</AppText></View>
    {React.createElement('iframe', { title: 'Selector de ubicación de clínica', srcDoc: html, style: styles.frame as unknown as React.CSSProperties })}
    <AppText style={styles.text}>Haz clic sobre el punto exacto. El pin y las coordenadas se actualizarán automáticamente.</AppText>
  </View>;
}

function buildMapHtml(latitude?: number | null, longitude?: number | null) {
  const lat = Number.isFinite(latitude) ? latitude : 12.1364;
  const lng = Number.isFinite(longitude) ? longitude : -86.2514;
  const zoom = latitude != null && longitude != null ? 16 : 7;
  return `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><style>html,body,#map{height:100%;margin:0}body{background:#071120}</style></head><body><div id="map"></div><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>const map=L.map('map').setView([${lat},${lng}],${zoom});L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);let pin=${latitude != null && longitude != null ? `L.marker([${lat},${lng}]).addTo(map)` : 'null'};map.on('click',event=>{const point=event.latlng;if(pin){pin.setLatLng(point)}else{pin=L.marker(point).addTo(map)};window.parent.postMessage({type:'gestion-salud-location',latitude:point.lat,longitude:point.lng},'*')});</script></body></html>`;
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 14, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface, padding: 12 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 9 },
  title: { color: appColors.text, fontSize: 14, fontWeight: '900' },
  frame: { borderWidth: 0, height: 270, width: '100%', borderRadius: 10 },
  text: { color: appColors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 8 },
});
