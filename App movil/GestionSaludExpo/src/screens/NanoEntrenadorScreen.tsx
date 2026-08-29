import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText, AppTextInput } from '../components/AppText';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'NanoEntrenador'>;
type Goal = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; color: string };
type Exercise = { name: string; sets: string; reps: string; rest: string; notes?: string };
type TrainingDay = { day: string; focus: string; duration: string; exercises: Exercise[] };
type TrainingPlan = { title: string; summary: string; weeklyDays: TrainingDay[]; nanoTip: string };
type TrainingResponse = { plan?: TrainingPlan; message?: string };

const GOALS: Goal[] = [
  { key: 'fitness', label: 'Ponerse en forma', icon: 'fitness-outline', color: appColors.success },
  { key: 'weight-loss', label: 'Bajar de peso', icon: 'trending-down-outline', color: appColors.info },
  { key: 'muscle-gain', label: 'Ganar músculo', icon: 'barbell-outline', color: '#FDBA74' },
  { key: 'mobility', label: 'Movilidad y salud', icon: 'body-outline', color: '#C084FC' },
];
const LEVELS = [{ key: 'beginner', label: 'Principiante' }, { key: 'intermediate', label: 'Intermedio' }, { key: 'advanced', label: 'Avanzado' }] as const;

const isTrainingPlan = (value: unknown): value is TrainingPlan => {
  if (!value || typeof value !== 'object') return false;
  const plan = value as Partial<TrainingPlan>;
  return typeof plan.title === 'string' && typeof plan.summary === 'string' && typeof plan.nanoTip === 'string' && Array.isArray(plan.weeklyDays) && plan.weeklyDays.length === 7 && plan.weeklyDays.every((day) => day && typeof day.day === 'string' && typeof day.focus === 'string' && typeof day.duration === 'string' && Array.isArray(day.exercises));
};

