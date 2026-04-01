import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";

export default function EntryDetailScreen({ route, navigation }: any) {
  const { entry } = route.params;
  const insets = useSafeAreaInsets();
  const [content, setContent] = useState(entry.content);
  const [saving, setSaving] = useState(false);

  const date = new Date(entry.created_at);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("journal_entries")
      .update({ content })
      .eq("id", entry.id);

    setSaving(false);

    if (error) {
      Alert.alert("Error", "Failed to save changes. Please try again.");
      console.error("Failed to update entry:", error);
      return;
    }

    navigation.goBack();
  };

  const hasChanges = content !== entry.content;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2C1810" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Entry</Text>
        {hasChanges ? (
          <TouchableOpacity onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>
              {saving ? "Saving..." : "Save"}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 50 }} />
        )}
      </View>

      <Text style={styles.timestamp}>
        {formattedDate} at {formattedTime}
      </Text>

      <ScrollView contentContainerStyle={styles.inner}>
        {entry.audio_url && (
          <View style={styles.voiceBadge}>
            <Ionicons name="mic" size={14} color="#FFFFFF" />
            <Text style={styles.voiceBadgeText}>Voice Entry</Text>
          </View>
        )}

        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholder="Write your thoughts..."
          placeholderTextColor="#C4A99A"
        />
      </ScrollView>
    </KeyboardAvoidingView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2C1810",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#D4847A",
  },
  timestamp: {
    fontSize: 13,
    color: "#8B6E65",
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  inner: {
    padding: 20,
    flexGrow: 1,
  },
  voiceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#D4847A",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  voiceBadgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  input: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: "#2C1810",
    lineHeight: 24,
    minHeight: 300,
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
});
