import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Calendar, DateData } from "react-native-calendars";
import { Picker } from "@react-native-picker/picker";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";

type Appointment = {
  citaId: number;
  pacienteId: number;
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

  const mapAppointments = (payload: any[]): Appointment[] => {
    return payload
      .map((item) => {
        const rawDate = item?.fechacita ?? item?.fecha ?? "";
        const date = toDateOnlyString(rawDate);
        if (!date) {
          return null;
        }
        return {
          citaId: item?.citaId ?? item?.citaid ?? item?.id ?? Math.random(),
          pacienteId: item?.pacienteId ?? item?.pacienteid ?? 0,
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
      const response = await fetch(`${API_URL}/citamedica`, { headers });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? "No se pudieron obtener las citas");
      }
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

  const markedDates: CalendarMarks = useMemo(() => {
    const marks: CalendarMarks = {};
    appointments.forEach((appointment) => {
      const existing = marks[appointment.date] ?? {};
      marks[appointment.date] = {
        ...existing,
        marked: true,
        dotColor: "#f97316",
      };
    });
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? {}),
        selected: true,
        selectedColor: "#2563eb",
        selectedTextColor: "#fff",
        dotColor: marks[selectedDate]?.dotColor ?? "#22d3ee",
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
      const response = await fetch(`${API_URL}/citamedica`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          pacienteid: Number(form.pacienteId),
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
      <Text style={styles.pageTitle}>Citas Programadas</Text>
      <View style={styles.calendarCard}>
        {loadingAppointments ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#2563eb" />
            <Text style={styles.loadingText}>Cargando agenda...</Text>
          </View>
        ) : (
          <Calendar
            markedDates={markedDates}
            onDayPress={handleDayPress}
            initialDate={selectedDate}
            enableSwipeMonths
            firstDay={1}
            theme={{
              todayTextColor: "#2563eb",
              arrowColor: "#2563eb",
              selectedDayBackgroundColor: "#2563eb",
              selectedDayTextColor: "#fff",
              textDayFontFamily: "System",
              textMonthFontFamily: "System",
              textDayHeaderFontFamily: "System",
            }}
            style={styles.calendar}
          />
        )}
        {fetchError ? <Text style={styles.errorText}>{fetchError}</Text> : null}
      </View>

      <View style={styles.patientSection}>
        <Text style={styles.sectionTitle}>Personas registradas</Text>
        {loadingPatients ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#2563eb" />
            <Text style={styles.loadingText}>Cargando personas...</Text>
          </View>
        ) : patientOptions.length === 0 ? (
          <View style={styles.emptyPatients}>
            <Text style={styles.emptyText}>
              No hay personas vinculadas. Regístralas desde Gestionar Expediente.
            </Text>
            <TouchableOpacity style={styles.refreshBtn} onPress={fetchPatients}>
              <Text style={styles.refreshBtnText}>Actualizar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.patientList}>
            {patientOptions.map((person) => (
              <View key={person.pacienteId} style={styles.patientChip}>
                <Text style={styles.patientChipTitle}>{person.displayName}</Text>
                {person.parentesco ? (
                  <Text style={styles.patientChipSubtitle}>{person.parentesco}</Text>
                ) : null}
              </View>
            ))}
          </View>
        )}
        {patientError ? <Text style={styles.errorText}>{patientError}</Text> : null}
      </View>

      <View style={styles.dailySection}>
        <Text style={styles.sectionTitle}>{formatHumanDate(selectedDate)}</Text>
        {appointmentsForSelectedDay.length === 0 ? (
          <Text style={styles.emptyText}>No hay citas para este día.</Text>
        ) : (
          appointmentsForSelectedDay.map((appointment) => (
            <View key={appointment.citaId} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentHour}>{appointment.timeLabel}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{appointment.estado ?? "Programada"}</Text>
                </View>
              </View>
              <Text style={styles.appointmentTitle}>Paciente #{appointment.pacienteId}</Text>
              {appointment.especialidad ? (
                <Text style={styles.appointmentDetail}>Especialidad: {appointment.especialidad}</Text>
              ) : null}
              {appointment.motivo ? (
                <Text style={styles.appointmentDetail}>Motivo: {appointment.motivo}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowForm((prev) => !prev)}>
        <Text style={styles.toggleBtnText}>
          {showForm ? "Cerrar formulario" : "Crear nueva cita"}
        </Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Registrar cita</Text>
          {loadingPatients ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#2563eb" />
              <Text style={styles.loadingText}>Cargando personas...</Text>
            </View>
          ) : patientOptions.length === 0 ? (
            <View style={styles.emptyPatients}>
              <Text style={styles.emptyText}>Agrega personas para seleccionar un paciente.</Text>
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
                  />
                ))}
              </Picker>
            </View>
          )}
          <Text style={styles.inputLabel}>Fecha y hora</Text>
          <View style={styles.dateRow}>
            <TouchableOpacity style={styles.dateButton} onPress={openDatePicker}>
              <Text style={styles.dateButtonText}>{formatHumanDate(formDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dateButton} onPress={openTimePicker}>
              <Text style={styles.dateButtonText}>Hora: {formattedTime}</Text>
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
                <Text style={styles.iosPickerDoneText}>Listo</Text>
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
                <Text style={styles.iosPickerDoneText}>Listo</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <TextInput
            style={styles.input}
            placeholder="Especialidad"
            value={form.especialidad}
            onChangeText={(value) => handleChange("especialidad", value)}
          />
          <TextInput
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
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Guardar Cita</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8fafc",
    gap: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  calendarCard: {
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 12,
    shadowColor: "#000",
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
    color: "#475569",
  },
  errorText: {
    color: "#b91c1c",
    marginTop: 8,
    textAlign: "center",
  },
  dailySection: {
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textTransform: "capitalize",
  },
  emptyText: {
    color: "#475569",
  },
  appointmentCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
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
    color: "#2563eb",
  },
  statusBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: "#1d4ed8",
    fontWeight: "700",
    fontSize: 12,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  appointmentDetail: {
    color: "#475569",
  },
  toggleBtn: {
    backgroundColor: "#0ea5e9",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  toggleBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  patientSection: {
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 16,
    gap: 10,
  },
  patientList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  patientChip: {
    backgroundColor: "#e0f2fe",
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  patientChipTitle: {
    color: "#0f172a",
    fontWeight: "700",
  },
  patientChipSubtitle: {
    color: "#0f172a",
    fontSize: 12,
  },
  emptyPatients: {
    borderWidth: 1,
    borderColor: "#fed7aa",
    backgroundColor: "#fff7ed",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  refreshBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#f97316",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  refreshBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#cbd5f5",
    borderRadius: 12,
    overflow: "hidden",
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#0f172a",
  },
  dateRow: {
    flexDirection: "row",
    gap: 12,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5f5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#f1f5f9",
  },
  dateButtonText: {
    color: "#0f172a",
    fontSize: 15,
  },
  iosPickerWrapper: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#cbd5f5",
    borderRadius: 16,
    backgroundColor: "#f8fafc",
    overflow: "hidden",
  },
  iosPickerDoneBtn: {
    borderTopWidth: 1,
    borderTopColor: "#cbd5f5",
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#e0f2fe",
  },
  iosPickerDoneText: {
    color: "#0f172a",
    fontWeight: "700",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 4,
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.7,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
