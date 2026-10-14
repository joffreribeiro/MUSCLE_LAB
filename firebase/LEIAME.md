# Conta e sincronização (Firebase)

Com o Firebase configurado, o Muscle Lab pede login (e-mail e senha) antes de abrir e guarda uma cópia dos seus dados na nuvem, para usar em qualquer aparelho. Sem a configuração, o app abre direto e funciona só no aparelho.

## Passo a passo

1. **Projeto.** Em https://console.firebase.google.com use um projeto existente (pode ser o do kingbt; os logins ficam compartilhados) ou crie um novo.
2. **Login.** Authentication → Sign-in method → ative **E-mail/senha**.
3. **Banco.** Firestore Database → criar banco (se ainda não existir).
4. **Regras.** Firestore → Regras. Acrescente o bloco `match /muscleLabBackups/{userId}` de `firebase/firestore.rules` **sem apagar** as regras que já existem (no projeto do kingbt, elas precisam continuar). Publique.
5. **App web.** Configurações do projeto → Seus apps → adicione um app **Web** (ou reuse o existente) e copie a "Configuração do SDK".
6. **`.env`.** Copie `.env.example` para `.env` e preencha as seis variáveis.
7. **Rodar.** Reinicie o Metro com `--clear` (`npx expo start --web --clear`). Para publicar, gere de novo a web (`npx expo export --platform web`) e o APK.

## Quem pode entrar

Por padrão o app **não mostra "Criar conta"**: crie as contas em Authentication → Users → Adicionar usuário. Para liberar o cadastro pelo app, ponha `EXPO_PUBLIC_FIREBASE_ALLOW_SIGNUP=1` no `.env`. Atenção: esconder o botão não impede que alguém com a chave do projeto crie contas pela API do Firebase; quem precisa de proteção forte deve usar um projeto só do Muscle Lab.

## Como funciona

- Os dados ficam no documento `muscleLabBackups/{id da conta}` (um texto JSON, no formato do backup).
- Sincroniza ao abrir, ao voltar para o app e alguns segundos depois de você registrar algo.
- Se o aparelho e a nuvem mudaram desde a última vez, o app pergunta qual versão manter; nada é apagado sem você escolher.
- "Esqueci a senha" envia o e-mail de redefinição do Firebase.
