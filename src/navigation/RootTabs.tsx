import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TreinosStackNavigator } from './TreinosStack';
import { ManualStackNavigator } from './ManualStack';
import { MaisStackNavigator } from './MaisStack';
import { CustomTabBar } from './CustomTabBar';
import { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="TreinosTab" component={TreinosStackNavigator} />
      <Tab.Screen name="ManualTab" component={ManualStackNavigator} />
      <Tab.Screen name="MaisTab" component={MaisStackNavigator} />
    </Tab.Navigator>
  );
}
