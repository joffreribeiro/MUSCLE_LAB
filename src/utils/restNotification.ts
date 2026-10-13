import { Platform } from 'react-native';

// Aviso do fim do descanso por notificação local: toca o som e vibra mesmo com a tela bloqueada ou
// o app em segundo plano. Só existe no celular; na web (e se o módulo faltar) tudo vira no-op.

type NotificationsModule = typeof import('expo-notifications');

let Notifications: NotificationsModule | null = null;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications') as NotificationsModule;
  } catch {
    Notifications = null;
  }
}

const CHANNEL_ID = 'descanso';

let ready: Promise<boolean> | null = null;
let scheduledId: string | null = null;
// Evita que um agendamento antigo, ainda em andamento, sobreviva a um cancelamento mais novo.
let generation = 0;

/** Configura o canal e o comportamento em primeiro plano; pede permissão uma vez. */
function ensureReady(askPermission: boolean): Promise<boolean> {
  const N = Notifications;
  if (!N) return Promise.resolve(false);
  if (!ready) {
    ready = (async () => {
      try {
        N.setNotificationHandler({
          handleNotification: async () => ({
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });
        if (Platform.OS === 'android') {
          await N.setNotificationChannelAsync(CHANNEL_ID, {
            name: 'Fim do descanso',
            importance: N.AndroidImportance.MAX,
            vibrationPattern: [0, 300, 150, 300],
            sound: 'default',
          });
        }
        return true;
      } catch {
        return false;
      }
    })();
  }
  return ready.then(async (ok) => {
    if (!ok || !N) return false;
    try {
      const current = await N.getPermissionsAsync();
      if (current.granted) return true;
      if (!askPermission || !current.canAskAgain) return false;
      return (await N.requestPermissionsAsync()).granted;
    } catch {
      return false;
    }
  });
}

/** Pede a permissão de notificação (ao ligar o aviso nas preferências). Devolve se foi concedida. */
export function requestRestAlertPermission(): Promise<boolean> {
  return ensureReady(true);
}

/** Cancela o aviso agendado, se houver. */
export async function cancelRestEnd(): Promise<void> {
  generation += 1;
  const N = Notifications;
  const id = scheduledId;
  scheduledId = null;
  if (!N || !id) return;
  try {
    await N.cancelScheduledNotificationAsync(id);
  } catch {
    // sem o que cancelar
  }
}

/** Agenda o aviso para daqui a `seconds` segundos, no lugar de qualquer aviso anterior. */
export async function scheduleRestEnd(seconds: number): Promise<void> {
  await cancelRestEnd();
  const N = Notifications;
  const mine = generation;
  if (!N || !(seconds >= 1)) return;
  if (!(await ensureReady(true))) return;
  if (mine !== generation) return; // cancelado ou reagendado enquanto esperava a permissão
  try {
    const id = await N.scheduleNotificationAsync({
      content: { title: 'Descanso terminou', body: 'Hora da próxima série.', sound: 'default' },
      trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.ceil(seconds), channelId: CHANNEL_ID },
    });
    if (mine !== generation) {
      await N.cancelScheduledNotificationAsync(id);
      return;
    }
    scheduledId = id;
  } catch {
    // sem notificação: o cronômetro na tela continua funcionando
  }
}
