const assert = require('node:assert');
const p = require('../.test-build/data/plates.js');

const sides = (r) => r.perSide.map((x) => `${x.count}x${x.plate}`).join(' ');

// cargas exatas
let r = p.calcPlates(100, 20);
assert.strictEqual(sides(r), '1x25 1x15', 'por lado: 25 + 15 = 40 -> total 100');
assert.strictEqual(r.achieved, 100);
assert.strictEqual(r.missing, 0);

r = p.calcPlates(60, 20);
assert.strictEqual(sides(r), '1x20');
assert.strictEqual(r.achieved, 60);

r = p.calcPlates(82.5, 20);
assert.strictEqual(sides(r), '1x25 1x5 1x1.25', 'por lado 31,25');
assert.strictEqual(r.achieved, 82.5);

r = p.calcPlates(140, 20);
assert.strictEqual(sides(r), '2x25 1x10', '120 / 2 = 60 = 25 + 25 + 10');
assert.strictEqual(r.achieved, 140);

// só a barra
r = p.calcPlates(20, 20);
assert.deepStrictEqual(r.perSide, []);
assert.strictEqual(r.achieved, 20);
assert.strictEqual(r.belowBar, false);

// outras barras
assert.strictEqual(sides(p.calcPlates(50, 15)), '1x15 1x2.5'); // (50-15)/2 = 17,5
assert.strictEqual(sides(p.calcPlates(30, 10)), '1x10');

// abaixo da barra
r = p.calcPlates(15, 20);
assert.strictEqual(r.belowBar, true);
assert.deepStrictEqual(r.perSide, []);

// não exato: devolve o mais próximo abaixo
r = p.calcPlates(81, 20); // por lado 30,5: 25 + 5 + 0,5 que não existe
assert.strictEqual(sides(r), '1x25 1x5');
assert.strictEqual(r.achieved, 80);
assert.strictEqual(r.missing, 1);

// entradas inválidas
assert.strictEqual(p.calcPlates(NaN, 20).belowBar, false);
assert.deepStrictEqual(p.calcPlates(NaN, 20).perSide, []);

// anilhas customizadas (sem 25)
r = p.calcPlates(100, 20, [20, 10, 5]);
assert.strictEqual(sides(r), '2x20', 'por lado 40');
assert.strictEqual(r.achieved, 100);

// ponto flutuante: 1,25 + 1,25 não pode virar 2,5 errado
r = p.calcPlates(22.5, 20);
assert.strictEqual(sides(r), '1x1.25');
assert.strictEqual(r.achieved, 22.5);

// total montado sempre = barra + 2 × soma por lado
for (const target of [20, 22.5, 45, 67.5, 102.5, 187.5, 250]) {
  const x = p.calcPlates(target, 20);
  const sum = x.perSide.reduce((a, s) => a + s.plate * s.count, 0);
  assert.strictEqual(x.achieved, 20 + 2 * sum);
  assert.ok(x.achieved <= target + 1e-9);
}

// formatação, cores e alturas
assert.strictEqual(p.formatPlate(2.5), '2,5 kg');
assert.strictEqual(p.formatPlate(20), '20 kg');
for (const plate of p.DEFAULT_PLATES) {
  assert.ok(p.PLATE_COLOR[plate], `cor da anilha ${plate}`);
  const h = p.plateHeight(plate);
  assert.ok(h > 0 && h <= 1);
}
assert.ok(p.plateHeight(25) > p.plateHeight(10) && p.plateHeight(10) > p.plateHeight(1.25));
assert.strictEqual(p.BARS[0].kg, p.DEFAULT_BAR_KG);

console.log('plates: ok');
