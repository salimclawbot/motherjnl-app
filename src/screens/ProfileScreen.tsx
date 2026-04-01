import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { checkSubscription, SubscriptionTier } from "../lib/revenuecat";
import { supabase } from "../lib/supabase";

export default function ProfileScreen({ navigation }: any) {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, daysActive: 0 });

  useFocusEffect(
    useCallback(() => {
      checkSubscription().then(setTier);
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    if (!user) return;

    const { count: total } = await supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: thisWeek } = await supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", weekAgo.toISOString());

    const { data: dates } = await supabase
      .from("journal_entries")
      .select("created_at")
      .eq("user_id", user.id);

    const uniqueDays = new Set(
      (dates ?? []).map((d) => new Date(d.created_at).toDateString())
    );

    setStats({
      total: total ?? 0,
      thisWeek: thisWeek ?? 0,
      daysActive: uniqueDays.size,
    });
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: signOut },
    ]);
  };

  const tierLabel = {
    free: "Free Plan",
    starter: "Starter Plan",
    pro: "Pro Plan",
  };

  const initial = (user?.email?.[0] ?? "?").toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.inner}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <LinearGradient
            colors={["#D4847A", "#E8B4A0"]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{initial}</Text>
          </LinearGradient>
          <Text style={styles.nameText}>
            {user?.email?.split("@")[0] ?? "User"}
          </Text>
          <Text style={styles.emailText}>{user?.email ?? "—"}</Text>
          <View style={styles.tierBadge}>
            <Text style={styles.tierBadgeText}>{tierLabel[tier]}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.thisWeek}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.daysActive}</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settingsSection}>
          {tier === "free" && (
            <TouchableOpacity
              style={styles.settingsItem}
              onPress={() => navigation.navigate("Paywall" as never)}
            >
              <View style={styles.settingsLeft}>
                <Ionicons name="star-outline" size={22} color="#D4847A" />
                <Text style={styles.settingsText}>Upgrade Plan</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C4A99A" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsLeft}>
              <Ionicons name="notifications-outline" size={22} color="#8B6E65" />
              <Text style={styles.settingsText}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4A99A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#8B6E65" />
              <Text style={styles.settingsText}>Privacy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4A99A" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem}>
            <View style={styles.settingsLeft}>
              <Ionicons name="help-circle-outline" size={22} color="#8B6E65" />
              <Text style={styles.settingsText}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#C4A99A" />
          </TouchableOpacity>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#E05050" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F0E8",
  },
  inner: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 28,
    marginTop: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  nameText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C1810",
    marginBottom: 2,
  },
  emailText: {
    fontSize: 14,
    color: "#8B6E65",
    marginBottom: 12,
  },
  tierBadge: {
    backgroundColor: "#FDF0EE",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tierBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D4847A",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#D4847A",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8B6E65",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  settingsSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5EDE8",
  },
  settingsLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  settingsText: {
    fontSize: 16,
    color: "#2C1810",
    fontWeight: "500",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#E05050",
    borderRadius: 24,
    padding: 14,
  },
  signOutText: {
    color: "#E05050",
    fontSize: 16,
    fontWeight: "600",
  },
});
