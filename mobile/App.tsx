import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import {
  Apple,
  BarChart3,
  Camera,
  ChevronLeft,
  Flame,
  Heart,
  Home,
  Image as ImageIcon,
  Info,
  Lightbulb,
  Plus,
  RefreshCcw,
  ScanLine,
  Sparkles,
  Sun,
  Target,
  User,
  Utensils,
  X,
  Zap,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

type Screen = "landing" | "scan" | "preview" | "result" | "dashboard";
type FlashMode = "off" | "on";

type FoodResult = {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore: number;
  coachMessage: string;
  source: "backend" | "sample";
  warning?: string;
};

const sampleFood: FoodResult = {
  foodName: "Pepperoni Pizza",
  calories: 855,
  protein: 36.4,
  carbs: 108,
  fat: 30.1,
  healthScore: 3,
  coachMessage:
    "Looks like a treat! Balance it with lighter meals today. This is higher in carbs and fat, but still okay in moderation.",
  source: "sample",
};

const API_BASE_URL = "http://192.168.0.129:8000";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [foodResult, setFoodResult] = useState<FoodResult>(sampleFood);

  async function handleAnalyzeFood(imageUri: string) {
    const result = await analyzeFoodImage(imageUri);
    setFoodResult(result);
    setScreen("result");
  }

  return (
    <SafeAreaView style={styles.app}>
      <StatusBar style="light" />
      {screen === "landing" ? (
        <LandingScreen onStartScan={() => setScreen("scan")} onDashboard={() => setScreen("dashboard")} />
      ) : null}
      {screen === "scan" ? (
        <ScanScreen
          onClose={() => setScreen("landing")}
          onCapture={(uri) => {
            setCapturedImageUri(uri);
            setScreen("preview");
          }}
        />
      ) : null}
      {screen === "preview" ? (
        <PreviewScreen
          imageUri={capturedImageUri}
          onAnalyze={() => capturedImageUri && handleAnalyzeFood(capturedImageUri)}
          onRetake={() => setScreen("scan")}
          onBack={() => setScreen("landing")}
        />
      ) : null}
      {screen === "result" ? (
        <AddFoodResultScreen
          imageUri={capturedImageUri}
          result={foodResult}
          onBack={() => setScreen("preview")}
          onDone={() => setScreen("dashboard")}
        />
      ) : null}
      {screen === "dashboard" ? (
        <DashboardScreen onScan={() => setScreen("scan")} onHome={() => setScreen("landing")} />
      ) : null}
    </SafeAreaView>
  );
}

async function analyzeFoodImage(imageUri: string): Promise<FoodResult> {
  // Sends the real phone image to the Python FastAPI backend.
  // Later, this can be expanded to include portion size or OCR label scanning.
  const formData = new FormData();
  formData.append("image", {
    uri: imageUri,
    name: "food.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  try {
    const response = await fetch(`${API_BASE_URL}/analyze-food`, {
      method: "POST",
      body: formData,
    });
    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.error || "Backend analysis failed.");
    }

    const nutrition = data.nutrition;
    const predictedName = data.matched_food || data.prediction?.label || "Unknown food";
    const calories = Number(nutrition?.calories ?? sampleFood.calories);
    const protein = Number(nutrition?.protein ?? sampleFood.protein);

    return {
      foodName: formatFoodName(predictedName),
      calories: Math.round(calories),
      protein: roundOneDecimal(protein),
      carbs: estimateCarbs(calories),
      fat: estimateFat(calories),
      healthScore: scoreFood(calories, protein),
      coachMessage: buildCoachMessage(predictedName, calories, protein, Boolean(data.matched_food)),
      source: "backend",
      warning: data.warning,
    };
  } catch (error) {
    return {
      ...sampleFood,
      warning: `Backend unavailable, showing sample data. ${String(error)}`,
    };
  }
}

