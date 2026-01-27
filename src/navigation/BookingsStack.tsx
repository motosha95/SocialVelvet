import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import type { BookingsStackParamList } from './types';
import { Routes } from './routes';
import { MyBookingsScreen } from '../features/bookings/screens/MyBookingsScreen';

const Stack = createNativeStackNavigator<BookingsStackParamList>();

export const BookingsStack = (): React.JSX.Element => {
  return (
    <Stack.Navigator
      initialRouteName={Routes.Bookings.Upcoming}
    >
      <Stack.Screen 
        name={Routes.Bookings.Upcoming} 
        component={MyBookingsScreen} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name={Routes.Bookings.Past} 
        component={MyBookingsScreen} 
        options={{ headerShown: false }} 
      />
    </Stack.Navigator>
  );
};
