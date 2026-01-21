import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { AppTabsParamList } from './types';
import { Routes } from './routes';
import { EventsStack } from './EventsStack';
import { ChatStack } from './ChatStack';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';

const Tabs = createBottomTabNavigator<AppTabsParamList>();

export const MainTabs = (): React.JSX.Element => {
  return (
    <Tabs.Navigator>
      <Tabs.Screen name={Routes.App.Events} component={EventsStack} options={{ title: 'Events', headerShown: false }} />
      <Tabs.Screen name={Routes.App.Chat} component={ChatStack} options={{ title: 'Chat', headerShown: false }} />
      <Tabs.Screen name={Routes.App.Profile} component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tabs.Navigator>
  );
};