function formatFoodName(foodName: string) {
  return foodName
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function roundOneDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function estimateCarbs(calories: number) {
  return Math.max(0, Math.round((calories * 0.45) / 4));
}

function estimateFat(calories: number) {
  return roundOneDecimal(Math.max(0, (calories * 0.3) / 9));
}

function scoreFood(calories: number, protein: number) {
  let score = 7;
  if (calories > 700) score -= 2;
  if (calories > 1000) score -= 1;
  if (protein >= 25) score += 1;
  if (protein < 10) score -= 1;
  return Math.max(1, Math.min(10, score));
}

function buildCoachMessage(foodName: string, calories: number, protein: number, hasNutritionMatch: boolean) {
  if (!hasNutritionMatch) {
    return "AI recognized the image, but this food is not in the local nutrition database yet. Use this as a rough estimate and confirm in the Streamlit app.";
  }
  if (calories > 700) {
    return `Looks like ${formatFoodName(foodName)} is a heavier meal. Balance it with lighter foods later today.`;
  }
  if (protein >= 25) {
    return `Good protein choice. ${formatFoodName(foodName)} can help you stay full and reach your protein goal.`;
  }
  return `This looks moderate. Pair it with a protein source if you need more protein today.`;
}

function LandingScreen({
  onStartScan,
  onDashboard,
}: {
  onStartScan: () => void;
  onDashboard: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.landingContainer}>
      <View style={styles.integrationRow}>
        <ScanLine color={colors.neon} size={22} />
        <Text style={styles.integrationText}>INTEGRATIONS</Text>
      </View>

      <View style={styles.logoCard}>
        <Text style={styles.logoFace}>◉‿◉</Text>
      </View>

      <Text style={styles.heroTitle}>
        ZapCal <Text style={styles.neonText}>AI</Text>
      </Text>
      <Text style={styles.heroSubtitle}>
        Everything you eat.{"\n"}Everything <Text style={styles.neonText}>you need.</Text>
      </Text>
      <Text style={styles.heroBody}>Seamless tracking. Smarter insights.{"\n"}Better you.</Text>

      <View style={styles.processRow}>
        <ProcessCard icon={<Camera color={colors.neon} size={24} />} title="1. You Scan" text="We Analyze" />
        <ProcessCard icon={<Sparkles color={colors.neon} size={24} />} title="2. AI Analyzes" text="Food Instantly" />
        <ProcessCard icon={<BarChart3 color={colors.neon} size={24} />} title="3. AI Powers" text="Your Day" />
      </View>

      <View style={styles.phoneShowcase}>
        <MiniPhone title="Scan Food" icon={<Camera color={colors.neon} size={20} />} />
        <MiniPhone title="Add Food" icon={<Utensils color={colors.neon} size={20} />} raised />
        <MiniPhone title="Dashboard" icon={<BarChart3 color={colors.neon} size={20} />} />
      </View>

      <View style={styles.buttonStack}>
        <Pressable style={styles.primaryButton} onPress={onStartScan}>
          <Camera color={colors.black} size={20} />
          <Text style={styles.primaryButtonText}>Start Scanning</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onDashboard}>
          <BarChart3 color={colors.neon} size={20} />
          <Text style={styles.secondaryButtonText}>View Dashboard</Text>
        </Pressable>
      </View>

      <View style={styles.featureRail}>
        <FeatureItem icon={<Camera color={colors.neon} size={24} />} title="Scan Food" text="Instantly" />
        <FeatureItem icon={<Flame color={colors.neon} size={24} />} title="Track Calories" text="Accurately" />
        <FeatureItem icon={<Heart color={colors.neon} size={24} />} title="Live Healthier" text="Everyday" />
      </View>
    </ScrollView>
  );
}

