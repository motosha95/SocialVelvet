import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { ChatStackParamList } from './types';
import { Routes } from './routes';
import { ChatListScreen } from '../features/chat/screens/ChatListScreen';
import { ChatDetailScreen } from '../features/chat/screens/ChatDetailScreen';

const Stack = createNativeStackNavigator<ChatStackParamList>();

export const ChatStack = (): React.JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name={Routes.Chat.List}
        component={ChatListScreen}
        options={{ title: 'Messages', headerShown: true }}
      />
      <Stack.Screen
        name={Routes.Chat.Detail}
        component={ChatDetailScreen}
        options={{ title: 'Chat', headerShown: true }}
      />
    </Stack.Navigator>
  );
};
