import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { ProfileStackParamList } from './types';
import { Routes } from './routes';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';
import { VIPSubscriptionScreen } from '../features/profile/screens/VIPSubscriptionScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStack = (): React.JSX.Element => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Profile.Main}
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name={Routes.Profile.Main}
        component={ProfileScreen}
      />
      <Stack.Screen
        name={Routes.Profile.VIPSubscription}
        component={VIPSubscriptionScreen}
        options={{
          headerShown: true,
          title: 'VIP',
          headerBackTitle: 'Profile',
        }}
      />
    </Stack.Navigator>
  );
};
