import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface Props {
  feature: string;
  onUpgrade: () => void;
}

export default function UpgradePrompt({ feature, onUpgrade }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.title}>{feature}</Text>
        <Text style={styles.description}>
          Upgrade your plan to unlock {feature.toLowerCase()} and get
          personalised insights from your journal entries.
        </Text>
        <TouchableOpacity style={styles.button} onPress={onUpgrade}>
          <Text style={styles.buttonText}>View Plans</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F0E8",
    justifyContent: "center",
    padding: 32,
  },
  card: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lockIcon: {
    fontSize: 40,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4A4A4A",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#999",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  button: {
    backgroundColor: "#D4847A",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
