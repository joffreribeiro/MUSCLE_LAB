import type { PainelWidgetId, PainelWidgetPref } from '../types';

// Ferramentas do Painel que o usuário pode mostrar, esconder e reordenar. Funções puras.

export interface PainelWidgetInfo {
  id: PainelWidgetId;
  label: string;
  hint: string;
  /** Respeita o seletor de período (7 dias, 30 dias, Sempre). */
  usesPeriod: boolean;
}

/** Ordem padrão = ordem desta lista. */
export const PAINEL_WIDGETS: PainelWidgetInfo[] = [
  { id: 'calendario', label: 'Calendário de treinos', hint: 'Dias treinados, planejados e perdidos no mês', usesPeriod: false },
  { id: 'corpo', label: 'Mapa do corpo', hint: 'Músculos pintados pela carga do período', usesPeriod: true },
  { id: 'grupos', label: 'Séries por grupo muscular', hint: 'Divisão das séries entre os músculos', usesPeriod: true },
  { id: 'pesoLevantado', label: 'Peso levantado', hint: 'Volume em kg por dia, semana ou mês', usesPeriod: true },
  { id: 'duracao', label: 'Duração dos treinos', hint: 'Minutos de cada treino concluído', usesPeriod: true },
  { id: 'calorias', label: 'Calorias estimadas', hint: 'Gasto estimado de cada treino', usesPeriod: true },
  { id: 'tipos', label: 'Tipo de exercício', hint: 'Força, cardio e aquecimento', usesPeriod: true },
  { id: 'medidas', label: 'Medidas corporais', hint: 'Últimas medidas e acesso ao registro', usesPeriod: false },
  { id: 'seriesSemana', label: 'Séries por músculo, por semana', hint: 'Mapa das últimas 6 semanas', usesPeriod: false },
  { id: 'peso', label: 'Meu peso', hint: 'Registro e evolução do peso corporal', usesPeriod: true },
];

const INFO = new Map(PAINEL_WIDGETS.map((w) => [w.id, w]));

export const widgetInfo = (id: PainelWidgetId): PainelWidgetInfo => INFO.get(id)!;

export const defaultWidgetPrefs = (): PainelWidgetPref[] => PAINEL_WIDGETS.map((w) => ({ id: w.id, visible: true }));

/**
 * Preferências completas e válidas: ferramentas desconhecidas ou repetidas saem, ferramentas
 * novas entram no fim, visíveis. Sem preferência salva, vale o padrão; quem tinha desligado
 * as análises antes (`legacyShowAnalytics === false`) mantém só o calendário.
 */
export function resolveWidgets(saved: PainelWidgetPref[] | undefined, legacyShowAnalytics?: boolean): PainelWidgetPref[] {
  if (!saved) {
    return defaultWidgetPrefs().map((p) => ({ ...p, visible: p.id === 'calendario' || legacyShowAnalytics !== false }));
  }
  const seen = new Set<PainelWidgetId>();
  const kept = saved.filter((p) => {
    if (!INFO.has(p.id) || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
  const added = PAINEL_WIDGETS.filter((w) => !seen.has(w.id)).map((w) => ({ id: w.id, visible: true }));
  return [...kept.map((p) => ({ id: p.id, visible: p.visible !== false })), ...added];
}

export function setWidgetVisible(prefs: PainelWidgetPref[], id: PainelWidgetId, visible: boolean): PainelWidgetPref[] {
  return prefs.map((p) => (p.id === id ? { ...p, visible } : p));
}

/** Sobe (-1) ou desce (+1) uma ferramenta na lista; nas pontas não muda nada. */
export function moveWidget(prefs: PainelWidgetPref[], id: PainelWidgetId, delta: -1 | 1): PainelWidgetPref[] {
  const from = prefs.findIndex((p) => p.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= prefs.length) return prefs;
  const next = [...prefs];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Id da primeira ferramenta visível que usa o período: o seletor aparece logo antes dela. */
export function firstPeriodWidget(prefs: PainelWidgetPref[]): PainelWidgetId | null {
  return prefs.find((p) => p.visible && widgetInfo(p.id).usesPeriod)?.id ?? null;
}
