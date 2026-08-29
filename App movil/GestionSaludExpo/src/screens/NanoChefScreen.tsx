/**
 * @file App movil/GestionSaludExpo/src/screens/NanoChefScreen.tsx
 * @description Recetas de Nano generadas únicamente a partir de texto.
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText, AppTextInput } from '../components/AppText';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'NanoChef'>;

type RecipeGoal = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
};

type RecipeResponse = { recipe?: string; goalLabel?: string };

const RECIPE_GOALS: RecipeGoal[] = [
  { id: 'weight-loss', label: 'Ligera y saciante', icon: 'leaf-outline', accent: appColors.success },
  { id: 'diabetes', label: 'Control de azucar', icon: 'water-outline', accent: appColors.accent },
  { id: 'muscle-gain', label: 'Alta en proteina', icon: 'barbell-outline', accent: appColors.info },
  { id: 'pregnancy', label: 'Embarazo', icon: 'flower-outline', accent: '#FDBA74' },
];

const QUICK_INGREDIENTS = ['pollo', 'huevo', 'arroz', 'frijoles', 'avena', 'tomate'];
const MAX_INGREDIENTS_LENGTH = 1_000;
const MAX_PREFERENCES_LENGTH = 500;

export function NanoChefScreen({ navigation }: Props) {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const isWebWide = width >= 900;
  const [goalId, setGoalId] = useState(RECIPE_GOALS[0].id);
  const [ingredients, setIngredients] = useState('');
  const [preferences, setPreferences] = useState('');
  const [recipe, setRecipe] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedGoal = useMemo(
    () => RECIPE_GOALS.find((goal) => goal.id === goalId) ?? RECIPE_GOALS[0],
    [goalId],
  );

  const addIngredient = (ingredient: string) => {
    const current = ingredients.trim();
    const values = current ? current.split(',').map((value) => value.trim().toLowerCase()) : [];
    if (values.includes(ingredient)) return;
    setIngredients(current ? `${current}, ${ingredient}` : ingredient);
  };

  const createRecipe = async () => {
    const normalizedIngredients = ingredients.trim();
    if (!normalizedIngredients) {
      Alert.alert('Agrega ingredientes', 'Escribe los ingredientes que tienes disponibles.');
      return;
    }
    if (!token) {
      Alert.alert('Sesion requerida', 'Necesitas iniciar sesion para usar Nano Chef.');
      return;
    }

    setSubmitting(true);
    setRecipe(null);
    try {
      const response = await fetch(`${API_URL}/nano/chef`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goalKey: selectedGoal.id,
          goalLabel: selectedGoal.label,
          ingredients: normalizedIngredients,
          preferences: preferences.trim() || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as RecipeResponse | null;
      if (!response.ok || !payload?.recipe) {
        throw new Error((payload as { message?: string } | null)?.message ?? 'Nano Chef no pudo crear una receta.');
      }
      setRecipe(payload.recipe);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear la receta.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, isWebWide && styles.containerWeb]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}><Ionicons name="restaurant-outline" size={24} color={appColors.background} /></View>
          <View style={styles.headerCopy}>
            <AppText style={styles.eyebrow}>Asistente IA</AppText>
            <AppText style={styles.title}>Nano Chef</AppText>
            <AppText style={styles.subtitle}>Recetas personalizadas sin fotos.</AppText>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} accessibilityLabel="Cerrar Nano Chef">
            <Ionicons name="close" size={20} color={appColors.textSoft} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="sparkles-outline" size={20} color={appColors.success} />
          <AppText style={styles.infoText}>Escribe los ingredientes disponibles y Nano Chef te propone una receta. No se envían imágenes.</AppText>
        </View>

        <View style={[styles.contentGrid, isWebWide && styles.contentGridWeb]}>
          <View style={styles.formColumn}>
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>1. Elige el objetivo</AppText>
          <View style={styles.goalGrid}>
            {RECIPE_GOALS.map((goal) => {
              const selected = goal.id === selectedGoal.id;
              return (
                <TouchableOpacity key={goal.id} style={[styles.goalCard, selected && { borderColor: goal.accent, backgroundColor: colorAlpha(goal.accent, '18') }]} onPress={() => setGoalId(goal.id)}>
                  <Ionicons name={goal.icon} size={20} color={goal.accent} />
                  <AppText style={styles.goalLabel}>{goal.label}</AppText>
                  <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected ? goal.accent : appColors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>2. Ingredientes disponibles</AppText>
          <AppText style={styles.sectionSubtitle}>Sepáralos por comas. Puedes incluir cantidades si las sabes.</AppText>
          <AppTextInput
            style={styles.input}
            value={ingredients}
            onChangeText={(value) => setIngredients(value.slice(0, MAX_INGREDIENTS_LENGTH))}
            placeholder="Ej.: pollo, tomate, arroz, cebolla"
            placeholderTextColor={appColors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={MAX_INGREDIENTS_LENGTH}
          />
          <View style={styles.chips}>
            {QUICK_INGREDIENTS.map((ingredient) => <TouchableOpacity key={ingredient} style={styles.chip} onPress={() => addIngredient(ingredient)}><AppText style={styles.chipText}>+ {ingredient}</AppText></TouchableOpacity>)}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>3. Preferencias opcionales</AppText>
          <AppTextInput
            style={styles.input}
            value={preferences}
            onChangeText={(value) => setPreferences(value.slice(0, MAX_PREFERENCES_LENGTH))}
            placeholder="Ej.: sin lactosa, para 2 personas, pocos ingredientes"
            placeholderTextColor={appColors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={MAX_PREFERENCES_LENGTH}
          />
        </View>

        <TouchableOpacity style={[styles.primaryButton, submitting && styles.buttonDisabled]} onPress={() => void createRecipe()} disabled={submitting}>
          {submitting ? <ActivityIndicator color={appColors.background} /> : <Ionicons name="restaurant-outline" size={19} color={appColors.background} />}
          <AppText style={styles.primaryButtonText}>{submitting ? 'Nano Chef está cocinando...' : 'Crear receta'}</AppText>
        </TouchableOpacity>
          </View>

          <View style={[styles.recipeColumn, !recipe && styles.recipeColumnEmpty]}>
            {recipe ? (
              <View style={styles.recipeCard}>
            <View style={styles.recipeHeader}><Ionicons name="book-outline" size={20} color={selectedGoal.accent} /><AppText style={styles.recipeTitle}>Tu receta</AppText></View>
            <AppText style={styles.recipeText}>{recipe}</AppText>
            <TouchableOpacity style={styles.newRecipeButton} onPress={() => setRecipe(null)}><Ionicons name="refresh-outline" size={17} color={appColors.info} /><AppText style={styles.newRecipeText}>Crear otra receta</AppText></TouchableOpacity>
              </View>
            ) : (
              <View style={styles.recipePlaceholder}>
                <View style={styles.recipePlaceholderIcon}><Ionicons name="restaurant-outline" size={30} color={appColors.success} /></View>
                <AppText style={styles.recipePlaceholderTitle}>Tu receta aparecerá aquí</AppText>
                <AppText style={styles.recipePlaceholderText}>Elige un objetivo, agrega los ingredientes y Nano Chef preparará una propuesta para ti.</AppText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: appColors.background },
  container: { padding: 20, paddingBottom: 40, gap: 16, width: '100%' },
  containerWeb: { maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 32, paddingTop: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.success },
  headerCopy: { flex: 1 }, eyebrow: { color: appColors.success, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: appColors.text, fontSize: 28, fontWeight: '900' }, subtitle: { color: appColors.textMuted, fontSize: 13 },
  closeButton: { padding: 10, borderRadius: 12, backgroundColor: appColors.surface },
  infoCard: { flexDirection: 'row', gap: 10, borderRadius: 16, padding: 15, backgroundColor: colorAlpha(appColors.success, '12'), borderWidth: 1, borderColor: colorAlpha(appColors.success, '55') },
  infoText: { flex: 1, color: appColors.textSoft, fontSize: 13, lineHeight: 19 },
  contentGrid: { gap: 18 }, contentGridWeb: { flexDirection: 'row', alignItems: 'flex-start' }, formColumn: { flex: 1, gap: 16 }, recipeColumn: { flex: 1 }, recipeColumnEmpty: { minHeight: 260 },
  section: { gap: 9 }, sectionTitle: { color: appColors.text, fontSize: 16, fontWeight: '900' }, sectionSubtitle: { color: appColors.textMuted, fontSize: 13 },
  goalGrid: { gap: 9 }, goalCard: { minHeight: 54, paddingHorizontal: 13, borderRadius: 14, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface, flexDirection: 'row', alignItems: 'center', gap: 11 },
  goalLabel: { flex: 1, color: appColors.text, fontSize: 14, fontWeight: '800' },
  input: { minHeight: 88, padding: 13, borderWidth: 1, borderColor: appColors.border, borderRadius: 14, backgroundColor: appColors.surface, color: appColors.text, fontSize: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { borderWidth: 1, borderColor: colorAlpha(appColors.info, '66'), backgroundColor: colorAlpha(appColors.info, '12'), borderRadius: 99, paddingVertical: 7, paddingHorizontal: 10 }, chipText: { color: appColors.info, fontSize: 12, fontWeight: '800' },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: appColors.success, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, primaryButtonText: { color: appColors.background, fontSize: 15, fontWeight: '900' }, buttonDisabled: { opacity: 0.65 },
  recipeCard: { borderRadius: 18, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface, padding: 16, gap: 12 }, recipeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 }, recipeTitle: { color: appColors.text, fontSize: 17, fontWeight: '900' }, recipeText: { color: appColors.textSoft, fontSize: 14, lineHeight: 22 },
  newRecipeButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8 }, newRecipeText: { color: appColors.info, fontWeight: '800', fontSize: 13 },
  recipePlaceholder: { minHeight: 250, padding: 24, borderRadius: 18, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface, alignItems: 'center', justifyContent: 'center', gap: 10 },
  recipePlaceholderIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.success, '18') }, recipePlaceholderTitle: { color: appColors.text, fontSize: 17, fontWeight: '900', textAlign: 'center' }, recipePlaceholderText: { color: appColors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 310 },
});
