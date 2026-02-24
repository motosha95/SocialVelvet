import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Routes } from './routes';

export type AuthStackParamList = {
  [Routes.Auth.Login]: undefined;
  [Routes.Auth.Register]: undefined;
};

export type EventsStackParamList = {
  [Routes.Events.List]: undefined;
  [Routes.Events.Details]: { eventId: string };
  [Routes.Events.Create]: { copyFromEventId?: string } | undefined;
  [Routes.Events.Edit]: { eventId: string };
  [Routes.Events.ScanTickets]: { eventId: string };
};

export type ChatStackParamList = {
  [Routes.Chat.List]: undefined;
  [Routes.Chat.Detail]: { conversationId: string };
};

export type BookingsStackParamList = {
  [Routes.Bookings.Upcoming]: undefined;
  [Routes.Bookings.Past]: undefined;
};

export type ProfileStackParamList = {
  [Routes.Profile.Main]: undefined;
  [Routes.Profile.VIPSubscription]: undefined;
};

export type AppTabsParamList = {
  [Routes.App.Events]: NavigatorScreenParams<EventsStackParamList>;
  [Routes.App.Chat]: NavigatorScreenParams<ChatStackParamList>;
  [Routes.App.Profile]: NavigatorScreenParams<ProfileStackParamList>;
  [Routes.App.Bookings]: NavigatorScreenParams<BookingsStackParamList>;
  [Routes.App.Challenges]: undefined;
};

export type RootStackParamList = {
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
  AppTabs: NavigatorScreenParams<AppTabsParamList>;
};
