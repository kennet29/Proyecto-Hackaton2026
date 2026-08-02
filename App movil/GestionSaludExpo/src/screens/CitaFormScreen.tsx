import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { AppText, AppTextInput } from '../components/AppText';

import DateTimePicker, {

  DateTimePickerAndroid,

} from "@react-native-community/datetimepicker";

import { Calendar, DateData } from "react-native-calendars";

import { Picker } from "@react-native-picker/picker";

import { useAuth } from "../context/AuthContext";

import { API_URL } from "../config/api";
import { submitJsonWithOfflineFallback } from "../utils/offlineWriteQueue";
import { openWebDateTimePicker } from "../utils/webDateTimePicker";
import { getJsonWithOfflineFallback } from "../utils/offlineReadCache";



type Appointment = {

  citaId: number;

  pacienteId: number;
  patientName?: string | null;

  estado?: string | null;

  especialidad?: string | null;

  motivo?: string | null;

  date: string;

  timeLabel: string;

};



type LinkedPatient = {

  pacienteId: number;

  displayName: string;

  parentesco?: string | null;

};



type CalendarMarks = {

  [date: string]: {

    selected?: boolean;

    selectedColor?: string;

    selectedTextColor?: string;

    marked?: boolean;

    dotColor?: string;

  };

};



const toDateOnlyString = (input?: Date | string | null): string => {

  if (!input) return "";

  if (input instanceof Date) {

    if (Number.isNaN(input.getTime())) {

      return "";

    }

    return [

      input.getFullYear(),

      String(input.getMonth() + 1).padStart(2, "0"),

      String(input.getDate()).padStart(2, "0"),

    ].join("-");

  }

  const trimmed = input.trim();

  if (!trimmed) return "";

  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {

    const [, year, month, day] = match;

    return `${year}-${month}-${day}`;

  }

  const parsed = new Date(trimmed);

  if (!Number.isNaN(parsed.getTime())) {

    return toDateOnlyString(parsed);

  }

  return "";

};



const formatHumanDate = (date?: string) => {

  if (!date) {

    return "Selecciona una fecha";

  }

  const segments = date.split("-").map((segment) => Number(segment));

  if (segments.length !== 3 || segments.some((item) => Number.isNaN(item))) {

    return date;

  }

  const parsed = new Date(segments[0], segments[1] - 1, segments[2]);

  return parsed.toLocaleDateString("es-NI", {

    weekday: "long",

    month: "long",

    day: "numeric",

  });

};



const formatHourLabel = (value?: string | null) => {

  if (!value) return "Sin hora";

  const parsed = new Date(value);

  if (!Number.isNaN(parsed.getTime())) {

    return parsed.toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" });

  }

  const match = value.match(/T(\d{2}:\d{2})/);

  if (match) {

    return match[1];

  }

  return value;

};



const todayString = () => toDateOnlyString(new Date());



const parseDateForPicker = (value?: string) => {

  const segments = value?.split("-").map((segment) => Number(segment)) ?? [];

  if (segments.length === 3 && segments.every((segment) => !Number.isNaN(segment))) {

    return new Date(segments[0], segments[1] - 1, segments[2]);

  }

  return new Date();

};



const parseTimeForPicker = (value?: string) => {

  const base = new Date();

  base.setSeconds(0, 0);

  const segments = value?.split(":").map((segment) => Number(segment)) ?? [];

  if (segments.length === 2 && segments.every((segment) => !Number.isNaN(segment))) {

    base.setHours(segments[0], segments[1], 0, 0);

    return base;

  }

  base.setHours(9, 0, 0, 0);

  return base;

};



