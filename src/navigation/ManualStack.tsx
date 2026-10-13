import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ManualScreen } from '../screens/ManualScreen';
import { GrupoScreen } from '../screens/GrupoScreen';
import { FichaScreen } from '../screens/FichaScreen';
import { MusculoScreen } from '../screens/MusculoScreen';
import { GlossarioScreen } from '../screens/GlossarioScreen';
import { MetodosScreen } from '../screens/MetodosScreen';
import { AnilhasScreen } from '../screens/AnilhasScreen';
import { StubScreen } from '../screens/StubScreen';
import { ManualStackParamList } from './types';

const Stack = createNativeStackNavigator<ManualStackParamList>();

export function ManualStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Manual" component={ManualScreen} />
      <Stack.Screen name="Grupo" component={GrupoScreen} />
      <Stack.Screen name="Ficha" component={FichaScreen} />
      <Stack.Screen name="Musculo" component={MusculoScreen} />
      <Stack.Screen name="Glossario" component={GlossarioScreen} />
      <Stack.Screen name="Metodos" component={MetodosScreen} />
      <Stack.Screen name="Anilhas" component={AnilhasScreen} />
      <Stack.Screen name="Stub" component={StubScreen} />
    </Stack.Navigator>
  );
}