export function NanoEntrenadorScreen({ navigation }: Props) {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const isWebWide = width >= 900;
  const [goalKey, setGoalKey] = useState(GOALS[0].key);
  const [level, setLevel] = useState<(typeof LEVELS)[number]['key']>('beginner');
  const [equipment, setEquipment] = useState('');
  const [limitations, setLimitations] = useState('');
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const goal = useMemo(() => GOALS.find((item) => item.key === goalKey) ?? GOALS[0], [goalKey]);
  const activeDay = plan?.weeklyDays[dayIndex];

  const generatePlan = async () => {
    if (!token) { Alert.alert('Sesión requerida', 'Necesitas iniciar sesión para usar Nano Entrenador.'); return; }
    setLoading(true); setPlan(null); setDayIndex(0);
    try {
      const response = await fetch(`${API_URL}/nano/training-plan`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ goalKey: goal.key, goalLabel: goal.label, level, equipment: equipment.trim() || undefined, limitations: limitations.trim() || undefined }) });
      const payload = await response.json().catch(() => null) as TrainingResponse | null;
      if (!response.ok || !isTrainingPlan(payload?.plan)) throw new Error(payload?.message ?? 'Nano Entrenador necesita la versión actualizada del backend para mostrar la rutina.');
      setPlan(payload.plan);
    } catch (error) { Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear la rutina.'); } finally { setLoading(false); }
  };

  return <SafeAreaView style={styles.safeArea}><ScrollView contentContainerStyle={[styles.container, isWebWide && styles.containerWeb]} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={[styles.headerIcon, { backgroundColor: goal.color }]}><Ionicons name="barbell-outline" size={24} color={appColors.background} /></View><View style={styles.grow}><AppText style={styles.eyebrow}>Asistente IA</AppText><AppText style={styles.title}>Nano Entrenador</AppText><AppText style={styles.subtitle}>Rutinas personalizadas para toda la semana.</AppText></View><TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}><Ionicons name="close" size={20} color={appColors.textSoft} /></TouchableOpacity></View>
    <View style={[styles.grid, isWebWide && styles.gridWeb]}><View style={styles.formColumn}>
      <View style={styles.section}><AppText style={styles.sectionTitle}>1. Objetivo</AppText>{GOALS.map((item) => <TouchableOpacity key={item.key} onPress={() => setGoalKey(item.key)} style={[styles.option, item.key === goal.key && { borderColor: item.color, backgroundColor: colorAlpha(item.color, '18') }]}><Ionicons name={item.icon} size={19} color={item.color} /><AppText style={styles.optionText}>{item.label}</AppText><Ionicons name={item.key === goal.key ? 'radio-button-on' : 'radio-button-off'} size={18} color={item.key === goal.key ? item.color : appColors.textMuted} /></TouchableOpacity>)}</View>
      <View style={styles.section}><AppText style={styles.sectionTitle}>2. Nivel</AppText><View style={styles.levelRow}>{LEVELS.map((item) => <TouchableOpacity key={item.key} onPress={() => setLevel(item.key)} style={[styles.levelButton, level === item.key && styles.levelButtonActive]}><AppText style={[styles.levelText, level === item.key && styles.levelTextActive]}>{item.label}</AppText></TouchableOpacity>)}</View></View>
      <View style={styles.section}><AppText style={styles.sectionTitle}>3. Contexto opcional</AppText><AppTextInput style={styles.input} value={equipment} onChangeText={setEquipment} placeholder="Equipo: pesas, bandas o solo cuerpo" placeholderTextColor={appColors.textMuted} /><AppTextInput style={[styles.input, styles.textarea]} value={limitations} onChangeText={setLimitations} placeholder="Limitaciones o preferencias" placeholderTextColor={appColors.textMuted} multiline textAlignVertical="top" /></View>
      <TouchableOpacity style={[styles.createButton, loading && styles.disabled]} onPress={() => void generatePlan()} disabled={loading}>{loading ? <ActivityIndicator color={appColors.background} /> : <Ionicons name="calendar-outline" size={19} color={appColors.background} />}<AppText style={styles.createText}>{loading ? 'Nano está planificando...' : 'Crear rutina semanal'}</AppText></TouchableOpacity>
    </View>
    <View style={styles.planColumn}>{plan && activeDay ? <View style={styles.planCard}><AppText style={styles.planTitle}>{plan.title}</AppText><AppText style={styles.planSummary}>{plan.summary}</AppText><View style={styles.dayDots}>{plan.weeklyDays.map((day, index) => <TouchableOpacity key={`${day.day}-${index}`} onPress={() => setDayIndex(index)} style={[styles.dayDot, index === dayIndex && { backgroundColor: goal.color }]}><AppText style={styles.dayDotText}>{index + 1}</AppText></TouchableOpacity>)}</View><View style={styles.dayHeader}><View><AppText style={styles.dayTitle}>{activeDay.day}</AppText><AppText style={styles.dayFocus}>{activeDay.focus}</AppText></View><View style={styles.duration}><Ionicons name="time-outline" size={15} color={appColors.info} /><AppText style={styles.durationText}>{activeDay.duration}</AppText></View></View>{activeDay.exercises.length ? <View style={styles.exerciseList}>{activeDay.exercises.map((exercise, index) => <View key={`${exercise.name}-${index}`} style={styles.exercise}><AppText style={styles.exerciseName}>{exercise.name}</AppText><AppText style={styles.exerciseMeta}>{exercise.sets} · {exercise.reps} · Descanso {exercise.rest}</AppText>{exercise.notes ? <AppText style={styles.exerciseNotes}>{exercise.notes}</AppText> : null}</View>)}</View> : <View style={styles.restBox}><Ionicons name="bed-outline" size={25} color={appColors.success} /><AppText style={styles.restText}>{activeDay.focus}</AppText></View>}<View style={styles.navigation}><TouchableOpacity style={[styles.navButton, dayIndex === 0 && styles.disabled]} onPress={() => setDayIndex((value) => Math.max(0, value - 1))} disabled={dayIndex === 0}><Ionicons name="chevron-back" size={19} color={appColors.info} /><AppText style={styles.navText}>Anterior</AppText></TouchableOpacity><AppText style={styles.count}>{dayIndex + 1}/7</AppText><TouchableOpacity style={[styles.navButton, dayIndex === 6 && styles.disabled]} onPress={() => setDayIndex((value) => Math.min(6, value + 1))} disabled={dayIndex === 6}><AppText style={styles.navText}>Siguiente</AppText><Ionicons name="chevron-forward" size={19} color={appColors.info} /></TouchableOpacity></View><View style={styles.tip}><Ionicons name="sparkles" size={20} color={appColors.success} /><AppText style={styles.tipText}>{plan.nanoTip}</AppText></View></View> : <View style={styles.placeholder}><Ionicons name="barbell-outline" size={34} color={appColors.success} /><AppText style={styles.placeholderTitle}>Tu semana de entrenamiento aparecerá aquí</AppText><AppText style={styles.placeholderText}>Elige tu objetivo y nivel para crear una rutina de siete días.</AppText></View>}</View></View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea:{flex:1,backgroundColor:appColors.background},container:{width:'100%',padding:20,paddingBottom:40,gap:18},containerWeb:{maxWidth:1180,alignSelf:'center',paddingHorizontal:32,paddingTop:32},header:{flexDirection:'row',alignItems:'center',gap:12},headerIcon:{width:52,height:52,borderRadius:17,alignItems:'center',justifyContent:'center'},grow:{flex:1},eyebrow:{color:appColors.success,fontSize:12,fontWeight:'900',textTransform:'uppercase'},title:{color:appColors.text,fontSize:28,fontWeight:'900'},subtitle:{color:appColors.textMuted,fontSize:13},closeButton:{padding:10,borderRadius:12,backgroundColor:appColors.surface},grid:{gap:18},gridWeb:{flexDirection:'row',alignItems:'flex-start'},formColumn:{flex:1,gap:16},planColumn:{flex:1},section:{gap:9},sectionTitle:{color:appColors.text,fontSize:16,fontWeight:'900'},option:{minHeight:51,paddingHorizontal:13,borderRadius:14,borderWidth:1,borderColor:appColors.border,backgroundColor:appColors.surface,flexDirection:'row',alignItems:'center',gap:10},optionText:{flex:1,color:appColors.text,fontSize:14,fontWeight:'800'},levelRow:{flexDirection:'row',gap:7},levelButton:{flex:1,borderRadius:12,borderWidth:1,borderColor:appColors.border,padding:11,alignItems:'center'},levelButtonActive:{backgroundColor:colorAlpha(appColors.info,'18'),borderColor:appColors.info},levelText:{color:appColors.textMuted,fontSize:12,fontWeight:'800'},levelTextActive:{color:appColors.info},input:{minHeight:48,paddingHorizontal:13,borderWidth:1,borderColor:appColors.border,borderRadius:13,backgroundColor:appColors.surface,color:appColors.text,fontSize:14},textarea:{minHeight:76,paddingTop:12},createButton:{minHeight:52,borderRadius:14,backgroundColor:appColors.success,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:9},createText:{color:appColors.background,fontSize:15,fontWeight:'900'},disabled:{opacity:.35},placeholder:{minHeight:280,padding:26,borderRadius:18,borderWidth:1,borderColor:appColors.border,backgroundColor:appColors.surface,alignItems:'center',justifyContent:'center',gap:10},placeholderTitle:{color:appColors.text,fontSize:17,fontWeight:'900',textAlign:'center'},placeholderText:{color:appColors.textMuted,fontSize:13,lineHeight:20,textAlign:'center',maxWidth:300},planCard:{borderRadius:18,borderWidth:1,borderColor:appColors.border,backgroundColor:appColors.surface,padding:16,gap:13},planTitle:{color:appColors.text,fontSize:20,fontWeight:'900'},planSummary:{color:appColors.textSoft,fontSize:13,lineHeight:20},dayDots:{flexDirection:'row',gap:5},dayDot:{flex:1,height:28,borderRadius:9,backgroundColor:appColors.border,alignItems:'center',justifyContent:'center'},dayDotText:{color:appColors.text,fontSize:11,fontWeight:'900'},dayHeader:{flexDirection:'row',justifyContent:'space-between',gap:10,alignItems:'flex-start'},dayTitle:{color:appColors.text,fontSize:17,fontWeight:'900'},dayFocus:{color:appColors.textMuted,fontSize:13,marginTop:2},duration:{flexDirection:'row',alignItems:'center',gap:5,padding:7,borderRadius:10,backgroundColor:colorAlpha(appColors.info,'12')},durationText:{color:appColors.textSoft,fontSize:12,fontWeight:'800'},exerciseList:{gap:9},exercise:{padding:12,borderRadius:13,backgroundColor:appColors.backgroundMuted},exerciseName:{color:appColors.text,fontSize:14,fontWeight:'900'},exerciseMeta:{color:appColors.info,fontSize:12,fontWeight:'800',marginTop:3},exerciseNotes:{color:appColors.textMuted,fontSize:12,marginTop:5},restBox:{minHeight:115,padding:18,borderRadius:14,backgroundColor:colorAlpha(appColors.success,'12'),alignItems:'center',justifyContent:'center',gap:8},restText:{color:appColors.textSoft,fontSize:14,textAlign:'center',lineHeight:20},navigation:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},navButton:{flexDirection:'row',alignItems:'center',gap:2,paddingVertical:7},navText:{color:appColors.info,fontSize:13,fontWeight:'800'},count:{color:appColors.textMuted,fontSize:12,fontWeight:'800'},tip:{flexDirection:'row',gap:10,padding:13,borderRadius:13,borderWidth:1,borderColor:colorAlpha(appColors.success,'55'),backgroundColor:colorAlpha(appColors.success,'12')},tipText:{flex:1,color:appColors.textSoft,fontSize:13,lineHeight:19},
});
