import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const p = require('../.test-build/data/progression.js');

const set = (w, r, rir, ex = 'supino-reto') => ({ exerciseId: ex, weight: w, reps: r, ...(rir === undefined ? {} : { rir }), label: '', loggedAt: '', loggedAtISO: '2026-10-10T10:00:00.000Z' });
const sess = (sets, iso = '2026-10-10T11:00:00.000Z') => ({ id: iso, workoutId: 'a', workoutName: 'A', finishedAtISO: iso, durationSec: 1, sets });

// passo de carga
assert.equal(p.weightStep(8), 1);
assert.equal(p.weightStep(19.5), 1);
assert.equal(p.weightStep(20), 2.5);
assert.equal(p.weightStep(59), 2.5);
assert.equal(p.weightStep(60), 5);

// formatação
assert.equal(p.formatKg(40), '40');
assert.equal(p.formatKg(42.5), '42,5');
assert.equal(p.formatKg(42.4999), '42,5');

// nunca feito
assert.equal(p.suggestNext('supino-reto', 10, []), null);
assert.equal(p.suggestNext('supino-reto', 10, [sess([set(50, 10, 2, 'agachamento')])]), null);

// RIR alto -> aumentar (+2,5 abaixo de 60 kg)
let s = p.suggestNext('supino-reto', 10, [sess([set(40, 10, 3), set(40, 10, 4), set(40, 10, 3)])]);
assert.equal(s.kind, 'aumentar');
assert.equal(s.weight, 42.5);
assert.equal(s.lastSets, 3);
assert.ok(Math.abs(s.avgRir - 10 / 3) < 1e-9);

// RIR exatamente 3 também aumenta (limite inclusivo)
s = p.suggestNext('supino-reto', 10, [sess([set(40, 10, 3), set(40, 10, 3)])]);
assert.equal(s.kind, 'aumentar');

// 60 kg ou mais -> passo de 5
s = p.suggestNext('supino-reto', 10, [sess([set(60, 10, 4)])]);
assert.equal(s.weight, 65);

// carga leve -> passo de 1
s = p.suggestNext('elevacao-lateral', 14, [sess([set(8, 14, 4, 'elevacao-lateral')])]);
assert.equal(s.weight, 9);

// faixa ideal -> manter
s = p.suggestNext('supino-reto', 10, [sess([set(40, 10, 2), set(40, 10, 1), set(40, 9, 2)])]);
assert.equal(s.kind, 'manter');
assert.equal(s.weight, 40);

// RIR médio 2,9 ainda mantém; 3,0 aumenta
s = p.suggestNext('supino-reto', 10, [sess([set(40, 10, 3), set(40, 10, 3), set(40, 10, 3), set(40, 10, 2), set(40, 10, 3), set(40, 10, 3), set(40, 10, 3), set(40, 10, 3), set(40, 10, 3), set(40, 10, 3)])]);
assert.equal(s.kind, 'manter'); // média 2,9

// falha com repetições dentro da meta -> manter
s = p.suggestNext('supino-reto', 10, [sess([set(40, 10, 0), set(40, 9, 0)])]);
assert.equal(s.kind, 'manter');
assert.equal(s.weight, 40);

// falha e repetições muito abaixo da meta (<= meta-2) -> reduzir
s = p.suggestNext('supino-reto', 10, [sess([set(40, 7, 0), set(40, 8, 0)])]);
assert.equal(s.kind, 'reduzir');
assert.equal(s.weight, 37.5);

// falha com 1 repetição abaixo da meta não reduz
s = p.suggestNext('supino-reto', 10, [sess([set(40, 9, 0), set(40, 9, 0)])]);
assert.equal(s.kind, 'manter');

// sem meta definida, falha só mantém
s = p.suggestNext('supino-reto', undefined, [sess([set(40, 5, 0)])]);
assert.equal(s.kind, 'manter');

// reduzir nunca chega a zero ou negativo
s = p.suggestNext('supino-reto', 12, [sess([set(1, 5, 0)])]);
assert.equal(s.kind, 'reduzir');
assert.ok(s.weight >= 1);

// sem RIR -> sem sugestão de carga
s = p.suggestNext('supino-reto', 10, [sess([set(40, 10), set(40, 10)])]);
assert.equal(s.kind, 'sem-rir');
assert.equal(s.weight, undefined);
assert.equal(s.avgRir, null);

// só a carga de trabalho (maior) conta: aquecimento leve com RIR alto não infla a média
s = p.suggestNext('supino-reto', 10, [sess([set(20, 12, 4), set(40, 10, 1), set(40, 10, 1)])]);
assert.equal(s.kind, 'manter');
assert.equal(s.lastWeight, 40);
assert.equal(s.lastSets, 2);

// usa a sessão mais recente que tem o exercício, ignorando as que não têm
const sessions = [
  sess([set(30, 10, 1, 'agachamento')], '2026-10-12T11:00:00.000Z'),
  sess([set(40, 10, 4)], '2026-10-10T11:00:00.000Z'),
  sess([set(30, 10, 0)], '2026-10-01T11:00:00.000Z'),
];
s = p.suggestNext('supino-reto', 10, sessions);
assert.equal(s.lastDateISO, '2026-10-10T11:00:00.000Z');
assert.equal(s.weight, 42.5);

// cardio (peso 0) é ignorado
assert.equal(p.suggestNext('bike', undefined, [sess([{ exerciseId: 'bike', weight: 0, reps: 0, minutes: 5, label: '', loggedAt: '', loggedAtISO: '' }])]), null);

console.log('progression: todos os testes passaram');
