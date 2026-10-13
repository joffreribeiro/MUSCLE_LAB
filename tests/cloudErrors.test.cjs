const assert = require('node:assert');
const e = require('../.test-build/data/cloudErrors.js');

assert.strictEqual(e.friendlyCloudError(new Error('Invalid login credentials')), 'E-mail ou senha incorretos.');
assert.strictEqual(e.friendlyCloudError(new Error('Email not confirmed')), 'Confirme seu e-mail pelo link que enviamos e entre de novo.');
assert.strictEqual(e.friendlyCloudError(new Error('User already registered')), 'Este e-mail já tem conta. Use "Entrar".');
assert.strictEqual(e.friendlyCloudError(new Error('Password should be at least 6 characters.')), 'A senha precisa ter pelo menos 6 caracteres.');
assert.strictEqual(e.friendlyCloudError(new Error('Unable to validate email address: invalid format')), 'Digite um e-mail válido.');
assert.strictEqual(e.friendlyCloudError(new Error('email rate limit exceeded')), 'Muitas tentativas. Espere um pouco e tente de novo.');
assert.strictEqual(e.friendlyCloudError(new TypeError('Failed to fetch')), 'Sem conexão com a internet. Tente de novo quando estiver online.');
assert.strictEqual(e.friendlyCloudError(new Error('Network request failed')), 'Sem conexão com a internet. Tente de novo quando estiver online.');
assert.ok(e.friendlyCloudError(new Error('new row violates row-level security policy for table "backups"')).includes('supabase/schema.sql'));
assert.ok(e.friendlyCloudError(new Error('relation "public.backups" does not exist')).includes('supabase/schema.sql'));

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
