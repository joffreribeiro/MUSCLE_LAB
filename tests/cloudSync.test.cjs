const assert = require('node:assert');
const c = require('../.test-build/data/cloudSync.js');

const now = new Date(2026, 9, 14, 12);
const base = () => ({
  workouts: [{ id: 'w1', name: 'A', exercises: [] }],
  activeWorkoutId: 'w1',
  sessions: [],
  comments: {},
  settings: { descansoSegundos: 90, pesoCorporalKg: 78, mostrarAnalytics: true },
  profile: null,
  onboardingComplete: false,
  weights: [],
  measures: [],
  activeProgram: null,
});
const withSession = (n) => {
  const d = base();
  d.sessions = Array.from({ length: n }, (_, i) => ({
    id: 's' + i,
    workoutId: 'w1',
    workoutName: 'A',
    finishedAtISO: new Date(2026, 9, 1 + i, 10).toISOString(),
    durationSec: 60,
    sets: [],
  }));
  return d;
};

/** Servidor em memória. */
function fakeApi(initial) {
  const state = { snap: initial || null, version: 1, pushes: 0 };
  return {
    state,
    async fetchRemote() {
      return state.snap;
    },
    async pushRemote(backup) {
      state.pushes += 1;
      state.version += 1;
      state.snap = { backup, updatedAt: 'v' + state.version };
      return state.snap.updatedAt;
    },
  };
}

// hash: estável e sensível a mudança
assert.strictEqual(c.hashData(base()), c.hashData(base()));
assert.notStrictEqual(c.hashData(base()), c.hashData(withSession(1)));
const tweaked = base();
tweaked.settings.descansoSegundos = 120;
assert.notStrictEqual(c.hashData(base()), c.hashData(tweaked));

// aparelho vazio
assert.strictEqual(c.isLocalEmpty(base()), true);
assert.strictEqual(c.isLocalEmpty(withSession(1)), false);
// só o onboarding (ou o perfil) concluído já é dado a guardar
assert.strictEqual(c.isLocalEmpty({ ...base(), onboardingComplete: true }), false);
assert.strictEqual(c.isLocalEmpty({ ...base(), profile: { sexo: 'm' } }), false);

// decisão
const hash = 'h1';
const meta = { lastSyncedHash: hash, lastRemoteUpdatedAt: 'v1' };
const D = (o) => c.decideSync({ localHash: hash, localEmpty: false, meta, remoteUpdatedAt: 'v1', ...o });
assert.strictEqual(D({}), 'noop');                                   // nada mudou
assert.strictEqual(D({ localHash: 'h2' }), 'push');                  // só local mudou
assert.strictEqual(D({ remoteUpdatedAt: 'v2' }), 'pull');            // só a nuvem mudou
assert.strictEqual(D({ localHash: 'h2', remoteUpdatedAt: 'v2' }), 'conflict');
// nuvem vazia
assert.strictEqual(D({ remoteUpdatedAt: null, localEmpty: true }), 'noop');
assert.strictEqual(D({ remoteUpdatedAt: null, localEmpty: false }), 'push');
// primeira sincronização deste aparelho
const fresh = c.EMPTY_SYNC_META;
assert.strictEqual(D({ meta: fresh, localEmpty: true }), 'pull');
assert.strictEqual(D({ meta: fresh, localEmpty: false }), 'conflict');
assert.strictEqual(D({ meta: fresh, remoteUpdatedAt: null, localEmpty: false }), 'push');

