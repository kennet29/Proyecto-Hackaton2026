import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { appColors, colorAlpha } from '../theme/colors';

type TipoDocumento = {
  tipodocumentoId: number;
  nombre: string;
  descripcion?: string | null;
};

const originOptions = [
  { value: 'general', label: 'General', icon: 'folder-open-outline' },
  { value: 'consultamedica', label: 'Consulta', icon: 'chatbubbles-outline' },
  { value: 'medicacion', label: 'Medicación', icon: 'medkit-outline' },
  { value: 'condicioncronica', label: 'Condición', icon: 'heart-outline' },
  { value: 'examenclinico', label: 'Examen', icon: 'document-text-outline' },
] as const;

export function DocumentoFormScreen() {
  const [form, setForm] = useState({
    pacienteId: '',
    tipoDocumentoId: '',
    entidadOrigen: 'general',
    entidadId: '',
    rutaArchivo: '',
    url: '',
    notas: '',
  });
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [documentTypes, setDocumentTypes] = useState<TipoDocumento[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { token, user } = useAuth();

  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const jsonHeaders = useMemo<Record<string, string>>(
    () => ({ 'Content-Type': 'application/json', ...authHeaders }),
    [authHeaders],
  );

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedType = useMemo(
    () => documentTypes.find((item) => String(item.tipodocumentoId) === form.tipoDocumentoId),
    [documentTypes, form.tipoDocumentoId],
  );

  const selectedPatient = useMemo(
    () => patientOptions.find((item) => String(item.pacienteId) === form.pacienteId),
    [patientOptions, form.pacienteId],
  );

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      return;
    }
    setLoadingPatients(true);
    try {
      let normalized = await fetchLinkedPatients(authHeaders, { forceRefresh: true });
      if (normalized.length === 0 && user?.pacienteId) {
        normalized = [
          {
            pacienteId: Number(user.pacienteId),
            displayName: user?.username?.split('@')[0] || `Paciente #${user.pacienteId}`,
          },
        ];
      }
      setPatientOptions(normalized);
      if (!form.pacienteId && normalized.length > 0) {
        setForm((prev) => ({ ...prev, pacienteId: String(normalized[0].pacienteId) }));
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron cargar las personas');
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, form.pacienteId, token, user?.pacienteId, user?.username]);

  const fetchDocumentTypes = useCallback(async () => {
    setLoadingTypes(true);
    try {
      const response = await fetch(`${API_URL}/tipodocumentoclinico`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudieron cargar los tipos de documento');
      }
      const normalized = (Array.isArray(body) ? body : [])
        .map((item: any) => ({
          tipodocumentoId: Number(item?.tipodocumentoId ?? item?.tipodocumentoid ?? item?.id ?? 0),
          nombre: String(item?.nombre ?? '').trim(),
          descripcion: item?.descripcion ?? null,
        }))
        .filter((item: TipoDocumento) => item.tipodocumentoId > 0 && item.nombre.length > 0)
        .sort((a: TipoDocumento, b: TipoDocumento) => a.nombre.localeCompare(b.nombre, 'es'));
      setDocumentTypes(normalized);
      if (!form.tipoDocumentoId && normalized.length > 0) {
        setForm((prev) => ({ ...prev, tipoDocumentoId: String(normalized[0].tipodocumentoId) }));
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron cargar los tipos');
    } finally {
      setLoadingTypes(false);
    }
  }, [authHeaders, form.tipoDocumentoId]);

  useEffect(() => {
    fetchPatients();
    fetchDocumentTypes();
  }, [fetchPatients, fetchDocumentTypes]);

  const resetForm = () => {
    setForm((prev) => ({
      pacienteId: prev.pacienteId,
      tipoDocumentoId: prev.tipoDocumentoId,
      entidadOrigen: 'general',
      entidadId: '',
      rutaArchivo: '',
      url: '',
      notas: '',
    }));
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.tipoDocumentoId) {
      Alert.alert('Faltan datos', 'Persona asociada y tipo de documento son obligatorios.');
      return;
    }
    if (!form.url.trim() && !form.rutaArchivo.trim()) {
      Alert.alert(
        'Falta referencia',
        'Agrega una URL externa o una ruta del archivo. Esta vista registra la referencia del documento.',
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/documentoclinico`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          tipodocumentoId: Number(form.tipoDocumentoId),
          entidadorigen: form.entidadOrigen,
          entidadId: form.entidadId ? Number(form.entidadId) : undefined,
          rutaarchivo: form.rutaArchivo.trim() || undefined,
          urlexterna: form.url.trim() || undefined,
          notas: form.notas.trim() || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo registrar el documento');
      }
      Alert.alert('Documento guardado', 'La referencia quedó adjunta al expediente clínico.');
      resetForm();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló la petición');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="folder-open-outline" size={30} color={appColors.text} />
          </View>
          <View style={styles.heroPill}>
            <Ionicons name="link-outline" size={14} color={appColors.info} />
            <Text style={styles.heroPillText}>Referencias clínicas</Text>
          </View>
        </View>
        <Text style={styles.kicker}>ESPACIOS CLÍNICOS</Text>
        <Text style={styles.title}>Documentos clínicos</Text>
        <Text style={styles.subtitle}>
          Centraliza enlaces, rutas y referencias de archivos vinculados al expediente del paciente.
        </Text>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={22} color={appColors.info} />
        <View style={styles.infoCopy}>
          <Text style={styles.infoTitle}>Sobre imágenes y PDF</Text>
          <Text style={styles.infoText}>
            Esta vista registra URL o ruta del archivo. Los adjuntos binarios ya existen en módulos específicos como medicación y exámenes clínicos.
          </Text>
        </View>
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Datos principales</Text>

        <Text style={styles.label}>Persona asociada</Text>
        {loadingPatients ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={appColors.info} />
            <Text style={styles.loadingText}>Cargando personas...</Text>
          </View>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              style={styles.picker}
              selectedValue={form.pacienteId}
              onValueChange={(value) => handleChange('pacienteId', String(value))}
              dropdownIconColor={appColors.text}
            >
              <Picker.Item label="Selecciona una persona" value="" />
              {patientOptions.map((patient) => (
                <Picker.Item
                  key={patient.pacienteId}
                  label={patient.displayName}
                  value={String(patient.pacienteId)}
                />
              ))}
            </Picker>
          </View>
        )}
        {selectedPatient ? (
          <View style={styles.selectedCard}>
            <Ionicons name="checkmark-circle" size={18} color={appColors.success} />
            <Text style={styles.selectedText}>{`Expediente de ${selectedPatient.displayName}`}</Text>
          </View>
        ) : null}

        <Text style={styles.label}>Tipo de documento</Text>
        {loadingTypes ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={appColors.info} />
            <Text style={styles.loadingText}>Cargando tipos...</Text>
          </View>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              style={styles.picker}
              selectedValue={form.tipoDocumentoId}
              onValueChange={(value) => handleChange('tipoDocumentoId', String(value))}
              dropdownIconColor={appColors.text}
            >
              <Picker.Item label="Selecciona un tipo" value="" />
              {documentTypes.map((type) => (
                <Picker.Item
                  key={type.tipodocumentoId}
                  label={type.nombre}
                  value={String(type.tipodocumentoId)}
                />
              ))}
            </Picker>
          </View>
        )}
        {selectedType?.descripcion ? <Text style={styles.fieldHint}>{selectedType.descripcion}</Text> : null}
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Origen del documento</Text>
        <Text style={styles.fieldHint}>
          Indica a qué módulo pertenece. Si tienes el ID del registro origen, puedes guardarlo también.
        </Text>
        <View style={styles.originGrid}>
          {originOptions.map((origin) => {
            const active = form.entidadOrigen === origin.value;
            return (
              <TouchableOpacity
                key={origin.value}
                style={[styles.originChip, active && styles.originChipActive]}
                onPress={() => handleChange('entidadOrigen', origin.value)}
              >
                <Ionicons
                  name={origin.icon as any}
                  size={17}
                  color={active ? appColors.background : appColors.info}
                />
                <Text style={[styles.originChipText, active && styles.originChipTextActive]}>{origin.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>ID del registro origen opcional</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. ID de consulta, medicación o condición"
          placeholderTextColor={appColors.textMuted}
          keyboardType="numeric"
          value={form.entidadId}
          onChangeText={(value) => handleChange('entidadId', value)}
        />
      </View>

      <View style={styles.formCard}>
        <Text style={styles.sectionTitle}>Referencia del archivo</Text>
        <Text style={styles.label}>URL externa</Text>
        <TextInput
          style={styles.input}
          placeholder="https://drive.google.com/... o enlace del laboratorio"
          placeholderTextColor={appColors.textMuted}
          value={form.url}
          autoCapitalize="none"
          keyboardType="url"
          onChangeText={(value) => handleChange('url', value)}
        />

        <Text style={styles.label}>Ruta del archivo</Text>
        <TextInput
          style={styles.input}
          placeholder="Ej. expediente/consulta-12/reporte.pdf"
          placeholderTextColor={appColors.textMuted}
          value={form.rutaArchivo}
          autoCapitalize="none"
          onChangeText={(value) => handleChange('rutaArchivo', value)}
        />

        <Text style={styles.label}>Notas</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Describe qué contiene, fecha del estudio o indicaciones relevantes"
          placeholderTextColor={appColors.textMuted}
          value={form.notas}
          multiline
          onChangeText={(value) => handleChange('notas', value)}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={resetForm} disabled={submitting}>
          <Text style={styles.cancelBtnText}>Limpiar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color={appColors.text} /> : <Ionicons name="save-outline" size={20} color={appColors.text} />}
          <Text style={styles.btnText}>{submitting ? 'Guardando...' : 'Guardar documento'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 110,
    backgroundColor: appColors.background,
    gap: 16,
  },
  heroCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colorAlpha(appColors.info, '22'),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '55'),
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: appColors.background,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '44'),
  },
  heroPillText: {
    color: appColors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  kicker: {
    color: appColors.info,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: appColors.text,
  },
  subtitle: {
    marginTop: 8,
    color: appColors.textSoft,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colorAlpha(appColors.info, '12'),
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '45'),
  },
  infoCopy: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    color: appColors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  infoText: {
    color: appColors.textSoft,
    lineHeight: 19,
  },
  formCard: {
    backgroundColor: appColors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: appColors.border,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: appColors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: appColors.text,
    marginTop: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: appColors.backgroundMuted,
  },
  picker: {
    color: appColors.text,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colorAlpha(appColors.success, '14'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '45'),
  },
  selectedText: {
    flex: 1,
    color: appColors.textSoft,
    fontWeight: '700',
  },
  fieldHint: {
    color: appColors.textMuted,
    lineHeight: 18,
  },
  originGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  originChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  originChipActive: {
    backgroundColor: appColors.info,
    borderColor: appColors.info,
  },
  originChipText: {
    color: appColors.textSoft,
    fontWeight: '800',
    fontSize: 12,
  },
  originChipTextActive: {
    color: appColors.background,
  },
  input: {
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    backgroundColor: appColors.backgroundMuted,
    color: appColors.text,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    color: appColors.textSoft,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.backgroundMuted,
  },
  cancelBtnText: {
    color: appColors.textSoft,
    fontWeight: '800',
  },
  primaryBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: appColors.accent,
    paddingVertical: 15,
    borderRadius: 16,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  btnText: {
    color: appColors.text,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
});
