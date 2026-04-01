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
import { analyseEntry, AnalysisResult } from "../lib/gemini";
import { LinearGradient } from "expo-linear-gradient";

type Tab = "summary" | "advice" | "patterns";
type AdviceMode = "today" | "week";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AnalysisScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [adviceMode, setAdviceMode] = useState<AdviceMode>("week");
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
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

  const runAnalysis = useCallback(async () => {
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

    // Fetch ALL entries (no date restriction) so analysis always works
    const { data } = await supabase
      .from("journal_entries")
      .select("content, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);

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

    const result = await analyseEntry(combinedText, "week");
    if (result) {
      setAnalysis(result);
      setAnalysisFailed(false);
    } else {
      setAnalysis(null);
      setAnalysisFailed(true);
    }
    setLoading(false);
    spinValue.setValue(0);
  }, [user]);

  const checkAndRun = useCallback(async () => {
    if (!user) return;
    // Always attempt analysis - runAnalysis handles the empty case gracefully
    setHasEntries(true);
    await runAnalysis();
  }, [user, runAnalysis]);

  useFocusEffect(
    useCallback(() => {
      checkAndRun();
    }, [checkAndRun])
  );

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

  const renderAdviceModePill = () => (
    <View style={styles.adviceModePill}>
      <TouchableOpacity
        style={[styles.adviceModeOption, adviceMode === "today" && styles.adviceModeOptionActive]}
        onPress={() => setAdviceMode("today")}
      >
        <Text style={[styles.adviceModeText, adviceMode === "today" && styles.adviceModeTextActive]}>
          Today
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.adviceModeOption, adviceMode === "week" && styles.adviceModeOptionActive]}
        onPress={() => setAdviceMode("week")}
      >
        <Text style={[styles.adviceModeText, adviceMode === "week" && styles.adviceModeTextActive]}>
          This Week
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTodayAdvice = () => {
    if (!analysis) return null;
    return (
      <View style={{ gap: 16 }}>
        {/* Today's Focus */}
        <LinearGradient
          colors={["#D4847A", "#E8B4A0"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.focusCard}
        >
          <View style={styles.cardHeader}>
            <Ionicons name="sunny-outline" size={22} color="#FFFFFF" />
            <Text style={styles.focusHeading}>Today's Focus</Text>
          </View>
          <Text style={styles.focusText}>{analysis.todayFocus}</Text>
        </LinearGradient>

        {/* Today's Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>✅</Text>
            <Text style={styles.cardHeading}>Your Actions for Today</Text>
          </View>
          {(analysis.todayActions ?? []).map((action, i) => (
            <View key={i} style={styles.actionRow}>
              <View style={styles.actionCircle}>
                <Text style={styles.actionNumber}>{i + 1}</Text>
              </View>
              <Text style={styles.actionText}>{action}</Text>
            </View>
          ))}
        </View>

        {/* Affirmation */}
        <View style={styles.affirmationCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="heart" size={20} color="#A07090" />
            <Text style={[styles.cardHeading, { color: "#6B4060" }]}>Your Affirmation</Text>
          </View>
          <Text style={styles.affirmationText}>{analysis.todayAffirmation}</Text>
        </View>
      </View>
    );
  };

  const renderWeekAdvice = () => {
    if (!analysis) return null;
    return (
      <View style={{ gap: 16 }}>
        {/* Priority Actions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="flag-outline" size={20} color="#D4847A" />
            <Text style={styles.cardHeading}>Priority Actions</Text>
          </View>
          {(analysis.priorityActions ?? []).map((item) => (
            <View key={item.rank} style={styles.priorityRow}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{item.rank}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.priorityAction}>{item.action}</Text>
                <Text style={styles.priorityReason}>{item.reason}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Deep Insights */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="analytics-outline" size={20} color="#D4847A" />
            <Text style={styles.cardHeading}>Deep Insights</Text>
          </View>
          {(analysis.insights ?? []).map((insight, i) => (
            <View key={i}>
              {i > 0 && <View style={styles.insightSeparator} />}
              <View style={styles.insightBlock}>
                <View style={styles.insightHeader}>
                  <Ionicons
                    name={(insight.icon as any) ?? "ellipse-outline"}
                    size={20}
                    color="#D4847A"
                  />
                  <Text style={styles.insightCategory}>{insight.category}</Text>
                </View>
                <Text style={styles.insightLabel}>What we detected:</Text>
                <Text style={styles.insightValue}>{insight.detected}</Text>
                <Text style={styles.insightLabel}>Why it matters:</Text>
                <Text style={styles.insightValue}>{insight.whyItMatters}</Text>
                {(insight.recommendations ?? []).length > 0 && (
                  <View style={{ marginTop: 8 }}>
                    {insight.recommendations.map((rec, j) => (
                      <View key={j} style={styles.recRow}>
                        <Text style={styles.recBullet}>•</Text>
                        <Text style={styles.recText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const MOOD_DATA = [
    { label: "Calm", emoji: "😌", color: "#A8D8B9", value: 0 },
    { label: "Happy", emoji: "😊", color: "#FFD966", value: 0 },
    { label: "Tired", emoji: "😴", color: "#B8A9C9", value: 0 },
    { label: "Anxious", emoji: "😰", color: "#F4A261", value: 0 },
    { label: "Stressed", emoji: "😤", color: "#E07070", value: 0 },
    { label: "Grateful", emoji: "🙏", color: "#81B29A", value: 0 },
  ];

  const SLEEP_DATA = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
    day: d,
    hours: 0,
  }));

  const ENERGY_DATA = [
    { label: "Week 1", value: 0 },
    { label: "Week 2", value: 0 },
    { label: "Week 3", value: 0 },
    { label: "Week 4", value: 0 },
  ];

  const renderPatternsContent = () => (
    <>
      {/* Chart 1: Entry Frequency */}
      <View style={styles.patternCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>📊</Text>
          <Text style={styles.cardHeading}>Entry Frequency</Text>
        </View>
        <Text style={styles.chartSubtitle}>Entries per day this week</Text>
        <View style={styles.chartContainer}>
          {dayFrequency.map((count, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: count > 0 ? `${(count / maxFreq) * 100}%` : 6,
                      backgroundColor: count > 0 ? "#D4847A" : "#E8D5CE",
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>{DAY_LABELS[i]}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.emptyChartNote}>📝 Keep journaling to see your weekly patterns</Text>
      </View>

      {/* Chart 2: Mood Distribution */}
      <View style={styles.patternCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🎭</Text>
          <Text style={styles.cardHeading}>Mood Distribution</Text>
        </View>
        <Text style={styles.chartSubtitle}>How you've been feeling</Text>
        <View style={styles.moodBarsContainer}>
          {MOOD_DATA.map((mood) => (
            <View key={mood.label} style={styles.moodBarRow}>
              <Text style={styles.moodBarEmoji}>{mood.emoji}</Text>
              <Text style={styles.moodBarLabel}>{mood.label}</Text>
              <View style={styles.moodBarTrack}>
                <View style={[styles.moodBarFill, { width: "0%", backgroundColor: mood.color }]} />
              </View>
              <Text style={styles.moodBarValue}>—</Text>
            </View>
          ))}
        </View>
        <Text style={styles.emptyChartNote}>💜 Log moods in your entries to populate this</Text>
      </View>

      {/* Chart 3: Sleep Quality */}
      <View style={styles.patternCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🌙</Text>
          <Text style={styles.cardHeading}>Sleep Quality</Text>
        </View>
        <Text style={styles.chartSubtitle}>Hours of rest per night</Text>
        <View style={styles.chartContainer}>
          {SLEEP_DATA.map((d, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <View style={[styles.bar, { height: 6, backgroundColor: "#B8A9C9" }]} />
              </View>
              <Text style={styles.barLabel}>{d.day}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.emptyChartNote}>😴 Mention your sleep in entries to track rest</Text>
      </View>

      {/* Chart 4: Energy Levels */}
      <View style={styles.patternCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>⚡</Text>
          <Text style={styles.cardHeading}>Energy Levels</Text>
        </View>
        <Text style={styles.chartSubtitle}>Weekly energy trend</Text>
        <View style={styles.energyChartContainer}>
          {ENERGY_DATA.map((d, i) => (
            <View key={i} style={styles.energyBarColumn}>
              <View style={styles.energyBarWrapper}>
                <View style={[styles.energyBar, { height: 6, backgroundColor: "#FFD966" }]} />
              </View>
              <Text style={styles.barLabel}>{d.label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.emptyChartNote}>⚡ Note your energy levels to see trends over time</Text>
      </View>

      {/* Chart 5: Stress Indicators */}
      <View style={styles.patternCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>🌊</Text>
          <Text style={styles.cardHeading}>Stress Indicators</Text>
        </View>
        <Text style={styles.chartSubtitle}>Stress mentions detected in entries</Text>
        <View style={styles.chartContainer}>
          {DAY_LABELS.map((day, i) => (
            <View key={i} style={styles.barColumn}>
              <View style={styles.barWrapper}>
                <View style={[styles.bar, { height: 6, backgroundColor: "#F4A261" }]} />
              </View>
              <Text style={styles.barLabel}>{day}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.emptyChartNote}>🌊 Stress patterns will appear as you journal more</Text>
      </View>

      {/* Chart 6: Wellbeing Score */}
      <View style={styles.patternCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>💚</Text>
          <Text style={styles.cardHeading}>Wellbeing Score</Text>
        </View>
        <Text style={styles.chartSubtitle}>Your overall wellbeing this week</Text>
        <View style={styles.wellbeingContainer}>
          <View style={styles.wellbeingCircle}>
            <Text style={styles.wellbeingScore}>—</Text>
            <Text style={styles.wellbeingLabel}>/ 100</Text>
          </View>
          <View style={styles.wellbeingBreakdown}>
            {[
              { label: "Physical", color: "#D4847A", pct: 0 },
              { label: "Emotional", color: "#A8D8B9", pct: 0 },
              { label: "Social", color: "#FFD966", pct: 0 },
              { label: "Rest", color: "#B8A9C9", pct: 0 },
            ].map((item) => (
              <View key={item.label} style={styles.wellbeingRow}>
                <View style={[styles.wellbeingDot, { backgroundColor: item.color }]} />
                <Text style={styles.wellbeingRowLabel}>{item.label}</Text>
                <View style={styles.wellbeingTrack}>
                  <View style={[styles.wellbeingFill, { width: "5%", backgroundColor: item.color }]} />
                </View>
              </View>
            ))}
          </View>
        </View>
        <Text style={styles.emptyChartNote}>💚 Score builds up after 7+ days of journaling</Text>
      </View>
    </>
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
              {renderPatternsContent()}
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
              {renderPatternsContent()}
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
            {activeTab === "summary" && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardIcon}>📋</Text>
                  <Text style={styles.cardHeading}>Your Week at a Glance</Text>
                </View>
                <Text style={styles.cardText}>{analysis.summary}</Text>
              </View>
            )}

            {activeTab === "advice" && (
              <>
                {renderAdviceModePill()}
                {adviceMode === "today" ? renderTodayAdvice() : renderWeekAdvice()}
              </>
            )}

            {activeTab === "patterns" && (
              {renderPatternsContent()}
            )}

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
    paddingBottom: 40,
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
  // Advice mode toggle pill
  adviceModePill: {
    flexDirection: "row",
    backgroundColor: "#F0E4DC",
    borderRadius: 24,
    padding: 3,
    marginBottom: 16,
  },
  adviceModeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 22,
    alignItems: "center",
  },
  adviceModeOptionActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  adviceModeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8B6E65",
  },
  adviceModeTextActive: {
    color: "#D4847A",
  },
  // Today focus card (rendered inside LinearGradient)
  focusCard: {
    borderRadius: 16,
    padding: 24,
  },
  focusHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  focusText: {
    fontSize: 16,
    color: "#FFFFFF",
    lineHeight: 24,
  },
  // Today actions
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  actionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D4847A",
    alignItems: "center",
    justifyContent: "center",
  },
  actionNumber: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  actionText: {
    flex: 1,
    fontSize: 15,
    color: "#2C1810",
    lineHeight: 22,
  },
  // Affirmation card
  affirmationCard: {
    backgroundColor: "#F5ECF4",
    borderRadius: 16,
    padding: 24,
  },
  affirmationText: {
    fontSize: 16,
    color: "#6B4060",
    lineHeight: 24,
    fontStyle: "italic",
  },
  // Priority actions
  priorityRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 14,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#D4847A",
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  priorityAction: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2C1810",
    lineHeight: 22,
  },
  priorityReason: {
    fontSize: 13,
    color: "#8B6E65",
    lineHeight: 18,
    marginTop: 2,
  },
  // Insight blocks
  insightSeparator: {
    height: 1,
    backgroundColor: "#F0E4DC",
    marginVertical: 16,
  },
  insightBlock: {
    marginBottom: 4,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  insightCategory: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2C1810",
  },
  insightLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B6E65",
    marginTop: 6,
    marginBottom: 2,
  },
  insightValue: {
    fontSize: 15,
    color: "#2C1810",
    lineHeight: 22,
  },
  recRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  recBullet: {
    fontSize: 15,
    color: "#D4847A",
    fontWeight: "700",
  },
  recText: {
    flex: 1,
    fontSize: 14,
    color: "#5C4033",
    lineHeight: 20,
  },
  // Patterns tab
  patternCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  chartSubtitle: {
    fontSize: 13,
    color: "#8B6E65",
    marginBottom: 14,
    marginTop: -8,
  },
  emptyChartNote: {
    fontSize: 12,
    color: "#B09A90",
    marginTop: 10,
    textAlign: "center",
    fontStyle: "italic",
  },
  // Mood bars
  moodBarsContainer: {
    gap: 10,
  },
  moodBarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  moodBarEmoji: {
    fontSize: 16,
    width: 22,
  },
  moodBarLabel: {
    fontSize: 13,
    color: "#2C1810",
    width: 60,
    fontWeight: "500",
  },
  moodBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: "#F0E4DC",
    borderRadius: 5,
    overflow: "hidden",
  },
  moodBarFill: {
    height: 10,
    borderRadius: 5,
    minWidth: 4,
  },
  moodBarValue: {
    fontSize: 12,
    color: "#8B6E65",
    width: 20,
    textAlign: "right",
  },
  // Energy chart
  energyChartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    marginTop: 8,
  },
  energyBarColumn: {
    flex: 1,
    alignItems: "center",
  },
  energyBarWrapper: {
    width: 32,
    height: 80,
    justifyContent: "flex-end",
  },
  energyBar: {
    width: 32,
    borderRadius: 6,
    minHeight: 6,
  },
  // Wellbeing score
  wellbeingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 8,
  },
  wellbeingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#E8D5CE",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FDF6F0",
  },
  wellbeingScore: {
    fontSize: 22,
    fontWeight: "800",
    color: "#D4847A",
  },
  wellbeingLabel: {
    fontSize: 11,
    color: "#8B6E65",
  },
  wellbeingBreakdown: {
    flex: 1,
    gap: 8,
  },
  wellbeingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  wellbeingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  wellbeingRowLabel: {
    fontSize: 12,
    color: "#5C4033",
    width: 60,
  },
  wellbeingTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#F0E4DC",
    borderRadius: 4,
    overflow: "hidden",
  },
  wellbeingFill: {
    height: 8,
    borderRadius: 4,
    minWidth: 4,
  },
});
