import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { purchasePackage, getOfferings } from "../lib/revenuecat";

interface PlanProps {
  name: string;
  price: string;
  features: string[];
  highlighted?: boolean;
  onPress: () => void;
}

function PlanCard({ name, price, features, highlighted, onPress }: PlanProps) {
  return (
    <View style={[styles.planCard, highlighted && styles.planCardHighlighted]}>
      {highlighted && <Text style={styles.badge}>Most Popular</Text>}
      <Text style={styles.planName}>{name}</Text>
      <Text style={styles.planPrice}>{price}</Text>
      {features.map((f, i) => (
        <View key={i} style={styles.featureRow}>
          <Text style={styles.checkmark}>✓</Text>
          <Text style={styles.featureText}>{f}</Text>
        </View>
      ))}
      <TouchableOpacity
        style={[styles.planButton, highlighted && styles.planButtonHighlighted]}
        onPress={onPress}
      >
        <Text
          style={[
            styles.planButtonText,
            highlighted && styles.planButtonTextHighlighted,
          ]}
        >
          {price === "Free" ? "Current Plan" : "Subscribe"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function PaywallScreen({ navigation }: any) {
  const handlePurchase = async (tier: "starter" | "pro") => {
    try {
      const offerings = await getOfferings();
      if (!offerings?.current) {
        Alert.alert("Error", "No offerings available. Please try again later.");
        return;
      }
      const pkg =
        tier === "starter"
          ? offerings.current.availablePackages[0]
          : offerings.current.availablePackages[1];

      if (pkg) {
        await purchasePackage(pkg);
        Alert.alert("Success", "Welcome to your new plan!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("Error", "Purchase failed. Please try again.");
      }
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Choose Your Plan</Text>
      <Text style={styles.subtitle}>
        Unlock the full power of MotherJnl
      </Text>

      <PlanCard
        name="Free"
        price="Free"
        features={[
          "3 journal entries per week",
          "Text entries only",
        ]}
        onPress={() => navigation.goBack()}
      />

      <PlanCard
        name="Starter"
        price="$9.99/mo"
        features={[
          "Unlimited journal entries",
          "Voice recordings",
          "AI analysis & insights",
          "AI alerts",
        ]}
        highlighted
        onPress={() => handlePurchase("starter")}
      />

      <PlanCard
        name="Pro"
        price="$19.99/mo"
        features={[
          "Everything in Starter",
          "Priority AI processing",
          "Export journal data",
          "Family sharing (coming soon)",
        ]}
        onPress={() => handlePurchase("pro")}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F0E8",
  },
  inner: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  closeText: {
    fontSize: 16,
    color: "#4A4A4A",
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#4A4A4A",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginBottom: 28,
  },
  planCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  planCardHighlighted: {
    borderWidth: 2,
    borderColor: "#D4847A",
  },
  badge: {
    position: "absolute",
    top: -12,
    alignSelf: "center",
    backgroundColor: "#D4847A",
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    overflow: "hidden",
    left: "33%",
  },
  planName: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4A4A4A",
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: "700",
    color: "#D4847A",
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  checkmark: {
    color: "#D4847A",
    fontSize: 16,
    fontWeight: "700",
  },
  featureText: {
    fontSize: 14,
    color: "#4A4A4A",
  },
  planButton: {
    borderWidth: 1.5,
    borderColor: "#D4847A",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 12,
  },
  planButtonHighlighted: {
    backgroundColor: "#D4847A",
  },
  planButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#D4847A",
  },
  planButtonTextHighlighted: {
    color: "#FFF",
  },
});
