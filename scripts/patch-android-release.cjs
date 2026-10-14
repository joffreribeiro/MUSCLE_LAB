// Ajusta o android/app/build.gradle gerado pelo "expo prebuild" para um APK de release publicável:
//   - versionCode / versionName (o Android só deixa instalar por cima uma versão com versionCode maior);
//   - assinatura com a keystore de release FIXA (a mesma em todo build). Sem isso o prebuild usaria a
//     chave de debug, que muda a cada geração, e o Android recusaria a atualização por cima.
// Uso: node scripts/patch-android-release.cjs <versionCode> <versionName> [caminho do build.gradle]
// A senha da keystore vem de MUSCLELAB_KEYSTORE_PASSWORD (lida pelo Gradle, nunca escrita no arquivo).

const fs = require('node:fs');

const [, , code, name, file = 'android/app/build.gradle'] = process.argv;
if (!/^\d+$/.test(code ?? '') || !name) {
  console.error('Uso: node scripts/patch-android-release.cjs <versionCode> <versionName> [build.gradle]');
  process.exit(1);
}

let s = fs.readFileSync(file, 'utf8');

function replaceOnce(from, to, what) {
  if (!from.test(s)) {
    console.error(`Falha ao ajustar ${what}: o template do build.gradle mudou. Build interrompido para não publicar um APK assinado com a chave de debug.`);
    process.exit(1);
  }
  s = s.replace(from, to);
}

replaceOnce(/versionCode \d+/, `versionCode ${code}`, 'versionCode');
replaceOnce(/versionName "[^"]*"/, `versionName "${name}"`, 'versionName');

replaceOnce(
  /signingConfigs \{\s*\n(\s*)debug \{/,
  (m, indent) =>
    `signingConfigs {\n${indent}release {\n${indent}    storeFile file("release.keystore")\n${indent}    storePassword System.getenv("MUSCLELAB_KEYSTORE_PASSWORD")\n${indent}    keyAlias "musclelab"\n${indent}    keyPassword System.getenv("MUSCLELAB_KEYSTORE_PASSWORD")\n${indent}}\n${indent}debug {`,
  'bloco signingConfigs',
);

// No buildType release, troca a chave de debug pela de release (o primeiro "signingConfig signingConfigs.debug" depois de "release {").
replaceOnce(/(buildTypes \{[\s\S]*?\n\s*release \{[\s\S]*?)signingConfig signingConfigs\.debug/, '$1signingConfig signingConfigs.release', 'assinatura do buildType release');

if (!s.includes('signingConfigs.release') || !s.includes('release.keystore')) {
  console.error('A assinatura de release não foi aplicada. Build interrompido.');
  process.exit(1);
}

fs.writeFileSync(file, s);
console.log(`build.gradle ajustado: versionCode ${code}, versionName ${name}, assinatura de release.`);
