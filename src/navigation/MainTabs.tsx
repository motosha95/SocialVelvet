import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import type { AppTabsParamList } from './types';
import { Routes } from './routes';
import { EventsListScreen } from '../features/events/screens/EventsListScreen';
import { ChatListScreen } from '../features/chat/screens/ChatListScreen';
import { ProfileScreen } from '../features/profile/screens/ProfileScreen';

const Tabs = createBottomTabNavigator<AppTabsParamList>();

export const MainTabs = (): React.JSX.Element => {
  return (
    <Tabs.Navigator>
      <Tabs.Screen name={Routes.App.Events} component={EventsListScreen} options={{ title: 'Events' }} />
      <Tabs.Screen name={Routes.App.Chat} component={ChatListScreen} options={{ title: 'Chat' }} />
      <Tabs.Screen name={Routes.App.Profile} component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tabs.Navigator>
  );
};
