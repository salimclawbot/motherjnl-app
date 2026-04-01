import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { analyseEntry } from "../lib/gemini";

export default function AlertsScreen({ navigation }: any) {
  const { user } = useAuth();
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
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <Text style={styles.heading}>AI Observations</Text>
      <Text style={styles.subheading}>
        Flagged observations from your recent entries
      </Text>

      {!fetched && !loading && (
        <TouchableOpacity style={styles.fetchButton} onPress={fetchAlerts}>
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
        <View style={styles.card}>
          <Text style={styles.cardText}>
            No concerns flagged. Everything looks good!
          </Text>
        </View>
      )}

      {fetched &&
        !loading &&
        alerts.map((alert, i) => (
          <View key={i} style={styles.alertCard}>
            <Text style={styles.alertIcon}>!</Text>
            <Text style={styles.alertText}>{alert}</Text>
          </View>
        ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F0E8",
  },
  inner: {
    padding: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4A4A4A",
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: "#999",
    marginBottom: 20,
  },
  fetchButton: {
    backgroundColor: "#D4847A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  fetchButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingContainer: {
    alignItems: "center",
    paddingTop: 40,
  },
  loadingText: {
    color: "#4A4A4A",
    marginTop: 12,
    fontSize: 14,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardText: {
    fontSize: 16,
    color: "#4A4A4A",
    lineHeight: 24,
  },
  alertCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#D4847A",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  alertIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D4847A",
    color: "#FFF",
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 24,
    overflow: "hidden",
  },
  alertText: {
    flex: 1,
    fontSize: 15,
    color: "#4A4A4A",
    lineHeight: 22,
  },
});
