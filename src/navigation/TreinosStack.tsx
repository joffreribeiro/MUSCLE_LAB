import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PainelScreen } from '../screens/PainelScreen';
import { ExerciciosScreen } from '../screens/ExerciciosScreen';
import { DiaScreen } from '../screens/DiaScreen';
import { ExecScreen } from '../screens/ExecScreen';
import { FichaScreen } from '../screens/FichaScreen';
import { ResumoScreen } from '../screens/ResumoScreen';
import { MusculoScreen } from '../screens/MusculoScreen';
import { HistoricoScreen } from '../screens/HistoricoScreen';
import { MedidasScreen } from '../screens/MedidasScreen';
import { EditarPainelScreen } from '../screens/EditarPainelScreen';
import { ProgramasScreen } from '../screens/ProgramasScreen';
import { ProgramaDetalheScreen } from '../screens/ProgramaDetalheScreen';
import { StubScreen } from '../screens/StubScreen';
import { TreinosStackParamList } from './types';

const Stack = createNativeStackNavigator<TreinosStackParamList>();

export function TreinosStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Painel" component={PainelScreen} />
      <Stack.Screen name="Exercicios" component={ExerciciosScreen} />
      <Stack.Screen name="Dia" component={DiaScreen} />
      <Stack.Screen name="Exec" component={ExecScreen} />
      <Stack.Screen name="Ficha" component={FichaScreen} />
      <Stack.Screen name="Musculo" component={MusculoScreen} />
      <Stack.Screen name="Historico" component={HistoricoScreen} />
      <Stack.Screen name="Medidas" component={MedidasScreen} />
      <Stack.Screen name="EditarPainel" component={EditarPainelScreen} />
      <Stack.Screen name="Resumo" component={ResumoScreen} />
      <Stack.Screen name="Programas" component={ProgramasScreen} />
      <Stack.Screen name="ProgramaDetalhe" component={ProgramaDetalheScreen} />
      <Stack.Screen name="Stub" component={StubScreen} />
    </Stack.Navigator>
  );
}
