import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { EventsStackParamList } from './types';
import { Routes } from './routes';
import { EventsListScreen } from '../features/events/screens/EventsListScreen';
import { EventDetailsScreen } from '../features/events/screens/EventDetailsScreen';
import { CreateEventScreen } from '../features/events/screens/CreateEventScreen';
import { EditEventScreen } from '../features/events/screens/EditEventScreen';
import { ScanTicketsScreen } from '../features/events/screens/ScanTicketsScreen';

const Stack = createNativeStackNavigator<EventsStackParamList>();

export const EventsStack = (): React.JSX.Element => {
  return (
    <Stack.Navigator>
      <Stack.Screen name={Routes.Events.List} component={EventsListScreen} options={{ title: 'Events', headerShown: false }} />
      <Stack.Screen name={Routes.Events.Details} component={EventDetailsScreen} options={{ title: 'Event Details' }} />
      <Stack.Screen name={Routes.Events.Create} component={CreateEventScreen} options={{ title: 'Create Event' }} />
      <Stack.Screen name={Routes.Events.Edit} component={EditEventScreen} options={{ title: 'Edit Event' }} />
      <Stack.Screen name={Routes.Events.ScanTickets} component={ScanTicketsScreen} options={{ title: 'Scan Tickets', headerShown: false }} />
    </Stack.Navigator>
  );
};

