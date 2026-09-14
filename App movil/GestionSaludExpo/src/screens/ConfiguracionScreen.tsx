import React from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../components/AppText';
import { FontSizePreference, useFontSize } from '../context/FontSizeContext';
import { RootStackParamList } from '../navigation/types';
import { appColors } from '../theme/colors';
import { AppColors, useAppColors } from '../theme/useAppColors';

type Props = NativeStackScreenProps<RootStackParamList, 'Configuracion'>;

const options: Array<{ value: FontSizePreference; title: string; description: string; sampleSize: number }> = [
  { value: 'small', title: 'Pequeño', description: 'Más contenido visible en pantalla.', sampleSize: 14 },
  { value: 'default', title: 'Predeterminado', description: 'Tamaño recomendado para la mayoría de personas.', sampleSize: 16 },
  { value: 'large', title: 'Grande', description: 'Lectura más cómoda y accesible.', sampleSize: 19 },
];

export function ConfiguracionScreen({ navigation }: Props) {
  const colors = useAppColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { preference, setFontSizePreference } = useFontSize();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}><Ionicons name="text-outline" size={28} color="#FFFFFF" /></View>
          <View style={styles.heroCopy}>
            <AppText style={styles.title}>Configuración</AppText>
            <AppText style={styles.subtitle}>Personaliza la lectura de la aplicación a tu medida.</AppText>
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>Tamaño de fuente</AppText>
          <AppText style={styles.sectionDescription}>El cambio se aplica de inmediato en toda la app y se conserva para tu próxima sesión.</AppText>

          {options.map((option) => {
            const selected = preference === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.option, selected && styles.optionSelected]}
                onPress={() => setFontSizePreference(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Tamaño de fuente ${option.title}`}
              >
                <View style={[styles.sample, selected && styles.sampleSelected]}>
                  <AppText style={[styles.sampleText, { fontSize: option.sampleSize, color: selected ? '#FFFFFF' : colors.text }]}>{option.value === 'small' ? 'Aa' : 'Aa'}</AppText>
                </View>
                <View style={styles.optionCopy}>
                  <AppText style={styles.optionTitle}>{option.title}</AppText>
                  <AppText style={styles.optionDescription}>{option.description}</AppText>
                </View>
                <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={24} color={selected ? colors.info : colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.preview}>
          <Ionicons name="eye-outline" size={20} color={colors.success} />
          <View style={styles.previewCopy}>
            <AppText style={styles.previewTitle}>Vista previa</AppText>
            <AppText style={styles.previewText}>Tu salud, tus datos y tus recordatorios seguirán siendo fáciles de leer.</AppText>
          </View>
        </View>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
          <AppText style={styles.backText}>Volver a Gestión</AppText>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 18, paddingBottom: 34 },
  hero: { backgroundColor: '#0B6FEA', borderRadius: 22, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroIcon: { width: 54, height: 54, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF24' },
  heroCopy: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: 25, fontWeight: '900' },
  subtitle: { color: '#EAF3FF', fontSize: 13, lineHeight: 19, marginTop: 3 },
  section: { padding: 18, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 12 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  sectionDescription: { color: colors.textSoft, fontSize: 13, lineHeight: 19, marginBottom: 4 },
  option: { minHeight: 78, padding: 12, borderRadius: 15, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionSelected: { borderColor: colors.info, backgroundColor: '#0B6FEA18' },
  sample: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  sampleSelected: { backgroundColor: '#0B6FEA' },
  sampleText: { color: '#FFFFFF', fontWeight: '900' },
  optionCopy: { flex: 1 },
  optionTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  optionDescription: { color: colors.textSoft, fontSize: 12, lineHeight: 17, marginTop: 2 },
  preview: { flexDirection: 'row', gap: 11, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#2E8B573F', backgroundColor: `${colors.success}16` },
  previewCopy: { flex: 1 },
  previewTitle: { color: colors.success, fontSize: 14, fontWeight: '900' },
  previewText: { color: colors.text, fontSize: 13, lineHeight: 19, marginTop: 2 },
  backButton: { alignSelf: 'center', minHeight: 46, paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.info, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  backText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
});
