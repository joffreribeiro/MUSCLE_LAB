import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WorkoutProvider, useWorkout } from './src/context/WorkoutContext';
import { CloudSyncProvider } from './src/context/CloudSyncContext';
import { RootTabs } from './src/navigation/RootTabs';
import { OnboardingFlow } from './src/screens/OnboardingFlow';
import { colors } from './src/theme/tokens';

function AppInner() {
  const { hydrated, onboardingComplete } = useWorkout();

  if (!hydrated) {
    return <View style={{ flex: 1, backgroundColor: colors.fill50 }} />;
  }

  if (!onboardingComplete) {
    return (
      <>
        <OnboardingFlow />
        <StatusBar style="dark" />
      </>
    );
  }

  return (
    <NavigationContainer>
      <RootTabs />
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <WorkoutProvider>
          <CloudSyncProvider>
            <AppInner />
          </CloudSyncProvider>
        </WorkoutProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
