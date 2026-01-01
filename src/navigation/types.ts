import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Routes } from './routes';

export type AuthStackParamList = {
  [Routes.Auth.Login]: undefined;
};

export type AppTabsParamList = {
  [Routes.App.Events]: undefined;
  [Routes.App.Chat]: undefined;
  [Routes.App.Profile]: undefined;
};

export type RootStackParamList = {
  AuthStack: NavigatorScreenParams<AuthStackParamList>;
  AppTabs: NavigatorScreenParams<AppTabsParamList>;
};
