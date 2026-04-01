import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Audio } from "expo-av";

interface Props {
  onRecordingComplete: (uri: string) => void;
}

export default function VoiceRecorder({ onRecordingComplete }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) return;

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setIsRecording(false);
    await recordingRef.current.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });

    const uri = recordingRef.current.getURI();
    recordingRef.current = null;

    if (uri) onRecordingComplete(uri);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.recordButton, isRecording && styles.recordButtonActive]}
        onPress={isRecording ? stopRecording : startRecording}
      >
        <View
          style={[
            styles.recordDot,
            isRecording && styles.recordDotActive,
          ]}
        />
      </TouchableOpacity>
      <Text style={styles.timer}>
        {isRecording ? formatTime(duration) : "Tap to record"}
      </Text>
      {isRecording && (
        <Text style={styles.hint}>Tap again to stop</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 8,
  },
  recordButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#D4847A",
    marginBottom: 12,
  },
  recordButtonActive: {
    borderColor: "#E05050",
  },
  recordDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D4847A",
  },
  recordDotActive: {
    borderRadius: 4,
    backgroundColor: "#E05050",
    width: 24,
    height: 24,
  },
  timer: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A4A4A",
  },
  hint: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});
