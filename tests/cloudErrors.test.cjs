const assert = require('node:assert');
const e = require('../.test-build/data/cloudErrors.js');

const fb = (c) => new Error('Firebase: Error (' + c + ').');
assert.strictEqual(e.friendlyCloudError(fb('auth/invalid-credential')), 'E-mail ou senha incorretos.');
assert.strictEqual(e.friendlyCloudError(fb('auth/wrong-password')), 'E-mail ou senha incorretos.');
assert.strictEqual(e.friendlyCloudError(fb('auth/user-not-found')), 'E-mail ou senha incorretos.');
assert.strictEqual(e.friendlyCloudError(fb('auth/email-already-in-use')), 'Este e-mail já tem conta. Use "Entrar".');
assert.strictEqual(e.friendlyCloudError(new Error('Firebase: Password should be at least 6 characters (auth/weak-password).')), 'A senha precisa ter pelo menos 6 caracteres.');
assert.strictEqual(e.friendlyCloudError(fb('auth/invalid-email')), 'Digite um e-mail válido.');
assert.strictEqual(e.friendlyCloudError(fb('auth/too-many-requests')), 'Muitas tentativas. Espere um pouco e tente de novo.');
assert.strictEqual(e.friendlyCloudError(fb('auth/network-request-failed')), 'Sem conexão com a internet. Tente de novo quando estiver online.');
assert.strictEqual(e.friendlyCloudError(new TypeError('Failed to fetch')), 'Sem conexão com a internet. Tente de novo quando estiver online.');
assert.ok(e.friendlyCloudError(new Error('Missing or insufficient permissions.')).includes('firebase/firestore.rules'));
assert.ok(e.friendlyCloudError(fb('auth/api-key-not-valid.-please-pass-a-valid-api-key.')).includes('.env'));
assert.ok(e.friendlyCloudError(fb('auth/invalid-api-key')).includes('.env'));
assert.ok(e.friendlyCloudError(fb('auth/operation-not-allowed')).includes('e-mail e senha'));

// mensagens nossas, já em português, passam como estão
assert.strictEqual(e.friendlyCloudError(new Error('Não há dados na nuvem para restaurar.')), 'Não há dados na nuvem para restaurar.');
// desconhecidas e vazias: genéricas
assert.strictEqual(e.friendlyCloudError(new Error('xyz 123')), 'Algo deu errado. Tente de novo.');
assert.strictEqual(e.friendlyCloudError(undefined), 'Algo deu errado. Tente de novo.');
assert.strictEqual(e.friendlyCloudError(null), 'Algo deu errado. Tente de novo.');

// formulário
assert.strictEqual(e.validateCredentials('a@b.co', '123456'), null);
assert.strictEqual(e.validateCredentials('  a@b.co  ', '123456'), null);
assert.strictEqual(e.validateCredentials('sem-arroba', '123456'), 'Digite um e-mail válido.');
assert.strictEqual(e.validateCredentials('a@b', '123456'), 'Digite um e-mail válido.');
assert.strictEqual(e.validateCredentials('', '123456'), 'Digite um e-mail válido.');
assert.strictEqual(e.validateCredentials('a@b.co', '12345'), 'A senha precisa ter pelo menos 6 caracteres.');
assert.strictEqual(e.validateCredentials('a@b.co', ''), 'A senha precisa ter pelo menos 6 caracteres.');

console.log('cloudErrors: ok');
