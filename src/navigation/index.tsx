import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useAuth } from "../context/AuthContext";

import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import JournalScreen from "../screens/JournalScreen";
import NewEntryScreen from "../screens/NewEntryScreen";
import EntryDetailScreen from "../screens/EntryDetailScreen";
import AnalysisScreen from "../screens/AnalysisScreen";
import AlertsScreen from "../screens/AlertsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PaywallScreen from "../screens/PaywallScreen";

const AuthStack = createStackNavigator();
const MainTab = createBottomTabNavigator();
const JournalStack = createStackNavigator();
const RootStack = createStackNavigator();

function JournalStackScreen() {
  return (
    <JournalStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#F9F0E8" },
        headerTintColor: "#4A4A4A",
        headerShadowVisible: false,
      }}
    >
      <JournalStack.Screen
        name="JournalList"
        component={JournalScreen}
        options={{ title: "Journal" }}
      />
      <JournalStack.Screen
        name="NewEntry"
        component={NewEntryScreen}
        options={{ title: "New Entry" }}
      />
      <JournalStack.Screen
        name="EntryDetail"
        component={EntryDetailScreen}
        options={{ title: "Entry" }}
      />
    </JournalStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#D4847A",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          backgroundColor: "#FFF",
          borderTopColor: "#EEE",
        },
        headerStyle: { backgroundColor: "#F9F0E8" },
        headerTintColor: "#4A4A4A",
        headerShadowVisible: false,
      }}
    >
      <MainTab.Screen
        name="Journal"
        component={JournalStackScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Journal",
        }}
      />
      <MainTab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{ tabBarLabel: "Analysis" }}
      />
      <MainTab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ tabBarLabel: "Alerts" }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: "Profile" }}
      />
    </MainTab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#F9F0E8" },
        headerTintColor: "#4A4A4A",
        headerShadowVisible: false,
      }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Signup"
        component={SignupScreen}
        options={{ title: "Create Account" }}
      />
    </AuthStack.Navigator>
  );
}

export default function Navigation() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#F9F0E8",
        }}
      >
        <ActivityIndicator size="large" color="#D4847A" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <>
            <RootStack.Screen name="Main" component={TabNavigator} />
            <RootStack.Screen
              name="Paywall"
              component={PaywallScreen}
              options={{ presentation: "modal" }}
            />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
