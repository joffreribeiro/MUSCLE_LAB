import { NavigatorScreenParams } from '@react-navigation/native';
import { GroupKey, MuscleKey } from '../types';

export type TreinosStackParamList = {
  Painel: undefined;
  Exercicios: undefined;
  /** editing: abre direto no modo de edição (usado por "Novo treino"). */
  Dia: { editing?: boolean } | undefined;
  Exec: undefined;
  Ficha: { exerciseId: string };
  Musculo: { muscle: MuscleKey; canAdd?: boolean };
  Historico: undefined;
  Medidas: undefined;
  EditarPainel: undefined;
  Resumo: undefined;
  Programas: undefined;
  ProgramaDetalhe: { programId: string };
  Stub: { title: string };
};

export type ManualStackParamList = {
  Manual: undefined;
  Grupo: { groupKey: GroupKey };
  Ficha: { exerciseId: string };
  Musculo: { muscle: MuscleKey; canAdd?: boolean };
  Glossario: undefined;
  Metodos: undefined;
  Anilhas: undefined;
  Stub: { title: string };
};

export type MaisStackParamList = {
  Perfil: undefined;
  Backup: undefined;
  Conta: undefined;
};

export type RootTabParamList = {
  TreinosTab: NavigatorScreenParams<TreinosStackParamList>;
  ManualTab: NavigatorScreenParams<ManualStackParamList>;
  MaisTab: NavigatorScreenParams<MaisStackParamList>;
};
