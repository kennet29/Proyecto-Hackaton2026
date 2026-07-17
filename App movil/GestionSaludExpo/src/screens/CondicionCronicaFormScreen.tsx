import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import type { RootStackParamList } from '../navigation/types';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { appColors, colorAlpha } from '../theme/colors';
import { openWebDateTimePicker } from '../utils/webDateTimePicker';
import { parseCalendarDate } from '../utils/localDate';

type TipoCondicion = {
  tipocondicionId: number;
  nombre: string;
};

type TipoDocumento = {
  tipodocumentoId: number;
  nombre: string;
};

type ConditionAttachment = {
  id: string;
  uri: string;
  base64Data: string;
  name: string;
  mimeType: string;
  kind: 'image' | 'pdf';
  size?: number;
};

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

type CondicionRecord = {
  condicioncronicaId: number;
  pacienteId: number;
  tipocondicionId: number;
  fechadiagnostico?: string | null;
  estado?: string | null;
  severidad?: string | null;
  tratamientoprincipal?: string | null;
  proximoseguimiento?: string | null;
  notas?: string | null;
};

const toDateOnlyString = (input?: Date | string | null): string => {
  if (!input) return '';
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return '';
    return [
      input.getFullYear(),
      String(input.getMonth() + 1).padStart(2, '0'),
      String(input.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const match = String(input).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
};

const parseDateForPicker = (value?: string) => {
  const normalized = toDateOnlyString(value);
  const parts = normalized.split('-').map(Number);
  if (parts.length === 3 && parts.every((part) => !Number.isNaN(part))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
};

const formatDisplayDate = (value?: string) => {
  if (!value) return 'Selecciona fecha';
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatRecordDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = parseCalendarDate(value);
  if (!parsed) return String(value);
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

type CondicionCronicaFormScreenProps = {
  mode?: 'list' | 'create';
  selectedTipoCondicion?: {
    tipocondicionId: number;
    nombre: string;
  };
  typedConditionName?: string;
};

const normalizeConditionName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export function CondicionCronicaFormScreen({
  mode = 'list',
  selectedTipoCondicion,
  typedConditionName,
}: CondicionCronicaFormScreenProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isCreateMode = mode === 'create';
  const { token, user } = useAuth();
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [typeOptions, setTypeOptions] = useState<TipoCondicion[]>([]);
  const [documentTypes, setDocumentTypes] = useState<TipoDocumento[]>([]);
  const [attachmentTypeId, setAttachmentTypeId] = useState('');
  const [attachments, setAttachments] = useState<ConditionAttachment[]>([]);
  const [records, setRecords] = useState<CondicionRecord[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [showIOSDiagnosticoPicker, setShowIOSDiagnosticoPicker] = useState(false);
  const [showIOSSeguimientoPicker, setShowIOSSeguimientoPicker] = useState(false);
  const [form, setForm] = useState({
    pacienteId: '',
    tipocondicionId: '',
    condicionNombre: '',
    fechadiagnostico: '',
    estado: 'Activa',
    severidad: '',
    tratamientoprincipal: '',
    proximoseguimiento: '',
    notas: '',
  });

  const headers = useMemo<Record<string, string>>(
    () => ({ 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }),
    [token],
  );
  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const handleChange = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const resetForm = useCallback(() => {
    setForm((prev) => ({
      pacienteId: prev.pacienteId,
      tipocondicionId: '',
      condicionNombre: '',
      fechadiagnostico: '',
      estado: 'Activa',
      severidad: '',
      tratamientoprincipal: '',
      proximoseguimiento: '',
      notas: '',
    }));
    setAttachments([]);
  }, []);

  const fetchPatients = useCallback(async () => {
    if (!token) return;
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
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar pacientes');
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, form.pacienteId, token, user?.pacienteId, user?.username]);

  const fetchTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/tipocondicioncronica`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar los tipos');
      setTypeOptions(
        (Array.isArray(body) ? body : [])
          .map((item: any) => ({
            tipocondicionId: Number(item?.tipocondicionId ?? item?.tipocondicionid ?? item?.id ?? 0),
            nombre: item?.nombre ?? 'Sin nombre',
          }))
          .filter(
            (item: TipoCondicion) =>
              Number.isFinite(item.tipocondicionId) && item.tipocondicionId > 0,
          )
          .sort((a: TipoCondicion, b: TipoCondicion) => a.nombre.localeCompare(b.nombre, 'es')),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar tipos de condicion');
    }
  }, [authHeaders]);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/tipodocumentoclinico`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar los tipos de documento');
      const normalized = (Array.isArray(body) ? body : [])
        .map((item: any) => ({
          tipodocumentoId: Number(item?.tipodocumentoId ?? item?.tipodocumentoid ?? item?.id ?? 0),
          nombre: String(item?.nombre ?? '').trim(),
        }))
        .filter((item: TipoDocumento) => item.tipodocumentoId > 0 && item.nombre.length > 0)
        .sort((a: TipoDocumento, b: TipoDocumento) => a.nombre.localeCompare(b.nombre, 'es'));
      setDocumentTypes(normalized);
      setAttachmentTypeId((current) => current || String(normalized[0]?.tipodocumentoId ?? ''));
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar tipos de documento');
    }
  }, [authHeaders]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setLoadingRecords(true);
    try {
      const response = await fetch(`${API_URL}/condicioncronica`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.message ?? 'No se pudieron cargar las condiciones');
      setRecords(
        (Array.isArray(body) ? body : [])
          .map((item: any) => ({
            condicioncronicaId:
              item?.condicioncronicaId ?? item?.condicioncronicaid ?? item?.id ?? Math.random(),
            pacienteId: Number(item?.pacienteId ?? item?.pacienteid ?? 0),
            tipocondicionId: Number(item?.tipocondicionId ?? item?.tipocondicionid ?? 0),
            fechadiagnostico: item?.fechadiagnostico ?? null,
            estado: item?.estado ?? null,
            severidad: item?.severidad ?? null,
            tratamientoprincipal: item?.tratamientoprincipal ?? null,
            proximoseguimiento: item?.proximoseguimiento ?? null,
            notas: item?.notas ?? null,
          }))
          .filter(
            (item: CondicionRecord) =>
              Number.isFinite(item.pacienteId) &&
              item.pacienteId > 0 &&
              Number.isFinite(item.tipocondicionId) &&
              item.tipocondicionId > 0,
          ),
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo al cargar condiciones cronicas');
    } finally {
      setLoadingRecords(false);
    }
  }, [authHeaders, token]);

  useEffect(() => {
    fetchPatients();
    fetchTypes();
    fetchDocumentTypes();
    fetchRecords();
  }, [fetchDocumentTypes, fetchPatients, fetchTypes, fetchRecords]);

  useEffect(() => {
    if (selectedTipoCondicion?.tipocondicionId) {
      setForm((prev) => ({
        ...prev,
        tipocondicionId: String(selectedTipoCondicion.tipocondicionId),
        condicionNombre: selectedTipoCondicion.nombre,
      }));
      return;
    }

    if (typedConditionName !== undefined) {
      setForm((prev) => ({
        ...prev,
        tipocondicionId: '',
        condicionNombre: typedConditionName,
      }));
    }
  }, [selectedTipoCondicion, typedConditionName]);

  const typeNameById = useMemo(() => {
    const map: Record<number, string> = {};
    typeOptions.forEach((item) => {
      map[item.tipocondicionId] = item.nombre;
    });
    return map;
  }, [typeOptions]);

  const patientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    patientOptions.forEach((patient) => {
      map[patient.pacienteId] = patient.displayName;
    });
    return map;
  }, [patientOptions]);

  const groupedPatientConditions = useMemo(() => {
    return patientOptions.map((patient) => ({
      patient,
      conditions: records.filter((record) => record.pacienteId === patient.pacienteId),
    }));
  }, [patientOptions, records]);

  const filteredRecords = useMemo(() => {
    const activePatientId = Number(form.pacienteId);
    return Number.isFinite(activePatientId) && activePatientId > 0
      ? records.filter((record) => record.pacienteId === activePatientId)
      : records;
  }, [form.pacienteId, records]);

  const selectedPatientName = useMemo(() => {
    const activePatientId = Number(form.pacienteId);
    if (!Number.isFinite(activePatientId) || activePatientId <= 0) {
      return 'todos los pacientes';
    }
    return patientNameById[activePatientId] ?? `Paciente #${activePatientId}`;
  }, [form.pacienteId, patientNameById]);

  const selectedConditionName = useMemo(() => {
    const activeTypeId = Number(form.tipocondicionId);
    if (Number.isFinite(activeTypeId) && activeTypeId > 0) {
      return typeNameById[activeTypeId] ?? form.condicionNombre;
    }
    return form.condicionNombre.trim();
  }, [form.condicionNombre, form.tipocondicionId, typeNameById]);

  const showDatePicker = (field: 'fechadiagnostico' | 'proximoseguimiento') => {
    if (openWebDateTimePicker('date', form[field], (value) => handleChange(field, value))) {
      return;
    }
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateForPicker(form[field]),
        mode: 'date',
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) handleChange(field, toDateOnlyString(selected));
        },
      });
      return;
    }
    if (field === 'fechadiagnostico') setShowIOSDiagnosticoPicker(true);
    else setShowIOSSeguimientoPicker(true);
  };

  const resolveTipoCondicionId = useCallback(async () => {
    const selectedId = Number(form.tipocondicionId);
    if (Number.isFinite(selectedId) && selectedId > 0) {
      return selectedId;
    }

    const typedName = form.condicionNombre.trim();
    if (!typedName) {
      throw new Error('Debes escribir o seleccionar una condicion clinica');
    }

    const existingType = typeOptions.find(
      (item) => normalizeConditionName(item.nombre) === normalizeConditionName(typedName),
    );
    if (existingType) {
      setForm((prev) => ({
        ...prev,
        tipocondicionId: String(existingType.tipocondicionId),
        condicionNombre: existingType.nombre,
      }));
      return existingType.tipocondicionId;
    }

    const response = await fetch(`${API_URL}/tipocondicioncronica`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        nombre: typedName,
        activo: true,
        creadopor: user?.username ?? undefined,
      }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(body?.message ?? 'No se pudo crear el tipo de condicion');
    }

    const createdType: TipoCondicion = {
      tipocondicionId: Number(body?.tipocondicionId ?? body?.tipocondicionid ?? body?.id ?? 0),
      nombre: String(body?.nombre ?? typedName),
    };
    if (!Number.isFinite(createdType.tipocondicionId) || createdType.tipocondicionId <= 0) {
      throw new Error('La condicion fue creada, pero no se recibio su identificador');
    }

    setTypeOptions((prev) =>
      [...prev, createdType].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    );
    setForm((prev) => ({
      ...prev,
      tipocondicionId: String(createdType.tipocondicionId),
      condicionNombre: createdType.nombre,
    }));
    return createdType.tipocondicionId;
  }, [form.condicionNombre, form.tipocondicionId, headers, typeOptions, user?.username]);

  const validateAttachmentSize = (size?: number | null) => {
    if (size && size > MAX_ATTACHMENT_BYTES) {
      Alert.alert('Archivo muy grande', 'Cada imagen o PDF puede pesar hasta 3 MB.');
      return false;
    }
    return true;
  };

  const readNativeFileAsDataUrl = async (uri: string, mimeType: string) => {
    const file = new FileSystem.File(uri);
    const base64 = await file.base64();
    return `data:${mimeType};base64,${base64}`;
  };

  const readWebFile = (file: File, kind: ConditionAttachment['kind']) =>
    new Promise<ConditionAttachment>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = typeof reader.result === 'string' ? reader.result : '';
        if (!base64Data) {
          reject(new Error('No se pudo leer el archivo seleccionado'));
          return;
        }
        resolve({
          id: `${Date.now()}-${Math.random()}`,
          uri: kind === 'image' ? base64Data : '',
          base64Data,
          name: file.name || `resultado-${Date.now()}.${kind === 'pdf' ? 'pdf' : 'jpg'}`,
          mimeType: file.type || (kind === 'pdf' ? 'application/pdf' : 'image/jpeg'),
          kind,
          size: file.size,
        });
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado'));
      reader.readAsDataURL(file);
    });

  const pickWebAttachments = (accept: string, kind: ConditionAttachment['kind']) => {
    if (typeof document === 'undefined') return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.multiple = true;
    input.onchange = async () => {
      try {
        const files = Array.from(input.files ?? []).filter((file) => validateAttachmentSize(file.size));
        const selected = await Promise.all(files.map((file) => readWebFile(file, kind)));
        setAttachments((current) => [...current, ...selected]);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron leer los archivos');
      }
    };
    input.click();
  };

  const handlePickImages = async () => {
    if (Platform.OS === 'web') {
      pickWebAttachments('image/jpeg,image/png,image/webp', 'image');
      return;
    }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Debes permitir acceso a tus imágenes.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsMultipleSelection: true,
        quality: 0.5,
        base64: true,
      });
      if (result.canceled) return;
      const selected = await Promise.all(
        result.assets
          .filter((asset) => validateAttachmentSize(asset.fileSize))
          .map(async (asset) => {
            const mimeType = asset.mimeType ?? 'image/jpeg';
            return {
              id: `${Date.now()}-${Math.random()}`,
              uri: asset.uri,
              base64Data: asset.base64
                ? `data:${mimeType};base64,${asset.base64}`
                : await readNativeFileAsDataUrl(asset.uri, mimeType),
              name: asset.fileName ?? `resultado-${Date.now()}.jpg`,
              mimeType,
              kind: 'image' as const,
              size: asset.fileSize,
            };
          }),
      );
      setAttachments((current) => [...current, ...selected]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron elegir las imágenes');
    }
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file || !validateAttachmentSize(file.size)) return;
        try {
          const selected = await readWebFile(file, 'image');
          setAttachments((current) => [...current, selected]);
        } catch (error) {
          Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo leer la fotografía');
        }
      };
      input.click();
      return;
    }
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Debes permitir acceso a la cámara.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.5,
        base64: true,
      });
      if (result.canceled || !result.assets.length) return;
      const asset = result.assets[0];
      if (!validateAttachmentSize(asset.fileSize)) return;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const base64Data = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : await readNativeFileAsDataUrl(asset.uri, mimeType);
      setAttachments((current) => [
        ...current,
        {
          id: `${Date.now()}-${Math.random()}`,
          uri: asset.uri,
          base64Data,
          name: asset.fileName ?? `foto-resultado-${Date.now()}.jpg`,
          mimeType,
          kind: 'image',
          size: asset.fileSize,
        },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo tomar la fotografía');
    }
  };

  const handlePickPdfs = async () => {
    if (Platform.OS === 'web') {
      pickWebAttachments('application/pdf,.pdf', 'pdf');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const selected = await Promise.all(
        result.assets
          .filter((asset) => validateAttachmentSize(asset.size))
          .map(async (asset) => {
            const mimeType = asset.mimeType ?? 'application/pdf';
            return {
              id: `${Date.now()}-${Math.random()}`,
              uri: asset.uri,
              base64Data: await readNativeFileAsDataUrl(asset.uri, mimeType),
              name: asset.name ?? `resultado-${Date.now()}.pdf`,
              mimeType,
              kind: 'pdf' as const,
              size: asset.size,
            };
          }),
      );
      setAttachments((current) => [...current, ...selected]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron elegir los PDF');
    }
  };

  const uploadConditionAttachments = async (
    conditionId: number,
    patientId: number,
    conditionName: string,
  ) => {
    for (const attachment of attachments) {
      const response = await fetch(`${API_URL}/documentoclinico`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId: patientId,
          tipodocumentoId: Number(attachmentTypeId),
          entidadorigen: 'condicioncronica',
          entidadId: conditionId,
          archivoBase64: attachment.base64Data,
          nombreArchivo: attachment.name,
          mimeArchivo: attachment.mimeType,
          notas: `Resultado o diagnóstico asociado a ${conditionName}`,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? `No se pudo guardar ${attachment.name}`);
      }
    }
  };

  const handleSubmit = useCallback(async () => {
    if (!form.pacienteId || !form.condicionNombre.trim()) {
      Alert.alert('Faltan Datos', 'Paciente y condicion clinica son obligatorios');
      return;
    }
    if (attachments.length > 0 && !attachmentTypeId) {
      Alert.alert('Falta tipo de documento', 'Selecciona el tipo de los resultados o diagnósticos adjuntos.');
      return;
    }
    try {
      const tipocondicionId = await resolveTipoCondicionId();
      const response = await fetch(`${API_URL}/condicioncronica`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          tipocondicionId,
          fechadiagnostico: form.fechadiagnostico || undefined,
          estado: form.estado.trim() || 'Activa',
          severidad: form.severidad.trim() || undefined,
          tratamientoprincipal: form.tratamientoprincipal.trim() || undefined,
          proximoseguimiento: form.proximoseguimiento || undefined,
          notas: form.notas.trim() || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudo guardar la condicion cronica');
      }
      const conditionId = Number(
        body?.condicioncronicaId ?? body?.condicioncronicaid ?? body?.id ?? 0,
      );
      if (attachments.length > 0) {
        if (!Number.isFinite(conditionId) || conditionId <= 0) {
          throw new Error('La condición se guardó, pero no fue posible vincular sus archivos');
        }
        await uploadConditionAttachments(
          conditionId,
          Number(form.pacienteId),
          selectedConditionName || form.condicionNombre.trim(),
        );
      }
      Alert.alert(
        'Condición guardada',
        attachments.length > 0
          ? `La condición y ${attachments.length} archivo${attachments.length === 1 ? '' : 's'} se guardaron correctamente`
          : 'La condición crónica fue registrada correctamente',
      );
      resetForm();
      if (isCreateMode && navigation.canGoBack()) {
        navigation.goBack();
      }
      fetchRecords();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la peticion');
    }
  }, [
    attachmentTypeId,
    attachments,
    fetchRecords,
    form,
    headers,
    isCreateMode,
    navigation,
    resetForm,
    resolveTipoCondicionId,
    selectedConditionName,
    user?.username,
  ]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>ENFERMEDADES CRONICAS</Text>
          <Text style={styles.title}>
            {isCreateMode ? 'Nueva enfermedad cronica' : 'Personas y condiciones'}
          </Text>
          <Text style={styles.subtitle}>
            {isCreateMode
              ? 'Registra una nueva enfermedad cronica y deja programado su seguimiento.'
              : 'Revisa rapido que personas tienen condiciones cronicas y luego filtra el detalle si necesitas profundizar.'}
          </Text>
        </View>

        {!isCreateMode ? (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Resumen por persona</Text>
              <Text style={styles.sectionSubtitle}>
                {`${groupedPatientConditions.length} personas vinculadas`}
              </Text>
            </View>

            {loadingPatients || loadingRecords ? (
              <View style={styles.stateBox}>
                <ActivityIndicator color="#38F28E" />
                <Text style={styles.stateText}>Cargando personas y condiciones...</Text>
              </View>
            ) : groupedPatientConditions.length === 0 ? (
              <View style={styles.stateBox}>
                <Text style={styles.stateTitle}>Sin personas vinculadas</Text>
                <Text style={styles.stateText}>
                  Todavia no hay personas disponibles para mostrar condiciones cronicas.
                </Text>
              </View>
            ) : (
              groupedPatientConditions.map(({ patient, conditions }) => (
                <View key={patient.pacienteId} style={styles.personCard}>
                  <View style={styles.personHeader}>
                    <View>
                      <Text style={styles.personName}>{patient.displayName}</Text>
                      <Text style={styles.personMeta}>
                        {conditions.length === 1 ? '1 condicion registrada' : `${conditions.length} condiciones registradas`}
                      </Text>
                    </View>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{conditions.length}</Text>
                    </View>
                  </View>

                  {conditions.length === 0 ? (
                    <Text style={styles.emptyInlineText}>Sin condiciones cronicas registradas.</Text>
                  ) : (
                    conditions.map((record) => (
                      <View key={record.condicioncronicaId} style={styles.conditionRow}>
                        <View style={styles.conditionHeader}>
                          <Text style={styles.conditionName}>
                            {typeNameById[record.tipocondicionId] ?? `Condicion #${record.tipocondicionId}`}
                          </Text>
                          <Text style={styles.conditionState}>{record.estado || 'Sin estado'}</Text>
                        </View>
                        <Text style={styles.conditionText}>
                          Diagnostico: {formatRecordDate(record.fechadiagnostico)}
                        </Text>
                        <Text style={styles.conditionText}>
                          Severidad: {record.severidad || 'Sin dato'}
                        </Text>
                        <Text style={styles.conditionText}>
                          Tratamiento: {record.tratamientoprincipal || 'Sin dato'}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              ))
            )}

            <View style={styles.filterCard}>
              <Text style={styles.label}>Filtrar historial por paciente</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  style={styles.picker}
                  selectedValue={form.pacienteId}
                  onValueChange={(value) => handleChange('pacienteId', String(value))}
                  dropdownIconColor="#F4F8FF"
                >
                  <Picker.Item label="Selecciona un paciente" value="" />
                  {patientOptions.map((patient) => (
                    <Picker.Item
                      key={patient.pacienteId}
                      label={patient.displayName}
                      value={String(patient.pacienteId)}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Historial de condiciones</Text>
              <Text style={styles.sectionSubtitle}>
                {`${filteredRecords.length} registros para ${selectedPatientName}`}
              </Text>
            </View>

            {filteredRecords.length === 0 ? (
              <Text style={styles.emptyText}>No hay condiciones registradas para este paciente.</Text>
            ) : (
              filteredRecords.map((record) => (
                <View key={record.condicioncronicaId} style={styles.card}>
                  <Text style={styles.cardTitle}>
                    {typeNameById[record.tipocondicionId] ?? `Condicion #${record.tipocondicionId}`}
                  </Text>
                  <Text style={styles.cardText}>Paciente: {patientNameById[record.pacienteId] ?? `Paciente #${record.pacienteId}`}</Text>
                  <Text style={styles.cardText}>Diagnostico: {formatRecordDate(record.fechadiagnostico)}</Text>
                  <Text style={styles.cardText}>Estado: {record.estado || 'Sin dato'}</Text>
                  <Text style={styles.cardText}>Severidad: {record.severidad || 'Sin dato'}</Text>
                  <Text style={styles.cardText}>Tratamiento: {record.tratamientoprincipal || 'Sin dato'}</Text>
                  <Text style={styles.cardText}>Seguimiento: {formatRecordDate(record.proximoseguimiento)}</Text>
                  {record.notas ? <Text style={styles.cardText}>Notas: {record.notas}</Text> : null}
                </View>
              ))
            )}
          </>
        ) : null}

        {isCreateMode ? (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva condicion cronica</Text>

            <Text style={styles.label}>Condicion clinica</Text>
            <View style={styles.conditionInputCard}>
              <View style={styles.conditionInputWrapper}>
                <Ionicons name="medical-outline" size={20} color={appColors.info} />
                <TextInput
                  style={styles.conditionInput}
                  placeholder="Escribe la condicion. Ej. Diabetes tipo 2"
                  placeholderTextColor="#9FB3C8"
                  value={form.condicionNombre}
                  autoCapitalize="words"
                  onChangeText={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      condicionNombre: value,
                      tipocondicionId:
                        typeOptions.find(
                          (item) => normalizeConditionName(item.nombre) === normalizeConditionName(value),
                        )?.tipocondicionId.toString() ?? '',
                    }))
                  }
                />
              </View>
              <TouchableOpacity
                style={styles.conditionPickerButton}
                onPress={() =>
                  navigation.navigate('CondicionTipoSelector', {
                    currentName: form.condicionNombre,
                    selectedId: Number(form.tipocondicionId) || undefined,
                  })
                }
              >
                <Ionicons name="search-outline" size={18} color={appColors.text} />
                <Text style={styles.conditionPickerButtonText}>Buscar en lista</Text>
              </TouchableOpacity>
              {selectedConditionName ? (
                <View style={styles.selectedConditionCard}>
                  <Ionicons
                    name={form.tipocondicionId ? 'checkmark-circle' : 'add-circle-outline'}
                    size={18}
                    color={form.tipocondicionId ? appColors.success : appColors.info}
                  />
                  <Text style={styles.selectedConditionText}>
                    {form.tipocondicionId
                      ? `Seleccionada: ${selectedConditionName}`
                      : `Nueva condicion: ${selectedConditionName}`}
                  </Text>
                </View>
              ) : (
                <Text style={styles.fieldHint}>
                  Puedes escribir una condicion nueva o escoger una existente desde el catalogo.
                </Text>
              )}
            </View>

            <Text style={styles.label}>Fecha de diagnostico</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('fechadiagnostico')}>
              <Text style={styles.dateButtonText}>{formatDisplayDate(form.fechadiagnostico)}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showIOSDiagnosticoPicker ? (
              <View style={styles.iosPickerCard}>
                <DateTimePicker
                  value={parseDateForPicker(form.fechadiagnostico)}
                  mode="date"
                  display="spinner"
                  locale="es-NI"
                  onChange={(_, selected) =>
                    selected && handleChange('fechadiagnostico', toDateOnlyString(selected))
                  }
                />
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowIOSDiagnosticoPicker(false)}>
                  <Text style={styles.secondaryBtnText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <TextInput
              style={styles.input}
              placeholder="Estado"
              placeholderTextColor="#9FB3C8"
              value={form.estado}
              onChangeText={(value) => handleChange('estado', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Severidad"
              placeholderTextColor="#9FB3C8"
              value={form.severidad}
              onChangeText={(value) => handleChange('severidad', value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Tratamiento principal"
              placeholderTextColor="#9FB3C8"
              value={form.tratamientoprincipal}
              onChangeText={(value) => handleChange('tratamientoprincipal', value)}
            />

            <Text style={styles.label}>Proximo seguimiento</Text>
            <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('proximoseguimiento')}>
              <Text style={styles.dateButtonText}>{formatDisplayDate(form.proximoseguimiento)}</Text>
            </TouchableOpacity>
            {Platform.OS === 'ios' && showIOSSeguimientoPicker ? (
              <View style={styles.iosPickerCard}>
                <DateTimePicker
                  value={parseDateForPicker(form.proximoseguimiento)}
                  mode="date"
                  display="spinner"
                  locale="es-NI"
                  onChange={(_, selected) =>
                    selected && handleChange('proximoseguimiento', toDateOnlyString(selected))
                  }
                />
                <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowIOSSeguimientoPicker(false)}>
                  <Text style={styles.secondaryBtnText}>Listo</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <View style={styles.attachmentsCard}>
              <View style={styles.attachmentsHeader}>
                <View style={styles.attachmentsHeaderIcon}>
                  <Ionicons name="document-attach-outline" size={22} color={appColors.info} />
                </View>
                <View style={styles.attachmentsHeaderCopy}>
                  <Text style={styles.attachmentsTitle}>Resultados y diagnósticos</Text>
                  <Text style={styles.attachmentsHint}>
                    Adjunta imágenes o PDF de hasta 3 MB por archivo.
                  </Text>
                </View>
                {attachments.length > 0 ? (
                  <View style={styles.attachmentsCount}>
                    <Text style={styles.attachmentsCountText}>{attachments.length}</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.attachmentActions}>
                <TouchableOpacity style={styles.attachmentAction} onPress={handlePickImages}>
                  <Ionicons name="images-outline" size={19} color={appColors.info} />
                  <Text style={styles.attachmentActionText}>Imágenes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachmentAction} onPress={handleTakePhoto}>
                  <Ionicons name="camera-outline" size={19} color={appColors.info} />
                  <Text style={styles.attachmentActionText}>Tomar foto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.attachmentAction} onPress={handlePickPdfs}>
                  <Ionicons name="document-text-outline" size={19} color={appColors.info} />
                  <Text style={styles.attachmentActionText}>Subir PDF</Text>
                </TouchableOpacity>
              </View>

              {attachments.length > 0 ? (
                <>
                  <Text style={styles.attachmentTypeLabel}>Tipo de documento</Text>
                  <View style={styles.attachmentTypePicker}>
                    <Picker
                      style={styles.picker}
                      selectedValue={attachmentTypeId}
                      onValueChange={(value) => setAttachmentTypeId(String(value))}
                      dropdownIconColor={appColors.text}
                    >
                      <Picker.Item label="Selecciona el tipo" value="" />
                      {documentTypes.map((type) => (
                        <Picker.Item
                          key={type.tipodocumentoId}
                          label={type.nombre}
                          value={String(type.tipodocumentoId)}
                        />
                      ))}
                    </Picker>
                  </View>

                  <View style={styles.attachmentsList}>
                    {attachments.map((attachment) => (
                      <View key={attachment.id} style={styles.attachmentItem}>
                        {attachment.kind === 'image' ? (
                          <Image source={{ uri: attachment.uri }} style={styles.attachmentThumb} />
                        ) : (
                          <View style={styles.pdfThumb}>
                            <Ionicons name="document-text" size={25} color={appColors.accent} />
                          </View>
                        )}
                        <View style={styles.attachmentItemCopy}>
                          <Text style={styles.attachmentName} numberOfLines={1}>
                            {attachment.name}
                          </Text>
                          <Text style={styles.attachmentMeta}>
                            {attachment.size
                              ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB`
                              : attachment.mimeType}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.removeAttachment}
                          onPress={() =>
                            setAttachments((current) =>
                              current.filter((item) => item.id !== attachment.id),
                            )
                          }
                          accessibilityLabel={`Quitar ${attachment.name}`}
                        >
                          <Ionicons name="trash-outline" size={19} color={appColors.accent} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.attachmentsEmpty}>
                  <Ionicons name="cloud-upload-outline" size={20} color={appColors.textMuted} />
                  <Text style={styles.attachmentsEmptyText}>No hay archivos seleccionados</Text>
                </View>
              )}
            </View>

            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Notas"
              placeholderTextColor="#9FB3C8"
              value={form.notas}
              multiline
              onChangeText={(value) => handleChange('notas', value)}
            />

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={resetForm}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.primaryBtn} onPress={handleSubmit}>
                <Text style={styles.primaryBtnText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {!isCreateMode ? (
        <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CondicionCronicaCreate')}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#071120',
  },
  container: {
    padding: 24,
    paddingBottom: 110,
    backgroundColor: '#071120',
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#182A44',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1B3355',
  },
  kicker: {
    color: '#29B6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F4F8FF',
  },
  subtitle: {
    marginTop: 8,
    color: '#C9D7E8',
    lineHeight: 20,
  },
  filterCard: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  formCard: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F4F8FF',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F4F8FF',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#0D1B2A',
  },
  picker: {
    color: '#F4F8FF',
  },
  conditionInputCard: {
    backgroundColor: '#0D1B2A',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#27496D',
    marginBottom: 12,
    gap: 10,
  },
  conditionInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#1B3355',
  },
  conditionInput: {
    flex: 1,
    minHeight: 54,
    color: '#F4F8FF',
    fontSize: 16,
  },
  conditionPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 13,
    backgroundColor: '#29B6FF',
  },
  conditionPickerButtonText: {
    color: '#F4F8FF',
    fontWeight: '800',
  },
  selectedConditionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colorAlpha(appColors.info, '14'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '40'),
  },
  selectedConditionText: {
    color: '#C9D7E8',
    flex: 1,
    fontWeight: '700',
  },
  fieldHint: {
    color: '#9FB3C8',
    lineHeight: 18,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    backgroundColor: '#0D1B2A',
  },
  dateButtonText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontSize: 15,
  },
  iosPickerCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0D1B2A',
    marginBottom: 12,
  },
  secondaryBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryBtnText: {
    color: '#29B6FF',
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#0D1B2A',
    color: '#F4F8FF',
  },
  attachmentsCard: {
    gap: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '45'),
    borderRadius: 18,
    backgroundColor: colorAlpha(appColors.info, '0A'),
  },
  attachmentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  attachmentsHeaderIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: colorAlpha(appColors.info, '16'),
  },
  attachmentsHeaderCopy: {
    flex: 1,
  },
  attachmentsTitle: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  attachmentsHint: {
    color: appColors.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  attachmentsCount: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: appColors.info,
  },
  attachmentsCountText: {
    color: appColors.background,
    fontWeight: '900',
  },
  attachmentActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attachmentAction: {
    flex: 1,
    minWidth: 115,
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '55'),
    borderRadius: 13,
    backgroundColor: appColors.backgroundMuted,
  },
  attachmentActionText: {
    color: appColors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  attachmentTypeLabel: {
    color: appColors.textSoft,
    fontSize: 13,
    fontWeight: '800',
  },
  attachmentTypePicker: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 13,
    backgroundColor: appColors.backgroundMuted,
  },
  attachmentsList: {
    gap: 8,
  },
  attachmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '40'),
    borderRadius: 14,
    backgroundColor: colorAlpha(appColors.success, '0C'),
  },
  attachmentThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: appColors.backgroundMuted,
  },
  pdfThumb: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: colorAlpha(appColors.accent, '14'),
  },
  attachmentItemCopy: {
    flex: 1,
    minWidth: 0,
  },
  attachmentName: {
    color: appColors.text,
    fontWeight: '800',
  },
  attachmentMeta: {
    color: appColors.textMuted,
    fontSize: 12,
    marginTop: 3,
  },
  removeAttachment: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colorAlpha(appColors.accent, '10'),
  },
  attachmentsEmpty: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: appColors.border,
    borderRadius: 13,
    backgroundColor: appColors.backgroundMuted,
  },
  attachmentsEmptyText: {
    color: appColors.textMuted,
    fontWeight: '700',
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9FB3C8',
    backgroundColor: '#0D1B2A',
  },
  cancelBtnText: {
    color: '#C9D7E8',
    fontWeight: '700',
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#38F28E',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
  },
  sectionHeader: {
    marginBottom: -4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F4F8FF',
  },
  sectionSubtitle: {
    color: '#C9D7E8',
    marginTop: 2,
  },
  emptyText: {
    color: '#C9D7E8',
    marginBottom: 12,
  },
  stateBox: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 18,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  stateTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
  },
  stateText: {
    color: '#C9D7E8',
    textAlign: 'center',
  },
  personCard: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
    gap: 12,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  personName: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 17,
  },
  personMeta: {
    color: '#29B6FF',
    marginTop: 2,
  },
  countBadge: {
    minWidth: 36,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#071120',
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#29B6FF',
    fontWeight: '800',
    fontSize: 12,
  },
  emptyInlineText: {
    color: '#C9D7E8',
  },
  conditionRow: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#0D1B2A',
    gap: 4,
  },
  conditionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  conditionName: {
    color: '#F4F8FF',
    fontWeight: '700',
    flex: 1,
  },
  conditionState: {
    color: '#38F28E',
    fontWeight: '700',
  },
  conditionText: {
    color: '#C9D7E8',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  cardTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 8,
  },
  cardText: {
    color: '#C9D7E8',
    marginBottom: 4,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#38F28E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  fabText: {
    color: '#F4F8FF',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
  },
});