export function CitaFormScreen() {

  const pickerItemColor = Platform.OS === "android" ? "#071120" : "#F4F8FF";

  const [form, setForm] = useState({

    pacienteId: "",

    fecha: "",

    especialidad: "",

    motivo: "",

  });

  const [formDate, setFormDate] = useState(todayString());

  const [formTime, setFormTime] = useState("09:00");

  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const [selectedDate, setSelectedDate] = useState(todayString());

  const [loadingAppointments, setLoadingAppointments] = useState(true);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showForm, setShowForm] = useState(false);

  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);

  const [loadingPatients, setLoadingPatients] = useState(false);

  const [patientError, setPatientError] = useState<string | null>(null);

  const [showIOSDatePicker, setShowIOSDatePicker] = useState(false);

  const [showIOSTimePicker, setShowIOSTimePicker] = useState(false);

  const { token, user } = useAuth();



  const headers = useMemo(() => {

    const base: Record<string, string> = { "Content-Type": "application/json" };

    if (token) {

      base.Authorization = `Bearer ${token}`;

    }

    return base;

  }, [token]);



  useEffect(() => {

    const composed = formDate && formTime ? `${formDate}T${formTime}` : "";

    setForm((prev) => (prev.fecha === composed ? prev : { ...prev, fecha: composed }));

  }, [formDate, formTime]);



  const handleChange = (key: keyof typeof form, value: string) => {

    setForm((prev) => ({ ...prev, [key]: value }));

  };



  const extractPatientName = (item: any): string | null => {
    const nombres =
      item?.paciente?.nombres ??
      item?.nombresPaciente ??
      item?.nombres ??
      item?.pacienteNombres ??
      '';
    const apellidos =
      item?.paciente?.apellidos ??
      item?.apellidosPaciente ??
      item?.apellidos ??
      item?.pacienteApellidos ??
      '';
    const combined = `${nombres} ${apellidos}`.trim();
    if (combined) {
      return combined;
    }
    const fallback =
      item?.paciente?.displayName ??
      item?.displayName ??
      item?.nombrePaciente ??
      item?.pacienteNombre ??
      null;
    return fallback && String(fallback).trim() ? String(fallback) : null;
  };

  const mapAppointments = (payload: any[]): Appointment[] => {

    return payload

      .map((item) => {

        const rawDate = item?.fechacita ?? item?.fecha ?? "";

        const date = toDateOnlyString(rawDate);

        if (!date) {

          return null;

        }

        const patientName = extractPatientName(item);

        return {

          citaId: item?.citaId ?? item?.citaid ?? item?.id ?? Math.random(),

          pacienteId: item?.pacienteId ?? item?.pacienteId ?? 0,

          patientName,

          estado: item?.estado ?? null,

          especialidad: item?.especialidad ?? null,

          motivo: item?.motivo ?? null,

          date,

          timeLabel: formatHourLabel(rawDate),

        } as Appointment;

      })

      .filter((item): item is Appointment => Boolean(item));

  };



  const fetchAppointments = useCallback(async () => {

    setLoadingAppointments(true);

    setFetchError(null);

    try {

      const { data: body } = await getJsonWithOfflineFallback<unknown>(
        "/citamedica",
        headers,
      );

      const data = Array.isArray(body) ? body : [];

      setAppointments(mapAppointments(data));

    } catch (error) {

      setFetchError(error instanceof Error ? error.message : "No se pudieron cargar las citas");

      setAppointments([]);

    } finally {

      setLoadingAppointments(false);

    }

  }, [headers]);



  useEffect(() => {

    fetchAppointments();

  }, [fetchAppointments]);



  const fetchPatients = useCallback(async () => {

    if (!token) {

      setPatientOptions([]);

      return;

    }

    setLoadingPatients(true);

    setPatientError(null);

    try {

      const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, { headers });

      const relations = await response.json().catch(() => null);

      if (!response.ok) {

        throw new Error(relations?.message ?? "No se pudieron cargar las personas");

      }

      const items: LinkedPatient[] = Array.isArray(relations)

        ? await Promise.all(

            relations.map(async (relation: any) => {

              const pacienteId = relation.pacienteId;

              let displayName = relation.nombrePaciente ?? relation.displayName ?? `Paciente #${pacienteId}`;

              try {

                const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, { headers });

                const patient = await patientResponse.json().catch(() => null);

                if (patient && patientResponse.ok) {

                  const nombres = patient?.nombres ?? "";

                  const apellidos = patient?.apellidos ?? "";

                  const candidate = `${nombres} ${apellidos}`.trim();

                  if (candidate) {

                    displayName = candidate;

                  }

                }

              } catch {

                // ignore

              }

              return {

                pacienteId,

                displayName: relation.esPrincipal ? `${displayName} (Principal)` : displayName,

                parentesco: relation.parentesco ?? null,

              };

            }),

          )

        : [];

      setPatientOptions(items);

      if (!form.pacienteId && items.length > 0) {

        setForm((prev) => ({ ...prev, pacienteId: String(items[0].pacienteId) }));

      }

    } catch (error) {

      setPatientError(error instanceof Error ? error.message : "No se pudo cargar la lista");

    } finally {

      setLoadingPatients(false);

    }

  }, [headers, token, form.pacienteId]);



  useEffect(() => {

    fetchPatients();

  }, [fetchPatients]);



  const patientNameById = useMemo(() => {

    const map: Record<number, string> = {};

    patientOptions.forEach((patient) => {

      map[patient.pacienteId] = patient.displayName;

    });

    return map;

  }, [patientOptions]);



  const markedDates: CalendarMarks = useMemo(() => {

    const marks: CalendarMarks = {};

    appointments.forEach((appointment) => {

      const existing = marks[appointment.date] ?? {};

      marks[appointment.date] = {

        ...existing,

        marked: true,

        dotColor: "#FF4D73",

      };

    });

    if (selectedDate) {

      marks[selectedDate] = {

        ...(marks[selectedDate] ?? {}),

        selected: true,

        selectedColor: "#29B6FF",

        selectedTextColor: "#F4F8FF",

        dotColor: marks[selectedDate]?.dotColor ?? "#29B6FF",

        marked: marks[selectedDate]?.marked ?? undefined,

      };

    }

    return marks;

  }, [appointments, selectedDate]);



  const appointmentsForSelectedDay = useMemo(

    () => appointments.filter((appointment) => appointment.date === selectedDate),

    [appointments, selectedDate],

  );



  const handleDayPress = (day: DateData) => {

    setSelectedDate(day.dateString);

    setFormDate(day.dateString);

  };



  const openDatePicker = () => {

    const baseDate = parseDateForPicker(formDate || selectedDate);

    if (openWebDateTimePicker("date", formDate || selectedDate, (value) => {
      setFormDate(value);
      setSelectedDate(value);
    })) {
      return;
    }

    if (Platform.OS === "android") {

      DateTimePickerAndroid.open({

        value: baseDate,

        mode: "date",

        is24Hour: true,

        onChange: (event, picked) => {

          if (event.type === "set" && picked) {

            const newDate = toDateOnlyString(picked);

            setFormDate(newDate);

            setSelectedDate(newDate);

          }

        },

      });

      return;

    }

    setShowIOSDatePicker(true);

  };



  const openTimePicker = () => {

    const baseTime = parseTimeForPicker(formTime);

    if (openWebDateTimePicker("time", formTime, setFormTime)) {
      return;
    }

    if (Platform.OS === "android") {

      DateTimePickerAndroid.open({

        value: baseTime,

        mode: "time",

        is24Hour: true,

        onChange: (event, picked) => {

          if (event.type === "set" && picked) {

            const hh = String(picked.getHours()).padStart(2, "0");

            const mm = String(picked.getMinutes()).padStart(2, "0");

            setFormTime(`${hh}:${mm}`);

          }

        },

      });

      return;

    }

    setShowIOSTimePicker(true);

  };



  const handleSubmit = async () => {

    if (!form.pacienteId || !form.fecha) {

      Alert.alert("Campos requeridos", "Paciente y fecha son obligatorios");

      return;

    }

    setIsSubmitting(true);

    try {

      const offlineResult = await submitJsonWithOfflineFallback({

        token,

        path: "/citamedica",

        method: "POST",

        description: "registrar cita",

        body: {

          pacienteId: Number(form.pacienteId),

          fechacita: form.fecha,

          especialidad: form.especialidad || undefined,

          motivo: form.motivo || undefined,

          creadopor: user?.username ?? undefined,

        },

      });

      if (offlineResult.status === "queued") {

        Alert.alert(

          "Cita en cola",

          "No habia conexion. La cita quedo guardada en este dispositivo y se sincronizara cuando vuelva la red.",

        );

      } else {

        Alert.alert("Cita creada", "La cita quedo registrada");

        fetchAppointments();

      }

      setForm({ pacienteId: "", fecha: "", especialidad: "", motivo: "" });

      setFormDate(selectedDate);

      setFormTime("09:00");

      setShowForm(false);

      return;

      const response = await fetch(`${API_URL}/citamedica`, {

        method: "POST",

        headers,

        body: JSON.stringify({

          pacienteId: Number(form.pacienteId),

          fechacita: form.fecha,

          especialidad: form.especialidad || undefined,

          motivo: form.motivo || undefined,

          creadopor: user?.username ?? undefined,

        }),

      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {

        throw new Error(body?.message ?? "No se pudo agendar la cita");

      }

      Alert.alert("Cita creada", "La cita quedó registrada");

      setForm({ pacienteId: "", fecha: "", especialidad: "", motivo: "" });

      setFormDate(selectedDate);

      setFormTime("09:00");

      fetchAppointments();

      setShowForm(false);

    } catch (error) {

      Alert.alert("Error", error instanceof Error ? error.message : "Falló la petición");

    } finally {

      setIsSubmitting(false);

    }

  };



  const formattedTime = formTime || "09:00";



  return (

    <ScrollView contentContainerStyle={styles.container}>

      <AppText style={styles.pageTitle}>Citas Programadas</AppText>

      <View style={styles.calendarCard}>

        {loadingAppointments ? (

          <View style={styles.loadingBox}>

            <ActivityIndicator color="#29B6FF" />

            <AppText style={styles.loadingText}>Cargando agenda...</AppText>

          </View>

        ) : (

          <Calendar

            markedDates={markedDates}

            onDayPress={handleDayPress}

            initialDate={selectedDate}

            enableSwipeMonths

            firstDay={1}

            theme={{

              todayTextColor: "#29B6FF",

              arrowColor: "#29B6FF",

              selectedDayBackgroundColor: "#29B6FF",

              selectedDayTextColor: "#F4F8FF",

              textDayFontFamily: 'SpaceGrotesk_400Regular',

              textMonthFontFamily: 'Nunito_700Bold',

              textDayHeaderFontFamily: 'SpaceGrotesk_600SemiBold',

            }}

            style={styles.calendar}

          />

        )}

        {fetchError ? <AppText style={styles.errorText}>{fetchError}</AppText> : null}

      </View>



      <View style={styles.patientSection}>

        <AppText style={styles.sectionTitle}>Personas registradas</AppText>

        {loadingPatients ? (

          <View style={styles.loadingBox}>

            <ActivityIndicator color="#29B6FF" />

            <AppText style={styles.loadingText}>Cargando personas...</AppText>

          </View>

        ) : patientOptions.length === 0 ? (

          <View style={styles.emptyPatients}>

            <AppText style={styles.emptyText}>

              No hay personas vinculadas. Regístralas desde Gestionar Expediente.

            </AppText>

            <TouchableOpacity style={styles.refreshBtn} onPress={fetchPatients}>

              <AppText style={styles.refreshBtnText}>Actualizar</AppText>

            </TouchableOpacity>

          </View>

        ) : (

          <View style={styles.patientList}>

            {patientOptions.map((person) => (

              <View key={person.pacienteId} style={styles.patientChip}>

                <AppText style={styles.patientChipTitle}>{person.displayName}</AppText>

                {person.parentesco ? (

                  <AppText style={styles.patientChipSubtitle}>{person.parentesco}</AppText>

                ) : null}

              </View>

            ))}

          </View>

        )}

        {patientError ? <AppText style={styles.errorText}>{patientError}</AppText> : null}

      </View>



      <View style={styles.dailySection}>

        <AppText style={styles.sectionTitle}>{formatHumanDate(selectedDate)}</AppText>

        {appointmentsForSelectedDay.length === 0 ? (

          <AppText style={styles.emptyText}>No hay citas para este día.</AppText>

        ) : (

          appointmentsForSelectedDay.map((appointment) => {

            const resolvedName =

              appointment.patientName ??

              patientNameById[appointment.pacienteId] ??

              `Paciente #${appointment.pacienteId}`;

            return (

              <View key={appointment.citaId} style={styles.appointmentCard}>

                <View style={styles.appointmentHeader}>

                  <AppText style={styles.appointmentHour}>{appointment.timeLabel}</AppText>

                  <View style={styles.statusBadge}>

                    <AppText style={styles.statusBadgeText}>{appointment.estado ?? "Programada"}</AppText>

                  </View>

                </View>

                <AppText style={styles.appointmentTitle}>{resolvedName}</AppText>

                {appointment.especialidad ? (

                  <AppText style={styles.appointmentDetail}>Especialidad: {appointment.especialidad}</AppText>

                ) : null}

                {appointment.motivo ? (

                  <AppText style={styles.appointmentDetail}>Motivo: {appointment.motivo}</AppText>

                ) : null}

              </View>

            );

          })

        )}

      </View>



      {showForm && (

        <View style={styles.formCard}>

          <AppText style={styles.formTitle}>Registrar cita</AppText>

          {loadingPatients ? (

            <View style={styles.loadingBox}>

              <ActivityIndicator color="#29B6FF" />

              <AppText style={styles.loadingText}>Cargando personas...</AppText>

            </View>

          ) : patientOptions.length === 0 ? (

            <View style={styles.emptyPatients}>

              <AppText style={styles.emptyText}>Agrega personas para seleccionar un paciente.</AppText>

            </View>

          ) : (

            <View style={styles.pickerWrapper}>

              <Picker

                selectedValue={form.pacienteId}

                onValueChange={(value) => handleChange("pacienteId", String(value))}

              >

                {patientOptions.map((person) => (

                  <Picker.Item

                    key={person.pacienteId}

                    label={

                      person.parentesco

                        ? `${person.displayName} · ${person.parentesco}`

                        : person.displayName

                    }

                    value={String(person.pacienteId)}

                    color={pickerItemColor}

                  />

                ))}

              </Picker>

            </View>

          )}

          <AppText style={styles.inputLabel}>Fecha y hora</AppText>

          <View style={styles.dateRow}>

            <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>

              <AppText style={styles.dateButtonText}>{formatHumanDate(formDate)}</AppText>

            </TouchableOpacity>

            <TouchableOpacity style={styles.dateButton} onPress={openTimePicker}>

              <AppText style={styles.dateButtonText}>Hora: {formattedTime}</AppText>

            </TouchableOpacity>

          </View>

          {Platform.OS === "ios" && showIOSDatePicker ? (

            <View style={styles.iosPickerWrapper}>

              <DateTimePicker

                mode="date"

                display="spinner"

                value={parseDateForPicker(formDate)}

                onChange={(_, picked) => {

                  if (picked) {

                    const newDate = toDateOnlyString(picked);

                    setFormDate(newDate);

                    setSelectedDate(newDate);

                  }

                }}

              />

              <TouchableOpacity

                style={styles.iosPickerDoneBtn}

                onPress={() => setShowIOSDatePicker(false)}

              >

                <AppText style={styles.iosPickerDoneText}>Listo</AppText>

              </TouchableOpacity>

            </View>

          ) : null}

          {Platform.OS === "ios" && showIOSTimePicker ? (

            <View style={styles.iosPickerWrapper}>

              <DateTimePicker

                mode="time"

                display="spinner"

                value={parseTimeForPicker(formTime)}

                onChange={(_, picked) => {

                  if (picked) {

                    const hh = String(picked.getHours()).padStart(2, "0");

                    const mm = String(picked.getMinutes()).padStart(2, "0");

                    setFormTime(`${hh}:${mm}`);

                  }

                }}

              />

              <TouchableOpacity

                style={styles.iosPickerDoneBtn}

                onPress={() => setShowIOSTimePicker(false)}

              >

                <AppText style={styles.iosPickerDoneText}>Listo</AppText>

              </TouchableOpacity>

            </View>

          ) : null}

          <AppTextInput

            style={styles.input}

            placeholder="Especialidad"

            value={form.especialidad}

            onChangeText={(value) => handleChange("especialidad", value)}

          />

          <AppTextInput

            style={styles.input}

            placeholder="Motivo"

            value={form.motivo}

            onChangeText={(value) => handleChange("motivo", value)}

          />

          <TouchableOpacity

            style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}

            onPress={handleSubmit}

            disabled={isSubmitting || !form.pacienteId}

          >

            {isSubmitting ? (

              <ActivityIndicator color="#F4F8FF" />

            ) : (

              <AppText style={styles.btnText}>Guardar Cita</AppText>

            )}

          </TouchableOpacity>

        </View>

      )}

      <TouchableOpacity style={styles.fab} onPress={() => setShowForm((prev) => !prev)}>
        <AppText style={styles.fabText}>{showForm ? "×" : "+"}</AppText>
      </TouchableOpacity>
    </ScrollView>

  );

}



