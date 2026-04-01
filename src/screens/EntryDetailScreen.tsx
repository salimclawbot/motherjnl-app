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
import { supabase } from "../lib/supabase";

export default function EntryDetailScreen({ route, navigation }: any) {
  const { entry } = route.params;
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
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.meta}>
          <Text style={styles.date}>{formattedDate}</Text>
          <Text style={styles.time}>{formattedTime}</Text>
          {entry.audio_url && <Text style={styles.voiceBadge}>Voice Entry</Text>}
        </View>

        <TextInput
          style={styles.input}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          placeholder="Write your thoughts..."
          placeholderTextColor="#999"
        />
      </ScrollView>

      {hasChanges && (
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save"}
          </Text>
        </TouchableOpacity>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F0E8",
  },
  inner: {
    padding: 16,
    flexGrow: 1,
  },
  meta: {
    marginBottom: 16,
  },
  date: {
    fontSize: 16,
    fontWeight: "600",
    color: "#D4847A",
    marginBottom: 2,
  },
  time: {
    fontSize: 13,
    color: "#999",
    marginBottom: 8,
  },
  voiceBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFF",
    backgroundColor: "#D4847A",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  input: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#4A4A4A",
    lineHeight: 24,
    minHeight: 200,
  },
  saveButton: {
    backgroundColor: "#D4847A",
    margin: 16,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
