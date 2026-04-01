import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { analyseEntry } from "../lib/gemini";

export default function AlertsScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [alerts, setAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const fetchAlerts = async () => {
    if (!user) return;
    setLoading(true);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data } = await supabase
      .from("journal_entries")
      .select("content, created_at")
      .eq("user_id", user.id)
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: true });

    if (!data || data.length === 0) {
      setAlerts([]);
      setLoading(false);
      setFetched(true);
      return;
    }

    const combinedText = data
      .map(
        (e) =>
          `[${new Date(e.created_at).toLocaleDateString()}] ${e.content}`
      )
      .join("\n\n");

    try {
      const result = await analyseEntry(combinedText);
      setAlerts(result.alerts);
    } catch {
      setAlerts([]);
    }
    setLoading(false);
    setFetched(true);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Ionicons name="notifications" size={24} color="#D4847A" />
        <Text style={styles.headerTitle}>Mindful Alerts</Text>
      </View>

      <ScrollView contentContainerStyle={styles.inner}>
        {!fetched && !loading && (
          <TouchableOpacity style={styles.fetchButton} onPress={fetchAlerts}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
            <Text style={styles.fetchButtonText}>Check for Alerts</Text>
          </TouchableOpacity>
        )}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4847A" />
            <Text style={styles.loadingText}>Scanning your entries...</Text>
          </View>
        )}

        {fetched && !loading && alerts.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>🌸</Text>
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptySubtext}>
              No concerns flagged — you are doing great
            </Text>
          </View>
        )}

        {fetched &&
          !loading &&
          alerts.map((alert, i) => (
            <View key={i} style={styles.alertCard}>
              <View style={styles.alertIconContainer}>
                <Ionicons name="alert-circle" size={20} color="#D4847A" />
              </View>
              <Text style={styles.alertText}>{alert}</Text>
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F0E8",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#2C1810",
  },
  inner: {
    padding: 20,
  },
  fetchButton: {
    backgroundColor: "#D4847A",
    borderRadius: 24,
    padding: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  fetchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingContainer: {
    alignItems: "center",
    paddingTop: 40,
  },
  loadingText: {
    color: "#8B6E65",
    marginTop: 14,
    fontSize: 15,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C1810",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#8B6E65",
    textAlign: "center",
    lineHeight: 22,
  },
  alertCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#D4847A",
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    gap: 14,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FDF0EE",
    justifyContent: "center",
    alignItems: "center",
  },
  alertText: {
    flex: 1,
    fontSize: 15,
    color: "#2C1810",
    lineHeight: 22,
  },
});
