import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { checkSubscription, SubscriptionTier } from "../lib/revenuecat";
import EntryCard from "../components/EntryCard";

interface JournalEntry {
  id: string;
  content: string;
  audio_url: string | null;
  created_at: string;
  user_id: string;
}

export default function JournalScreen({ navigation }: any) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [weekCount, setWeekCount] = useState(0);
  const [tier, setTier] = useState<SubscriptionTier>("free");

  const FREE_WEEKLY_LIMIT = 3;

  const fetchEntries = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (data) setEntries(data);

    // Count entries this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeek = (data ?? []).filter(
      (e) => new Date(e.created_at) >= weekAgo
    );
    setWeekCount(thisWeek.length);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchEntries();
      checkSubscription().then(setTier);
    }, [fetchEntries])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEntries();
    setRefreshing(false);
  };

  const canAddEntry = tier !== "free" || weekCount < FREE_WEEKLY_LIMIT;

  return (
    <View style={styles.container}>
      {tier === "free" && (
        <View style={styles.counterBar}>
          <Text style={styles.counterText}>
            {weekCount}/{FREE_WEEKLY_LIMIT} entries this week
          </Text>
        </View>
      )}

      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <EntryCard entry={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#D4847A"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No entries yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to start journaling
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={[styles.fab, !canAddEntry && styles.fabDisabled]}
        onPress={() => {
          if (canAddEntry) {
            navigation.navigate("NewEntry");
          } else {
            navigation.navigate("Paywall" as never);
          }
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F0E8",
  },
  counterBar: {
    backgroundColor: "#FFF",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  counterText: {
    color: "#D4847A",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A4A4A",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#D4847A",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  fabDisabled: {
    opacity: 0.5,
  },
  fabText: {
    color: "#FFF",
    fontSize: 28,
    fontWeight: "300",
    marginTop: -2,
  },
});