function ScanScreen({
  onClose,
  onCapture,
}: {
  onClose: () => void;
  onCapture: (uri: string) => void;
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>("off");
  const cameraRef = useRef<CameraView | null>(null);

  async function capturePhoto() {
    const photo = await cameraRef.current?.takePictureAsync({
      quality: 0.85,
      skipProcessing: false,
    });
    if (photo?.uri) {
      onCapture(photo.uri);
    }
  }

  async function chooseFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.9,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) {
      onCapture(result.assets[0].uri);
    }
  }

  if (!permission || !permission.granted) {
    return <CameraPermissionView onAllow={requestPermission} onClose={onClose} />;
  }

  return (
    <View style={styles.cameraScreen}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" flash={flash} />
      <View style={styles.cameraShade} />
      <View style={styles.cameraTopBar}>
        <IconButton icon={<X color={colors.white} size={22} />} onPress={onClose} />
        <Text style={styles.cameraTitle}>Point camera at your food</Text>
        <IconButton
          icon={<Zap color={flash === "on" ? colors.neon : colors.white} size={22} />}
          onPress={() => setFlash((value) => (value === "on" ? "off" : "on"))}
        />
      </View>
      <ScanFrame />
      <View style={styles.cameraBottomBar}>
        <IconButton icon={<ImageIcon color={colors.white} size={24} />} onPress={chooseFromGallery} />
        <Pressable style={styles.captureButton} onPress={capturePhoto}>
          <View style={styles.captureInner} />
        </Pressable>
        <View style={styles.bottomSpacer} />
      </View>
    </View>
  );
}

