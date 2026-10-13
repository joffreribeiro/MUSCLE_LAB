// Formatação numérica pt-BR sem depender de dados de locale do Intl no runtime do Hermes.
export function formatNumberPtBR(n: number): string {
  const rounded = Math.round(n);
  const negative = rounded < 0;
  const digits = Math.abs(rounded).toString();
  let grouped = '';
  for (let i = 0; i < digits.length; i++) {
    const posFromEnd = digits.length - i;
    grouped += digits[i];
    if (posFromEnd > 1 && posFromEnd % 3 === 1) grouped += '.';
  }
  return (negative ? '-' : '') + grouped;
}

// mm:ss a partir de segundos totais.
export function formatMinSec(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const WEEKDAYS = ['Dom.', 'Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.'];
const pad2 = (n: number) => String(n).padStart(2, '0');

// "Sáb., 31.10.2020" — mesmo formato dos cabeçalhos de histórico do protótipo.
export function formatSessionDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${pad2(date.getDate())}.${pad2(date.getMonth() + 1)}.${date.getFullYear()}`;
}

// "12/10" — data curta para listas.
export function formatShortDate(date: Date): string {
  return `${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`;
}

export function formatHHmm(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// "<1 min", "42 min" ou "1 h 05 min", a partir de segundos.
export function formatDuration(totalSeconds: number): string {
  const minutes = Math.round(Math.max(0, totalSeconds) / 60);
  if (minutes < 1) return '<1 min';
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`;
}
