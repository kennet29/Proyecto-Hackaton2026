import React, { useEffect, useMemo, useState } from 'react';
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

type Props = NativeStackScreenProps<RootStackParamList, 'PresupuestoMedico'>;
type Category = 'Consultas' | 'Medicamentos' | 'Exámenes' | 'Transporte' | 'Otros';
type BudgetItem = { id: number; description: string; category: Category; amount: number };
type MonthlyBudget = { id: number | null; month: string; limit: number; items: BudgetItem[] };

const CATEGORIES: { label: Category; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { label: 'Consultas', icon: 'medkit-outline', color: appColors.info },
  { label: 'Medicamentos', icon: 'medical-outline', color: appColors.success },
  { label: 'Exámenes', icon: 'document-text-outline', color: '#C084FC' },
  { label: 'Transporte', icon: 'car-outline', color: '#FDBA74' },
  { label: 'Otros', icon: 'ellipsis-horizontal', color: appColors.accent },
];

const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const monthLabel = (date: Date) => new Intl.DateTimeFormat('es-NI', { month: 'long', year: 'numeric' }).format(date);
const money = (value: number) => new Intl.NumberFormat('es-NI', { style: 'currency', currency: 'NIO', maximumFractionDigits: 2 }).format(value);
const parseAmount = (value: string) => Number(value.trim().replace(',', '.'));
const emptyBudget = (month: string): MonthlyBudget => ({ id: null, month, limit: 0, items: [] });
const apiError = (body: unknown, fallback: string) => {
  if (!body || typeof body !== 'object' || !('message' in body)) return fallback;
  const message = (body as { message?: string | string[] }).message;
  return Array.isArray(message) ? message.join('\n') : message || fallback;
};