function PreviewScreen({
  imageUri,
  onAnalyze,
  onRetake,
  onBack,
}: {
  imageUri: string | null;
  onAnalyze: () => void;
  onRetake: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.previewScreen}>
      <View style={styles.screenHeader}>
        <IconButton icon={<ChevronLeft color={colors.white} size={24} />} onPress={onBack} />
        <Text style={styles.screenTitle}>Food Preview</Text>
        <View style={styles.bottomSpacer} />
      </View>
      {imageUri ? <Image source={{ uri: imageUri }} style={styles.previewImage} /> : <FoodPlaceholder />}
      <View style={styles.previewActions}>
        <Pressable style={styles.primaryButton} onPress={onAnalyze}>
          <Sparkles color={colors.black} size={20} />
          <Text style={styles.primaryButtonText}>Analyze Food</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={onRetake}>
          <RefreshCcw color={colors.neon} size={20} />
          <Text style={styles.secondaryButtonText}>Retake</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AddFoodResultScreen({
  imageUri,
  result,
  onBack,
  onDone,
}: {
  imageUri: string | null;
  result: FoodResult;
  onBack: () => void;
  onDone: () => void;
}) {
  const [portion, setPortion] = useState(1);

  return (
    <ScrollView contentContainerStyle={styles.resultContainer}>
      <View style={styles.screenHeader}>
        <IconButton icon={<ChevronLeft color={colors.white} size={24} />} onPress={onBack} />
        <Text style={styles.screenTitle}>Add Food</Text>
        <IconButton icon={<X color={colors.white} size={22} />} onPress={onDone} />
      </View>

      {imageUri ? <Image source={{ uri: imageUri }} style={styles.resultImage} /> : <FoodPlaceholder />}

      <View style={styles.foodTitleRow}>
        <View>
          <Text style={styles.foodUnit}>{result.source === "backend" ? "AI RESULT" : "SAMPLE RESULT"}</Text>
          <Text style={styles.foodName}>{result.foodName}</Text>
        </View>
        <View style={styles.portionControls}>
          <Pressable style={styles.portionButton} onPress={() => setPortion(Math.max(1, portion - 1))}>
            <Text style={styles.portionText}>-</Text>
          </Pressable>
          <Text style={styles.portionValue}>{portion}</Text>
          <Pressable style={styles.portionButton} onPress={() => setPortion(portion + 1)}>
            <Text style={styles.portionText}>+</Text>
          </Pressable>
        </View>
      </View>

      {result.warning ? (
        <View style={styles.warningBox}>
          <Info color={colors.warning} size={18} />
          <Text style={styles.warningText}>{result.warning}</Text>
        </View>
      ) : null}

      <View style={styles.nutritionGrid}>
        <NutritionCard icon={<Flame color={colors.warning} size={18} />} label="Calories" value={`${result.calories} kcal`} />
        <NutritionCard icon={<Zap color={colors.neon} size={18} />} label="Carbs" value={`${result.carbs}g`} />
        <NutritionCard icon={<Utensils color={colors.warning} size={18} />} label="Protein" value={`${result.protein}g`} />
        <NutritionCard icon={<Apple color={colors.secondary} size={18} />} label="Fat" value={`${result.fat}g`} />
      </View>

      <View style={styles.healthScoreRow}>
        <Text style={styles.healthScoreLabel}>Health score</Text>
        <Text style={styles.healthScoreValue}>{result.healthScore}/10</Text>
      </View>
      <View style={styles.healthTrack}>
        <View style={[styles.healthFill, { width: `${result.healthScore * 10}%` }]} />
      </View>

      <GlowCard>
        <View style={styles.coachRow}>
          <View style={styles.coachAvatar}>
            <Text style={styles.coachFace}>AI</Text>
          </View>
          <Text style={styles.coachText}>
            <Text style={styles.coachTitle}>AI Coach: </Text>
            {result.coachMessage}
          </Text>
        </View>
      </GlowCard>

      <Pressable style={styles.doneButton} onPress={onDone}>
        <Text style={styles.doneButtonText}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

function DashboardScreen({ onScan, onHome }: { onScan: () => void; onHome: () => void }) {
  return (
    <View style={styles.dashboardScreen}>
      <ScrollView contentContainerStyle={styles.dashboardContent}>
        <View style={styles.dashboardTop}>
          <Text style={styles.dashboardBrand}>ZapCal</Text>
          <View style={styles.dashboardIcons}>
            <Flame color={colors.warning} size={18} />
            <Text style={styles.streakText}>1</Text>
            <Sun color={colors.textSecondary} size={18} />
          </View>
        </View>

        <View style={styles.dateRow}>
          {["20", "21", "22", "23", "24", "25", "26"].map((day) => (
            <View key={day} style={[styles.datePill, day === "23" && styles.datePillActive]}>
              <Text style={[styles.dateText, day === "23" && styles.dateTextActive]}>{day}</Text>
            </View>
          ))}
        </View>

        <GlowCard>
          <Text style={styles.greeting}>Zapy, Good Afternoon</Text>
          <Text style={styles.dashboardMessage}>Let’s power up that energy and get those steps in!</Text>
          <View style={styles.coachActions}>
            <Pressable style={styles.smallAction}><Text style={styles.smallActionText}>Fix My Day</Text></Pressable>
            <Pressable style={styles.smallAction}><Text style={styles.smallActionText}>Ask Zapy</Text></Pressable>
          </View>
        </GlowCard>

        <View style={styles.caloriePanel}>
          <View>
            <Text style={styles.textSecondary}>Calories Left</Text>
            <Text style={styles.calorieLeft}>1904 <Text style={styles.kcal}>kcal</Text></Text>
            <Text style={styles.textSecondary}>Eaten 642  •  Burned 0</Text>
          </View>
          <ProgressCircle percent={25} />
        </View>

        <View style={styles.macroRow}>
          <MacroCard label="Protein" value="43" goal="84" color="#FF4D6D" />
          <MacroCard label="Carbs" value="97" goal="280" color={colors.warning} />
          <MacroCard label="Fat" value="9" goal="84" color="#00D8FF" />
        </View>

        <GlowCard>
          <View style={styles.insightHeader}>
            <Lightbulb color={colors.neon} size={20} />
            <Text style={styles.insightTitle}>Insight</Text>
          </View>
          <Text style={styles.dashboardMessage}>Apple is a high choice at 95 kcal — perfect</Text>
        </GlowCard>
      </ScrollView>
      <BottomNav onScan={onScan} onHome={onHome} />
    </View>
  );
}

function CameraPermissionView({ onAllow, onClose }: { onAllow: () => void; onClose: () => void }) {
  return (
    <View style={styles.permissionScreen}>
      <IconButton icon={<X color={colors.white} size={22} />} onPress={onClose} />
      <View style={styles.permissionCard}>
        <Camera color={colors.neon} size={46} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionText}>Allow camera access to scan food with the real phone camera.</Text>
        <Pressable style={styles.primaryButton} onPress={onAllow}>
          <Text style={styles.primaryButtonText}>Allow Camera Access</Text>
        </Pressable>
      </View>
    </View>
  );
}

function ScanFrame() {
  const linePosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(linePosition, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(linePosition, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [linePosition]);

  const translateY = linePosition.interpolate({
    inputRange: [0, 1],
    outputRange: [-95, 95],
  });

  return (
    <View style={styles.scanFrameWrap}>
      <View style={styles.scanFrame}>
        <View style={[styles.frameCorner, styles.frameTopLeft]} />
        <View style={[styles.frameCorner, styles.frameTopRight]} />
        <View style={[styles.frameCorner, styles.frameBottomLeft]} />
        <View style={[styles.frameCorner, styles.frameBottomRight]} />
        <Animated.View style={[styles.animatedScanLine, { transform: [{ translateY }] }]} />
      </View>
      <Text style={styles.scanHint}>Point camera at your food</Text>
    </View>
  );
}

function GlowCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.glowCard}>{children}</View>;
}

function NutritionCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <GlowCard>
      <View style={styles.nutritionCardContent}>
        {icon}
        <Text style={styles.nutritionLabel}>{label}</Text>
        <Text style={styles.nutritionValue}>{value}</Text>
      </View>
    </GlowCard>
  );
}

