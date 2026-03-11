import React, { useEffect } from 'react';
import { View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../lib/constants';
import MiniPlayer from '../components/MiniPlayer';

import SplashScreen from '../screens/SplashScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import BookDetailScreen from '../screens/BookDetailScreen';
import PlayerScreen from '../screens/PlayerScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: ['audiobooks://'],
  config: {
    screens: {
      BookDetail: 'book/:bookId',
      Player: 'player/:bookId',
    },
  },
};

export default function Navigation() {
  const { isLoading, isAuthenticated, restoreSession } = useAuthStore();

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <NavigationContainer linking={linking}>
      <View style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.background },
          }}
        >
          {isLoading ? (
            <Stack.Screen name="Splash" component={SplashScreen} />
          ) : !isAuthenticated ? (
            <>
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
              <Stack.Screen name="Auth" component={AuthNavigator} />
            </>
          ) : (
            <>
              <Stack.Screen name="Main" component={MainNavigator} />
              <Stack.Screen
                name="BookDetail"
                component={BookDetailScreen}
                options={{
                  headerShown: true,
                  headerTransparent: true,
                  headerTitle: '',
                  headerTintColor: COLORS.white,
                }}
              />
              <Stack.Screen
                name="Player"
                component={PlayerScreen}
                options={{
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }}
              />
            </>
          )}
        </Stack.Navigator>
        {isAuthenticated && <MiniPlayer />}
      </View>
    </NavigationContainer>
  );
}
