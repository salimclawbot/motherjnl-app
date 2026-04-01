import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  entry: {
    id: string;
    content: string;
    audio_url: string | null;
    created_at: string;
  };
  onPress?: () => void;
}

export default function EntryCard({ entry, onPress }: Props) {
  const date = new Date(entry.created_at);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={14} color="#8B6E65" />
          <Text style={styles.date}>{formattedDate}</Text>
        </View>
        <View style={styles.metaRow}>
          {entry.audio_url && (
            <View style={styles.voiceBadge}>
              <Ionicons name="mic" size={11} color="#FFFFFF" />
              <Text style={styles.voiceBadgeText}>Voice</Text>
            </View>
          )}
          <Text style={styles.time}>{formattedTime}</Text>
        </View>
      </View>
      <Text style={styles.content} numberOfLines={4}>
        {entry.content}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  date: {
    fontSize: 13,
    fontWeight: "600",
    color: "#8B6E65",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D4847A",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  voiceBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  time: {
    fontSize: 12,
    color: "#8B6E65",
  },
  content: {
    fontSize: 15,
    color: "#2C1810",
    lineHeight: 22,
  },
});
