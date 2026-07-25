import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { appColors } from '../theme/colors';

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[app-error-boundary] error no controlado', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <View style={styles.screen}>
        <View style={styles.card}>
          <AppText style={styles.eyebrow}>RECUPERACION</AppText>
          <AppText style={styles.title}>La pantalla fallo</AppText>
          <AppText style={styles.body}>
            Se capturo un error inesperado para evitar que toda la app se cierre.
          </AppText>
          <AppText style={styles.detail} numberOfLines={4}>
            {this.state.error.message || 'Error sin mensaje'}
          </AppText>
          <Pressable style={styles.button} onPress={this.handleReset}>
            <AppText style={styles.buttonText}>Intentar de nuevo</AppText>
          </Pressable>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    padding: 22,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  eyebrow: {
    color: appColors.info,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    color: appColors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  body: {
    marginTop: 10,
    color: appColors.textSoft,
    lineHeight: 20,
  },
  detail: {
    marginTop: 12,
    color: appColors.accent,
    lineHeight: 20,
  },
  button: {
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: appColors.info,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: appColors.text,
    fontWeight: '800',
  },
});
