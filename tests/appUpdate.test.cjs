const assert = require('node:assert');
const u = require('../.test-build/data/appUpdate.js');

// apk-version.json
assert.deepStrictEqual(u.parsePublishedVersion({ build: 5, versao: '1.0.0-5', sha: 'abc' }), { build: 5, versao: '1.0.0-5' });
assert.deepStrictEqual(u.parsePublishedVersion({ build: '7' }), { build: 7, versao: null });
assert.deepStrictEqual(u.parsePublishedVersion({ build: 3, versao: '  ' }), { build: 3, versao: null });
for (const bad of [null, undefined, 'x', 3, [], {}, { build: 0 }, { build: -1 }, { build: 1.5 }, { build: 'abc' }, { versao: '1.0.0-2' }]) {
  assert.strictEqual(u.parsePublishedVersion(bad), null, JSON.stringify(bad));
}

// número do build embutido
assert.strictEqual(u.parseBuildNumber('12'), 12);
assert.strictEqual(u.parseBuildNumber(undefined), null);
assert.strictEqual(u.parseBuildNumber(''), null);
assert.strictEqual(u.parseBuildNumber('0'), null);
assert.strictEqual(u.parseBuildNumber('abc'), null);

// comparação
assert.strictEqual(u.isNewerBuild(4, 5), true);
assert.strictEqual(u.isNewerBuild(5, 5), false);
assert.strictEqual(u.isNewerBuild(6, 5), false);
assert.strictEqual(u.isNewerBuild(null, 5), false); // desenvolvimento: não sabe a própria versão
assert.strictEqual(u.isNewerBuild(5, null), false);

// nomes e endereços
assert.strictEqual(u.apkFileName('1.0.0-5'), 'MUSCLELAB_1.0.0-5.apk');
assert.strictEqual(u.versionUrl('joffre/muscle-lab'), 'https://github.com/joffre/muscle-lab/releases/download/latest-apk/apk-version.json');
assert.strictEqual(u.apkUrl('joffre/muscle-lab', '1.0.0-5'), 'https://github.com/joffre/muscle-lab/releases/download/latest-apk/MUSCLELAB_1.0.0-5.apk');
assert.strictEqual(u.apkUrl('joffre/muscle-lab', null), 'https://github.com/joffre/muscle-lab/releases/download/latest-apk/muscle-lab.apk');

// repositório
assert.strictEqual(u.isValidRepo('joffre/muscle-lab'), true);
assert.strictEqual(u.isValidRepo('joffre'), false);
assert.strictEqual(u.isValidRepo('a/b/c'), false);
assert.strictEqual(u.isValidRepo(''), false);
assert.strictEqual(u.isValidRepo(undefined), false);
assert.strictEqual(u.isValidRepo('joffre/muscle lab'), false);

console.log('appUpdate: ok');
