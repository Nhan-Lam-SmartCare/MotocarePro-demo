type HapticType = "selection" | "success" | "error";

const vibrationMap: Record<HapticType, number | number[]> = {
  selection: 10,
  success: [20, 30, 20],
  error: [60, 40, 60],
};

export function triggerHaptic(type: HapticType = "selection"): void {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") {
    return;
  }

  navigator.vibrate(vibrationMap[type]);
}