(async () => {
  // 1) primeiro envio: nuvem vazia, aparelho com dados -> push
  let api = fakeApi(null);
  let local = withSession(2);
  let r = await c.runSync(api, local, c.EMPTY_SYNC_META, now);
  assert.strictEqual(r.outcome, 'pushed');
  assert.strictEqual(api.state.pushes, 1);
  assert.strictEqual(r.meta.lastSyncedHash, c.hashData(local));
  assert.strictEqual(r.meta.lastRemoteUpdatedAt, 'v2');
  assert.strictEqual(api.state.snap.backup.app, 'muscle-lab');

  // 2) sem mudanças: não envia nada
  let r2 = await c.runSync(api, local, r.meta, now);
  assert.strictEqual(r2.outcome, 'noop');
  assert.strictEqual(api.state.pushes, 1);

  // 3) mudança local: envia e atualiza a marca
  const edited = withSession(3);
  let r3 = await c.runSync(api, edited, r.meta, now);
  assert.strictEqual(r3.outcome, 'pushed');
  assert.strictEqual(api.state.pushes, 2);
  assert.strictEqual(r3.meta.lastRemoteUpdatedAt, 'v3');

  // 4) outro aparelho novo (vazio) recebe os dados da nuvem
  const otherDevice = await c.runSync(api, base(), c.EMPTY_SYNC_META, now);
  assert.strictEqual(otherDevice.outcome, 'pulled');
  assert.strictEqual(otherDevice.pulled.sessions.length, 3);
  assert.strictEqual(otherDevice.meta.lastRemoteUpdatedAt, 'v3');
  assert.strictEqual(otherDevice.meta.lastSyncedHash, c.hashData(otherDevice.pulled));
  assert.strictEqual(api.state.pushes, 2);                            // receber não envia

  // 5) o primeiro aparelho sem mudanças ao ver a nuvem alterada por outro: recebe
  api.state.snap = { backup: api.state.snap.backup, updatedAt: 'v9' };
  let r5 = await c.runSync(api, edited, r3.meta, now);
  assert.strictEqual(r5.outcome, 'pulled');

  // 6) conflito: os dois mudaram -> não mexe em nada e informa
  api = fakeApi(null);
  let m = (await c.runSync(api, withSession(1), c.EMPTY_SYNC_META, now)).meta;
  api.state.snap = { backup: api.state.snap.backup, updatedAt: 'v-outro' };       // a nuvem mudou
  const pushesBefore = api.state.pushes;
  let r6 = await c.runSync(api, withSession(4), m, now);                           // e o aparelho também
  assert.strictEqual(r6.outcome, 'conflict');
  assert.strictEqual(api.state.pushes, pushesBefore);
  assert.deepStrictEqual(r6.meta, m);
  assert.strictEqual(r6.remoteInfo.updatedAt, 'v-outro');
  assert.strictEqual(r6.remoteInfo.data.sessions.length, 1);

  // 7) resolver o conflito: manter este aparelho
  let r7 = await c.runSync(api, withSession(4), m, now, 'local');
  assert.strictEqual(r7.outcome, 'pushed');
  assert.strictEqual(api.state.snap.backup.data.sessions.length, 4);

  // 8) resolver o conflito: usar a nuvem
  api = fakeApi(null);
  await c.runSync(api, withSession(1), c.EMPTY_SYNC_META, now);
  let r8 = await c.runSync(api, withSession(4), c.EMPTY_SYNC_META, now, 'remote');
  assert.strictEqual(r8.outcome, 'pulled');
  assert.strictEqual(r8.pulled.sessions.length, 1);

  // 9) primeiro acesso de aparelho com dados e conta com dados: pergunta
  api = fakeApi(null);
  await c.runSync(api, withSession(2), c.EMPTY_SYNC_META, now);
  let r9 = await c.runSync(api, withSession(5), c.EMPTY_SYNC_META, now);
  assert.strictEqual(r9.outcome, 'conflict');

  // 10) forçar receber sem nada na nuvem: erro claro
  await assert.rejects(c.runSync(fakeApi(null), base(), c.EMPTY_SYNC_META, now, 'remote'), /Não há dados na nuvem/);

  // 11) dados da nuvem inválidos ou de versão futura: erro, sem aplicar
  const bad = fakeApi({ backup: { app: 'outro-app', version: 1, data: {} }, updatedAt: 'v1' });
  await assert.rejects(c.runSync(bad, base(), c.EMPTY_SYNC_META, now), /formato que este app entende/);
  const future = fakeApi({ backup: { app: 'muscle-lab', version: 99, data: {} }, updatedAt: 'v1' });
  await assert.rejects(c.runSync(future, base(), c.EMPTY_SYNC_META, now), c.CloudDataError);

  // 12) a nuvem pode devolver o backup como texto
  api = fakeApi(null);
  await c.runSync(api, withSession(2), c.EMPTY_SYNC_META, now);
  api.state.snap = { backup: JSON.stringify(api.state.snap.backup), updatedAt: 'v7' };
  let r12 = await c.runSync(api, base(), c.EMPTY_SYNC_META, now);
  assert.strictEqual(r12.outcome, 'pulled');
  assert.strictEqual(r12.pulled.sessions.length, 2);

  // 13) falha de rede não altera o estado
  const broken = { fetchRemote: async () => { throw new Error('sem rede'); }, pushRemote: async () => 'x' };
  await assert.rejects(c.runSync(broken, withSession(1), c.EMPTY_SYNC_META, now), /sem rede/);

  console.log('cloudSync: ok');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
