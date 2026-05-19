import { StatusBar } from "expo-status-bar";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Mode = "food" | "label" | "tracker";

type ApiResult = {
  success?: boolean;
  error?: string;
  prediction?: {
    label: string;
    score: number;
  };
  matched_food?: string | null;
  nutrition?: {
    calories: number;
    protein: number;
    portion_label: string;
  } | null;
  warning?: string;
  text?: string;
  calories?: number | null;
  protein?: number | null;
};

const DEFAULT_API_URL = "http://192.168.0.129:8000";

export default function App() {
  const [mode, setMode] = useState<Mode>("food");
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResult | null>(null);
  const [loading, setLoading] = useState(false);

  const calories = getCalories(result);
  const protein = getProtein(result);

  async function pickImage(source: "camera" | "library") {
    setResult(null);

    if (source === "camera") {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        setResult({ success: false, error: "Camera permission was denied." });
        return;
      }
    }

    const pickerResult =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
          })
        : await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.8,
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
          });

    if (!pickerResult.canceled) {
      setImageUri(pickerResult.assets[0].uri);
    }
  }

  async function analyzeImage() {
    if (!imageUri) {
      setResult({ success: false, error: "Please take or choose a photo first." });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("image", {
        uri: imageUri,
        name: mode === "food" ? "food.jpg" : "label.jpg",
        type: "image/jpeg",
      } as unknown as Blob);

      const endpoint = mode === "food" ? "/analyze-food" : "/scan-label";
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: "POST",
        body: formData,
      });
      const data = (await response.json()) as ApiResult;
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: `Could not connect to API: ${String(error)}`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>NutriVision Khmer</Text>
          <Text style={styles.subtitle}>AI Food Calorie & Protein Tracker</Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Nutrition values are estimates only. Actual calories and protein depend on
            ingredients, cooking method, and portion size.
          </Text>
        </View>

        <View style={styles.segment}>
          <ModeButton label="Food Photo" active={mode === "food"} onPress={() => setMode("food")} />
          <ModeButton label="Label Scan" active={mode === "label"} onPress={() => setMode("label")} />
          <ModeButton label="Tracker" active={mode === "tracker"} onPress={() => setMode("tracker")} />
        </View>

        {mode === "tracker" ? (
          <TrackerPanel calories={calories} protein={protein} />
        ) : (
          <>
            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>
                {mode === "food" ? "1. Add a Food Image" : "1. Add a Nutrition Label"}
              </Text>
              <Text style={styles.label}>Python API URL</Text>
              <TextInput
                value={apiUrl}
                onChangeText={setApiUrl}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
              />

              <View style={styles.actions}>
                <Pressable style={styles.button} onPress={() => pickImage("camera")}>
                  <Text style={styles.buttonText}>Take Photo</Text>
                </Pressable>
                <Pressable style={styles.buttonSecondary} onPress={() => pickImage("library")}>
                  <Text style={styles.buttonSecondaryText}>Upload Image</Text>
                </Pressable>
              </View>

              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.preview} />
              ) : (
                <View style={styles.emptyPreview}>
                  <Text style={styles.emptyText}>No image selected</Text>
                </View>
              )}
            </View>

            <View style={styles.panel}>
              <Text style={styles.sectionTitle}>
                {mode === "food" ? "2. AI Prediction" : "2. OCR Nutrition Result"}
              </Text>
              <Pressable
                style={[styles.primaryButton, loading && styles.disabledButton]}
                onPress={analyzeImage}
                disabled={loading}
              >
                <Text style={styles.primaryButtonText}>
                  {loading ? "Analyzing..." : mode === "food" ? "Analyze Food Image" : "Scan Label"}
                </Text>
              </Pressable>

              {loading ? <ActivityIndicator size="large" color="#ff4b4b" /> : null}
              {result ? <ResultCard result={result} mode={mode} /> : null}
            </View>

            <TrackerPanel calories={calories} protein={protein} compact />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active && styles.segmentActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
    </Pressable>
  );
}

