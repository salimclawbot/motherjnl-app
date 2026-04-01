import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { analyseEntry } from "../lib/gemini";

type Tab = "summary" | "advice" | "patterns";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalysisScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [analysis, setAnalysis] = useState<{
    summary: string;
    advice: string;
    alerts: string[];
    patterns?: { entryFrequency: string[] };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasEntries, setHasEntries] = useState<boolean | null>(null);
  const [dayFrequency, setDayFrequency] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const skeletonAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (loading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(skeletonAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(skeletonAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [loading]);

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
    setAnalysisFailed(false);

    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data } = await supabase
      .from("journal_entries")
      .select("content, created_at")
      .eq("user_id", user.id)
      .gte("created_at", weekAgo.toISOString())
      .order("created_at", { ascending: true });

    if (!data || data.length === 0) {
      setAnalysis(null);
      setAnalysisFailed(false);
      setLoading(false);
      return;
    }

    // Calculate day frequency
    const freq = [0, 0, 0, 0, 0, 0, 0];
    data.forEach((e) => {
      const day = new Date(e.created_at).getDay();
      const idx = day === 0 ? 6 : day - 1;
      freq[idx]++;
    });
    setDayFrequency(freq);

    const combinedText = data
      .map(
        (e) =>
          `[${new Date(e.created_at).toLocaleDateString()}] ${e.content}`
      )
      .join("\n\n");

    const result = await analyseEntry(combinedText);
    if (result) {
      setAnalysis(result);
      setAnalysisFailed(false);
    } else {
      setAnalysis(null);
      setAnalysisFailed(true);
    }
    setLoading(false);
    spinValue.setValue(0);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  if (hasEntries === false) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.emptyEmoji}>✨</Text>
        <Text style={styles.emptyTitle}>No entries yet</Text>
        <Text style={styles.emptySubtext}>
          Write your first journal entry to get AI insights
        </Text>
      </View>
    );
  }

  const maxFreq = Math.max(...dayFrequency, 1);
  const showPreview = !analysis && !loading;
  const showAnalysisFailed = analysisFailed && !loading;

  const renderSummaryPreview = () => (
    <View style={styles.previewCard}>
      <Text style={styles.previewHeading}>
        Your weekly summary will appear here ✨
      </Text>
      <View style={styles.previewChipsContainer}>
        {["😴 Sleep patterns detected", "💪 Stress levels trending down", "🌸 Positive moments: 4 this week"].map((chip) => (
          <View key={chip} style={styles.previewChip}>
            <Text style={styles.previewChipText}>{chip}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.previewCaption}>
        Write a few entries and your personal summary will come alive
      </Text>
    </View>
  );

  const renderAdvicePreview = () => (
    <View style={styles.previewCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardIcon}>💜</Text>
        <Text style={styles.cardHeading}>Gentle Guidance</Text>
      </View>
      <Text style={styles.previewSubheading}>
        Here is an example of the advice you will receive:
      </Text>
      <View style={styles.exampleBlock}>
        <Text style={styles.exampleText}>
          You have been showing great resilience this week. Remember to take
          moments for yourself — even 5 minutes of quiet can recharge you. Your
          entries show you care deeply about your family.
        </Text>
      </View>
      <Text style={styles.previewCaption}>
        Your personalised advice appears after your first few entries
      </Text>
    </View>
  );

  const renderMoodChips = () => (
    <View style={styles.moodSection}>
      <Text style={styles.moodSectionTitle}>Mood Distribution</Text>
      <View style={styles.moodChipsContainer}>
        {[
          { label: "Calm", emoji: "😌" },
          { label: "Happy", emoji: "😊" },
          { label: "Tired", emoji: "😴" },
          { label: "Anxious", emoji: "😰" },
        ].map((mood) => (
          <View key={mood.label} style={styles.moodChip}>
            <Text style={styles.moodChipText}>
              {mood.label} {mood.emoji}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={24} color="#D4847A" />
        <Text style={styles.headerTitle}>Your Insights</Text>
      </View>

      <ScrollView contentContainerStyle={styles.inner}>
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

        {showPreview && !showAnalysisFailed && (
          <>
            <TouchableOpacity style={styles.analyseButton} onPress={runAnalysis}>
              <Ionicons name="sparkles-outline" size={20} color="#FFFFFF" />
              <Text style={styles.analyseButtonText}>Analyse Last 7 Days</Text>
            </TouchableOpacity>

            {activeTab === "summary" && renderSummaryPreview()}
            {activeTab === "advice" && renderAdvicePreview()}
            {activeTab === "patterns" && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>📊</Text>
                  <Text style={styles.cardHeading}>Entry Frequency</Text>
                </View>
                <View style={styles.chartContainer}>
                  {dayFrequency.map((count, i) => (
                    <View key={i} style={styles.barColumn}>
                      <View style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${(count / maxFreq) * 100}%`,
                              backgroundColor:
                                count > 0 ? "#D4847A" : "#E8D5CE",
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{DAY_LABELS[i]}</Text>
                    </View>
                  ))}
                </View>
                {renderMoodChips()}
              </View>
            )}
          </>
        )}

        {showAnalysisFailed && (
          <>
            <TouchableOpacity style={styles.analyseButton} onPress={runAnalysis}>
              <Ionicons name="refresh-outline" size={20} color="#FFFFFF" />
              <Text style={styles.analyseButtonText}>Try Again</Text>
            </TouchableOpacity>

            {activeTab === "summary" && renderSummaryPreview()}
            {activeTab === "advice" && renderAdvicePreview()}
            {activeTab === "patterns" && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>📊</Text>
                  <Text style={styles.cardHeading}>Entry Frequency</Text>
                </View>
                <View style={styles.chartContainer}>
                  {dayFrequency.map((count, i) => (
                    <View key={i} style={styles.barColumn}>
                      <View style={styles.barWrapper}>
                        <View
                          style={[
                            styles.bar,
                            {
                              height: `${(count / maxFreq) * 100}%`,
                              backgroundColor:
                                count > 0 ? "#D4847A" : "#E8D5CE",
                            },
                          ]}
                        />
                      </View>
                      <Text style={styles.barLabel}>{DAY_LABELS[i]}</Text>
                    </View>
                  ))}
                </View>
                {renderMoodChips()}
              </View>
            )}
          </>
        )}

        {loading && (
          <View>
            {[1, 2, 3].map((i) => (
              <Animated.View
                key={i}
                style={[styles.skeletonCard, { opacity: skeletonAnim }]}
              >
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, { width: "70%" }]} />
                <View style={[styles.skeletonLine, { width: "50%" }]} />
              </Animated.View>
            ))}
          </View>
        )}

        {analysis && !loading && (
          <>
            <View style={styles.card}>
              {activeTab === "summary" && (
                <>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>📋</Text>
                    <Text style={styles.cardHeading}>Your Week at a Glance</Text>
                  </View>
                  <Text style={styles.cardText}>{analysis.summary}</Text>
                </>
              )}
              {activeTab === "advice" && (
                <>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>💜</Text>
                    <Text style={styles.cardHeading}>Gentle Guidance</Text>
                  </View>
                  <Text style={styles.cardText}>{analysis.advice}</Text>
                </>
              )}
              {activeTab === "patterns" && (
                <>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>📊</Text>
                    <Text style={styles.cardHeading}>Entry Frequency</Text>
                  </View>
                  <View style={styles.chartContainer}>
                    {dayFrequency.map((count, i) => (
                      <View key={i} style={styles.barColumn}>
                        <View style={styles.barWrapper}>
                          <View
                            style={[
                              styles.bar,
                              {
                                height: `${(count / maxFreq) * 100}%`,
                                backgroundColor:
                                  count > 0 ? "#D4847A" : "#E8D5CE",
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.barLabel}>{DAY_LABELS[i]}</Text>
                      </View>
                    ))}
                  </View>
                  {renderMoodChips()}
                </>
              )}
            </View>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={runAnalysis}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons name="refresh" size={18} color="#D4847A" />
              </Animated.View>
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </TouchableOpacity>
          </>
        )}
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
  tabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "#D4847A",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B6E65",
  },
  tabTextActive: {
    color: "#FFFFFF",
  },
  analyseButton: {
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
  analyseButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
  },
  skeletonLine: {
    height: 14,
    backgroundColor: "#E8D5CE",
    borderRadius: 7,
    marginBottom: 10,
    width: "90%",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 8,
  },
  cardIcon: {
    fontSize: 22,
  },
  cardHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2C1810",
  },
  cardText: {
    fontSize: 16,
    color: "#2C1810",
    lineHeight: 24,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
    marginTop: 8,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barWrapper: {
    width: 24,
    height: 100,
    justifyContent: "flex-end",
  },
  bar: {
    width: 24,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 11,
    color: "#8B6E65",
    marginTop: 6,
    fontWeight: "600",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#D4847A",
    borderRadius: 24,
    padding: 14,
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
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C1810",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 15,
    color: "#8B6E65",
    textAlign: "center",
    lineHeight: 22,
  },
  // Preview / empty state styles
  previewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "#E8D5CE",
    borderStyle: "dashed",
  },
  previewHeading: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2C1810",
    marginBottom: 16,
    textAlign: "center",
  },
  previewSubheading: {
    fontSize: 14,
    color: "#8B6E65",
    marginBottom: 12,
  },
  previewChipsContainer: {
    gap: 10,
    marginBottom: 16,
  },
  previewChip: {
    backgroundColor: "#FDF6F0",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E8D5CE",
  },
  previewChipText: {
    fontSize: 15,
    color: "#8B6E65",
  },
  previewCaption: {
    fontSize: 13,
    color: "#B09A90",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  exampleBlock: {
    backgroundColor: "#FDF6F0",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    borderLeftColor: "#D4847A",
    marginBottom: 14,
  },
  exampleText: {
    fontSize: 15,
    color: "#5C4033",
    lineHeight: 22,
    fontStyle: "italic",
  },
  moodSection: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0E4DC",
  },
  moodSectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2C1810",
    marginBottom: 12,
  },
  moodChipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  moodChip: {
    backgroundColor: "#FDF6F0",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#E8D5CE",
  },
  moodChipText: {
    fontSize: 14,
    color: "#8B6E65",
    fontWeight: "500",
  },
});