function MacroCard({ label, value, goal, color }: { label: string; value: string; goal: string; color: string }) {
  return (
    <View style={styles.macroCard}>
      <View style={[styles.macroRing, { borderColor: color }]}>
        <Text style={styles.macroValue}>{value}</Text>
        <Text style={styles.macroGoal}>/{goal}</Text>
      </View>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

function ProgressCircle({ percent }: { percent: number }) {
  return (
    <View style={styles.progressCircle}>
      <Text style={styles.progressText}>{percent}%</Text>
    </View>
  );
}

function BottomNav({ onScan, onHome }: { onScan: () => void; onHome: () => void }) {
  return (
    <View style={styles.bottomNav}>
      <NavItem icon={<Home color={colors.neon} size={20} />} label="Home" onPress={onHome} />
      <NavItem icon={<BarChart3 color={colors.textSecondary} size={20} />} label="Insights" />
      <Pressable style={styles.scanNavButton} onPress={onScan}>
        <Plus color={colors.black} size={30} />
      </Pressable>
      <NavItem icon={<Target color={colors.textSecondary} size={20} />} label="Programs" />
      <NavItem icon={<User color={colors.textSecondary} size={20} />} label="Profile" />
    </View>
  );
}

function NavItem({ icon, label, onPress }: { icon: React.ReactNode; label: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.navItem} onPress={onPress}>
      {icon}
      <Text style={styles.navLabel}>{label}</Text>
    </Pressable>
  );
}

function ProcessCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <GlowCard>
      <View style={styles.processCard}>
        {icon}
        <Text style={styles.processTitle}>{title}</Text>
        <Text style={styles.processText}>{text}</Text>
      </View>
    </GlowCard>
  );
}

