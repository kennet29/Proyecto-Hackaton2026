import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText } from '../components/AppText';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Premium'>;
type PlanId = 'mensual' | 'anual';

const plans: Record<PlanId, { title: string; price: string; period: string; detail: string; saving?: string }> = {
  mensual: {
    title: 'Premium mensual',
    price: 'US$4.99',
    period: 'por mes',
    detail: 'Flexibilidad total; cancela cuando quieras.',
  },
  anual: {
    title: 'Premium anual',
    price: 'US$49.99',
    period: 'por año',
    detail: 'La mejor opción para acompañar tu salud todo el año.',
    saving: 'Ahorra un 16%',
  },
};

const benefits = [
  { icon: 'sparkles-outline' as const, title: 'Análisis avanzado', detail: 'Resumen clínico y tendencias con más detalle.' },
  { icon: 'people-outline' as const, title: 'Más personas asociadas', detail: 'Organiza y acompaña a toda tu familia.' },
  { icon: 'notifications-outline' as const, title: 'Recordatorios inteligentes', detail: 'Prioriza medicamentos, citas y controles importantes.' },
  { icon: 'shield-checkmark-outline' as const, title: 'Historial compartible', detail: 'Comparte tu expediente de forma segura con profesionales.' },
];

export function PremiumScreen({ navigation }: Props) {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('anual');
  const plan = useMemo(() => plans[selectedPlan], [selectedPlan]);

  const handleCheckout = () => {
    Alert.alert(
      'Compra Premium',
      `Seleccionaste ${plan.title}. La pasarela de pago se conectará en este paso antes de activar la suscripción.`,
    );
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

      <TouchableOpacity accessibilityRole="button" activeOpacity={0.85} onPress={handleCheckout} style={styles.checkoutButton}>
        <AppText style={styles.checkoutText}>Continuar con {plan.title}</AppText>
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
  checkoutButton: { minHeight: 52, borderRadius: 15, backgroundColor: appColors.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 8 },
  checkoutText: { color: appColors.background, fontSize: 15, fontWeight: '900' },
  legal: { color: appColors.textMuted, fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 10 },
  secondaryButton: { alignSelf: 'center', paddingVertical: 14, paddingHorizontal: 22, marginTop: 4 },
  secondaryText: { color: appColors.info, fontSize: 14, fontWeight: '800' },
});
