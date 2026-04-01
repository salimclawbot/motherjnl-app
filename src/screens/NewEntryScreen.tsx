import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import VoiceRecorder from "../components/VoiceRecorder";

type Mode = "text" | "voice";

export default function NewEntryScreen({ navigation }: any) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>("text");
  const [content, setContent] = useState("");
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleRecordingComplete = async (uri: string) => {
    setAudioUri(uri);
    setUploading(true);
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const timestamp = Date.now();
      const filePath = `${user!.id}/${timestamp}.m4a`;
      const { error: uploadError } = await supabase.storage
        .from("audio-recordings")
        .upload(filePath, Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)), {
          contentType: "audio/m4a",
        });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage
        .from("audio-recordings")
        .getPublicUrl(filePath);
      setUploadedAudioUrl(urlData.publicUrl);
      setContent("Voice recording");
    } catch {
      Alert.alert("Error", "Failed to upload audio. Please try again.");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!content.trim() && !uploadedAudioUrl) {
      Alert.alert("Error", "Please add some content to your entry");
      return;
    }
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      content: content.trim() || "Voice recording",
      audio_url: uploadedAudioUrl,
      entry_type: uploadedAudioUrl ? "voice" : "text",
    });
    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2C1810" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Entry</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.inner}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === "text" && styles.modeButtonActive]}
            onPress={() => setMode("text")}
          >
            <Ionicons
              name="create-outline"
              size={18}
              color={mode === "text" ? "#FFFFFF" : "#8B6E65"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === "text" && styles.modeButtonTextActive,
              ]}
            >
              Text
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === "voice" && styles.modeButtonActive]}
            onPress={() => setMode("voice")}
          >
            <Ionicons
              name="mic-outline"
              size={18}
              color={mode === "voice" ? "#FFFFFF" : "#8B6E65"}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.modeButtonText,
                mode === "voice" && styles.modeButtonTextActive,
              ]}
            >
              Voice
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "voice" && (
          <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
        )}

        {uploading && (
          <Text style={styles.transcribingText}>Uploading audio...</Text>
        )}

        <TextInput
          style={styles.input}
          placeholder="What is on your mind today?"
          placeholderTextColor="#C4A99A"
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#D4847A", "#E8B4A0"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveGradient}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {saving ? "Saving..." : "Save Entry"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
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
  inner: {
    padding: 20,
  },
  modeToggle: {
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
  modeButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modeButtonActive: {
    backgroundColor: "#D4847A",
  },
  modeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8B6E65",
  },
  modeButtonTextActive: {
    color: "#FFFFFF",
  },
  transcribingText: {
    color: "#D4847A",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    color: "#2C1810",
    minHeight: 220,
    marginBottom: 20,
    lineHeight: 24,
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  saveButton: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#D4847A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },
});
