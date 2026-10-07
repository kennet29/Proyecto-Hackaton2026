/**
 * @file App movil/GestionSaludExpo/src/screens/PremiumScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '../components/AppText';
import { NanoSectionIllustration, type NanoSection } from '../components/NanoSectionIllustration';
import { RootStackParamList } from '../navigation/types';
import { colorAlpha } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';
import { readUriAsDataUrl } from '../utils/fileBase64';
import { AppColors, useAppColors } from '../theme/useAppColors';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;
type PlanId = 'gratis' | 'premium' | 'plus' | 'publicidad';
type BankId = 'banpro' | 'bac' | 'lafise';
type PaymentAccount = { banco: BankId; titularCuenta?: string | null; numeroCuenta?: string | null; moneda: string; tipoCambio?: number | null };
type Receipt = { base64: string; name: string; mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' };

type PlanOption = {
  title: string;
  description: string;
  price: string;
  period: string;
  nano: NanoSection;
  benefits: string[];
  audience?: string[];
  cta: string;
  featured?: boolean;
};

const plans: Record<PlanId, PlanOption> = {
  gratis: {
    title: 'Nano Gratis',
    description: 'Para comenzar a cuidar tu salud',
    price: 'C$0.00',
    period: 'Gratis',
    nano: 'plan-gratis',
    benefits: [
      'Registra hasta 3 personas',
      '1 consulta diaria con la IA de Nano Bienestar',
      'Herramientas esenciales para el seguimiento de tu salud',
    ],
    cta: 'Comenzar gratis',
  },
  premium: {
    title: 'Nano Free Premium',
    description: 'Para quienes quieren llevar su cuidado al siguiente nivel',
    price: 'C$130.00',
    period: 'por usuario',
    nano: 'plan-freemium',
    benefits: [
      'Registro ilimitado de personas',
      'Acceso a todas las funcionalidades de la aplicación',
      'Uso ilimitado de las opciones de IA disponibles',
      'Sin anuncios publicitarios',
    ],
    cta: 'Elegir Premium',
    featured: true,
  },
  plus: {
    title: 'Plan Plus',
    description: 'Para profesionales de la salud',
    price: 'C$150.00',
    period: 'por profesional',
    nano: 'plan-plus',
    benefits: [
      'Registra y gestiona la información de tus pacientes',
      'Accede a los historiales de salud de tus pacientes',
      'Facilita el seguimiento y organización de la información',
      'Los usuarios pueden agendar citas contigo directamente desde la web',
    ],
    cta: 'Soy profesional de salud',
  },
  publicidad: {
    title: 'Nano Publicidad',
    description: 'Haz crecer tu presencia dentro de Nica Prime',
    price: 'C$450.00',
    period: 'por servicio publicitario',
    nano: 'plan-publicidad',
    audience: [
      '🩺 Médicos y profesionales de la salud',
      '🏥 Clínicas y laboratorios clínicos',
      '🏋️ Gimnasios y marcas deportivas',
      '💊 Tiendas de suplementos médicos y alimenticios',
      '💚 Farmacias y otros negocios relacionados con salud y bienestar',
    ],
    benefits: [
      'Aparece en el mapa de profesionales y servicios de salud de Nica Prime',
      'Publicita tus servicios dentro de Nica Prime',
      'Ofrece tus productos en la Nano Tienda',
      'Conecta tu negocio con personas interesadas en el cuidado de su salud y bienestar',
      'Aumenta la visibilidad de tu marca dentro de la plataforma',
    ],
    cta: 'Publicitar mi negocio',
  },
};

const planOrder: PlanId[] = ['gratis', 'premium', 'plus', 'publicidad'];

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

export function PremiumScreen({ navigation }: Props) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { token } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('premium');
  const [selectedBank, setSelectedBank] = useState<BankId>('banpro');
  const [paymentAccounts, setPaymentAccounts] = useState<PaymentAccount[]>([]);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [submitting, setSubmitting] = useState(false);
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

  const handlePlanAction = (planId: PlanId) => {
    setSelectedPlan(planId);
    if (planId === 'gratis') {
      navigation.goBack();
    } else if (planId === 'plus' || planId === 'publicidad') {
      navigation.navigate('Contacto');
    }
  };

  const chooseReceipt = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/jpeg', 'image/png', 'application/pdf'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.size && asset.size > 5 * 1024 * 1024) { Alert.alert('Archivo muy grande', 'El comprobante puede pesar hasta 5 MB.'); return; }
    const mimeType = asset.mimeType === 'application/pdf' || asset.mimeType === 'image/png' ? asset.mimeType : 'image/jpeg';
    const webFile = asset.file;
    const base64 = Platform.OS === 'web' && webFile
      ? await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('No se pudo leer el archivo.')); reader.onerror = () => reject(new Error('No se pudo leer el archivo.')); reader.readAsDataURL(webFile); })
      : await readUriAsDataUrl(asset.uri, mimeType);
    setReceipt({ base64, name: asset.name || `recibo-${bank.name}.${mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`, mimeType });
  };

  const handleCheckout = async () => {
    if (!receipt) { Alert.alert('Adjunta el comprobante', 'Sube la factura o recibo de tu transferencia antes de enviar la solicitud.'); return; }
    setSubmitting(true);
    try {
      const response = await apiFetch('/pagos-premium', { method: 'POST', headers: buildJsonHeaders(token), body: JSON.stringify({ banco: selectedBank, plan: 'mensual', comprobanteBase64: receipt.base64, nombreComprobante: receipt.name, mimeComprobante: receipt.mimeType }) });
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
          <NanoSectionIllustration section="planes-pago" size={76} />
        </View>
        <AppText style={styles.eyebrow}>PLANES NICA PRIME</AppText>
        <AppText style={styles.title}>Elige el plan ideal para ti</AppText>
        <AppText style={styles.subtitle}>
          Encuentra la opción que mejor se adapte a tus necesidades y empieza a cuidar tu salud con Nica Prime.
        </AppText>
      </View>

      <View style={styles.planList}>
      {planOrder.map((planId) => {
        const item = plans[planId];
        const active = selectedPlan === planId;
        return (
          <View key={planId} style={[styles.planCard, active && styles.planCardActive, item.featured && styles.featuredCard]}>
            {item.featured ? (
              <View style={styles.popularBadge}>
                <AppText style={styles.popularText}>🏆 MÁS ELEGIDO</AppText>
              </View>
            ) : null}
            <View style={styles.planNano}>
              <NanoSectionIllustration section={item.nano} size={94} />
            </View>
            <AppText style={styles.planTitle}>{item.title}</AppText>
            <AppText style={styles.planDescription}>{item.description}</AppText>
            <View style={styles.priceRow}>
              <AppText style={styles.price}>{item.price}</AppText>
              <AppText style={styles.period}>{item.period}</AppText>
            </View>
            {item.audience ? (
              <View style={styles.audienceBox}>
                <AppText style={styles.audienceTitle}>Dirigido a:</AppText>
                {item.audience.map((audience) => (
                  <AppText key={audience} style={styles.audienceItem}>{audience}</AppText>
                ))}
              </View>
            ) : null}
            <View style={styles.benefitList}>
              {item.benefits.map((benefit) => (
                <View key={benefit} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                  <AppText style={styles.benefitText}>{benefit}</AppText>
                </View>
              ))}
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              activeOpacity={0.85}
              onPress={() => handlePlanAction(planId)}
              style={[styles.planButton, item.featured && styles.featuredButton]}
            >
              <AppText style={[styles.planButtonText, item.featured && styles.featuredButtonText]}>{item.cta}</AppText>
              <Ionicons name="arrow-forward" size={18} color={item.featured ? colors.onAccent : colors.info} />
            </TouchableOpacity>
          </View>
        );
      })}
      </View>

      {selectedPlan === 'premium' ? (
      <View style={styles.paymentSection}>
      <View style={styles.paymentHeader}>
        <AppText style={styles.sectionTitle}>Completa tu suscripción Premium</AppText>
        <AppText style={styles.sectionHint}>Selecciona el banco con el que deseas pagar C$130.00.</AppText>
      </View>

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
                color={active ? colors.success : colors.textMuted}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.accountCard}>
        <Ionicons name="business-outline" size={20} color={colors.success} />
        <View style={styles.accountCopy}>
          <AppText style={styles.accountLabel}>Cuenta para transferencia {bank.name}</AppText>
          <AppText style={styles.accountValue}>{account?.numeroCuenta || 'Cuenta pendiente de configuración'}</AppText>
          {account?.titularCuenta ? <AppText style={styles.accountDetail}>Titular: {account.titularCuenta}</AppText> : null}
          {account?.tipoCambio ? <AppText style={styles.accountDetail}>Tipo de cambio: {account.tipoCambio} {account.moneda}</AppText> : null}
        </View>
      </View>

      <TouchableOpacity onPress={() => void chooseReceipt()} style={styles.receiptButton}>
        <Ionicons name={receipt ? 'document-text' : 'cloud-upload-outline'} size={21} color={colors.info} />
        <View style={styles.receiptCopy}><AppText style={styles.receiptTitle}>{receipt ? 'Comprobante seleccionado' : 'Subir factura o recibo'}</AppText><AppText style={styles.receiptDetail}>{receipt ? receipt.name : 'Acepta PDF, JPG o PNG de hasta 5 MB.'}</AppText></View>
      </TouchableOpacity>

      <TouchableOpacity disabled={submitting} accessibilityRole="button" activeOpacity={0.85} onPress={() => void handleCheckout()} style={styles.checkoutButton}>
        <AppText style={styles.checkoutText}>{submitting ? 'Enviando comprobante…' : `Enviar pago de ${bank.name}`}</AppText>
        <Ionicons name="arrow-forward" size={20} color={colors.onAccent} />
      </TouchableOpacity>
      <AppText style={styles.legal}>El cobro se realizará únicamente después de confirmar el pago.</AppText>
      </View>
      ) : null}

      <View style={styles.closingCard}>
        <AppText style={styles.closingText}>Elige cómo quieres cuidar tu salud.</AppText>
        <AppText style={styles.closingTitle}>Eleva tu salud, vive tu Prime.</AppText>
      </View>

      <TouchableOpacity accessibilityRole="button" onPress={() => navigation.goBack()} style={styles.secondaryButton}>
        <AppText style={styles.secondaryText}>Ahora no</AppText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: colors.background, padding: 20, paddingBottom: 38 },
  hero: { alignItems: 'center', paddingVertical: 22 },
  heroIcon: { width: 82, height: 82, borderRadius: 41, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  eyebrow: { color: colors.success, fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  title: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  subtitle: { color: colors.textSoft, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10, maxWidth: 500 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  sectionHint: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  planList: { gap: 16 },
  planCard: { position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 22, padding: 18 },
  planCardActive: { borderColor: colors.success },
  featuredCard: { borderColor: colors.info, backgroundColor: colorAlpha(colors.info, '0A') },
  popularBadge: { position: 'absolute', top: 14, right: 14, zIndex: 2, borderRadius: 999, backgroundColor: colors.info, paddingHorizontal: 10, paddingVertical: 6 },
  popularText: { color: colors.onAccent, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  planNano: { alignItems: 'center', marginBottom: 10 },
  planTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' },
  planDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 5 },
  priceRow: { alignItems: 'center', marginTop: 14, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: colors.border },
  price: { color: colors.text, fontSize: 29, lineHeight: 34, fontWeight: '900' },
  period: { color: colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  audienceBox: { marginTop: 14, borderRadius: 14, backgroundColor: colorAlpha(colors.info, '0D'), padding: 13, gap: 7 },
  audienceTitle: { color: colors.text, fontSize: 13, fontWeight: '900' },
  audienceItem: { color: colors.textSoft, fontSize: 12, lineHeight: 18 },
  benefitList: { gap: 10, marginTop: 15 },
  benefitRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 9 },
  benefitText: { flex: 1, color: colors.textSoft, fontSize: 13, lineHeight: 19 },
  planButton: { minHeight: 48, marginTop: 17, borderRadius: 14, borderWidth: 1, borderColor: colors.info, backgroundColor: colorAlpha(colors.info, '0D'), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  planButtonText: { color: colors.info, fontSize: 14, fontWeight: '900', textAlign: 'center' },
  featuredButton: { borderColor: colors.success, backgroundColor: colors.success },
  featuredButtonText: { color: colors.onAccent },
  paymentSection: { marginTop: 24, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 16 },
  paymentHeader: { marginTop: 12, marginBottom: 12 },
  paymentList: { gap: 9, marginBottom: 8 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: 13 },
  paymentCardActive: { borderColor: colors.success, backgroundColor: colorAlpha(colors.success, '12') },
  bankLogoSurface: { width: 88, height: 44, borderRadius: 10, borderWidth: 1, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 4 },
  bankLogo: { width: '100%', height: '100%' },
  paymentCopy: { flex: 1 },
  paymentName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  paymentDetail: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  accountCard: { flexDirection: 'row', gap: 10, borderRadius: 14, borderWidth: 1, borderColor: colorAlpha(colors.success, '66'), backgroundColor: colorAlpha(colors.success, '10'), padding: 13, marginBottom: 8 },
  accountCopy: { flex: 1 },
  accountLabel: { color: colors.textSoft, fontSize: 12, fontWeight: '800' },
  accountValue: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 3 },
  accountDetail: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  receiptButton: { flexDirection: 'row', alignItems: 'center', gap: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.info, borderRadius: 14, padding: 13, marginBottom: 8, backgroundColor: colorAlpha(colors.info, '0D') },
  receiptCopy: { flex: 1 }, receiptTitle: { color: colors.text, fontSize: 14, fontWeight: '900' }, receiptDetail: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  checkoutButton: { minHeight: 52, borderRadius: 15, backgroundColor: colors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 8 },
  checkoutText: { color: colors.onAccent, fontSize: 15, fontWeight: '900' },
  legal: { color: colors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 10 },
  closingCard: { marginTop: 20, borderRadius: 18, backgroundColor: colorAlpha(colors.success, '12'), padding: 18, alignItems: 'center' },
  closingText: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  closingTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  secondaryButton: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 22, marginTop: 4 },
  secondaryText: { color: colors.info, fontSize: 14, fontWeight: '800' },
});
