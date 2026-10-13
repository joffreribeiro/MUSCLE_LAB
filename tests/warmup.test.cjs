const assert = require('node:assert');
const w = require('../.test-build/data/warmup.js');

const fmt = (sets) => sets.map((s) => `${s.kg}x${s.reps}`).join(' ');

// cargas leves: sem aquecimento
assert.deepStrictEqual(w.warmupSets(0), []);
assert.deepStrictEqual(w.warmupSets(20), []);
assert.deepStrictEqual(w.warmupSets(29.5), []);
assert.deepStrictEqual(w.warmupSets(NaN), []);
assert.deepStrictEqual(w.warmupSets(-10), []);

// cargas médias: 2 séries (50% x10, 75% x5)
assert.strictEqual(fmt(w.warmupSets(40)), '20x10 30x5');
assert.strictEqual(fmt(w.warmupSets(50)), '25x10 37.5x5'); // 37,5 arredonda para anilha de 2,5

// cargas pesadas: 3 séries (40% x10, 60% x6, 80% x3)
assert.strictEqual(fmt(w.warmupSets(100)), '40x10 60x6 80x3');
assert.strictEqual(fmt(w.warmupSets(60)), '25x10 35x6 47.5x3');

// sempre cresce, nunca chega na carga de trabalho, repetições diminuem
for (let kg = 30; kg <= 300; kg += 2.5) {
  const sets = w.warmupSets(kg);
  assert.ok(sets.length >= 1 && sets.length <= 3, `quantidade em ${kg}`);
  sets.forEach((s, i) => {
    assert.ok(s.kg > 0 && s.kg < kg, `carga abaixo da de trabalho em ${kg}`);
    if (i > 0) {
      assert.ok(s.kg > sets[i - 1].kg, `crescente em ${kg}`);
      assert.ok(s.reps < sets[i - 1].reps, `repetições diminuem em ${kg}`);
    }
  });
}

// limites
assert.strictEqual(w.warmupSets(w.WARMUP_MIN_KG).length, 2);
assert.strictEqual(w.warmupSets(w.WARMUP_HEAVY_KG - 0.5).length, 2);
assert.strictEqual(w.warmupSets(w.WARMUP_HEAVY_KG).length, 3);

console.log('warmup: ok');
