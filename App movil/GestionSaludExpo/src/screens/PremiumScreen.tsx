import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '../components/AppText';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;
type PlanId = 'mensual' | 'trimestral';
type BankId = 'banpro' | 'bac' | 'lafise';
type PaymentAccount = { banco: BankId; titularCuenta?: string | null; numeroCuenta?: string | null; moneda: string; tipoCambio?: number | null };
type Receipt = { base64: string; name: string; mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' };

const plans: Record<PlanId, { title: string; price: string; period: string; detail: string; saving?: string }> = {
  mensual: {
    title: 'Premium mensual',
    price: 'US$4.99',
    period: 'por mes',
    detail: 'Flexibilidad total; cancela cuando quieras.',
  },
  trimestral: {
    title: 'Premium trimestral',
    price: 'US$12.99',
    period: 'cada 3 meses',
    detail: 'Más tiempo de cuidado con una sola renovación.',
    saving: 'Ahorra un 13%',
  },
};

const paymentMethods: Array<{ id: BankId; name: string; detail: string; color: string; logoUri: string }> = [
  {
    id: 'banpro',
    name: 'Banpro',
    detail: 'Banca en línea o transferencia',
    color: '#FFFFFF',
    logoUri: 'https://images.seeklogo.com/logo-png/40/1/banpro-logo-png_seeklogo-408581.png',
  },
  {
    id: 'bac',
    name: 'BAC',
    detail: 'Pago con tarjeta o banca móvil',
    color: '#FFFFFF',
    logoUri: 'https://images.squarespace-cdn.com/content/v1/5e83d5a6a631ec0bc312acae/1687279930808-M2LS3YAR9CHFSZB3K5CZ/BAC_Credomatic_logo.svg.png',
  },
  {
    id: 'lafise',
    name: 'LAFISE',
    detail: 'Transferencia bancaria segura',
    color: '#FFFFFF',
    logoUri: 'https://images.seeklogo.com/logo-png/24/1/banco-lafise-logo-png_seeklogo-243595.png',
  },
];

const benefits = [
  { icon: 'sparkles-outline' as const, title: 'Análisis avanzado', detail: 'Resumen clínico y tendencias con más detalle.' },
  { icon: 'people-outline' as const, title: 'Más personas asociadas', detail: 'Organiza y acompaña a toda tu familia.' },
  { icon: 'notifications-outline' as const, title: 'Recordatorios inteligentes', detail: 'Prioriza medicamentos, citas y controles importantes.' },
  { icon: 'shield-checkmark-outline' as const, title: 'Historial compartible', detail: 'Comparte tu expediente de forma segura con profesionales.' },
];

export function PremiumScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('trimestral');
  const [selectedBank, setSelectedBank] = useState<BankId>('banpro');
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const plan = useMemo(() => plans[selectedPlan], [selectedPlan]);
  const bank = useMemo(
    () => paymentMethods.find((method) => method.id === selectedBank) ?? paymentMethods[0],
    [selectedBank],
  );
  const account = useMemo(() => paymentAccounts.find((item) => item.banco === selectedBank), [paymentAccounts, selectedBank]);

  useEffect(() => {
    if (!token) return;
    apiFetch('/configuracion-pagos', { headers: buildJsonHeaders(token) })
      .then(async (response) => response.ok ? parseJsonResponse<PaymentAccount[]>(response) : null)
      .then((data) => setPaymentAccounts(Array.isArray(data) ? data : []))
      .catch(() => setPaymentAccounts([]));
  }, [token]);

  const chooseReceipt = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'application/pdf'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 5 * 1024 * 1024) { Alert.alert('Archivo muy grande', 'El comprobante puede pesar hasta 5 MB.'); return; }
    const mimeType = asset.mimeType === 'application/pdf' || asset.mimeType === 'image/png' ? asset.mimeType : 'image/jpeg';
    const webFile = asset.file;
    const base64 = Platform.OS === 'web' && webFile
      ? await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('No se pudo leer el archivo.')); reader.onerror = () => reject(new Error('No se pudo leer el archivo.')); reader.readAsDataURL(webFile); })
      : `data:${mimeType};base64,${await new FileSystem.File(asset.uri).base64()}`;
    setReceipt({ base64, name: asset.name || `recibo-${bank.name}.${mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`, mimeType });
  };

  const handleCheckout = async () => {
    if (!receipt) { Alert.alert('Adjunta el comprobante', 'Sube la factura o recibo de tu transferencia antes de enviar la solicitud.'); return; }
    setSubmitting(true);
    try {
      const response = await apiFetch('/pagos-premium', { method: 'POST', headers: buildJsonHeaders(token), body: JSON.stringify({ banco: selectedBank, plan: selectedPlan, comprobanteBase64: receipt.base64, nombreComprobante: receipt.name, mimeComprobante: receipt.mimeType }) });
      if (!response.ok) throw new Error('No se pudo enviar el comprobante.');
      setReceipt(null);
      Alert.alert('Solicitud enviada', `Tu pago con ${bank.name} quedó pendiente de revisión. Te activaremos Premium al aprobarse.`);
    } catch (error) { Alert.alert('No se envió', error instanceof Error ? error.message : 'Inténtalo nuevamente.'); }
    finally { setSubmitting(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="diamond-outline" size={30} color={appColors.background} />
        </View>
        <AppText style={styles.eyebrow}>GESTIÓN SALUD PREMIUM</AppText>
        <AppText style={styles.title}>Tu salud, con más herramientas.</AppText>
        <AppText style={styles.subtitle}>
          Obtén una experiencia más completa para cuidar tu bienestar y el de las personas que acompañas.
        </AppText>
      </View>

      <View style={styles.benefitsCard}>
        <AppText style={styles.sectionTitle}>Todo lo que incluye Premium</AppText>
        {benefits.map((benefit) => (
          <View key={benefit.title} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Ionicons name={benefit.icon} size={20} color={appColors.info} />
            </View>
            <View style={styles.benefitCopy}>
              <AppText style={styles.benefitTitle}>{benefit.title}</AppText>
              <AppText style={styles.benefitDetail}>{benefit.detail}</AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.plansHeader}>
        <AppText style={styles.sectionTitle}>Elige tu plan</AppText>
        <AppText style={styles.sectionHint}>Puedes cambiar o cancelar cuando lo necesites.</AppText>
      </View>

      {(Object.keys(plans) as PlanId[]).map((planId) => {
        const item = plans[planId];
        const active = selectedPlan === planId;
        return (
          <TouchableOpacity
            key={planId}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            activeOpacity={0.85}
            onPress={() => setSelectedPlan(planId)}
            style={[styles.planCard, active && styles.planCardActive]}
          >
            <View style={styles.planTop}>
              <View style={[styles.radio, active && styles.radioActive]}>
                {active ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={styles.planCopy}>
                <View style={styles.planTitleRow}>
                  <AppText style={styles.planTitle}>{item.title}</AppText>
                  {item.saving ? <AppText style={styles.savingBadge}>{item.saving}</AppText> : null}
                </View>
                <AppText style={styles.planDetail}>{item.detail}</AppText>
              </View>
              <View>
                <AppText style={styles.price}>{item.price}</AppText>
                <AppText style={styles.period}>{item.period}</AppText>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.paymentHeader}>
        <AppText style={styles.sectionTitle}>Método de pago</AppText>
        <AppText style={styles.sectionHint}>Selecciona el banco con el que deseas pagar.</AppText>
      </View>

      <View style={styles.paymentList}>
        {paymentMethods.map((method) => {
          const active = method.id === selectedBank;
          return (
            <TouchableOpacity
              key={method.id}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              activeOpacity={0.85}
              onPress={() => setSelectedBank(method.id)}
              style={[styles.paymentCard, active && styles.paymentCardActive]}
            >
              <View style={[styles.bankLogoSurface, { borderColor: method.color }]}>
                <Image
                  accessibilityLabel={`Logo de ${method.name}`}
                  resizeMode="contain"
                  source={{ uri: method.logoUri }}
                  style={styles.bankLogo}
                />
              </View>
              <View style={styles.paymentCopy}>
                <AppText style={styles.paymentName}>{method.name}</AppText>
                <AppText style={styles.paymentDetail}>{method.detail}</AppText>
              </View>
              <Ionicons
                name={active ? 'checkmark-circle' : 'ellipse-outline'}
                size={23}
                color={active ? appColors.success : appColors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.accountCard}>
        <Ionicons name="business-outline" size={20} color={appColors.success} />
        <View style={styles.accountCopy}>
          <AppText style={styles.accountLabel}>Cuenta para transferencia {bank.name}</AppText>
          <AppText style={styles.accountValue}>{account?.numeroCuenta || 'Cuenta pendiente de configuración'}</AppText>
          {account?.titularCuenta ? <AppText style={styles.accountDetail}>Titular: {account.titularCuenta}</AppText> : null}
          {account?.tipoCambio ? <AppText style={styles.accountDetail}>Tipo de cambio: {account.tipoCambio} {account.moneda}</AppText> : null}
        </View>
      </View>

      <TouchableOpacity onPress={() => void chooseReceipt()} style={styles.receiptButton}>
        <Ionicons name={receipt ? 'document-text' : 'cloud-upload-outline'} size={21} color={appColors.info} />
        <View style={styles.receiptCopy}><AppText style={styles.receiptTitle}>{receipt ? 'Comprobante seleccionado' : 'Subir factura o recibo'}</AppText><AppText style={styles.receiptDetail}>{receipt ? receipt.name : 'Acepta PDF, JPG o PNG de hasta 5 MB.'}</AppText></View>
      </TouchableOpacity>

      <TouchableOpacity disabled={submitting} accessibilityRole="button" activeOpacity={0.85} onPress={() => void handleCheckout()} style={styles.checkoutButton}>
        <AppText style={styles.checkoutText}>{submitting ? 'Enviando comprobante…' : `Enviar pago de ${bank.name}`}</AppText>
        <Ionicons name="arrow-forward" size={20} color={appColors.background} />
      </TouchableOpacity>
      <AppText style={styles.legal}>El cobro se realizará únicamente después de confirmar el pago.</AppText>

      <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.secondaryButton}>
        <AppText style={styles.secondaryText}>Ahora no</AppText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: appColors.background, padding: 20, paddingBottom: 38 },
  hero: { alignItems: 'center', paddingVertical: 22 },
  heroIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: appColors.success, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  eyebrow: { color: appColors.success, fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: appColors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  subtitle: { color: appColors.textSoft, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, maxWidth: 500 },
  benefitsCard: { backgroundColor: appColors.surface, borderColor: appColors.border, borderWidth: 1, borderRadius: 20, padding: 18, gap: 16 },
  sectionTitle: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  benefitRow: { flexDirection: 'row', gap: 12 },
  benefitIcon: { height: 38, width: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.info, '18') },
  benefitCopy: { flex: 1 },
  benefitTitle: { color: appColors.text, fontSize: 15, fontWeight: '800' },
  benefitDetail: { color: appColors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 2 },
  plansHeader: { marginTop: 24, marginBottom: 12 },
  sectionHint: { color: appColors.textMuted, fontSize: 13, marginTop: 3 },
  planCard: { borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface, borderRadius: 18, padding: 16, marginBottom: 12 },
  planCardActive: { borderColor: appColors.success, backgroundColor: colorAlpha(appColors.success, '12') },
  planTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  radio: { height: 22, width: 22, borderRadius: 11, borderWidth: 2, borderColor: appColors.textMuted, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: appColors.success },
  radioDot: { height: 10, width: 10, borderRadius: 5, backgroundColor: appColors.success },
  planCopy: { flex: 1 },
  planTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  planTitle: { color: appColors.text, fontSize: 15, fontWeight: '900' },
  savingBadge: { color: appColors.background, backgroundColor: appColors.success, borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, fontSize: 10, fontWeight: '900' },
  planDetail: { color: appColors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  price: { color: appColors.text, fontSize: 16, fontWeight: '900', textAlign: 'right' },
  period: { color: appColors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  paymentHeader: { marginTop: 12, marginBottom: 12 },
  paymentList: { gap: 9, marginBottom: 8 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface, padding: 13 },
  paymentCardActive: { borderColor: appColors.success, backgroundColor: colorAlpha(appColors.success, '12') },
  bankLogoSurface: { width: 88, height: 44, borderRadius: 10, borderWidth: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 4 },
  bankLogo: { width: '100%', height: '100%' },
  paymentCopy: { flex: 1 },
  paymentName: { color: appColors.text, fontSize: 15, fontWeight: '900' },
  paymentDetail: { color: appColors.textMuted, fontSize: 12, marginTop: 2 },
  accountCard: { flexDirection: 'row', gap: 10, borderRadius: 14, borderWidth: 1, borderColor: colorAlpha(appColors.success, '66'), backgroundColor: colorAlpha(appColors.success, '10'), padding: 13, marginBottom: 8 },
  accountCopy: { flex: 1 },
  accountLabel: { color: appColors.textSoft, fontSize: 12, fontWeight: '800' },
  accountValue: { color: appColors.text, fontSize: 16, fontWeight: '900', marginTop: 3 },
  accountDetail: { color: appColors.textMuted, fontSize: 12, marginTop: 3 },
  receiptButton: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: appColors.info, borderRadius: 14, padding: 13, marginBottom: 8, backgroundColor: colorAlpha(appColors.info, '0D') },
  receiptCopy: { flex: 1 }, receiptTitle: { color: appColors.text, fontSize: 14, fontWeight: '900' }, receiptDetail: { color: appColors.textMuted, fontSize: 12, marginTop: 2 },
  checkoutButton: { minHeight: 52, borderRadius: 15, backgroundColor: appColors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 8 },
  checkoutText: { color: appColors.background, fontSize: 15, fontWeight: '900' },
  legal: { color: appColors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 10 },
  secondaryButton: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 22, marginTop: 4 },
  secondaryText: { color: appColors.info, fontSize: 14, fontWeight: '800' },
});
