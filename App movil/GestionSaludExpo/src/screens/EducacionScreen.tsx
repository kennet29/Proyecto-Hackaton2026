import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { nivelesEducativos } from '../data/educacion';

type Props = NativeStackScreenProps<RootStackParamList, 'Educacion'>;

export function EducacionScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Elige Un Nivel</Text>
      <Text style={styles.subtitle}>
        contenido educativo diseÃƒÂ±ado para niÃƒÂ±os, adolescentes y adultos
      </Text>

      <FlatList
        data={nivelesEducativos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('EducacionNivel', { nivelId: item.id })}
          >
            <Text style={styles.cardLabel}>{item.nombre}</Text>
            <Text style={styles.cardDescription}>{item.enfoque}</Text>
            <View style={styles.tagRow}>
              {item.comoMostrar.slice(0, 3).map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
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
  listContent: {
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#132238',
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },
  cardLabel: {
    color: '#F4F8FF',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  cardDescription: {
    color: '#C9D7E8',
    lineHeight: 20,
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
});
