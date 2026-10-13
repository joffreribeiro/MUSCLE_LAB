const assert = require('node:assert');
const s = require('../.test-build/data/superset.js');

const ex = (id, sets = 3, type = 'strength', supersetId) => ({
  exerciseId: id,
  name: id,
  groupLabel: '',
  groupKey: 'peito',
  type,
  sets,
  reps: 10,
  weight: 20,
  ...(supersetId ? { supersetId } : {}),
});
const ids = (list) => list.map((e) => `${e.exerciseId}:${e.supersetId ?? '-'}`).join(' ');

// groupAt
let list = [ex('a'), ex('b', 3, 'strength', 'g1'), ex('c', 3, 'strength', 'g1'), ex('d')];
assert.strictEqual(s.groupAt(list, 0), null);
assert.deepStrictEqual(s.groupAt(list, 1), { id: 'g1', indices: [1, 2] });
assert.deepStrictEqual(s.groupAt(list, 2), { id: 'g1', indices: [1, 2] });
assert.strictEqual(s.groupAt([ex('a', 3, 'strength', 'x')], 0), null); // sozinho não é grupo
assert.strictEqual(s.groupAt(list, 9), null);
assert.strictEqual(s.groupLabel(2), 'Bi-set');
assert.strictEqual(s.groupLabel(3), 'Tri-set');

// toggleLink: liga dois soltos
list = [ex('a'), ex('b'), ex('c')];
let r = s.toggleLink(list, 0, 'n1');
assert.strictEqual(ids(r), 'a:n1 b:n1 c:-');
assert.strictEqual(list[0].supersetId, undefined); // não altera a lista original

// entra no grupo vizinho (tri-set)
r = s.toggleLink(r, 1, 'n2');
assert.strictEqual(ids(r), 'a:n1 b:n1 c:n1');

// não passa de 3
let four = [ex('a'), ex('b'), ex('c'), ex('d')];
four = s.toggleLink(s.toggleLink(four, 0, 'x'), 1, 'y'); // a b c ligados
assert.strictEqual(s.toggleLink(four, 2, 'z'), four, 'quarto exercício não entra');

// junta dois grupos pequenos se couber (2 + 1)
let m = [ex('a', 3, 'strength', 'p'), ex('b', 3, 'strength', 'p'), ex('c')];
assert.strictEqual(ids(s.toggleLink(m, 1, 'q')), 'a:p b:p c:p');
// 2 + 2 = 4: recusa
m = [ex('a', 3, 'strength', 'p'), ex('b', 3, 'strength', 'p'), ex('c', 3, 'strength', 'q'), ex('d', 3, 'strength', 'q')];
assert.strictEqual(s.toggleLink(m, 1, 'z'), m);

// separar
let tri = [ex('a', 3, 'strength', 'g'), ex('b', 3, 'strength', 'g'), ex('c', 3, 'strength', 'g')];
assert.strictEqual(ids(s.toggleLink(tri, 0, 'n')), 'a:- b:n c:n');   // a sai; b-c seguem juntos
assert.strictEqual(ids(s.toggleLink(tri, 1, 'n')), 'a:g b:g c:-');   // c sai
let bi = [ex('a', 3, 'strength', 'g'), ex('b', 3, 'strength', 'g')];
assert.strictEqual(ids(s.toggleLink(bi, 0, 'n')), 'a:- b:-');        // desfaz o grupo

// cardio nunca liga; fim da lista não liga
const withCardio = [ex('a'), ex('bike', 5, 'cardio')];
assert.strictEqual(s.toggleLink(withCardio, 0, 'n'), withCardio);
const one = [ex('a')];
assert.strictEqual(s.toggleLink(one, 0, 'n'), one);

// normalize: sozinho, não contíguo e cardio perdem o vínculo
let broken = [ex('a', 3, 'strength', 'g'), ex('x'), ex('b', 3, 'strength', 'g')];
assert.strictEqual(ids(s.normalizeSupersets(broken)), 'a:- x:- b:-');
assert.strictEqual(ids(s.normalizeSupersets([ex('a', 3, 'strength', 'g')])), 'a:-');
assert.strictEqual(ids(s.normalizeSupersets([ex('a', 3, 'strength', 'g'), ex('bike', 5, 'cardio', 'g')])), 'a:- bike:-');
const fine = [ex('a', 3, 'strength', 'g'), ex('b', 3, 'strength', 'g')];
assert.strictEqual(s.normalizeSupersets(fine), fine, 'sem mudança devolve a mesma lista');
const tooBig = [1, 2, 3, 4].map((n) => ex('e' + n, 3, 'strength', 'g'));
assert.strictEqual(ids(s.normalizeSupersets(tooBig)), 'e1:- e2:- e3:- e4:-');

// afterSet: fora de grupo
const plain = [ex('a'), ex('b')];
assert.deepStrictEqual(s.afterSet(plain, 0, () => 1), { goTo: null, rest: true });

// bi-set a-b, 3 séries cada
const pair = [ex('a', 3, 'strength', 'g'), ex('b', 3, 'strength', 'g'), ex('c')];
const counts = { a: 0, b: 0 };
const done = (id) => counts[id] ?? 0;
// série 1 de a (já contada): vai para b sem descanso
counts.a = 1;
assert.deepStrictEqual(s.afterSet(pair, 0, done), { goTo: 1, rest: false });
// série 1 de b: fim da rodada -> descansa e volta para a
counts.b = 1;
assert.deepStrictEqual(s.afterSet(pair, 1, done), { goTo: 0, rest: true });
// rodadas seguintes
counts.a = 2; assert.deepStrictEqual(s.afterSet(pair, 0, done), { goTo: 1, rest: false });
counts.b = 2; assert.deepStrictEqual(s.afterSet(pair, 1, done), { goTo: 0, rest: true });
counts.a = 3; assert.deepStrictEqual(s.afterSet(pair, 0, done), { goTo: 1, rest: false });
// última série de b: tudo feito -> só descansa, sem mudar de exercício
counts.b = 3; assert.deepStrictEqual(s.afterSet(pair, 1, done), { goTo: null, rest: true });

// séries diferentes: a tem 2, b tem 4
const uneven = [ex('a', 2, 'strength', 'g'), ex('b', 4, 'strength', 'g')];
const c2 = { a: 2, b: 2 };
assert.deepStrictEqual(s.afterSet(uneven, 1, (id) => c2[id]), { goTo: null, rest: true });  // a já terminou: fica em b e descansa
const c3 = { a: 2, b: 3 };
assert.deepStrictEqual(s.afterSet(uneven, 1, (id) => c3[id]), { goTo: null, rest: true });

// tri-set: a, b, c
const tri3 = [ex('a', 2, 'strength', 'g'), ex('b', 2, 'strength', 'g'), ex('c', 2, 'strength', 'g')];
const t = { a: 1, b: 0, c: 0 };
assert.deepStrictEqual(s.afterSet(tri3, 0, (id) => t[id]), { goTo: 1, rest: false });
t.b = 1; assert.deepStrictEqual(s.afterSet(tri3, 1, (id) => t[id]), { goTo: 2, rest: false });
t.c = 1; assert.deepStrictEqual(s.afterSet(tri3, 2, (id) => t[id]), { goTo: 0, rest: true });

console.log('superset: ok');
