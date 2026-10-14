import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WorkoutProvider, useWorkout } from './src/context/WorkoutContext';
import { CloudSyncProvider, useCloudSync } from './src/context/CloudSyncContext';
import { UpdateProvider } from './src/context/UpdateContext';
import { UpdateBanner } from './src/components/UpdateBanner';
import { authGate } from './src/data/authGate';
import { LoginScreen } from './src/screens/LoginScreen';
import { RootTabs } from './src/navigation/RootTabs';
import { OnboardingFlow } from './src/screens/OnboardingFlow';
import { colors } from './src/theme/tokens';

function AppInner() {
  const { hydrated, onboardingComplete } = useWorkout();
  const cloud = useCloudSync();
  const gate = authGate({ configured: cloud.configured, authReady: cloud.authReady, hasUser: cloud.user !== null });

  if (!hydrated || gate === 'carregando') {
    return <View style={{ flex: 1, backgroundColor: colors.fill50 }} />;
  }

  // Com a conta na nuvem configurada, é preciso entrar antes de ver qualquer tela do app.
  if (gate === 'login') {
    return (
      <View style={{ flex: 1 }}>
        <UpdateBanner />
        <LoginScreen />
        <StatusBar style="dark" />
      </View>
    );
  }

  if (!onboardingComplete) {
    return (
      <View style={{ flex: 1 }}>
        <UpdateBanner />
        <OnboardingFlow />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <UpdateBanner />
      <NavigationContainer>
        <RootTabs />
        <StatusBar style="dark" />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WorkoutProvider>
          <CloudSyncProvider>
            <UpdateProvider>
              <AppInner />
            </UpdateProvider>
          </CloudSyncProvider>
        </WorkoutProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
