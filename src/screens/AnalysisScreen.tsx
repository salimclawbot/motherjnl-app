import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { analyseEntry } from "../lib/gemini";

type Tab = "summary" | "advice" | "patterns";

export default function AnalysisScreen({ navigation }: any) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [analysis, setAnalysis] = useState<{
    summary: string;
    advice: string;
    alerts: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasEntries, setHasEntries] = useState<boolean | null>(null);

  const checkEntries = useCallback(async () => {
    if (!user) return;
    const { count } = await supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);
    setHasEntries((count ?? 0) > 0);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      checkEntries();
    }, [checkEntries])
  );

  const runAnalysis = async () => {
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
      setAnalysis({
        summary: "No entries found in the last 7 days.",
        advice: "Start journaling to get personalised insights!",
        alerts: [],
      });
      setLoading(false);
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
      setAnalysis(result);
    } catch (error) {
      console.error("Analysis failed:", error);
      setAnalysis({
        summary: "Unable to analyse entries right now.",
        advice:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
        alerts: [],
      });
    }
    setLoading(false);
  };

  if (hasEntries === false) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No entries yet</Text>
        <Text style={styles.emptySubtext}>
          Write your first journal entry to get AI insights
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.tabs}>
        {(["summary", "advice", "patterns"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {!analysis && !loading && (
        <TouchableOpacity style={styles.analyseButton} onPress={runAnalysis}>
          <Text style={styles.analyseButtonText}>Analyse Last 7 Days</Text>
        </TouchableOpacity>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#D4847A" />
          <Text style={styles.loadingText}>Analysing your entries...</Text>
        </View>
      )}

      {analysis && !loading && (
        <>
          <View style={styles.card}>
            {activeTab === "summary" && (
              <Text style={styles.cardText}>{analysis.summary}</Text>
            )}
            {activeTab === "advice" && (
              <Text style={styles.cardText}>{analysis.advice}</Text>
            )}
            {activeTab === "patterns" && (
              <>
                {analysis.alerts.length > 0 ? (
                  analysis.alerts.map((alert, i) => (
                    <View key={i} style={styles.alertItem}>
                      <Text style={styles.alertDot}>•</Text>
                      <Text style={styles.cardText}>{alert}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.cardText}>
                    No patterns or concerns flagged. Keep up the good work!
                  </Text>
                )}
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={runAnalysis}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </>
      )}
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
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#D4847A",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A4A4A",
  },
  tabTextActive: {
    color: "#FFF",
  },
  analyseButton: {
    backgroundColor: "#D4847A",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  analyseButtonText: {
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
    flex: 1,
  },
  alertItem: {
    flexDirection: "row",
    marginBottom: 8,
    gap: 8,
  },
  alertDot: {
    color: "#D4847A",
    fontSize: 16,
    fontWeight: "700",
  },
  refreshButton: {
    borderWidth: 1.5,
    borderColor: "#D4847A",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    marginTop: 16,
  },
  refreshButtonText: {
    color: "#D4847A",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#F9F0E8",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A4A4A",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
  },
});
