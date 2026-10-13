import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const m = require('../.test-build/data/stats.js');

const mk = (iso, w = 50, r = 10, ex = 'supino-reto') => ({
  exerciseId: ex, weight: w, reps: r, label: '', loggedAt: '', loggedAtISO: iso,
});
const session = (iso, sets = []) => ({ id: iso, workoutId: 'a', workoutName: 'A', finishedAtISO: iso, durationSec: 60, sets });

// "hoje" = segunda 12/10/2026, 15:00 local
const today = new Date(2026, 9, 12, 15, 0);

// weekStart: segunda-feira
assert.equal(m.dayKey(m.weekStart(today)), '2026-10-12');
assert.equal(m.dayKey(m.weekStart(new Date(2026, 9, 18, 9))), '2026-10-12'); // domingo -> segunda anterior
assert.equal(m.dayKey(m.weekStart(new Date(2026, 9, 14, 9))), '2026-10-12'); // quarta

// calendário de outubro/2026: dia 1 é quinta -> 3 posições de padding (seg, ter, qua)
const cal = m.monthCalendar([session(new Date(2026, 9, 5, 20).toISOString()), session(new Date(2026, 9, 12, 8).toISOString()), session(new Date(2026, 8, 30, 8).toISOString())], today);
assert.equal(cal.label, 'Outubro 2026');
assert.equal(cal.padding, 3);
assert.equal(cal.cells.length, 31);
assert.equal(cal.daysTrained, 2); // 05 e 12; 30/09 fica fora
assert.equal(cal.cells.filter((c) => c.today).length, 1);
assert.equal(cal.cells[11].today && cal.cells[11].done, true);
assert.equal(cal.cells[4].done, true);

// dois treinos no mesmo dia contam como 1 dia treinado
const two = m.monthCalendar([session(new Date(2026, 9, 5, 8).toISOString()), session(new Date(2026, 9, 5, 19).toISOString())], today);
assert.equal(two.daysTrained, 1);

// treinos na semana: só os de segunda em diante
assert.equal(m.sessionsThisWeek([session(new Date(2026, 9, 12, 8).toISOString()), session(new Date(2026, 9, 11, 22).toISOString())], today), 1);
// domingo à noite entra na semana que começou na segunda anterior
assert.equal(m.sessionsThisWeek([session(new Date(2026, 9, 18, 22).toISOString())], new Date(2026, 9, 18, 23)), 1);

// volume por dia
const sets = [mk(new Date(2026, 9, 12, 10).toISOString(), 60, 10), mk(new Date(2026, 9, 12, 11).toISOString(), 60, 8), mk(new Date(2026, 9, 10, 10).toISOString(), 40, 10), mk(new Date(2026, 9, 1, 10).toISOString(), 100, 10)];
const vol = m.volumeByDay(sets, today, 7);
assert.equal(vol.length, 7);
assert.equal(vol[6].volume, 60 * 10 + 60 * 8);
assert.equal(vol[6].today, true);
assert.equal(vol[6].label, 'Seg');
assert.equal(vol[4].volume, 400); // sexta 10/10
assert.equal(vol[0].label, 'Ter'); // 6 dias antes de segunda = terça
assert.equal(vol.reduce((a, d) => a + d.volume, 0), 1080 + 400); // 01/10 fora da janela

// divisão por grupo
const groups = { 'supino-reto': { key: 'peito', label: 'Peito' }, pulldown: { key: 'costas', label: 'Costas' }, agachamento: { key: 'pernas', label: 'Pernas' }, 'rosca-direta': { key: 'biceps', label: 'Bíceps' }, 'triceps-polia': { key: 'triceps', label: 'Tríceps' }, 'elevacao-lateral': { key: 'ombros', label: 'Ombros' }, bike: null };
const groupOf = (id) => groups[id] ?? null;
const t = new Date(2026, 9, 12, 10).toISOString();
const shareSets = [
  ...Array(3).fill(0).map(() => mk(t, 50, 10, 'supino-reto')),
  ...Array(3).fill(0).map(() => mk(t, 50, 10, 'pulldown')),
  mk(t, 50, 10, 'agachamento'),
  mk(t, 20, 10, 'rosca-direta'),
  mk(t, 20, 10, 'triceps-polia'),
  mk(t, 10, 10, 'elevacao-lateral'),
  mk(t, 0, 0, 'bike'), // cardio ignorado
  mk(new Date(2026, 8, 1).toISOString(), 50, 10, 'supino-reto'), // fora da janela
];
const share = m.groupShare(shareSets, today, 7, groupOf, 4);
assert.equal(share.total, 10);
assert.equal(share.items.length, 5); // 4 maiores + Outros
assert.equal(share.items.at(-1).key, 'outros');
assert.equal(share.items.reduce((a, i) => a + i.pct, 0), 100);
assert.equal(share.items.reduce((a, i) => a + i.count, 0), 10);
assert.deepEqual(share.items.slice(0, 2).map((i) => i.count), [3, 3]);

// soma sempre 100 mesmo com divisões quebradas (1/3 cada)
const thirds = m.groupShare([mk(t, 1, 1, 'supino-reto'), mk(t, 1, 1, 'pulldown'), mk(t, 1, 1, 'agachamento')], today, 7, groupOf, 4);
assert.equal(thirds.items.reduce((a, i) => a + i.pct, 0), 100);

// vazio
const empty = m.groupShare([], today, 7, groupOf);
assert.deepEqual(empty, { total: 0, items: [] });

// sessionVolume
assert.equal(m.sessionVolume(session('2026-10-12T10:00:00.000Z', [mk('2026-10-12T10:00:00.000Z', 60, 10), mk('2026-10-12T10:01:00.000Z', 40, 5), mk('2026-10-12T10:02:00.000Z', 0, 0, 'bike')])), 800);
assert.equal(m.sessionVolume(session('2026-10-12T10:00:00.000Z', [])), 0);

// groupSetsByExercise: ordem de execução, sem depender da ordem do array
const g = m.groupSetsByExercise([
  mk('2026-10-12T10:05:00.000Z', 40, 10, 'pulldown'),
  mk('2026-10-12T10:01:00.000Z', 60, 10, 'supino-reto'),
  mk('2026-10-12T10:02:00.000Z', 60, 9, 'supino-reto'),
  mk('2026-10-12T10:06:00.000Z', 40, 8, 'pulldown'),
  mk('2026-10-12T10:03:00.000Z', 14, 12, 'crucifixo'),
]);
assert.deepEqual(g.map((x) => x.exerciseId), ['supino-reto', 'crucifixo', 'pulldown']);
assert.deepEqual(g.map((x) => x.sets.length), [2, 1, 2]);
assert.equal(g[0].sets[0].reps, 10); // séries do exercício em ordem de horário
assert.deepEqual(m.groupSetsByExercise([]), []);

console.log('stats: todos os testes passaram');
