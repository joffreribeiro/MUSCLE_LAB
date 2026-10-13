import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PerfilScreen } from '../screens/PerfilScreen';
import { BackupScreen } from '../screens/BackupScreen';
import { ContaScreen } from '../screens/ContaScreen';
import { MaisStackParamList } from './types';

const Stack = createNativeStackNavigator<MaisStackParamList>();

export function MaisStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Perfil" component={PerfilScreen} />
      <Stack.Screen name="Backup" component={BackupScreen} />
      <Stack.Screen name="Conta" component={ContaScreen} />
    </Stack.Navigator>
  );
}
