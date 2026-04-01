import Purchases from "react-native-purchases";
import { Platform } from "react-native";

export type SubscriptionTier = "free" | "starter" | "pro";

let isConfigured = false;

export function configureRevenueCat() {
  if (isConfigured) return;
  const apiKey = process.env.EXPO_PUBLIC_REVENUECAT_KEY;
  if (!apiKey) return;

  Purchases.configure({ apiKey });
  isConfigured = true;
}

export async function checkSubscription(): Promise<SubscriptionTier> {
  try {
    if (!isConfigured) configureRevenueCat();
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlements = customerInfo.entitlements.active;

    if (entitlements["pro"]) return "pro";
    if (entitlements["starter"]) return "starter";
    return "free";
  } catch {
    return "free";
  }
}

export async function getOfferings() {
  try {
    if (!isConfigured) configureRevenueCat();
    return await Purchases.getOfferings();
  } catch {
    return null;
  }
}

export async function purchasePackage(pkg: any) {
  return Purchases.purchasePackage(pkg);
}
