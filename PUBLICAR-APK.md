# Publicar o APK e avisar os celulares (Muscle Lab)

O APK é gerado na nuvem pelo GitHub (`.github/workflows/build-apk.yml`), com o nome
`MUSCLELAB_<versão>.apk` (ex.: `MUSCLELAB_1.0.0-5.apk`), e publicado na release `latest-apk` junto com o
`apk-version.json`. O app instalado compara o número do próprio build com esse arquivo e mostra, no topo,
**"Nova versão disponível — Atualizar"**. Em Perfil → Versão do app dá para verificar na hora.

A versão é `versão do app.json` + `-` + número do build (ex.: `1.0.0-5`). Para uma versão maior (1.1.0),
mude `version` no `app.json`; o número do build sobe sozinho a cada APK.

## Configuração (uma vez só)

1. **Repositório.** Crie um repositório **público** no GitHub (veja a observação no fim) e envie o
   projeto (pelo GitHub Desktop: *Publish repository*). O repositório é a pasta `app-treino`.
2. **Keystore de release.** É a "assinatura" do app. Gere uma vez e **guarde uma cópia segura**: se
   perdê-la, os celulares precisam desinstalar o app para instalar uma versão nova.
   ```
   keytool -genkeypair -v -storetype PKCS12 -keystore musclelab-release.keystore -alias musclelab -keyalg RSA -keysize 2048 -validity 10000
   ```
   Use o mesmo valor para a senha da keystore e da chave. O alias precisa ser `musclelab`. Não coloque o
   arquivo dentro do projeto (ele não deve ir para o GitHub).
3. **Segredos.** No repositório: Settings → Secrets and variables → Actions → *New repository secret*:
   - `ANDROID_KEYSTORE_PASSWORD`: a senha da keystore.
   - `ANDROID_KEYSTORE_BASE64`: a keystore em base64. No PowerShell:
     `[Convert]::ToBase64String([IO.File]::ReadAllBytes("musclelab-release.keystore")) | Set-Clipboard`
     e cole o conteúdo.
   - `ENV_FILE`: o conteúdo do seu arquivo `.env` (as variáveis `EXPO_PUBLIC_FIREBASE_*`), tal como está.

## Gerar um APK

- Aba **Actions** → *Build e publicar APK* → **Run workflow**; ou
- um commit com `[apk]` na mensagem, enviado para a branch principal.

Demora uns 15 minutos. Ao terminar, o APK fica em *Releases* → `latest-apk`. Os celulares que já têm uma
versão **com este aviso** passam a mostrar a atualização ao abrir o app (ou ao voltar para ele).

## Primeira instalação

- O APK gerado antes deste fluxo não consulta atualizações, e foi assinado com outra chave. Instale o
  primeiro APK da nuvem **desinstalando o antigo antes**. Entre de novo com a sua conta: os dados voltam
  da sincronização.
- Daí em diante, cada APK novo se instala por cima, sem perder nada.

## Observação sobre repositório privado

O app baixa o `apk-version.json` e o APK direto do endereço da release, sem login. Isso só funciona com
**repositório público**. Em repositório privado, o aviso não consegue consultar a versão. Se o código não
pode ser público, use um repositório público separado só para as releases (o fluxo de build precisaria
publicar nele) ou outro lugar de hospedagem.
