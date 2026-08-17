import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText, AppTextInput } from '../components/AppText';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors } from '../theme/colors';
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'AdminPagos'>;
type PaymentConfig = { banco: 'banpro' | 'bac' | 'lafise'; titularCuenta?: string | null; numeroCuenta?: string | null; moneda: string; tipoCambio?: number | null; activo: boolean };
type Draft = { titularCuenta: string; numeroCuenta: string; moneda: string; tipoCambio: string };
const names: Record<PaymentConfig['banco'], string> = { banpro: 'Banpro', bac: 'BAC', lafise: 'LAFISE' };

export function AdminPagosScreen({ navigation }: Props) {
  const { token, user } = useAuth();
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await apiFetch('/configuracion-pagos/admin', { headers: buildJsonHeaders(token) });
      const body = await parseJsonResponse<PaymentConfig[]>(response);
      if (!response.ok || !body) throw new Error('No se pudo cargar la configuración de pagos.');
      setConfigs(body);
      setDrafts(Object.fromEntries(body.map((item) => [item.banco, { titularCuenta: item.titularCuenta ?? '', numeroCuenta: item.numeroCuenta ?? '', moneda: item.moneda ?? 'NIO', tipoCambio: item.tipoCambio?.toString() ?? '' }])));
    } catch (error) { Alert.alert('Pagos Premium', error instanceof Error ? error.message : 'No se pudo cargar la configuración.'); }
    finally { setLoading(false); }
  }, [token]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const update = (bank: string, key: keyof Draft, value: string) => setDrafts((current) => ({ ...current, [bank]: { ...current[bank], [key]: value } }));
  const save = async (bank: PaymentConfig['banco']) => {
    const draft = drafts[bank];
    const rate = draft.tipoCambio.trim() ? Number(draft.tipoCambio) : null;
    if (rate !== null && (!Number.isFinite(rate) || rate <= 0)) { Alert.alert('Tipo de cambio inválido', 'Ingresa un número mayor que cero.'); return; }
    setSaving(bank);
    try {
      const response = await apiFetch(`/configuracion-pagos/${bank}`, { method: 'PATCH', headers: buildJsonHeaders(token), body: JSON.stringify({ titularCuenta: draft.titularCuenta.trim() || null, numeroCuenta: draft.numeroCuenta.trim() || null, moneda: draft.moneda.trim() || 'NIO', tipoCambio: rate }) });
      if (!response.ok) throw new Error('No se pudo guardar la configuración.');
      Alert.alert('Guardado', `La cuenta de ${names[bank]} fue actualizada.`); await load();
    } catch (error) { Alert.alert('No se guardó', error instanceof Error ? error.message : 'Inténtalo nuevamente.'); }
    finally { setSaving(null); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={appColors.info} /></View>;
  return <ScrollView contentContainerStyle={styles.container}>
    <View style={styles.hero}><Ionicons name="card-outline" size={26} color={appColors.success} /><View><AppText style={styles.title}>Pagos Premium</AppText><AppText style={styles.subtitle}>Configura las cuentas bancarias y el tipo de cambio.</AppText></View></View>
    {configs.map((item) => { const draft = drafts[item.banco]; return <View key={item.banco} style={styles.card}>
      <AppText style={styles.cardTitle}>{names[item.banco]}</AppText>
      <AppText style={styles.label}>Titular de la cuenta</AppText><AppTextInput value={draft?.titularCuenta ?? ''} onChangeText={(value) => update(item.banco, 'titularCuenta', value)} placeholder="Ej. Gestión Salud" placeholderTextColor={appColors.textMuted} style={styles.input} />
      <AppText style={styles.label}>Número de cuenta</AppText><AppTextInput value={draft?.numeroCuenta ?? ''} onChangeText={(value) => update(item.banco, 'numeroCuenta', value)} placeholder="Cuenta para transferencias" placeholderTextColor={appColors.textMuted} style={styles.input} />
      <View style={styles.row}><View style={styles.half}><AppText style={styles.label}>Moneda</AppText><AppTextInput value={draft?.moneda ?? 'NIO'} onChangeText={(value) => update(item.banco, 'moneda', value.toUpperCase())} style={styles.input} /></View><View style={styles.half}><AppText style={styles.label}>Tipo de cambio</AppText><AppTextInput value={draft?.tipoCambio ?? ''} onChangeText={(value) => update(item.banco, 'tipoCambio', value)} keyboardType="decimal-pad" placeholder="Ej. 36.62" placeholderTextColor={appColors.textMuted} style={styles.input} /></View></View>
      <TouchableOpacity onPress={() => save(item.banco)} disabled={saving === item.banco} style={styles.save}>{saving === item.banco ? <ActivityIndicator color={appColors.background} /> : <AppText style={styles.saveText}>Guardar {names[item.banco]}</AppText>}</TouchableOpacity>
    </View>; })}
    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}><AppText style={styles.backText}>Volver</AppText></TouchableOpacity>
  </ScrollView>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.background }, container: { padding: 18, gap: 14, backgroundColor: appColors.background }, hero: { flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 4 }, title: { color: appColors.text, fontSize: 23, fontWeight: '900' }, subtitle: { color: appColors.textMuted, fontSize: 13, marginTop: 2 }, card: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 16, padding: 15 }, cardTitle: { color: appColors.text, fontSize: 18, fontWeight: '900', marginBottom: 12 }, label: { color: appColors.textSoft, fontSize: 12, fontWeight: '800', marginBottom: 5, marginTop: 8 }, input: { minHeight: 44, borderWidth: 1, borderColor: appColors.borderStrong, borderRadius: 10, paddingHorizontal: 12, color: appColors.text, backgroundColor: appColors.backgroundMuted }, row: { flexDirection: 'row', gap: 10 }, half: { flex: 1 }, save: { backgroundColor: appColors.success, minHeight: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 16 }, saveText: { color: appColors.background, fontWeight: '900' }, back: { alignSelf: 'center', padding: 14 }, backText: { color: appColors.info, fontWeight: '800' },
});
