import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'NanoConsejero'>;

const DIALOG_TEXT = 'Soy Nano, tu Consejero IA en tema de alimentacion.';

function NanoRobotIcon() {
  return (
    <View style={styles.robotShell}>
      <View style={styles.robotFlame} />
      <View style={styles.robotHead}>
        <View style={styles.robotFace}>
          <View style={styles.robotEye} />
          <View style={styles.robotMouth} />
          <View style={styles.robotEye} />
        </View>
      </View>
      <View style={styles.robotEarLeft} />
      <View style={styles.robotEarRight} />
      <View style={styles.robotBody} />
      <View style={styles.robotFootLeft} />
      <View style={styles.robotFootRight} />
    </View>
  );
}

export function NanoConsejeroScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Asistente IA</Text>
            <Text style={styles.title}>Nano</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={20} color="#dbeafe" />
          </Pressable>
        </View>

        <View style={styles.speechBubble}>
          <Text style={styles.speechTitle}>Hola</Text>
          <Text style={styles.speechText}>{DIALOG_TEXT}</Text>
        </View>

        <View style={styles.stageCard}>
          <View style={styles.stageGlow} />
          <View style={styles.robotBackdrop}>
            <View style={styles.robotWrap}>
              <NanoRobotIcon />
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="sparkles-outline" size={20} color="#38bdf8" />
          <Text style={styles.infoText}>
            Puedes usar este espacio luego para recomendaciones de comidas, rutinas y metas.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: '#0f172a',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 6,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#16233c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#223555',
  },
  speechBubble: {
    marginTop: 24,
    backgroundColor: '#eff6ff',
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  speechTitle: {
    color: '#e11d48',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  speechText: {
    color: '#334155',
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    minHeight: 84,
  },
  stageCard: {
    flex: 1,
    marginTop: 22,
    borderRadius: 34,
    backgroundColor: '#111c34',
    borderWidth: 1,
    borderColor: '#223555',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  stageGlow: {
    position: 'absolute',
    bottom: 82,
    width: 190,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#193d60',
  },
  robotWrap: {
    position: 'relative',
    width: 44,
    height: 44,
    transform: [{ scale: 3.95 }],
  },
  robotBackdrop: {
    width: 142,
    height: 142,
    borderRadius: 71,
    backgroundColor: '#fff7fb',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fecdd3',
    shadowColor: '#020617',
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  robotShell: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  robotFlame: {
    position: 'absolute',
    top: 0,
    right: 8,
    width: 11,
    height: 11,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    backgroundColor: '#fb334b',
    transform: [{ rotate: '22deg' }],
  },
  robotHead: {
    width: 29,
    height: 23,
    marginTop: 4,
    borderRadius: 11,
    backgroundColor: '#fb334b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotFace: {
    width: 23,
    height: 18,
    borderRadius: 8,
    backgroundColor: '#21162d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  robotEye: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#f8fafc',
  },
  robotMouth: {
    width: 4,
    height: 2,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: '#f8fafc',
    marginTop: 4,
  },
  robotEarLeft: {
    position: 'absolute',
    top: 14,
    left: 1,
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: '#21162d',
  },
  robotEarRight: {
    position: 'absolute',
    top: 14,
    right: 1,
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: '#21162d',
  },
  robotBody: {
    width: 14,
    height: 9,
    marginTop: 3,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: '#fb334b',
  },
  robotFootLeft: {
    position: 'absolute',
    bottom: 2,
    left: 8,
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: '#fb334b',
    transform: [{ rotate: '22deg' }],
  },
  robotFootRight: {
    position: 'absolute',
    bottom: 2,
    right: 8,
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: '#fb334b',
    transform: [{ rotate: '-22deg' }],
  },
  infoCard: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: '#111c34',
    borderWidth: 1,
    borderColor: '#223555',
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 12,
  },
  infoText: {
    flex: 1,
    color: '#cbd5f5',
    fontSize: 14,
    lineHeight: 21,
  },
});
