# Sincronização com Supabase: passo a passo

Com isso o Muscle Lab guarda seus dados na nuvem e abre o mesmo histórico em qualquer aparelho em que você entrar.
Leva uns 5 minutos e o plano gratuito basta.

## 1. Criar o projeto
1. Entre em https://supabase.com e crie uma conta (ou entre).
2. Clique em **New project**, escolha um nome (ex.: `muscle-lab`), defina uma senha do banco e a região mais próxima.
3. Espere o projeto terminar de ser criado.

## 2. Criar a tabela
1. No menu lateral, abra **SQL Editor** → **New query**.
2. Copie todo o conteúdo de `supabase/schema.sql`, cole e clique em **Run**.
   Isso cria a tabela `backups` e as regras para cada pessoa ver só os próprios dados.

## 3. Pegar a URL e a chave
1. Abra **Project Settings** → **API**.
2. Copie a **Project URL** e a chave **anon / public**.
   (Não use a chave `service_role`: ela dá acesso total e nunca deve ir para o app.)

## 4. Ligar no app
1. Na pasta `app-treino`, copie `.env.example` para `.env`.
2. Preencha `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Reinicie o servidor: `npx expo start --clear`.

No app, abra **Mais → Conta e sincronização** para criar a conta.

## E-mail de confirmação (opcional)
Por padrão o Supabase pede para confirmar o e-mail antes do primeiro login. Para testar sem confirmação,
vá em **Authentication → Providers → Email** e desligue **Confirm email**. Em uso real, deixe ligado.

## Como funciona
- Cada conta guarda uma cópia completa dos dados (treinos, histórico, pesagens, medidas, preferências).
- O app sincroniza ao abrir, ao voltar para ele e alguns segundos depois de você registrar algo.
- Se este aparelho e a nuvem mudaram desde a última sincronização, o app **pergunta qual versão manter**.
  Nada é apagado sem você escolher.
- Sair da conta mantém os dados neste aparelho.
