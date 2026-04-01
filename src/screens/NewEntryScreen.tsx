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
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { transcribeAudio } from "../lib/gemini";
import VoiceRecorder from "../components/VoiceRecorder";

type Mode = "text" | "voice";

export default function NewEntryScreen({ navigation }: any) {
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>("text");
  const [content, setContent] = useState("");
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const handleRecordingComplete = async (uri: string) => {
    setAudioUri(uri);
    setTranscribing(true);
    try {
      const text = await transcribeAudio(uri);
      setContent(text);
    } catch {
      Alert.alert("Error", "Failed to transcribe audio. You can edit the text manually.");
    }
    setTranscribing(false);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert("Error", "Please add some content to your entry");
      return;
    }
    if (!user) return;

    setSaving(true);
    const { error } = await supabase.from("journal_entries").insert({
      user_id: user.id,
      content: content.trim(),
      audio_url: audioUri,
    });
    setSaving(false);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      navigation.goBack();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeButton, mode === "text" && styles.modeButtonActive]}
          onPress={() => setMode("text")}
        >
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

      {transcribing && (
        <Text style={styles.transcribingText}>Transcribing audio...</Text>
      )}

      <TextInput
        style={styles.input}
        placeholder="How are you feeling today?"
        placeholderTextColor="#AAA"
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
      />

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Entry"}
        </Text>
      </TouchableOpacity>
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
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  modeButtonActive: {
    backgroundColor: "#D4847A",
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A4A4A",
  },
  modeButtonTextActive: {
    color: "#FFF",
  },
  transcribingText: {
    color: "#D4847A",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
    fontStyle: "italic",
  },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#4A4A4A",
    minHeight: 200,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButton: {
    backgroundColor: "#D4847A",
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
