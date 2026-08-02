import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';
import { appColors, colorAlpha } from '../theme/colors';
import { AltchaWidget } from '../components/AltchaWidget';

type Props = NativeStackScreenProps<RootStackParamList, 'CambiarContrasena'>;
type ApiMessage = { message?: string; token?: string; expira?: string };
type SecurityQuestion = 'pet' | 'school' | 'city';

const SECURITY_QUESTIONS: Array<{ id: SecurityQuestion; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { id: 'pet', label: '¿Cómo se llamaba tu primera mascota?', icon: 'paw-outline' },
  { id: 'school', label: '¿Cuál fue el nombre de tu primera escuela?', icon: 'school-outline' },
  { id: 'city', label: '¿En qué ciudad naciste?', icon: 'location-outline' },
];

export function CambiarContrasenaScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 980;
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [securityQuestion, setSecurityQuestion] = useState<SecurityQuestion>('pet');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [altchaPayload, setAltchaPayload] = useState('');
  const [altchaResetKey, setAltchaResetKey] = useState(0);
  const [recoveryExpiresAt, setRecoveryExpiresAt] = useState('');

  const handleAltchaPayload = useCallback((payload: string) => setAltchaPayload(payload), []);

  const passwordChecks = useMemo(() => [
    { label: '8 caracteres', valid: newPassword.length >= 8 },
    { label: 'Una mayúscula', valid: /[A-ZÁÉÍÓÚÑ]/.test(newPassword) },
    { label: 'Un número', valid: /\d/.test(newPassword) },
  ], [newPassword]);
  const passwordIsStrong = passwordChecks.every((check) => check.valid);

  const requestCode = async () => {
    const accountEmail = email.trim().toLowerCase();
    if (!accountEmail || !securityAnswer.trim() || !altchaPayload) {
      Alert.alert('Faltan datos', 'Completa tu correo, la respuesta de seguridad y la verificación.');
      return;
    }

    try {
      setSendingCode(true);
      const response = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        headers: buildJsonHeaders(),
        body: JSON.stringify({
          username: accountEmail,
          securityQuestion,
          securityAnswer: securityAnswer.trim(),
          altchaPayload,
        }),
      });
      const body = await parseJsonResponse<ApiMessage>(response);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudo generar el código.');
      if (!body?.token) throw new Error('El servidor no devolvió el código.');
      setCode(body.token);
      setRecoveryExpiresAt(body.expira ?? '');
      setStep(2);
    } catch (error) {
      Alert.alert('No se pudo continuar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
      setAltchaPayload('');
      setAltchaResetKey((current) => current + 1);
    } finally {
      setSendingCode(false);
    }
  };

  const onSubmit = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (!trimmedCode || !newPassword || !confirmPassword) {
      Alert.alert('Faltan datos', 'Completa el código y confirma tu nueva contraseña.');
      return;
    }
    if (!passwordIsStrong) {
      Alert.alert('Contraseña débil', 'Usa al menos 8 caracteres, una mayúscula y un número.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Las contraseñas no coinciden', 'Revisa la confirmación e inténtalo nuevamente.');
      return;
    }

    try {
      setSaving(true);
      const response = await apiFetch('/auth/reset-password', {
        method: 'POST',
        headers: buildJsonHeaders(),
        body: JSON.stringify({ token: trimmedCode, password: newPassword }),
      });
      const body = await parseJsonResponse<ApiMessage>(response);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudo cambiar la contraseña.');
      Alert.alert('Éxito', 'Ya puedes iniciar sesión con tu nueva contraseña.', [
        { text: 'Ir al inicio de sesión', onPress: () => navigation.replace('Login') },
      ]);
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.shell, isDesktop && styles.shellDesktop]}>
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <View style={styles.heroIcon}>
            <Ionicons name="key-outline" size={30} color={appColors.info} />
          </View>
          <AppText style={styles.eyebrow}>SEGURIDAD DE LA CUENTA</AppText>
          <AppText style={styles.heroTitle}>Recupera el acceso de forma segura</AppText>
          <AppText style={styles.heroText}>
            Verificaremos tu identidad antes de permitir que establezcas una contraseña nueva.
          </AppText>
          <View style={styles.trustList}>
            {[
              ['shield-checkmark-outline', 'Verificación protegida contra bots'],
              ['timer-outline', 'Código válido durante 30 minutos'],
              ['lock-closed-outline', 'Tu contraseña nunca se muestra'],
            ].map(([icon, text]) => (
              <View key={text} style={styles.trustItem}>
                <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={18} color={appColors.success} />
                <AppText style={styles.trustText}>{text}</AppText>
              </View>
            ))}
          </View>
        </View>

        <View style={[styles.card, isDesktop && styles.cardDesktop]}>
          <View style={styles.progressHeader}>
            <View style={styles.progressCopy}>
              <AppText style={styles.cardTitle}>{step === 1 ? 'Verifica tu identidad' : 'Crea tu contraseña'}</AppText>
              <AppText style={styles.cardSubtitle}>Paso {step} de 2</AppText>
            </View>
            <View style={styles.steps}>
              {[1, 2].map((item) => (
                <View key={item} style={[styles.stepDot, step >= item && styles.stepDotActive]}>
                  {step > item ? (
                    <Ionicons name="checkmark" size={14} color={appColors.background} />
                  ) : (
                    <AppText style={[styles.stepNumber, step >= item && styles.stepNumberActive]}>{item}</AppText>
                  )}
                </View>
              ))}
            </View>
          </View>

          {step === 1 ? (
            <View style={styles.form}>
              <View>
                <AppText style={styles.label}>Correo de la cuenta</AppText>
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={19} color={appColors.textMuted} />
                  <AppTextInput
                    style={styles.input}
                    placeholder="nombre@correo.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    placeholderTextColor={appColors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              <View>
                <AppText style={styles.label}>Pregunta de seguridad</AppText>
                <View style={styles.questionGrid}>
                  {SECURITY_QUESTIONS.map((question) => {
                    const selected = securityQuestion === question.id;
                    return (
                      <TouchableOpacity
                        key={question.id}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: selected }}
                        style={[styles.questionOption, selected && styles.questionOptionActive]}
                        onPress={() => setSecurityQuestion(question.id)}
                      >
                        <Ionicons name={question.icon} size={18} color={selected ? appColors.info : appColors.textMuted} />
                        <AppText style={[styles.questionText, selected && styles.questionTextActive]}>{question.label}</AppText>
                        <View style={[styles.radio, selected && styles.radioActive]}>
                          {selected ? <View style={styles.radioCenter} /> : null}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View>
                <AppText style={styles.label}>Tu respuesta</AppText>
                <View style={styles.inputWrap}>
                  <Ionicons name="chatbubble-ellipses-outline" size={19} color={appColors.textMuted} />
                  <AppTextInput
                    style={styles.input}
                    placeholder="Escribe la respuesta que registraste"
                    placeholderTextColor={appColors.textMuted}
                    value={securityAnswer}
                    onChangeText={setSecurityAnswer}
                  />
                </View>
                <AppText style={styles.helperText}>No distingue entre mayúsculas, minúsculas ni acentos.</AppText>
              </View>

              <AltchaWidget onPayload={handleAltchaPayload} resetKey={altchaResetKey} />

              <TouchableOpacity
                style={[styles.primaryButton, sendingCode && styles.disabled]}
                onPress={requestCode}
                disabled={sendingCode}
              >
                {sendingCode ? <ActivityIndicator color={appColors.background} /> : (
                  <>
                    <AppText style={styles.primaryButtonText}>Continuar</AppText>
                    <Ionicons name="arrow-forward" size={18} color={appColors.background} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={23} color={appColors.success} />
                <View style={styles.bannerCopy}>
                  <AppText style={styles.successTitle}>Identidad verificada</AppText>
                  <AppText style={styles.successText}>Usa el código generado para {email.trim().toLowerCase()}.</AppText>
                </View>
              </View>

              <View>
                <AppText style={styles.label}>Código de recuperación</AppText>
                <View style={styles.codeInputWrap}>
                  <AppTextInput
                    style={styles.codeInput}
                    placeholder="AB12"
                    placeholderTextColor={appColors.textMuted}
                    value={code}
                    onChangeText={setCode}
                    autoCapitalize="characters"
                    maxLength={4}
                  />
                </View>
                <AppText style={styles.helperText}>
                  {recoveryExpiresAt ? 'Este código expira en 30 minutos.' : 'Ingresa el código de cuatro caracteres.'}
                </AppText>
              </View>

              <View>
                <AppText style={styles.label}>Nueva contraseña</AppText>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={19} color={appColors.textMuted} />
                  <AppTextInput
                    style={styles.input}
                    placeholder="Escribe una contraseña segura"
                    placeholderTextColor={appColors.textMuted}
                    secureTextEntry={!showPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoComplete="new-password"
                  />
                  <TouchableOpacity onPress={() => setShowPassword((current) => !current)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={appColors.textMuted} />
                  </TouchableOpacity>
                </View>
                <View style={styles.requirements}>
                  {passwordChecks.map((check) => (
                    <View key={check.label} style={styles.requirement}>
                      <Ionicons
                        name={check.valid ? 'checkmark-circle' : 'ellipse-outline'}
                        size={15}
                        color={check.valid ? appColors.success : appColors.textMuted}
                      />
                      <AppText style={[styles.requirementText, check.valid && styles.requirementValid]}>{check.label}</AppText>
                    </View>
                  ))}
                </View>
              </View>

              <View>
                <AppText style={styles.label}>Confirma tu contraseña</AppText>
                <View style={styles.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={19} color={appColors.textMuted} />
                  <AppTextInput
                    style={styles.input}
                    placeholder="Repite la contraseña"
                    placeholderTextColor={appColors.textMuted}
                    secureTextEntry={!showPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoComplete="new-password"
                  />
                  {confirmPassword ? (
                    <Ionicons
                      name={newPassword === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={newPassword === confirmPassword ? appColors.success : appColors.accent}
                    />
                  ) : null}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryButton, saving && styles.disabled]}
                onPress={onSubmit}
                disabled={saving}
              >
                {saving ? <ActivityIndicator color={appColors.background} /> : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color={appColors.background} />
                    <AppText style={styles.primaryButtonText}>Actualizar contraseña</AppText>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.backButton} onPress={() => setStep(1)}>
                <Ionicons name="arrow-back" size={17} color={appColors.textMuted} />
                <AppText style={styles.backButtonText}>Cambiar datos de verificación</AppText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  shell: { width: '100%', maxWidth: 760, gap: 18 },
  shellDesktop: { maxWidth: 1180, flexDirection: 'row', alignItems: 'stretch', gap: 28 },
  hero: { padding: 8 },
  heroDesktop: { flex: 0.8, justifyContent: 'center', padding: 38 },
  heroIcon: {
    width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.info, '14'), borderWidth: 1, borderColor: colorAlpha(appColors.info, '44'),
    marginBottom: 24,
  },
  eyebrow: { color: appColors.info, fontSize: 12, fontWeight: '900', letterSpacing: 1.3, marginBottom: 10 },
  heroTitle: { color: appColors.text, fontSize: 38, lineHeight: 44, fontWeight: '900', maxWidth: 460 },
  heroText: { color: appColors.textMuted, fontSize: 16, lineHeight: 25, marginTop: 14, maxWidth: 480 },
  trustList: { marginTop: 30, gap: 14 },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trustText: { color: appColors.textSoft, fontSize: 14 },
  card: {
    padding: 22, borderRadius: 24, borderWidth: 1, borderColor: appColors.border,
    backgroundColor: appColors.surface, shadowColor: '#000', shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25, shadowRadius: 30, elevation: 16,
  },
  cardDesktop: { flex: 1.2, padding: 30 },
  progressHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16,
    paddingBottom: 22, borderBottomWidth: 1, borderBottomColor: appColors.border,
  },
  progressCopy: { flex: 1 },
  cardTitle: { color: appColors.text, fontSize: 23, fontWeight: '900' },
  cardSubtitle: { color: appColors.textMuted, fontSize: 13, marginTop: 4 },
  steps: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepDot: {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted,
  },
  stepDotActive: { backgroundColor: appColors.info, borderColor: appColors.info },
  stepNumber: { color: appColors.textMuted, fontSize: 12, fontWeight: '900' },
  stepNumberActive: { color: appColors.background },
  form: { paddingTop: 22, gap: 18 },
  label: { color: appColors.textSoft, fontSize: 13, fontWeight: '800', marginBottom: 8 },
  inputWrap: {
    minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14,
    borderRadius: 14, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted,
  },
  input: { flex: 1, minWidth: 0, color: appColors.text, fontSize: 15, paddingVertical: 13, outlineStyle: 'none' } as any,
  helperText: { color: appColors.textMuted, fontSize: 11, marginTop: 7 },
  questionGrid: { gap: 8 },
  questionOption: {
    minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13,
    borderRadius: 13, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted,
  },
  questionOptionActive: { borderColor: appColors.info, backgroundColor: colorAlpha(appColors.info, '10') },
  questionText: { flex: 1, color: appColors.textMuted, fontSize: 13, fontWeight: '600' },
  questionTextActive: { color: appColors.text },
  radio: { width: 17, height: 17, borderRadius: 9, borderWidth: 1, borderColor: appColors.textMuted, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: appColors.info },
  radioCenter: { width: 9, height: 9, borderRadius: 5, backgroundColor: appColors.info },
  primaryButton: {
    minHeight: 52, borderRadius: 14, backgroundColor: appColors.info, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 18,
  },
  primaryButtonText: { color: appColors.background, fontSize: 15, fontWeight: '900' },
  disabled: { opacity: 0.6 },
  successBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: colorAlpha(appColors.success, '44'), backgroundColor: colorAlpha(appColors.success, '0D'),
  },
  bannerCopy: { flex: 1 },
  successTitle: { color: appColors.success, fontSize: 14, fontWeight: '900' },
  successText: { color: appColors.textMuted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  codeInputWrap: {
    minHeight: 62, borderRadius: 14, borderWidth: 1, borderColor: appColors.info,
    backgroundColor: colorAlpha(appColors.info, '0A'), alignItems: 'center', justifyContent: 'center',
  },
  codeInput: {
    width: '100%', color: appColors.text, textAlign: 'center', fontSize: 25, fontWeight: '900',
    letterSpacing: 12, paddingVertical: 12, outlineStyle: 'none',
  } as any,
  requirements: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 9 },
  requirement: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  requirementText: { color: appColors.textMuted, fontSize: 11 },
  requirementValid: { color: appColors.success },
  backButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  backButtonText: { color: appColors.textMuted, fontSize: 13, fontWeight: '700' },
});
