import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { appColors } from '../theme/colors';

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
            <Ionicons name="close" size={20} color={appColors.textSoft} />
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
          <Ionicons name="sparkles-outline" size={20} color={appColors.info} />
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
    backgroundColor: appColors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 24,
    backgroundColor: appColors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    color: appColors.info,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: appColors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 6,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: appColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appColors.border,
  },
  speechBubble: {
    marginTop: 24,
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  speechTitle: {
    color: appColors.accent,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  speechText: {
    color: appColors.textSoft,
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '500',
    minHeight: 84,
  },
  stageCard: {
    flex: 1,
    marginTop: 22,
    borderRadius: 34,
    backgroundColor: appColors.surfaceStrong,
    borderWidth: 1,
    borderColor: appColors.border,
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
    backgroundColor: appColors.borderStrong,
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
    backgroundColor: appColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appColors.borderStrong,
    shadowColor: appColors.overlay,
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
    backgroundColor: appColors.accent,
    transform: [{ rotate: '22deg' }],
  },
  robotHead: {
    width: 29,
    height: 23,
    marginTop: 4,
    borderRadius: 11,
    backgroundColor: appColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  robotFace: {
    width: 23,
    height: 18,
    borderRadius: 8,
    backgroundColor: appColors.background,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  robotEye: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: appColors.text,
  },
  robotMouth: {
    width: 4,
    height: 2,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: appColors.text,
    marginTop: 4,
  },
  robotEarLeft: {
    position: 'absolute',
    top: 14,
    left: 1,
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: appColors.background,
  },
  robotEarRight: {
    position: 'absolute',
    top: 14,
    right: 1,
    width: 3,
    height: 9,
    borderRadius: 2,
    backgroundColor: appColors.background,
  },
  robotBody: {
    width: 14,
    height: 9,
    marginTop: 3,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 9,
    backgroundColor: appColors.accent,
  },
  robotFootLeft: {
    position: 'absolute',
    bottom: 2,
    left: 8,
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: appColors.accent,
    transform: [{ rotate: '22deg' }],
  },
  robotFootRight: {
    position: 'absolute',
    bottom: 2,
    right: 8,
    width: 8,
    height: 5,
    borderRadius: 4,
    backgroundColor: appColors.accent,
    transform: [{ rotate: '-22deg' }],
  },
  infoCard: {
    marginTop: 18,
    borderRadius: 22,
    backgroundColor: appColors.surfaceStrong,
    borderWidth: 1,
    borderColor: appColors.border,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    columnGap: 12,
  },
  infoText: {
    flex: 1,
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
});
