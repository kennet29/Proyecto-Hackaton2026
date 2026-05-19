import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { healthTips } from '../data/healthTips';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MenuLoading'>;

const LOADER_SCALE = 1.48;
const LOADER_WIDTH = 220 * LOADER_SCALE;
const LOADER_HEIGHT = 84 * LOADER_SCALE;
const LOADER_BACKGROUND = '#111c34';
const ECG_COLOR = '#38bdf8';
const DISPLAY_TIP_COUNT = 3;
const ENTER_DURATION_MS = 2500;
const TIP_ROTATION_MS = 1600;

type HeartSegment = {
  width: number;
  left: number;
  top: number;
  rotate: string;
};

const heartSegments: HeartSegment[] = [
  { width: 58, left: 0, top: 48, rotate: '0deg' },
  { width: 15, left: 54, top: 40, rotate: '-62deg' },
  { width: 15, left: 64, top: 40, rotate: '62deg' },
  { width: 12, left: 76, top: 48, rotate: '0deg' },
  { width: 12, left: 86, top: 40, rotate: '62deg' },
  { width: 34, left: 96, top: 24, rotate: '-78deg' },
  { width: 42, left: 118, top: 28, rotate: '80deg' },
  { width: 15, left: 145, top: 48, rotate: '-70deg' },
  { width: 16, left: 156, top: 44, rotate: '35deg' },
  { width: 63, left: 168, top: 48, rotate: '0deg' },
];

const scaledHeartSegments: HeartSegment[] = heartSegments.map((segment) => ({
  width: segment.width * LOADER_SCALE,
  left: segment.left * LOADER_SCALE,
  top: segment.top * LOADER_SCALE,
  rotate: segment.rotate,
}));

function HeartRateLoader() {
  const fadeInWidth = useRef(new Animated.Value(LOADER_WIDTH)).current;
  const fadeOutTranslate = useRef(new Animated.Value(-LOADER_WIDTH * 1.2)).current;

  useEffect(() => {
    const fadeInLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeInWidth, {
          toValue: 0,
          duration: ENTER_DURATION_MS / 2,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
        Animated.timing(fadeInWidth, {
          toValue: 0,
          duration: ENTER_DURATION_MS / 2,
          easing: Easing.linear,
          useNativeDriver: false,
        }),
      ]),
    );

    const fadeOutLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeOutTranslate, {
          toValue: -LOADER_WIDTH * 1.2,
          duration: ENTER_DURATION_MS * 0.3,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(fadeOutTranslate, {
          toValue: 0,
          duration: ENTER_DURATION_MS * 0.7,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    fadeInLoop.start();
    fadeOutLoop.start();

    return () => {
      fadeInLoop.stop();
      fadeOutLoop.stop();
    };
  }, [fadeInWidth, fadeOutTranslate]);

  return (
    <View style={styles.loaderFrame}>
      <View style={styles.loaderGrid} pointerEvents="none" />
      <View style={styles.lineBase} />
      <View style={styles.segmentLayer}>
        {scaledHeartSegments.map((segment, index) => (
          <View
            key={`heart-segment-${index}`}
            style={[
              styles.segment,
              {
                width: segment.width,
                left: segment.left,
                top: segment.top,
                transform: [{ rotate: segment.rotate }],
              },
            ]}
          />
        ))}
      </View>
      <Animated.View
        style={[
          styles.fadeInMask,
          {
            width: fadeInWidth,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.fadeOutMask,
          {
            transform: [{ translateX: fadeOutTranslate }],
          },
        ]}
      />
    </View>
  );
}

export function MenuLoadingScreen({ navigation }: Props) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const rotation = setInterval(() => {
      setTipIndex((current) => (current + 1) % healthTips.length);
    }, TIP_ROTATION_MS);

    const timeout = setTimeout(() => {
      navigation.replace('MenuPrincipal');
    }, ENTER_DURATION_MS + 700);

    return () => {
      clearInterval(rotation);
      clearTimeout(timeout);
    };
  }, [navigation]);

  const visibleTips = useMemo(
    () =>
      Array.from({ length: DISPLAY_TIP_COUNT }, (_, offset) => {
        const index = (tipIndex + offset) % healthTips.length;
        return {
          index,
          text: healthTips[index],
        };
      }),
    [tipIndex],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.backgroundOrbPrimary} />
        <View style={styles.backgroundOrbSecondary} />
        <View style={styles.topSpacer} />

        <View style={styles.centerBlock}>
          <View style={styles.loaderCard}>
            <Text style={styles.loaderEyebrow}>CARGANDO PANEL DE SALUD</Text>
            <HeartRateLoader />
          </View>
          <Text style={styles.loadingText}>Sincronizando informacion importante...</Text>
        </View>

        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Text style={styles.tipsTitle}>Consejos de salud</Text>
            <Text style={styles.tipsCounter}>
              {tipIndex + 1} / {healthTips.length}
            </Text>
          </View>

          <Text style={styles.primaryTip}>{visibleTips[0]?.text}</Text>

          <View style={styles.tipDivider} />

          {visibleTips.slice(1).map((tip) => (
            <Text key={`tip-${tip.index}`} style={styles.secondaryTip}>
              • {tip.text}
            </Text>
          ))}
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
  screen: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
    justifyContent: 'space-between',
  },
  backgroundOrbPrimary: {
    position: 'absolute',
    top: -70,
    right: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(56, 189, 248, 0.11)',
  },
  backgroundOrbSecondary: {
    position: 'absolute',
    bottom: 120,
    left: -55,
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
  },
  topSpacer: {
    height: 24,
  },
  centerBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  loaderCard: {
    width: '100%',
    maxWidth: 370,
    backgroundColor: '#111c34',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#020617',
    shadowOpacity: 0.28,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  loaderEyebrow: {
    color: '#7dd3fc',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  loaderFrame: {
    width: LOADER_WIDTH,
    height: LOADER_HEIGHT,
    borderRadius: 28,
    backgroundColor: LOADER_BACKGROUND,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#29466b',
  },
  loaderGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.42,
    backgroundColor: 'transparent',
    borderColor: 'rgba(148, 163, 184, 0.12)',
    borderWidth: 1,
  },
  segmentLayer: {
    width: LOADER_WIDTH,
    height: LOADER_HEIGHT,
    position: 'absolute',
  },
  lineBase: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 48 * LOADER_SCALE,
    height: 4,
    backgroundColor: ECG_COLOR,
    opacity: 0.18,
  },
  segment: {
    position: 'absolute',
    height: 4,
    borderRadius: 99,
    backgroundColor: ECG_COLOR,
  },
  fadeInMask: {
    position: 'absolute',
    height: LOADER_HEIGHT,
    top: 0,
    right: 0,
    backgroundColor: LOADER_BACKGROUND,
  },
  fadeOutMask: {
    position: 'absolute',
    width: LOADER_WIDTH * 1.2,
    height: LOADER_HEIGHT,
    top: 0,
    left: -LOADER_WIDTH * 1.2,
    backgroundColor: LOADER_BACKGROUND,
  },
  loadingText: {
    color: '#dbeafe',
    fontSize: 15,
    fontWeight: '700',
  },
  tipsCard: {
    backgroundColor: '#111c34',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    shadowColor: '#020617',
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tipsTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
  },
  tipsCounter: {
    color: '#7dd3fc',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryTip: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '600',
  },
  tipDivider: {
    height: 1,
    backgroundColor: '#29466b',
    marginVertical: 12,
  },
  secondaryTip: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
});