function FeatureItem({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      {icon}
      <Text style={styles.featureTitle}>{title}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function MiniPhone({ title, icon, raised = false }: { title: string; icon: React.ReactNode; raised?: boolean }) {
  return (
    <View style={[styles.miniPhone, raised && styles.miniPhoneRaised]}>
      <View style={styles.miniPhoneImage}>
        {icon}
        <View style={styles.miniScanLine} />
      </View>
      <Text style={styles.miniPhoneTitle}>{title}</Text>
    </View>
  );
}

function FoodPlaceholder() {
  return (
    <View style={styles.foodPlaceholder}>
      <Utensils color={colors.neon} size={44} />
      <Text style={styles.textSecondary}>Food image preview</Text>
    </View>
  );
}

function IconButton({ icon, onPress }: { icon: React.ReactNode; onPress?: () => void }) {
  return (
    <Pressable style={styles.iconButton} onPress={onPress}>
      {icon}
    </Pressable>
  );
}

const colors = {
  black: "#020403",
  dark: "#071108",
  card: "rgba(10, 25, 14, 0.85)",
  cardSolid: "#0B160D",
  border: "rgba(124, 255, 0, 0.35)",
  neon: "#7CFF00",
  neon2: "#8DFF2A",
  secondary: "#00E676",
  white: "#FFFFFF",
  textSecondary: "#B8C7B0",
  warning: "#FFB020",
  error: "#FF4D6D",
};

const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.black,
  },
  landingContainer: {
    padding: 22,
    paddingBottom: 38,
    backgroundColor: colors.black,
    gap: 18,
  },
  integrationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  integrationText: {
    color: colors.neon,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 6,
  },
  logoCard: {
    width: 108,
    height: 108,
    borderRadius: 30,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardSolid,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.neon,
    shadowOpacity: 0.6,
    shadowRadius: 24,
  },
  logoFace: {
    color: colors.neon,
    fontSize: 34,
    fontWeight: "900",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 54,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -1,
  },
  neonText: {
    color: colors.neon,
  },
  heroSubtitle: {
    color: colors.white,
    fontSize: 25,
    lineHeight: 32,
    textAlign: "center",
    fontWeight: "800",
  },
  heroBody: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 24,
    textAlign: "center",
    fontWeight: "600",
  },
  processRow: {
    gap: 10,
  },
  glowCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    padding: 16,
    shadowColor: colors.neon,
    shadowOpacity: 0.26,
    shadowRadius: 18,
  },
  processCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  processTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
    minWidth: 116,
  },
  processText: {
    color: colors.textSecondary,
    fontSize: 15,
    flex: 1,
  },
  phoneShowcase: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-end",
  },
  miniPhone: {
    flex: 1,
    minHeight: 178,
    borderRadius: 28,
    padding: 10,
    backgroundColor: "#050806",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  miniPhoneRaised: {
    minHeight: 218,
  },
  miniPhoneImage: {
    flex: 1,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#102414",
    overflow: "hidden",
  },
  miniScanLine: {
    position: "absolute",
    left: 10,
    right: 10,
    height: 2,
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOpacity: 1,
    shadowRadius: 10,
  },
  miniPhoneTitle: {
    color: colors.white,
    textAlign: "center",
    fontWeight: "800",
    marginTop: 10,
  },
  buttonStack: {
    gap: 12,
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 22,
    backgroundColor: colors.neon,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: colors.neon,
    shadowOpacity: 0.5,
    shadowRadius: 18,
  },
  primaryButtonText: {
    color: colors.black,
    fontSize: 16,
    fontWeight: "900",
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(10,25,14,0.55)",
  },
  secondaryButtonText: {
    color: colors.neon,
    fontSize: 16,
    fontWeight: "900",
  },
  featureRail: {
    flexDirection: "row",
    gap: 10,
  },
  featureItem: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: "center",
    backgroundColor: colors.card,
  },
  featureTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 8,
  },
  featureText: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: "center",
    marginTop: 3,
  },
  cameraScreen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  cameraShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  cameraTopBar: {
    position: "absolute",
    top: 18,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cameraTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "800",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  scanFrameWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  scanFrame: {
    width: 285,
    height: 285,
    position: "relative",
    justifyContent: "center",
  },
  frameCorner: {
    position: "absolute",
    width: 62,
    height: 62,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOpacity: 1,
    shadowRadius: 12,
  },
  frameTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 22,
  },
  frameTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 22,
  },
  frameBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 22,
  },
  frameBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 22,
  },
  animatedScanLine: {
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOpacity: 1,
    shadowRadius: 18,
  },
  scanHint: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "800",
  },
  cameraBottomBar: {
    position: "absolute",
    left: 28,
    right: 28,
    bottom: 34,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.45)",
  },
  captureInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
  },
  bottomSpacer: {
    width: 44,
  },
  permissionScreen: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.black,
  },
  permissionCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 18,
  },
  permissionTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: "900",
  },
  permissionText: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: "center",
    lineHeight: 23,
  },
  previewScreen: {
    flex: 1,
    padding: 20,
    backgroundColor: colors.black,
    gap: 18,
  },
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  screenTitle: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },
  previewImage: {
    flex: 1,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewActions: {
    gap: 12,
    paddingBottom: 8,
  },
  resultContainer: {
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.black,
    gap: 18,
  },
  resultImage: {
    width: "100%",
    height: 230,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  foodPlaceholder: {
    height: 230,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  foodTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foodUnit: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  foodName: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },
  portionControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  portionButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  portionText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },
  portionValue: {
    color: colors.white,
    fontWeight: "900",
  },
  nutritionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  warningBox: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 176, 32, 0.35)",
    backgroundColor: "rgba(255, 176, 32, 0.10)",
    padding: 12,
  },
  warningText: {
    color: colors.warning,
    flex: 1,
    lineHeight: 20,
    fontWeight: "700",
  },
  nutritionCardContent: {
    width: "44%",
    minWidth: 135,
    gap: 8,
  },
  nutritionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  nutritionValue: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  healthScoreRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  healthScoreLabel: {
    color: colors.textSecondary,
    fontWeight: "800",
  },
  healthScoreValue: {
    color: colors.white,
    fontWeight: "900",
  },
  healthTrack: {
    height: 5,
    backgroundColor: "#1E2B1F",
    borderRadius: 999,
    overflow: "hidden",
  },
  healthFill: {
    height: "100%",
    backgroundColor: colors.error,
  },
  coachRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  coachAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.neon,
    alignItems: "center",
    justifyContent: "center",
  },
  coachFace: {
    color: colors.black,
    fontWeight: "900",
  },
  coachText: {
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 21,
  },
  coachTitle: {
    color: colors.white,
    fontWeight: "900",
  },
  doneButton: {
    minHeight: 62,
    borderRadius: 24,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  doneButtonText: {
    color: colors.black,
    fontSize: 18,
    fontWeight: "900",
  },
  dashboardScreen: {
    flex: 1,
    backgroundColor: colors.black,
  },
  dashboardContent: {
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  dashboardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dashboardBrand: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "900",
  },
  dashboardIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  streakText: {
    color: colors.warning,
    fontWeight: "900",
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  datePill: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.card,
  },
  datePillActive: {
    backgroundColor: colors.secondary,
  },
  dateText: {
    color: colors.textSecondary,
    fontWeight: "800",
  },
  dateTextActive: {
    color: colors.black,
  },
  greeting: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "900",
  },
  dashboardMessage: {
    color: colors.textSecondary,
    lineHeight: 22,
  },
  coachActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  smallAction: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    backgroundColor: "rgba(0,230,118,0.14)",
  },
  smallActionText: {
    color: colors.neon,
    textAlign: "center",
    fontWeight: "900",
  },
  caloriePanel: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 18,
  },
  textSecondary: {
    color: colors.textSecondary,
  },
  calorieLeft: {
    color: colors.white,
    fontSize: 42,
    fontWeight: "900",
  },
  kcal: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  progressCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 14,
    borderColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.cardSolid,
  },
  progressText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  macroRow: {
    flexDirection: "row",
    gap: 12,
  },
  macroCard: {
    flex: 1,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    alignItems: "center",
    gap: 8,
  },
  macroRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  macroValue: {
    color: colors.white,
    fontWeight: "900",
  },
  macroGoal: {
    color: colors.textSecondary,
    fontSize: 10,
  },
  macroLabel: {
    color: colors.textSecondary,
    textTransform: "uppercase",
    fontSize: 11,
    fontWeight: "800",
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  insightTitle: {
    color: colors.white,
    fontWeight: "900",
  },
  bottomNav: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 18,
    height: 76,
    borderRadius: 26,
    backgroundColor: "rgba(5, 12, 7, 0.95)",
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    alignItems: "center",
    gap: 4,
    minWidth: 54,
  },
  navLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "700",
  },
  scanNavButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -26,
    shadowColor: colors.secondary,
    shadowOpacity: 0.6,
    shadowRadius: 18,
  },
});
