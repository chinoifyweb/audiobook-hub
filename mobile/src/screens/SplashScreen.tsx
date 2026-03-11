import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '../lib/constants';

export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>AudioBooks</Text>
      <Text style={styles.tagline}>Listen. Learn. Explore.</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 40,
  },
  loader: {
    marginTop: 20,
  },
});
