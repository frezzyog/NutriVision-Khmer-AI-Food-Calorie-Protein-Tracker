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
          <Text style={styles.kicker}>AI Nutrition Vision</Text>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>NV</Text>
          </View>
          <Text style={styles.title}>NutriVision Khmer</Text>
          <Text style={styles.subtitle}>Everything you eat. Everything you need.</Text>
        </View>

        <View style={styles.flowRow}>
          <FlowStep number="1" title="You Scan" text="We analyze" />
          <FlowStep number="2" title="AI Scans" text="Food instantly" />
          <FlowStep number="3" title="Your Day" text="Goals update" />
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
                <View style={styles.scanShell}>
                  <Image source={{ uri: imageUri }} style={styles.preview} />
                  <View style={styles.scanCornerTopLeft} />
                  <View style={styles.scanCornerTopRight} />
                  <View style={styles.scanCornerBottomLeft} />
                  <View style={styles.scanCornerBottomRight} />
                  <View style={styles.scanLine} />
                </View>
              ) : (
                <View style={styles.scanShell}>
                  <View style={styles.emptyPreview}>
                    <Text style={styles.emptyText}>No image selected</Text>
                  </View>
                  <View style={styles.scanCornerTopLeft} />
                  <View style={styles.scanCornerTopRight} />
                  <View style={styles.scanCornerBottomLeft} />
                  <View style={styles.scanCornerBottomRight} />
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

function FlowStep({ number, title, text }: { number: string; title: string; text: string }) {
  return (
    <View style={styles.flowStep}>
      <View style={styles.flowIcon}>
        <Text style={styles.flowIconText}>{number}</Text>
      </View>
      <Text style={styles.flowTitle}>{title}</Text>
      <Text style={styles.flowText}>{text}</Text>
    </View>
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
      <View style={styles.ring}>
        <Text style={styles.ringText}>{Math.round(calorieProgress * 100)}%</Text>
      </View>
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
  background: "#020403",
  panel: "#07110b",
  text: "#fafafa",
  darkText: "#f8fafc",
  muted: "#b6c7b5",
  border: "rgba(126, 255, 0, 0.28)",
  primary: "#7eff00",
  primaryDark: "#061006",
  warningBg: "#142111",
  warningText: "#b8ff75",
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
    alignItems: "center",
  },
  kicker: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 5,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  logoMark: {
    width: 78,
    height: 78,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  logoText: {
    color: colors.primaryDark,
    fontSize: 26,
    fontWeight: "900",
  },
  title: {
    fontSize: 36,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 17,
    color: colors.muted,
    marginTop: 8,
    textAlign: "center",
    fontWeight: "700",
  },
  notice: {
    backgroundColor: colors.warningBg,
    borderRadius: 8,
    padding: 14,
  },
  flowRow: {
    flexDirection: "row",
    gap: 8,
  },
  flowStep: {
    flex: 1,
    backgroundColor: "#07110b",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    minHeight: 104,
  },
  flowIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(126, 255, 0, 0.12)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  flowIconText: {
    color: colors.primary,
    fontWeight: "900",
  },
  flowTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
  },
  flowText: {
    color: colors.text,
    fontSize: 11,
    textAlign: "center",
    marginTop: 3,
  },
  noticeText: {
    color: colors.warningText,
    lineHeight: 20,
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#07110b",
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.muted,
    textAlign: "center",
  },
  segmentTextActive: {
    color: colors.primaryDark,
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
    color: colors.muted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#020403",
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
    color: colors.primaryDark,
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
    color: colors.primaryDark,
    fontWeight: "800",
  },
  scanShell: {
    height: 280,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#0d1f12",
    borderWidth: 1,
    borderColor: "rgba(126, 255, 0, 0.35)",
    position: "relative",
  },
  preview: {
    width: "100%",
    height: "100%",
    backgroundColor: "#0d1f12",
  },
  emptyPreview: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020403",
  },
  scanLine: {
    position: "absolute",
    left: 20,
    right: 20,
    top: "50%",
    height: 3,
    borderRadius: 999,
    backgroundColor: "#00ff87",
    shadowColor: "#00ff87",
    shadowOpacity: 0.9,
    shadowRadius: 14,
  },
  scanCornerTopLeft: {
    position: "absolute",
    top: 18,
    left: 18,
    width: 44,
    height: 44,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#00ff87",
    borderTopLeftRadius: 14,
  },
  scanCornerTopRight: {
    position: "absolute",
    top: 18,
    right: 18,
    width: 44,
    height: 44,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: "#00ff87",
    borderTopRightRadius: 14,
  },
  scanCornerBottomLeft: {
    position: "absolute",
    bottom: 18,
    left: 18,
    width: 44,
    height: 44,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: "#00ff87",
    borderBottomLeftRadius: 14,
  },
  scanCornerBottomRight: {
    position: "absolute",
    bottom: 18,
    right: 18,
    width: 44,
    height: 44,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: "#00ff87",
    borderBottomRightRadius: 14,
  },
  emptyText: {
    color: colors.muted,
  },
  resultBox: {
    backgroundColor: "#0b160f",
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
    color: "#d7f5d0",
  },
  warningText: {
    color: "#92400e",
  },
  errorBox: {
    backgroundColor: "#2b1010",
    borderRadius: 8,
    padding: 14,
  },
  errorText: {
    color: "#ff8c8c",
    fontWeight: "700",
  },
  mutedText: {
    color: colors.muted,
    lineHeight: 20,
  },
  ocrText: {
    color: colors.muted,
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
    backgroundColor: "#0b160f",
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
  ring: {
    width: 118,
    height: 118,
    borderRadius: 59,
    borderWidth: 14,
    borderColor: colors.primary,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020403",
    shadowColor: colors.primary,
    shadowOpacity: 0.45,
    shadowRadius: 18,
  },
  ringText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: "#15311c",
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
    color: colors.primary,
    backgroundColor: "#0b2613",
    borderRadius: 8,
    padding: 10,
    fontWeight: "700",
  },
});
