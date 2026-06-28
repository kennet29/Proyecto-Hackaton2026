import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'NanoConsejero'>;

type FoodGoal = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
};

type CapturedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

type AnalyzeMealResponse = {
  feedback?: string;
  wordCount?: number;
  goalLabel?: string;
};

const FOOD_GOALS: FoodGoal[] = [
  {
    id: 'weight-loss',
    label: 'Bajar de peso',
    description: 'Quiero revisar si esta comida me ayuda a perder grasa sin quedarme con hambre.',
    icon: 'trending-down-outline',
    accent: appColors.info,
  },
  {
    id: 'diabetes',
    label: 'Diabetes',
    description: 'Necesito validar si esta opcion es conveniente para control de azucar.',
    icon: 'water-outline',
    accent: appColors.accent,
  },
  {
    id: 'muscle-gain',
    label: 'Subir de peso o musculo',
    description: 'Busco evaluar si la comida me aporta energia y proteina para ganar masa.',
    icon: 'barbell-outline',
    accent: appColors.success,
  },
  {
    id: 'pregnancy',
    label: 'Embarazo',
    description: 'Quiero revisar si esta comida es adecuada durante el embarazo.',
    icon: 'flower-outline',
    accent: '#FDBA74',
  },
];

const DIALOG_TEXT =
  'Toma una foto de tu comida, elige el objetivo y Nano te devolvera una recomendacion breve con mejoras o confirmacion si vas bien.';

function NanoRobotIcon() {
  return (
    <View style={styles.robotShell}>
      <View style={styles.robotFlame} />
      <View style={styles.robotHead}>
        <View style={styles.robotFace}>
          <View style={styles.robotEye} />
          <View style={styles.robotMouth} />
          <View style={styles.robotEye} />
        </View>
      </View>
      <View style={styles.robotEarLeft} />
      <View style={styles.robotEarRight} />
      <View style={styles.robotBody} />
      <View style={styles.robotFootLeft} />
      <View style={styles.robotFootRight} />
    </View>
  );
}