export function PresupuestoMedicoScreen({ navigation }: Props) {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [selectedMonth, setSelectedMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const key = monthKey(selectedMonth);
  const [current, setCurrent] = useState<MonthlyBudget>(() => emptyBudget(key));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [limitInput, setLimitInput] = useState('');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [category, setCategory] = useState<Category>('Consultas');
  const [editingId, setEditingId] = useState<number | null>(null);

  const total = useMemo(() => current.items.reduce((sum, item) => sum + item.amount, 0), [current.items]);
  const remaining = current.limit - total;
  const progress = current.limit > 0 ? Math.min(total / current.limit, 1) : 0;
  const overBudget = current.limit > 0 && total > current.limit;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setCurrent(emptyBudget(key));
    setEditingId(null);
    setDescription('');
    setAmountInput('');
    setCategory('Consultas');
    if (!token) {
      setLoading(false);
      return () => { active = false; };
    }
    void fetch(`${API_URL}/presupuestos-medicos?mes=${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(apiError(body, 'No se pudo cargar el presupuesto.'));
        if (active) setCurrent(body as MonthlyBudget);
      })
      .catch((error: Error) => { if (active) Alert.alert('No se pudo cargar', error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [key, token]);

  useEffect(() => {
    setLimitInput(current.limit > 0 ? String(current.limit) : '');
  }, [current.limit]);

  const saveLimit = async () => {
    const value = parseAmount(limitInput);
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert('Presupuesto inválido', 'Ingresa un monto mensual mayor que cero.');
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/presupuestos-medicos/${key}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: value }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(body, 'No se pudo guardar el presupuesto.'));
      setCurrent(body as MonthlyBudget);
      Alert.alert('Presupuesto guardado', `Tu límite para ${monthLabel(selectedMonth)} es ${money(value)}.`);
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const submitItem = async () => {
    const value = parseAmount(amountInput);
    if (!description.trim()) {
      Alert.alert('Descripción requerida', 'Indica en qué planeas utilizar este monto.');
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      Alert.alert('Monto inválido', 'Ingresa un gasto mayor que cero.');
      return;
    }
    if (!token) return;
    setSaving(true);
    try {
      const editing = editingId !== null;
      const response = await fetch(
        editing ? `${API_URL}/presupuestos-medicos/gastos/${editingId}` : `${API_URL}/presupuestos-medicos/${key}/gastos`,
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: description.trim(), category, amount: value }),
        },
      );
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(apiError(body, 'No se pudo guardar el gasto.'));
      setCurrent(body as MonthlyBudget);
      cancelEdit();
    } catch (error) {
      Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const editItem = (item: BudgetItem) => {
    setEditingId(item.id);
    setDescription(item.description);
    setAmountInput(String(item.amount));
    setCategory(item.category);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDescription('');
    setAmountInput('');
    setCategory('Consultas');
  };

  const removeItem = (item: BudgetItem) => {
    Alert.alert('Eliminar gasto', `¿Deseas eliminar “${item.description}”?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => {
        if (!token) return;
        setSaving(true);
        void fetch(`${API_URL}/presupuestos-medicos/gastos/${item.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).then(async (response) => {
          const body = await response.json().catch(() => null);
          if (!response.ok) throw new Error(apiError(body, 'No se pudo eliminar el gasto.'));
          setCurrent(body as MonthlyBudget);
          if (editingId === item.id) cancelEdit();
        }).catch((error: Error) => Alert.alert('No se pudo eliminar', error.message))
          .finally(() => setSaving(false));
      } },
    ]);
  };

  const moveMonth = (offset: number) => {
    setSelectedMonth((currentMonth) => new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, isWide && styles.containerWide]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerIcon}><Ionicons name="wallet-outline" size={25} color={appColors.background} /></View>
          <View style={styles.headerCopy}>
            <AppText style={styles.eyebrow}>Planificación mensual</AppText>
            <AppText style={styles.title}>Presupuesto Médico</AppText>
            <AppText style={styles.subtitle}>Organiza con anticipación tus gastos de salud.</AppText>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} accessibilityLabel="Cerrar presupuesto médico">
            <Ionicons name="close" size={20} color={appColors.textSoft} />
          </TouchableOpacity>
        </View>

        <View style={styles.monthPicker}>
          <TouchableOpacity style={styles.monthButton} onPress={() => moveMonth(-1)} accessibilityLabel="Mes anterior">
            <Ionicons name="chevron-back" size={21} color={appColors.info} />
          </TouchableOpacity>
          <View style={styles.monthCopy}>
            <AppText style={styles.monthLabel}>{monthLabel(selectedMonth)}</AppText>
            <AppText style={styles.monthHint}>Presupuesto independiente por mes</AppText>
          </View>
          <TouchableOpacity style={styles.monthButton} onPress={() => moveMonth(1)} accessibilityLabel="Mes siguiente">
            <Ionicons name="chevron-forward" size={21} color={appColors.info} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={appColors.info} />
            <AppText style={styles.loadingText}>Cargando presupuesto...</AppText>
          </View>
        ) : null}

        <View style={[styles.topGrid, isWide && styles.topGridWide]}>
          <View style={styles.panel}>
            <View style={styles.panelTitleRow}>
              <Ionicons name="flag-outline" size={20} color={appColors.success} />
              <AppText style={styles.panelTitle}>Define tu límite mensual</AppText>
            </View>
            <AppText style={styles.label}>Presupuesto disponible (C$)</AppText>
            <View style={styles.amountRow}>
              <AppTextInput
                style={styles.amountInput}
                value={limitInput}
                onChangeText={setLimitInput}
                placeholder="Ej.: 5000"
                placeholderTextColor={appColors.textMuted}
                keyboardType="decimal-pad"
              />
              <TouchableOpacity style={[styles.saveButton, saving && styles.buttonDisabled]} onPress={() => void saveLimit()} disabled={saving || loading}>
                <Ionicons name="checkmark" size={19} color={appColors.background} />
                <AppText style={styles.saveButtonText}>Guardar</AppText>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.summaryPanel}>
            <View style={styles.summaryRow}>
              <View><AppText style={styles.summaryLabel}>Presupuesto</AppText><AppText style={styles.summaryValue}>{money(current.limit)}</AppText></View>
              <View style={styles.summaryRight}><AppText style={styles.summaryLabel}>Planificado</AppText><AppText style={styles.summaryValue}>{money(total)}</AppText></View>
            </View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }, overBudget && styles.progressOver]} /></View>
            <View style={[styles.balanceBox, overBudget && styles.balanceBoxOver]}>
              <Ionicons name={overBudget ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={22} color={overBudget ? appColors.accent : appColors.success} />
              <View style={styles.balanceCopy}>
                <AppText style={styles.balanceLabel}>{overBudget ? 'Exceso planificado' : 'Disponible'}</AppText>
                <AppText style={[styles.balanceValue, overBudget && styles.balanceValueOver]}>{money(Math.abs(remaining))}</AppText>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelTitleRow}>
            <Ionicons name={editingId === null ? 'add-circle-outline' : 'create-outline'} size={21} color={appColors.info} />
            <AppText style={styles.panelTitle}>{editingId === null ? 'Agregar gasto planificado' : 'Editar gasto planificado'}</AppText>
          </View>
          <AppText style={styles.label}>Categoría</AppText>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((item) => {
              const selected = item.label === category;
              return (
                <TouchableOpacity key={item.label} style={[styles.categoryChip, selected && { borderColor: item.color, backgroundColor: colorAlpha(item.color, '18') }]} onPress={() => setCategory(item.label)}>
                  <Ionicons name={item.icon} size={17} color={item.color} />
                  <AppText style={[styles.categoryText, selected && { color: item.color }]}>{item.label}</AppText>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={[styles.expenseFields, isWide && styles.expenseFieldsWide]}>
            <View style={styles.descriptionField}>
              <AppText style={styles.label}>Descripción</AppText>
              <AppTextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="Ej.: consulta de control" placeholderTextColor={appColors.textMuted} />
            </View>
            <View style={styles.valueField}>
              <AppText style={styles.label}>Monto (C$)</AppText>
              <AppTextInput style={styles.input} value={amountInput} onChangeText={setAmountInput} placeholder="Ej.: 850" placeholderTextColor={appColors.textMuted} keyboardType="decimal-pad" />
            </View>
            <View style={styles.formActions}>
              {editingId !== null ? (
                <TouchableOpacity style={styles.cancelButton} onPress={cancelEdit} disabled={saving}>
                  <Ionicons name="close" size={19} color={appColors.textMuted} />
                  <AppText style={styles.cancelButtonText}>Cancelar</AppText>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity style={[styles.addButton, saving && styles.buttonDisabled]} onPress={() => void submitItem()} disabled={saving || loading}>
                <Ionicons name={editingId === null ? 'add' : 'checkmark'} size={20} color={appColors.background} />
                <AppText style={styles.addButtonText}>{editingId === null ? 'Agregar' : 'Actualizar'}</AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.listHeader}>
          <AppText style={styles.listTitle}>Gastos del mes</AppText>
          <View style={styles.countPill}><AppText style={styles.countText}>{current.items.length}</AppText></View>
        </View>

        {loading ? null : current.items.length ? (
          <View style={styles.expenseList}>
            {current.items.map((item) => {
              const meta = CATEGORIES.find((entry) => entry.label === item.category) ?? CATEGORIES[4];
              return (
                <View key={item.id} style={styles.expenseCard}>
                  <View style={[styles.expenseIcon, { backgroundColor: colorAlpha(meta.color, '18') }]}><Ionicons name={meta.icon} size={20} color={meta.color} /></View>
                  <View style={styles.expenseCopy}>
                    <AppText style={styles.expenseDescription}>{item.description}</AppText>
                    <AppText style={styles.expenseCategory}>{item.category}</AppText>
                  </View>
                  <AppText style={styles.expenseAmount}>{money(item.amount)}</AppText>
                  <View style={styles.itemActions}>
                    <TouchableOpacity style={styles.editButton} onPress={() => editItem(item)} disabled={saving} accessibilityLabel={`Editar ${item.description}`}>
                      <Ionicons name="create-outline" size={19} color={appColors.info} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => removeItem(item)} disabled={saving} accessibilityLabel={`Eliminar ${item.description}`}>
                      <Ionicons name="trash-outline" size={19} color={appColors.accent} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={36} color={appColors.textMuted} />
            <AppText style={styles.emptyTitle}>Aún no hay gastos planificados</AppText>
            <AppText style={styles.emptyText}>Agrega consultas, medicamentos u otros gastos para calcular tu presupuesto mensual.</AppText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: appColors.background },
  container: { width: '100%', padding: 20, paddingBottom: 44, gap: 18 },
  containerWide: { maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 32, paddingTop: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.success },
  headerCopy: { flex: 1 },
  eyebrow: { color: appColors.success, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: appColors.text, fontSize: 28, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 13 },
  closeButton: { padding: 10, borderRadius: 12, backgroundColor: appColors.surface },
  monthPicker: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 17, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  monthButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: colorAlpha(appColors.info, '12') },
  monthCopy: { flex: 1, alignItems: 'center' },
  monthLabel: { color: appColors.text, fontSize: 17, fontWeight: '900', textTransform: 'capitalize' },
  monthHint: { marginTop: 2, color: appColors.textMuted, fontSize: 11 },
  loadingBox: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 14, backgroundColor: colorAlpha(appColors.info, '0D') },
  loadingText: { color: appColors.textMuted, fontSize: 12, fontWeight: '700' },
  topGrid: { gap: 14 },
  topGridWide: { flexDirection: 'row', alignItems: 'stretch' },
  panel: { flex: 1, gap: 12, padding: 16, borderRadius: 17, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  panelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  panelTitle: { color: appColors.text, fontSize: 16, fontWeight: '900' },
  label: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' },
  amountRow: { flexDirection: 'row', gap: 9 },
  amountInput: { flex: 1, minHeight: 48, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted, color: appColors.text, fontSize: 15 },
  saveButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14, borderRadius: 13, backgroundColor: appColors.success },
  saveButtonText: { color: appColors.background, fontSize: 13, fontWeight: '900' },
  buttonDisabled: { opacity: 0.55 },
  summaryPanel: { flex: 1, gap: 13, padding: 16, borderRadius: 17, borderWidth: 1, borderColor: colorAlpha(appColors.success, '55'), backgroundColor: colorAlpha(appColors.success, '0F') },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  summaryRight: { alignItems: 'flex-end' },
  summaryLabel: { color: appColors.textMuted, fontSize: 11, textTransform: 'uppercase' },
  summaryValue: { marginTop: 3, color: appColors.text, fontSize: 18, fontWeight: '900' },
  progressTrack: { height: 8, overflow: 'hidden', borderRadius: 4, backgroundColor: appColors.border },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: appColors.success },
  progressOver: { backgroundColor: appColors.accent },
  balanceBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 11, borderRadius: 13, backgroundColor: colorAlpha(appColors.success, '12') },
  balanceBoxOver: { backgroundColor: colorAlpha(appColors.accent, '12') },
  balanceCopy: { flex: 1 },
  balanceLabel: { color: appColors.textMuted, fontSize: 11 },
  balanceValue: { color: appColors.success, fontSize: 17, fontWeight: '900' },
  balanceValueOver: { color: appColors.accent },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { minHeight: 39, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, borderRadius: 99, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted },
  categoryText: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' },
  expenseFields: { gap: 11 },
  expenseFieldsWide: { flexDirection: 'row', alignItems: 'flex-end' },
  descriptionField: { flex: 2, gap: 6 },
  valueField: { flex: 1, gap: 6 },
  input: { minHeight: 48, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted, color: appColors.text, fontSize: 14 },
  addButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 17, borderRadius: 13, backgroundColor: appColors.info },
  addButtonText: { color: appColors.background, fontSize: 13, fontWeight: '900' },
  formActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cancelButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 13, borderRadius: 13, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.backgroundMuted },
  cancelButtonText: { color: appColors.textMuted, fontSize: 12, fontWeight: '900' },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  listTitle: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  countPill: { minWidth: 28, height: 28, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colorAlpha(appColors.info, '22') },
  countText: { color: appColors.info, fontSize: 12, fontWeight: '900' },
  expenseList: { gap: 10 },
  expenseCard: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 15, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  expenseIcon: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  expenseCopy: { flex: 1 },
  expenseDescription: { color: appColors.text, fontSize: 14, fontWeight: '900' },
  expenseCategory: { marginTop: 3, color: appColors.textMuted, fontSize: 12 },
  expenseAmount: { color: appColors.success, fontSize: 14, fontWeight: '900' },
  itemActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  editButton: { padding: 9, borderRadius: 11, backgroundColor: colorAlpha(appColors.info, '12') },
  deleteButton: { padding: 9, borderRadius: 11, backgroundColor: colorAlpha(appColors.accent, '12') },
  emptyState: { minHeight: 220, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 24, borderRadius: 18, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  emptyTitle: { color: appColors.text, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyText: { maxWidth: 360, color: appColors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
});
