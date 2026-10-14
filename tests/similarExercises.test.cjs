const assert = require('node:assert');
const s = require('../.test-build/data/similarExercises.js');
const { catalog, findExerciseById } = require('../.test-build/data/catalog.js');

const ids = (list) => list.map((e) => e.id);

// puxada: só costas, sem o próprio exercício; o mesmo movimento vertical vem primeiro
const pull = s.similarExercises('pulldown');
assert.ok(!ids(pull.similar).includes('pulldown'));
assert.ok(!ids(pull.others).includes('pulldown'));
assert.strictEqual(ids(pull.similar)[0], 'barra-fixa');
assert.ok(ids(pull.similar).includes('remada-barra'), 'remadas também miram o dorsal');
for (const e of [...pull.similar, ...pull.others]) assert.strictEqual(e.muscleGroup, 'costas');
// hiperextensão trabalha lombar/glúteos, não o dorsal: fica fora dos parecidos
assert.deepStrictEqual(ids(pull.others), ['hiperextensao']);
assert.ok(!ids(pull.similar).includes('hiperextensao'));

// remada: as outras remadas antes das puxadas
const row = ids(s.similarExercises('remada-barra').similar);
assert.ok(row.indexOf('remada-halter') < row.indexOf('pulldown'));
assert.ok(row.indexOf('remada-baixa') < row.indexOf('barra-fixa'));

// todos os exercícios do catálogo: nunca devolve o próprio nem outro grupo, sem repetição
for (const group of Object.values(catalog)) {
  for (const ex of group.items) {
    const r = s.similarExercises(ex.id);
    const all = [...r.similar, ...r.others];
    assert.ok(!ids(all).includes(ex.id), ex.id);
    assert.strictEqual(new Set(ids(all)).size, all.length, ex.id);
    assert.strictEqual(all.length, group.items.length - 1, `${ex.id}: o grupo todo deve estar em parecidos + outros`);
    for (const e of all) assert.strictEqual(e.muscleGroup, ex.muscleGroup, ex.id);
  }
}

// cardio e id desconhecido
assert.ok(ids(s.similarExercises('bike').similar).includes('esteira'));
assert.deepStrictEqual(s.similarExercises('nao-existe'), { similar: [], others: [] });

// prescrição mostrada na troca
const base = { exerciseId: 'pulldown', name: 'x', groupLabel: 'Costas', groupKey: 'costas', type: 'strength', sets: 4, reps: 12, weight: 80 };
const alt = findExerciseById('barra-fixa');
const session = (weight) => ({
  id: 's',
  workoutId: 'w',
  workoutName: 'W',
  finishedAtISO: new Date(2026, 9, 10).toISOString(),
  durationSec: 60,
  sets: [{ exerciseId: 'barra-fixa', weight, reps: 12, label: '', loggedAt: '10:00', loggedAtISO: new Date(2026, 9, 10).toISOString() }],
});
// com histórico do exercício novo: usa a carga dele
assert.strictEqual(s.substituteWeight(alt, 12, [session(10)], null) >= 10, true);
assert.match(s.substitutePrescription(base, alt, [session(10)], null), /^4x12x\d/);
// peso corporal sem histórico: carga 0
assert.strictEqual(s.substituteWeight(alt, 12, [], null), 0);
assert.strictEqual(s.substitutePrescription(base, alt, [], null), '4x12 (peso corporal)');
// cardio mostra os minutos
const cardio = { ...base, type: 'cardio', minutes: 8 };
assert.strictEqual(s.substitutePrescription(cardio, findExerciseById('bike'), [], null), '8 min');

console.log('similarExercises: ok');