export function NanoConsejeroScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [selectedGoalId, setSelectedGoalId] = useState<string>(FOOD_GOALS[0].id);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisWordCount, setAnalysisWordCount] = useState<number | null>(null);

  const selectedGoal = useMemo(
    () => FOOD_GOALS.find((goal) => goal.id === selectedGoalId) ?? FOOD_GOALS[0],
    [selectedGoalId],
  );

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('No disponible', 'La captura con camara se recomienda desde Android o iOS.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la camara para fotografiar tu comida.');
      return;
    }

    setCapturing(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.6,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? `meal-${Date.now()}.jpg`,
      });
      setAnalysisText(null);
      setAnalysisWordCount(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo abrir la camara.');
    } finally {
      setCapturing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!photo) {
      Alert.alert('Falta la foto', 'Primero toma una foto de tu comida.');
      return;
    }

    if (!token) {
      Alert.alert('Sesion requerida', 'Necesitas iniciar sesion para usar Nano.');
      return;
    }

    setSubmitting(true);
    setAnalysisText(null);
    setAnalysisWordCount(null);

    try {
      const file = new FileSystem.File(photo.uri);
      const imageBase64 = await file.base64();

      const response = await fetch(`${API_URL}/nano/analyze-meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goalKey: selectedGoal.id,
          goalLabel: selectedGoal.label,
          imageBase64,
          imageMimeType: photo.mimeType,
          fileName: photo.fileName,
        }),
      });

      const payload = (await response.json().catch(() => null)) as AnalyzeMealResponse | null;
      if (!response.ok) {
        const message =
          (payload as { message?: string } | null)?.message ?? 'No se pudo analizar la imagen.';
        throw new Error(message);
      }

      if (!payload?.feedback) {
        throw new Error('Nano no devolvio una recomendacion util.');
      }

      setAnalysisText(payload.feedback);
      setAnalysisWordCount(payload.wordCount ?? null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo analizar la comida.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Asistente IA</Text>
            <Text style={styles.title}>Nano</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={20} color={appColors.textSoft} />
          </Pressable>
        </View>

        <View style={styles.speechBubble}>
          <View style={styles.speechHeader}>
            <View style={styles.speechIndicator} />
            <Text style={styles.speechTitle}>Analisis de comida</Text>
          </View>
          <Text style={styles.speechText}>{DIALOG_TEXT}</Text>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroIconWrap}>
            <NanoRobotIcon />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Foto + objetivo + recomendacion</Text>
            <Text style={styles.heroSubtitle}>
              Nano usa la imagen de tu plato y el contexto nutricional seleccionado para darte una respuesta breve.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Para que quieres evaluar la comida</Text>
          <Text style={styles.sectionSubtitle}>
            Selecciona el perfil que Nano debe considerar al revisar tu plato.
          </Text>

          <View style={styles.goalList}>
            {FOOD_GOALS.map((goal) => {
              const isActive = goal.id === selectedGoalId;
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    isActive && {
                      borderColor: goal.accent,
                      backgroundColor: colorAlpha(goal.accent, '18'),
                    },
                  ]}
                  activeOpacity={0.9}
                  onPress={() => setSelectedGoalId(goal.id)}
                >
                  <View style={[styles.goalIcon, { backgroundColor: colorAlpha(goal.accent, '22') }]}>
                    <Ionicons name={goal.icon} size={20} color={goal.accent} />
                  </View>
                  <View style={styles.goalContent}>
                    <Text style={styles.goalLabel}>{goal.label}</Text>
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                  </View>
                  <Ionicons
                    name={isActive ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isActive ? goal.accent : appColors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Toma la foto de tu comida</Text>
          <Text style={styles.sectionSubtitle}>
            Usa la camara del telefono para capturar el plato que quieres evaluar.
          </Text>

          <View style={styles.cameraCard}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={styles.foodPreview} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderWrap}>
                <View style={styles.placeholderIcon}>
                  <Ionicons name="camera-outline" size={34} color={appColors.info} />
                </View>
                <Text style={styles.placeholderTitle}>Sin foto todavia</Text>
                <Text style={styles.placeholderText}>
                  Cuando tomes la foto aparecera aqui la vista previa de tu comida.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.cameraActions}>
            <TouchableOpacity
              style={[styles.primaryButton, capturing && styles.buttonDisabled]}
              activeOpacity={0.9}
              onPress={() => void handleTakePhoto()}
              disabled={capturing}
            >
              <Ionicons name="camera" size={18} color={appColors.text} />
              <Text style={styles.primaryButtonText}>
                {capturing ? 'Abriendo camara...' : photo ? 'Tomar otra foto' : 'Tomar foto'}
              </Text>
            </TouchableOpacity>

            {photo ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.9}
                onPress={() => {
                  setPhoto(null);
                  setAnalysisText(null);
                  setAnalysisWordCount(null);
                }}
              >
                <Ionicons name="trash-outline" size={18} color={appColors.accent} />
                <Text style={styles.secondaryButtonText}>Quitar foto</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={selectedGoal.accent} />
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryLabel}>Objetivo seleccionado</Text>
              <Text style={styles.summaryValue}>{selectedGoal.label}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Ionicons
              name={photo ? 'image-outline' : 'alert-circle-outline'}
              size={20}
              color={photo ? appColors.success : appColors.textMuted}
            />
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryLabel}>Estado de la foto</Text>
              <Text style={styles.summaryValue}>
                {photo ? 'Foto lista para analizar' : 'Aun no has tomado la foto'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Ionicons
              name={analysisText ? 'sparkles-outline' : 'chatbubble-ellipses-outline'}
              size={20}
              color={analysisText ? appColors.info : appColors.textMuted}
            />
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryLabel}>Respuesta de Nano</Text>
              <Text style={styles.summaryValue}>
                {analysisText
                  ? `Lista${analysisWordCount ? ` - ${analysisWordCount} palabras` : ''}`
                  : 'Todavia no se ha generado'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.readyButton, (!photo || submitting) && styles.buttonDisabled]}
          activeOpacity={0.9}
          onPress={() => void handleAnalyze()}
          disabled={!photo || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={appColors.text} />
          ) : (
            <Ionicons name="sparkles-outline" size={18} color={appColors.text} />
          )}
          <Text style={styles.readyButtonText}>
            {submitting ? 'Analizando comida...' : 'Analizar con Nano'}
          </Text>
        </TouchableOpacity>

        {analysisText ? (
          <View style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={appColors.info} />
              <Text style={styles.analysisTitle}>Respuesta de Nano</Text>
            </View>
            <Text style={styles.analysisText}>{analysisText}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
    backgroundColor: appColors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    color: appColors.info,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: appColors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 6,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: appColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appColors.border,
  },
  speechBubble: {
    marginTop: 24,
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  speechHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  speechIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appColors.accent,
    marginRight: 10,
  },
  speechTitle: {
    color: appColors.accent,
    fontSize: 18,
    fontWeight: '800',
  },
  speechText: {
    color: appColors.textSoft,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  heroCard: {
    marginTop: 18,
    borderRadius: 28,
    padding: 20,
    backgroundColor: appColors.surfaceStrong,
    borderWidth: 1,
    borderColor: appColors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colorAlpha(appColors.info, '18'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  goalList: {
    marginTop: 14,
    gap: 12,
  },
  goalCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceStrong,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  goalContent: {
    flex: 1,
    paddingRight: 12,
  },
  goalLabel: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  goalDescription: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  cameraCard: {
    marginTop: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceStrong,
    overflow: 'hidden',
    minHeight: 260,
  },
  foodPreview: {
    width: '100%',
    height: 300,
  },
  placeholderWrap: {
    minHeight: 260,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.info, '18'),
    marginBottom: 16,
  },
  placeholderTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  placeholderText: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  cameraActions: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 18,
    backgroundColor: appColors.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  primaryButtonText: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.accent, '88'),
    backgroundColor: colorAlpha(appColors.accent, '12'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  secondaryButtonText: {
    color: appColors.accent,
    fontSize: 15,
    fontWeight: '800',
  },
  summaryCard: {
    marginTop: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceStrong,
    padding: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  summaryLabel: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    color: appColors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: appColors.border,
    marginVertical: 16,
  },
  readyButton: {
    marginTop: 18,
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: appColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  readyButtonText: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  analysisCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '88'),
    backgroundColor: colorAlpha(appColors.info, '14'),
    padding: 18,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  analysisTitle: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  analysisText: {
    color: appColors.textSoft,
    fontSize: 15,
    lineHeight: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  robotShell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'flex-start',
    transform: [{ scale: 1.4 }],
  },
  robotFlame: {
    position: 'absolute',
    top: 0,
    right: 8,
    width: 11,
    height: 11,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: appColors.accent,
    transform: [{ rotate: '22deg' }],
  },
  robotHead: {
    width: 29,
    height: 23,
    marginTop: 4,
    borderRadius: 11,
    backgroundColor: appColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotFace: {
    width: 23,
    height: 18,
    borderRadius: 8,
    backgroundColor: appColors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  robotEye: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: appColors.text,
  },
  robotMouth: {
    width: 4,
    height: 2,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: appColors.text,
    marginTop: 4,
  },
  robotEarLeft: {
    position: 'absolute',
    top: 14,
    left: 1,
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: appColors.background,
  },
  robotEarRight: {
    position: 'absolute',
    top: 14,
    right: 1,
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: appColors.background,
  },
  robotBody: {
    width: 14,
    height: 9,
    marginTop: 3,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: appColors.accent,
  },
  robotFootLeft: {
    position: 'absolute',
    bottom: 2,
    left: 8,
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: appColors.accent,
    transform: [{ rotate: '22deg' }],
  },
  robotFootRight: {
    position: 'absolute',
    bottom: 2,
    right: 8,
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: appColors.accent,
    transform: [{ rotate: '-22deg' }],
  },
});
