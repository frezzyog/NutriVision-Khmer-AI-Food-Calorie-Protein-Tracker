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

type Mode = "food" | "label";

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
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>NutriVision Khmer</Text>
        <Text style={styles.subtitle}>Expo Go Camera Companion</Text>

        <Text style={styles.label}>Python API URL</Text>
        <TextInput
          value={apiUrl}
          onChangeText={setApiUrl}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <View style={styles.segment}>
          <Pressable
            onPress={() => setMode("food")}
            style={[styles.segmentButton, mode === "food" && styles.segmentActive]}
          >
            <Text style={styles.segmentText}>Food Photo</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("label")}
            style={[styles.segmentButton, mode === "label" && styles.segmentActive]}
          >
            <Text style={styles.segmentText}>Label Scan</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.button} onPress={() => pickImage("camera")}>
            <Text style={styles.buttonText}>Take Photo</Text>
          </Pressable>
          <Pressable style={styles.buttonSecondary} onPress={() => pickImage("library")}>
            <Text style={styles.buttonSecondaryText}>Choose Photo</Text>
          </Pressable>
        </View>

        {imageUri ? <Image source={{ uri: imageUri }} style={styles.preview} /> : null}

        <Pressable style={styles.primaryButton} onPress={analyzeImage} disabled={loading}>
          <Text style={styles.primaryButtonText}>
            {loading ? "Analyzing..." : mode === "food" ? "Analyze Food" : "Scan Label"}
          </Text>
        </Pressable>

        {loading ? <ActivityIndicator size="large" /> : null}
        {result ? <ResultCard result={result} mode={mode} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ResultCard({ result, mode }: { result: ApiResult; mode: Mode }) {
  if (result.error) {
    return (
      <View style={styles.resultCard}>
        <Text style={styles.errorText}>{result.error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.resultCard}>
      {result.warning ? <Text style={styles.warningText}>{result.warning}</Text> : null}

      {mode === "food" ? (
        <>
          <Text style={styles.resultTitle}>Prediction</Text>
          <Text style={styles.resultText}>
            {result.prediction?.label ?? "No prediction"} (
            {Math.round((result.prediction?.score ?? 0) * 100)}%)
          </Text>
          <Text style={styles.resultText}>
            Matched food: {result.matched_food ?? "Use manual correction in Streamlit"}
          </Text>
          {result.nutrition ? (
            <Text style={styles.resultText}>
              Estimate: {Math.round(result.nutrition.calories)} kcal,{" "}
              {result.nutrition.protein.toFixed(1)} g protein
            </Text>
          ) : null}
        </>
      ) : (
        <>
          <Text style={styles.resultTitle}>Nutrition Label</Text>
          <Text style={styles.resultText}>Calories: {result.calories ?? "Not found"}</Text>
          <Text style={styles.resultText}>Protein: {result.protein ?? "Not found"} g</Text>
          <Text style={styles.ocrText}>{result.text}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  container: {
    padding: 20,
    gap: 14,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 16,
    color: "#4b5563",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#ffffff",
  },
  segment: {
    flexDirection: "row",
    backgroundColor: "#e5e7eb",
    borderRadius: 8,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  segmentActive: {
    backgroundColor: "#ffffff",
  },
  segmentText: {
    fontWeight: "600",
    color: "#111827",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    backgroundColor: "#ef4444",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonSecondary: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ef4444",
    borderRadius: 8,
    padding: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  buttonSecondaryText: {
    color: "#ef4444",
    fontWeight: "700",
  },
  primaryButton: {
    backgroundColor: "#111827",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  preview: {
    width: "100%",
    height: 280,
    borderRadius: 8,
    backgroundColor: "#e5e7eb",
  },
  resultCard: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  resultText: {
    fontSize: 15,
    color: "#374151",
  },
  warningText: {
    color: "#92400e",
  },
  errorText: {
    color: "#b91c1c",
    fontWeight: "600",
  },
  ocrText: {
    color: "#4b5563",
    marginTop: 8,
  },
});
