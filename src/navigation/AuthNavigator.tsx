import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { AuthStackParamList } from './types';
import { Routes } from './routes';
import { LoginScreen } from '../features/auth/screens/LoginScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export const AuthNavigator = (): React.JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen name={Routes.Auth.Login} component={LoginScreen} options={{ title: 'Sign in' }} />
    </Stack.Navigator>
  );
};
