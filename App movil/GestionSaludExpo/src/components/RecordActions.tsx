import React, { useRef, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AppTextInput } from './AppText';
import { useAuth } from '../context/AuthContext';
import { useAppColors } from '../theme/useAppColors';
import { apiFetch, buildJsonHeaders } from '../utils/apiClient';
import { buildRecordPatch, displayValue, fieldsFor } from '../utils/recordEditing';

type Props = { resource: string; recordId: number; onChanged: () => unknown; title?: string };

export function RecordActions({ resource, recordId, onChanged, title = 'Registro' }: Props) {
  const colors = useAppColors();
  const { token } = useAuth();
  const [mode, setMode] = useState<'edit' | 'delete' | 'success' | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [original, setOriginal] = useState<Record<string, unknown> | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const fields = fieldsFor(resource);
  const valid = Number.isInteger(recordId) && recordId > 0 && Boolean(token);
  const styles = StyleSheet.create({
    actions: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 12 },
    button: { minHeight: 44, paddingHorizontal: 14, borderRadius: 10, gap: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceStrong },
    text: { color: colors.text },
    backdrop: { flex: 1, padding: 20, backgroundColor: '#000000AA', justifyContent: 'center', alignItems: 'center' },
    dialog: { width: '100%', maxWidth: 560, maxHeight: '90%', padding: 22, borderRadius: 18, backgroundColor: colors.surface, gap: 14 },
    title: { color: colors.text, fontSize: 21, fontWeight: '800' },
    input: { color: colors.text, backgroundColor: colors.backgroundMuted, borderColor: colors.border, borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 6, marginBottom: 16 },
    error: { color: colors.accent },
  });
  const close = () => {
    if (lock.current) return;
    const changed = mode === 'success';
    setMode(null);
    if (changed) void onChanged();
  };
  const open = async (next: 'edit' | 'delete') => {
    if (!valid || lock.current) return;
    setMode(next); setError(''); setOriginal(null);
    lock.current = true; setBusy(true);
    try {
      const response = await apiFetch(`/${resource}/${recordId}`, { headers: buildJsonHeaders(token) });
      const body = await response.json().catch(() => null);
      if (!response.ok || !body || typeof body !== 'object') throw new Error('No se pudo cargar el registro actualizado. Cierra y vuelve a intentarlo.');
      setOriginal(body);
      setDraft(Object.fromEntries(fields.map((field) => [field.key, displayValue(body[field.key], field)])));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo cargar el registro.'); }
    finally { lock.current = false; setBusy(false); }
  };
  const save = async () => {
    if (lock.current || !original || (mode !== 'edit' && mode !== 'delete')) return;
    lock.current = true; setBusy(true); setError('');
    try {
      const patch = mode === 'edit' ? buildRecordPatch(resource, original, draft) : undefined;
      if (patch && Object.keys(patch).length === 0) { setError('No hay cambios para guardar.'); return; }
      const response = await apiFetch(`/${resource}/${recordId}`, {
        method: mode === 'delete' ? 'DELETE' : 'PATCH', headers: buildJsonHeaders(token),
        ...(patch ? { body: JSON.stringify(patch) } : {}),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(response.status >= 500
          ? 'No se pudo completar la operación. El registro podría tener datos relacionados; se conserva en la lista.'
          : Array.isArray(body?.message) ? body.message.join('. ') : body?.message || 'No se pudo completar la operación.');
      }
      setMessage(mode === 'delete' ? 'Registro eliminado correctamente.' : 'Cambios guardados correctamente.');
      setMode('success');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo completar la operación.'); }
    finally { lock.current = false; setBusy(false); }
  };
  return <>
    <View style={styles.actions}>
      <TouchableOpacity style={styles.button} accessibilityRole="button" accessibilityLabel={`Editar ${title}`} disabled={!valid || busy} onPress={() => void open('edit')}>
        <Ionicons name="create-outline" size={18} color={colors.info} /><AppText style={{ color: colors.info }}>Editar</AppText>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} accessibilityRole="button" accessibilityLabel={`Eliminar ${title}`} disabled={!valid || busy} onPress={() => void open('delete')}>
        <Ionicons name="trash-outline" size={18} color={colors.accent} /><AppText style={{ color: colors.accent }}>Eliminar</AppText>
      </TouchableOpacity>
    </View>
    <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <AppText style={styles.title}>{mode === 'success' ? 'Operación completada' : mode === 'delete' ? '¿Eliminar registro?' : `Editar ${title}`}</AppText>
          {mode !== 'success' && <AppText style={styles.text}>{title} · #{recordId}</AppText>}
          {mode === 'delete' && <AppText style={styles.text}>Se eliminará este registro permanentemente. Esta acción no se puede deshacer.</AppText>}
          {mode === 'success' && <AppText accessibilityRole="alert" style={styles.text}>{message}</AppText>}
          {mode === 'edit' && original && <ScrollView keyboardShouldPersistTaps="handled">
            {fields.map((field) => <View key={field.key}>
              <AppText style={styles.text}>{field.label}{field.required ? ' *' : ''}</AppText>
              <AppTextInput accessibilityLabel={field.label} editable={!busy} style={styles.input} value={draft[field.key] ?? ''}
                placeholder={field.type === 'date' ? 'AAAA-MM-DD' : field.label} placeholderTextColor={colors.textMuted}
                keyboardType={field.type === 'number' ? 'decimal-pad' : 'default'}
                onChangeText={(value) => setDraft((current) => ({ ...current, [field.key]: value }))} />
            </View>)}
          </ScrollView>}
          {Boolean(error) && <AppText accessibilityRole="alert" style={styles.error}>{error}</AppText>}
          {busy && <ActivityIndicator color={colors.info} />}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.button} accessibilityRole="button" disabled={busy} onPress={close}><AppText style={styles.text}>{mode === 'success' ? 'Aceptar' : 'Cancelar'}</AppText></TouchableOpacity>
            {mode !== 'success' && <TouchableOpacity style={styles.button} accessibilityRole="button" disabled={busy || !original} onPress={() => void save()}><AppText style={{ color: mode === 'delete' ? colors.accent : colors.info }}>{mode === 'delete' ? 'Eliminar definitivamente' : 'Guardar cambios'}</AppText></TouchableOpacity>}
          </View>
        </View>
      </View>
    </Modal>
  </>;
}
