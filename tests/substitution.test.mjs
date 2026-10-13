import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const m = require('../.test-build/data/substitution.js');

const ex = (id, extra = {}) => ({ exerciseId: id, name: id, groupLabel: 'G', groupKey: 'peito', type: 'strength', sets: 3, reps: 10, weight: 40, ...extra });
const wk = (id, ids) => ({ id, name: id, exercises: ids.map((i) => ex(i)) });
const sub = (workoutId, index, original, replacementId, day = '2026-10-12') => ({ workoutId, index, original, replacementId, day });

// recordSub: nova troca entra; trocar o mesmo lugar de novo mantém o original mais antigo
let subs = m.recordSub([], sub('a', 1, ex('crucifixo'), 'peck-deck'));
assert.equal(subs.length, 1);
subs = m.recordSub(subs, sub('a', 1, ex('peck-deck'), 'crossover')); // "original" aqui é o intermediário
assert.equal(subs.length, 1);
assert.equal(subs[0].original.exerciseId, 'crucifixo', 'preserva o original do programa');
assert.equal(subs[0].replacementId, 'crossover');
subs = m.recordSub(subs, sub('a', 2, ex('flexao'), 'supino-maquina'));
assert.equal(subs.length, 2);
subs = m.recordSub(subs, sub('b', 1, ex('x'), 'y')); // mesmo índice em outro treino é outro lugar
assert.equal(subs.length, 3);

// dropSub
assert.equal(m.dropSub(subs, 'a', 1).length, 2);
assert.equal(m.dropSub(subs, 'a', 9).length, 3);

// applyReverts: devolve o original no lugar certo
const workouts = [wk('a', ['bike', 'crossover', 'supino-maquina']), wk('b', ['bike', 'y'])];
let r = m.applyReverts(workouts, subs, () => true);
assert.deepEqual(r.workouts[0].exercises.map((e) => e.exerciseId), ['bike', 'crucifixo', 'flexao']);
assert.equal(r.remaining.length, 0);
// o treino b: 'y' no índice 1 volta para 'x'
assert.deepEqual(r.workouts[1].exercises.map((e) => e.exerciseId), ['bike', 'x']);
// não muta a entrada
assert.equal(workouts[0].exercises[1].exerciseId, 'crossover');

// filtro: só reverte o que aceitar; o resto continua pendente
r = m.applyReverts(workouts, subs, (s) => s.workoutId === 'a');
assert.deepEqual(r.workouts[0].exercises.map((e) => e.exerciseId), ['bike', 'crucifixo', 'flexao']);
assert.deepEqual(r.workouts[1].exercises.map((e) => e.exerciseId), ['bike', 'y'], 'treino b não foi revertido');
assert.equal(r.remaining.length, 1);
assert.equal(r.remaining[0].workoutId, 'b');

// treino editado: se o lugar já não tem o exercício trocado, não mexe
const edited = [wk('a', ['bike', 'supino-maquina', 'crossover'])]; // crossover mudou de índice
r = m.applyReverts(edited, [sub('a', 1, ex('crucifixo'), 'crossover')], () => true);
assert.deepEqual(r.workouts[0].exercises.map((e) => e.exerciseId), ['bike', 'supino-maquina', 'crossover']);
assert.equal(r.remaining.length, 0, 'a troca é descartada, não fica pendente para sempre');

// índice fora do alcance e treino inexistente não quebram
r = m.applyReverts([wk('a', ['bike'])], [sub('a', 5, ex('x'), 'y'), sub('zzz', 0, ex('x'), 'y')], () => true);
assert.equal(r.workouts[0].exercises.length, 1);
assert.equal(r.remaining.length, 0);

// buildSubstitute: força mantém séries/reps e usa a carga nova; cardio ignora carga
const exercise = { id: 'peck-deck', name: 'Peck deck (voador)' };
const s1 = m.buildSubstitute(ex('crucifixo', { sets: 4, reps: 12, weight: 14, barNote: 'nota' }), exercise, 25);
assert.equal(s1.exerciseId, 'peck-deck');
assert.equal(s1.name, 'Peck deck (voador)');
assert.equal(s1.sets, 4);
assert.equal(s1.reps, 12);
assert.equal(s1.weight, 25);
assert.equal(s1.barNote, undefined);
const c1 = m.buildSubstitute(ex('bike', { type: 'cardio', minutes: 5, bpmRange: '110 - 140 bpm', weight: undefined }), { id: 'corda', name: 'Corda' }, 99);
assert.equal(c1.exerciseId, 'corda');
assert.equal(c1.minutes, 5);
assert.equal(c1.weight, undefined);

console.log('substitution: todos os testes passaram');
