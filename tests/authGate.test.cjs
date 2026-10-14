const assert = require('node:assert');
const { authGate } = require('../.test-build/data/authGate.js');

// sem a nuvem configurada: o app abre direto, em qualquer estado
assert.strictEqual(authGate({ configured: false, authReady: false, hasUser: false }), 'app');
assert.strictEqual(authGate({ configured: false, authReady: true, hasUser: false }), 'app');
assert.strictEqual(authGate({ configured: false, authReady: true, hasUser: true }), 'app');

// configurado: espera saber se já havia sessão, para não piscar a tela de login
assert.strictEqual(authGate({ configured: true, authReady: false, hasUser: false }), 'carregando');
assert.strictEqual(authGate({ configured: true, authReady: false, hasUser: true }), 'carregando');

// sabendo: sem usuário pede login; com usuário entra
assert.strictEqual(authGate({ configured: true, authReady: true, hasUser: false }), 'login');
assert.strictEqual(authGate({ configured: true, authReady: true, hasUser: true }), 'app');

console.log('authGate: ok');
