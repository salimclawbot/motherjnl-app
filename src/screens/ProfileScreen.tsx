import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { checkSubscription, SubscriptionTier } from "../lib/revenuecat";

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const [tier, setTier] = useState<SubscriptionTier>("free");

  useFocusEffect(
    useCallback(() => {
      checkSubscription().then(setTier);
    }, [])
  );

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const tierLabel = {
    free: "Free",
    starter: "Starter",
    pro: "Pro",
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email ?? "—"}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Subscription</Text>
        <View style={styles.tierRow}>
          <Text style={styles.value}>{tierLabel[tier]}</Text>
          {tier === "free" && (
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={() => navigation.navigate("Paywall" as never)}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F0E8",
    padding: 16,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: "#4A4A4A",
    fontWeight: "500",
  },
  tierRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  upgradeButton: {
    backgroundColor: "#D4847A",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  upgradeButtonText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "600",
  },
  signOutButton: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  signOutText: {
    color: "#D4847A",
    fontSize: 16,
    fontWeight: "600",
  },
});
