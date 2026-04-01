import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  entry: {
    id: string;
    content: string;
    audio_url: string | null;
    created_at: string;
  };
}

export default function EntryCard({ entry }: Props) {
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
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.date}>{formattedDate}</Text>
        <View style={styles.metaRow}>
          {entry.audio_url && <Text style={styles.voiceBadge}>Voice</Text>}
          <Text style={styles.time}>{formattedTime}</Text>
        </View>
      </View>
      <Text style={styles.content} numberOfLines={4}>
        {entry.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  date: {
    fontSize: 13,
    fontWeight: "600",
    color: "#D4847A",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  voiceBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFF",
    backgroundColor: "#D4847A",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  time: {
    fontSize: 12,
    color: "#999",
  },
  content: {
    fontSize: 15,
    color: "#4A4A4A",
    lineHeight: 22,
  },
});
