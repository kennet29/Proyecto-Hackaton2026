import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { obtenerNivel } from '../data/educacion';

type Props = NativeStackScreenProps<RootStackParamList, 'EducacionNivel'>;

export function EducacionNivelScreen({ route, navigation }: Props) {
  const nivelId = route.params?.nivelId;
  const nivel = useMemo(
    () => (nivelId ? obtenerNivel(nivelId) : null),
    [nivelId],
  );

  if (!nivel) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>No se pudo abrir este nivel educativo.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{nivel.nombre}</Text>
      <Text style={styles.subtitle}>{nivel.enfoque}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>CÃƒÆ’Ã‚Â³mo lo explicamos</Text>
        <View style={styles.tagRow}>
          {nivel.comoMostrar.map((item) => (
            <View key={item} style={styles.tag}>
              <Text style={styles.tagText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>

      <FlatList
        data={nivel.temas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EducacionTema', { nivelId: nivel.id, temaId: item.id })}
          >
            <Text style={styles.cardTitle}>{item.titulo}</Text>
            <Text style={styles.cardDescription}>{item.descripcion}</Text>
            <View style={styles.tagRow}>
              {item.formato.slice(0, 2).map((fmt) => (
                <View key={fmt} style={styles.smallTag}>
                  <Text style={styles.smallTagText}>{fmt}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#071120',
    padding: 20,
  },
  title: {
    color: '#F4F8FF',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 6,
  },
  subtitle: {
    color: '#C9D7E8',
    marginBottom: 16,
  },
  section: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    marginBottom: 10,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#29B6FF22',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: '#29B6FF',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#132238',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDescription: {
    color: '#C9D7E8',
    marginBottom: 10,
  },
  smallTag: {
    backgroundColor: '#FF4D7322',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  smallTagText: {
    color: '#FF4D73',
    fontSize: 11,
  },
  listContent: {
    paddingBottom: 30,
  },
  errorText: {
    color: '#FF4D73',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 24,
  },
  backBtn: {
    marginTop: 16,
    alignSelf: 'center',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#FF4D73',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backBtnText: {
    color: '#FF4D73',
    fontWeight: '700',
  },
});