function ResultCard({ result, mode }: { result: ApiResult; mode: Mode }) {
  if (result.error) {
    return (
      <View style={styles.errorBox}>
        <Text style={styles.errorText}>{result.error}</Text>
      </View>
    );
  }

  if (mode === "food") {
    return (
      <View style={styles.resultBox}>
        {result.warning ? <Text style={styles.warningText}>{result.warning}</Text> : null}
        <Text style={styles.resultTitle}>Top Prediction</Text>
        <Text style={styles.resultText}>
          {result.prediction?.label ?? "No prediction"} (
          {Math.round((result.prediction?.score ?? 0) * 100)}%)
        </Text>
        <Text style={styles.mutedText}>
          Matched food: {result.matched_food ?? "Use manual correction in Streamlit"}
        </Text>
        <View style={styles.metricRow}>
          <Metric label="Calories" value={`${Math.round(result.nutrition?.calories ?? 0)} kcal`} />
          <Metric label="Protein" value={`${(result.nutrition?.protein ?? 0).toFixed(1)} g`} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.resultBox}>
      <Text style={styles.resultTitle}>Detected Nutrition</Text>
      <View style={styles.metricRow}>
        <Metric label="Calories" value={result.calories ? `${result.calories} kcal` : "Not found"} />
        <Metric label="Protein" value={result.protein ? `${result.protein} g` : "Not found"} />
      </View>
      <Text style={styles.ocrText}>{result.text || "No OCR text yet."}</Text>
    </View>
  );
}

function TrackerPanel({
  calories,
  protein,
  compact = false,
}: {
  calories: number;
  protein: number;
  compact?: boolean;
}) {
  const calorieGoal = 2000;
  const proteinGoal = 60;
  const calorieProgress = Math.min(calories / calorieGoal, 1);
  const proteinProgress = Math.min(protein / proteinGoal, 1);

  return (
    <View style={styles.panel}>
      <Text style={styles.sectionTitle}>{compact ? "Daily Summary" : "Daily Tracker"}</Text>
      <View style={styles.metricRow}>
        <Metric label="Total Calories" value={`${Math.round(calories)} kcal`} />
        <Metric label="Total Protein" value={`${protein.toFixed(1)} g`} />
      </View>
      <Progress label="Calories progress" value={calorieProgress} />
      <Progress label="Protein progress" value={proteinProgress} />
      <View style={styles.statusGrid}>
        <Text style={styles.statusText}>
          {calories <= calorieGoal ? "Within daily calorie goal" : "Over daily calorie goal"}
        </Text>
        <Text style={styles.statusText}>
          {protein >= proteinGoal ? "Protein goal reached" : "More protein needed"}
        </Text>
      </View>
      <Text style={styles.mutedText}>
        Full food history and manual correction remain in the Streamlit app.
      </Text>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressLabel}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${value * 100}%` }]} />
      </View>
    </View>
  );
}

function getCalories(result: ApiResult | null) {
  if (!result || result.error) {
    return 0;
  }
  return result.nutrition?.calories ?? result.calories ?? 0;
}

function getProtein(result: ApiResult | null) {
  if (!result || result.error) {
    return 0;
  }
  return result.nutrition?.protein ?? result.protein ?? 0;
}

const colors = {
  background: "#0e1117",
  panel: "#ffffff",
  text: "#fafafa",
  darkText: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  primary: "#ff4b4b",
  warningBg: "#4a2429",
  warningText: "#ff6b6b",
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    padding: 18,
    gap: 14,
  },
  hero: {
    paddingTop: 10,
    paddingBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: "#d1d5db",
    marginTop: 4,
  },
  notice: {
    backgroundColor: colors.warningBg,
    borderRadius: 8,
    padding: 14,
  },
  noticeText: {
    color: "#ffb4b4",
    lineHeight: 20,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#1f2937",
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#d1d5db",
    textAlign: "center",
  },
  segmentTextActive: {
    color: "#ffffff",
  },
  panel: {
    backgroundColor: colors.panel,
    borderRadius: 8,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.darkText,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#f9fafb",
    color: colors.darkText,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  buttonSecondaryText: {
    color: colors.primary,
    fontWeight: "800",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "800",
  },
  preview: {
    width: "100%",
    height: 280,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  emptyPreview: {
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
  },
  emptyText: {
    color: colors.muted,
  },
  resultBox: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.darkText,
  },
  resultText: {
    fontSize: 15,
    color: "#374151",
  },
  warningText: {
    color: "#92400e",
  },
  errorBox: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    padding: 14,
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "700",
  },
  mutedText: {
    color: colors.muted,
    lineHeight: 20,
  },
  ocrText: {
    color: "#4b5563",
    lineHeight: 20,
  },
  metricRow: {
    flexDirection: "row",
    gap: 10,
  },
  metric: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#ffffff",
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },
  metricValue: {
    color: colors.darkText,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 4,
  },
  progressWrap: {
    gap: 6,
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: "#374151",
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  statusGrid: {
    gap: 8,
  },
  statusText: {
    color: "#166534",
    backgroundColor: "#dcfce7",
    borderRadius: 8,
    padding: 10,
    fontWeight: "700",
  },
});
