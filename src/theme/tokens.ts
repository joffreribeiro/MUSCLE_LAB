// Design tokens extraídos de design_handoff_app_musculacao/README.md e App Treino.dc.html.
// Alta fidelidade: valores exatos, não arredondar nem "harmonizar" com outra paleta.

export const colors = {
  teal500: '#14A8A8',
  teal600: '#0E8A8A',
  teal100: '#BFE7E7',
  teal300: '#4FD3D3',
  navy700: '#1B4A6B',
  navy800: '#16405C',
  navy600: '#245C7F',
  ink: '#1C1C1E',
  gray500: '#8A8F98',
  gray400: '#B4BAC2',
  gray300: '#C3CAD2',
  gray200: '#D2D8DE',
  border: '#E6E9ED',
  divider: '#F0F2F5',
  fill100: '#EEF1F4',
  fill50: '#F4F6F8',
  fill25: '#F7F9FA',
  surface: '#FFFFFF',
  red500: '#E8505B',
  red50: '#FDE8EA',
  red900: '#8C3A42',
  green500: '#3ECF8E',
  amber: '#F5C451',
  pageBg: '#E9ECEF',
} as const;

export const spacing = {
  s2: 2,
  s4: 4,
  s6: 6,
  s7: 7,
  s8: 8,
  s10: 10,
  s12: 12,
  s14: 14,
  s16: 16,
  s18: 18,
  s20: 20,
  s22: 22,
  s24: 24,
  s26: 26,
} as const;

export const radii = {
  calendarCell: 8,
  card: 10,
  chip: 20,
  circle: 9999,
} as const;

export const screenPaddingHorizontal = 16;

export const minTouchTarget = 44;

// text-wrap: pretty não existe em RN; usamos os estilos de fonte diretamente.
export const typography = {
  navbarTitle: { fontSize: 17, fontWeight: '600' as const, color: colors.navy800 },
  programCardTitle: { fontSize: 17, fontWeight: '700' as const, lineHeight: 21, color: colors.surface },
  screenTitle: { fontSize: 22, fontWeight: '700' as const, lineHeight: 26 },
  exerciseExecTitle: { fontSize: 20, fontWeight: '700' as const, lineHeight: 24 },
  dayName: { fontSize: 20, fontWeight: '700' as const },
  sectionTitle: { fontSize: 15, fontWeight: '700' as const, color: colors.navy700 },
  listItem: { fontSize: 15, fontWeight: '600' as const, lineHeight: 19 },
  body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
  secondary: { fontSize: 12, fontWeight: '400' as const, color: colors.gray500 },
  rowCaption: { fontSize: 11, fontWeight: '400' as const, color: colors.gray500 },
  tabLabel: { fontSize: 10, fontWeight: '600' as const },
  sectionLabelUpper: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.96, color: colors.gray500 },
  primaryButton: { fontSize: 15, fontWeight: '700' as const, letterSpacing: 0.6 },
  metricNumber: { fontSize: 22, fontWeight: '700' as const },
  bigRingNumber: { fontSize: 20, fontWeight: '700' as const },
};
