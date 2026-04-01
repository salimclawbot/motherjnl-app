import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
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
        headerTintColor: "#2C1810",
        headerShadowVisible: false,
      }}
    >
      <JournalStack.Screen
        name="JournalList"
        component={JournalScreen}
        options={{ headerShown: false }}
      />
      <JournalStack.Screen
        name="NewEntry"
        component={NewEntryScreen}
        options={{ headerShown: false }}
      />
      <JournalStack.Screen
        name="EntryDetail"
        component={EntryDetailScreen}
        options={{ headerShown: false }}
      />
    </JournalStack.Navigator>
  );
}

function TabNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#D4847A",
        tabBarInactiveTintColor: "#8B6E65",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: "#D4847A",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
        headerStyle: { backgroundColor: "#F9F0E8" },
        headerTintColor: "#2C1810",
        headerShadowVisible: false,
      }}
    >
      <MainTab.Screen
        name="Journal"
        component={JournalStackScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Journal",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <MainTab.Screen
        name="Analysis"
        component={AnalysisScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Analysis",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "sparkles" : "sparkles-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <MainTab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Alerts",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "notifications" : "notifications-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarLabel: "Profile",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={24}
              color={color}
            />
          ),
        }}
      />
    </MainTab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#F9F0E8" },
        headerTintColor: "#2C1810",
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
