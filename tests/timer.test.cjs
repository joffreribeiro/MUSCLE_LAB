const assert = require('node:assert');
const { tickDelta } = require('../.test-build/data/timer.js');

assert.strictEqual(tickDelta(0, 1000), 1);          // tique normal
assert.strictEqual(tickDelta(0, 1004), 1);          // pequeno atraso do JavaScript
assert.strictEqual(tickDelta(0, 996), 1);
assert.strictEqual(tickDelta(0, 1499), 1);
assert.strictEqual(tickDelta(0, 1500), 2);
assert.strictEqual(tickDelta(0, 90000), 90);        // tela bloqueada por 1 min 30 s
assert.strictEqual(tickDelta(5000, 4000), 1);       // relógio voltou atrás: nunca desconta menos de 1
assert.strictEqual(tickDelta(1000, 1000), 1);       // mesmo instante
console.log('timer: ok');