const styles = StyleSheet.create({

  container: {

    padding: 20,

    backgroundColor: "#071120",

    gap: 16,

  },

  pageTitle: {

    fontSize: 24,

    fontWeight: "700",

    color: "#F4F8FF",

  },

  calendarCard: {

    borderRadius: 20,

    backgroundColor: "#071120",

    padding: 12,

    shadowColor: "#000000",

    shadowOpacity: 0.05,

    shadowRadius: 8,

    elevation: 2,

  },

  calendar: {

    borderRadius: 12,

  },

  loadingBox: {

    alignItems: "center",

    paddingVertical: 24,

  },

  loadingText: {

    marginTop: 8,

    color: "#C9D7E8",

  },

  errorText: {

    color: "#FF4D73",

    marginTop: 8,

    textAlign: "center",

  },

  dailySection: {

    borderRadius: 20,

    backgroundColor: "#071120",

    padding: 16,

    gap: 12,

  },

  sectionTitle: {

    fontSize: 18,

    fontWeight: "700",

    color: "#F4F8FF",

    textTransform: "capitalize",

  },

  emptyText: {

    color: "#C9D7E8",

  },

  appointmentCard: {

    borderWidth: 1,

    borderColor: "#27496D",

    borderRadius: 14,

    padding: 12,

    gap: 4,

  },

  appointmentHeader: {

    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

  },

  appointmentHour: {

    fontSize: 16,

    fontWeight: "700",

    color: "#29B6FF",

  },

  statusBadge: {

    backgroundColor: "#C9D7E8",

    paddingHorizontal: 10,

    paddingVertical: 4,

    borderRadius: 999,

  },

  statusBadgeText: {

    color: "#29B6FF",

    fontWeight: "700",

    fontSize: 12,

  },

  appointmentTitle: {

    fontSize: 16,

    fontWeight: "700",

    color: "#071120",

  },

  appointmentDetail: {

    color: "#9FB3C8",

  },

  toggleBtn: {

    backgroundColor: "#29B6FF",

    borderRadius: 14,

    paddingVertical: 14,

    alignItems: "center",

  },

  toggleBtnText: {

    color: "#F4F8FF",

    fontWeight: "700",

    fontSize: 16,

  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#29B6FF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  fabText: {
    color: "#F4F8FF",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "700",
  },

  patientSection: {

    borderRadius: 20,

    backgroundColor: "#071120",

    padding: 16,

    gap: 10,

  },

  patientList: {

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,

  },

  patientChip: {

    backgroundColor: "#29B6FF18",

    borderRadius: 12,

    paddingVertical: 6,

    paddingHorizontal: 12,

  },

  patientChipTitle: {

    color: "#F4F8FF",

    fontWeight: "700",

  },

  patientChipSubtitle: {

    color: "#C9D7E8",

    fontSize: 12,

  },

  emptyPatients: {

    borderWidth: 1,

    borderColor: "#27496D",

    backgroundColor: "#071120",

    borderRadius: 12,

    padding: 12,

    gap: 8,

  },

  refreshBtn: {

    alignSelf: "flex-start",

    backgroundColor: "#FF4D73",

    borderRadius: 999,

    paddingHorizontal: 12,

    paddingVertical: 6,

  },

  refreshBtnText: {

    color: "#F4F8FF",

    fontWeight: "700",

  },

  formCard: {

    backgroundColor: "#071120",

    borderRadius: 20,

    padding: 18,

    gap: 12,

  },

  formTitle: {

    fontSize: 18,

    fontWeight: "700",

    color: "#F4F8FF",

  },

  pickerWrapper: {

    borderWidth: 1,

    borderColor: "#27496D",

    borderRadius: 12,

    overflow: "hidden",

  },

  inputLabel: {

    fontSize: 13,

    fontWeight: "600",

    color: "#F4F8FF",

  },

  dateRow: {

    flexDirection: "row",

    gap: 12,

  },

  dateButton: {

    flex: 1,

    borderWidth: 1,

    borderColor: "#27496D",

    borderRadius: 12,

    paddingVertical: 12,

    paddingHorizontal: 14,

    backgroundColor: "#071120",

  },

  dateButtonText: {

    color: "#F4F8FF",

    fontSize: 15,

  },

  iosPickerWrapper: {

    marginTop: 8,

    borderWidth: 1,

    borderColor: "#27496D",

    borderRadius: 16,

    backgroundColor: "#071120",

    overflow: "hidden",

  },

  iosPickerDoneBtn: {

    borderTopWidth: 1,

    borderTopColor: "#27496D",

    paddingVertical: 10,

    alignItems: "center",

    backgroundColor: "#071120",

  },

  iosPickerDoneText: {

    color: "#29B6FF30",

    fontWeight: "700",

  },

  input: {

    borderWidth: 1,

    borderColor: "#27496D",

    borderRadius: 12,

    padding: 14,

    fontSize: 16,

  },

  primaryBtn: {

    backgroundColor: "#38E28E",

    paddingVertical: 16,

    borderRadius: 12,

    marginTop: 4,

    alignItems: "center",

  },

  disabledBtn: {

    opacity: 0.7,

  },

  btnText: {

    color: "#F4F8FF",

    fontWeight: "600",

    fontSize: 16,

  },

});
