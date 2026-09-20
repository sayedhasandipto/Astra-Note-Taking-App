import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Vibration,
  ScrollView,
  Switch,
  useColorScheme,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Swipeable,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 52) / 2;

// ============ Palette ============
const NOTE_COLORS = [
  { id: 0, bg: "#FBE4E4", darkBg: "#3A2525", bar: "#E89B9B", label: "Rose" },
  { id: 1, bg: "#FCF0D5", darkBg: "#3A3325", bar: "#E8C878", label: "Honey" },
  { id: 2, bg: "#DFF0E0", darkBg: "#253A25", bar: "#94C99B", label: "Mint" },
  { id: 3, bg: "#DCEAF6", darkBg: "#25303A", bar: "#92BCD9", label: "Sky" },
  { id: 4, bg: "#E8E1F5", darkBg: "#2E253A", bar: "#B5A2DC", label: "Lilac" },
  { id: 5, bg: "#FAE5D8", darkBg: "#3A2E25", bar: "#E8B198", label: "Peach" },
];

const IOS_BLUE_GRADIENT = ["#0A84FF", "#0060DF"];
const IOS_BLUE_SOLID = "#0A84FF";
const DANGER_RED = "#FF3B30";

// ============ Option Lists ============
const THEME_OPTIONS = [
  { id: "light", label: "Light", icon: "sunny-outline" },
  { id: "dark", label: "Dark", icon: "moon-outline" },
  { id: "system", label: "System", icon: "phone-portrait-outline" },
];

const FONT_SIZES = [
  { id: "small", label: "Small", scale: 0.88 },
  { id: "medium", label: "Medium", scale: 1.0 },
  { id: "large", label: "Large", scale: 1.15 },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "title", label: "Title (A–Z)" },
];

// ============ Themes ============
const lightTheme = {
  bg: "#F7F5F0",
  bgElevated: "#FFFFFF",
  text: "#0F0F0F",
  subText: "#6B6B6B",
  hint: "#A0A0A0",
  border: "rgba(0,0,0,0.06)",
  searchBg: "#FFFFFF",
  searchBorder: "rgba(0,0,0,0.04)",
  iconBg: "rgba(0,0,0,0.05)",
  iconColor: "#0F0F0F",
  divider: "rgba(0,0,0,0.06)",
  emptyIconBg: "rgba(0,0,0,0.04)",
  skeletonBg: "#EAE7E0",
  skeletonShine: "#D8D4CC",
  cardBg: "#FFFFFF",
  sectionBg: "#FFFFFF",
  danger: "#FF3B30",
};

const darkTheme = {
  bg: "#0A0A0A",
  bgElevated: "#1A1A1C",
  text: "#F7F7F7",
  subText: "#A0A0A0",
  hint: "#5A5A5A",
  border: "rgba(255,255,255,0.06)",
  searchBg: "#1A1A1C",
  searchBorder: "rgba(255,255,255,0.04)",
  iconBg: "rgba(255,255,255,0.08)",
  iconColor: "#F7F7F7",
  divider: "rgba(255,255,255,0.06)",
  emptyIconBg: "rgba(255,255,255,0.05)",
  skeletonBg: "#1A1A1C",
  skeletonShine: "#2A2A2C",
  cardBg: "#1A1A1C",
  sectionBg: "#1A1A1C",
  danger: "#FF453A",
};

// ============ Haptic Helper ============
const triggerHaptic = (type = "light") => {
  try {
    if (type === "light") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else if (type === "medium") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (type === "heavy") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (type === "success") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (type === "warning") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } else if (type === "error") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    if (Platform.OS === "android") {
      if (type === "medium" || type === "heavy" || type === "warning") {
        Vibration.vibrate(30);
      } else if (type === "success") {
        Vibration.vibrate([0, 20, 40, 20]);
      } else {
        Vibration.vibrate(15);
      }
    }
  } catch (e) {}
};

// ============ Skeleton ============
function SkeletonCard({ theme }) {
  const shimmer = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.5,
          duration: 750,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);
  return (
    <Animated.View
      style={[
        styles.skeletonCard,
        { backgroundColor: theme.skeletonBg, opacity: shimmer },
      ]}
    >
      <View
        style={[styles.skeletonDot, { backgroundColor: theme.skeletonShine }]}
      />
      <View
        style={[
          styles.skeletonLine,
          {
            width: "75%",
            height: 16,
            marginTop: 14,
            backgroundColor: theme.skeletonShine,
          },
        ]}
      />
      <View
        style={[
          styles.skeletonLine,
          {
            width: "95%",
            height: 11,
            marginTop: 10,
            backgroundColor: theme.skeletonShine,
          },
        ]}
      />
      <View
        style={[
          styles.skeletonLine,
          {
            width: "60%",
            height: 11,
            marginTop: 6,
            backgroundColor: theme.skeletonShine,
          },
        ]}
      />
      <View
        style={[
          styles.skeletonLine,
          {
            width: "35%",
            height: 9,
            marginTop: 18,
            backgroundColor: theme.skeletonShine,
          },
        ]}
      />
    </Animated.View>
  );
}

function SkeletonGrid({ theme }) {
  return (
    <View style={styles.skeletonWrap}>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} theme={theme} />
      ))}
    </View>
  );
}

// ============ Note Card ============
function NoteCard({
  item,
  index,
  isDark,
  theme,
  fontScale,
  onPress,
  onDelete,
  onPin,
  formatRelative,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const swipeRef = useRef(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 320,
        delay: index * 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        delay: index * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const palette = NOTE_COLORS[item.colorId ?? 0];
  const cardBg = isDark ? palette.darkBg : palette.bg;

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });
    return (
      <TouchableOpacity
        style={styles.deleteAction}
        activeOpacity={0.85}
        onPress={() => {
          triggerHaptic("warning");
          swipeRef.current?.close();
          onDelete();
        }}
      >
        <Animated.View style={{ transform: [{ scale }] }}>
          <Ionicons name="trash" size={22} color="#FFFFFF" />
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY }],
        width: CARD_WIDTH,
      }}
    >
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
        onSwipeableOpen={() => triggerHaptic("light")}
      >
        <TouchableOpacity
          style={[styles.cardStatic, { backgroundColor: cardBg }]}
          onPress={onPress}
          activeOpacity={0.9}
        >
          <View style={styles.cardTop}>
            <View
              style={[styles.colorDotSmall, { backgroundColor: palette.bar }]}
            />
            <TouchableOpacity
              onPress={onPin}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name={item.pinned ? "bookmark" : "bookmark-outline"}
                size={16}
                color={item.pinned ? palette.bar : "rgba(0,0,0,0.18)"}
              />
            </TouchableOpacity>
          </View>
          <Text
            style={[
              styles.cardTitle,
              { fontSize: 16 * fontScale },
              isDark && { color: "#F7F7F7" },
            ]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          {item.content ? (
            <Text
              style={[
                styles.cardContent,
                { fontSize: 13 * fontScale },
                isDark && { color: "rgba(255,255,255,0.55)" },
              ]}
              numberOfLines={3}
            >
              {item.content}
            </Text>
          ) : null}
          <View style={styles.cardBottom}>
            <Text
              style={[
                styles.cardDate,
                { fontSize: 11 * fontScale },
                isDark && { color: "rgba(255,255,255,0.35)" },
              ]}
            >
              {formatRelative(item.updatedAt || item.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    </Animated.View>
  );
}

// ============ Static styles for card/skeleton ============
const styles = StyleSheet.create({
  cardStatic: {
    borderRadius: 22,
    padding: 16,
    minHeight: 160,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  colorDotSmall: { width: 8, height: 8, borderRadius: 4 },
  cardTitle: {
    fontWeight: "800",
    color: "#0F0F0F",
    marginBottom: 6,
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  cardContent: {
    color: "rgba(0,0,0,0.55)",
    lineHeight: 18,
    flex: 1,
  },
  cardBottom: { marginTop: 10 },
  cardDate: {
    color: "rgba(0,0,0,0.4)",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  deleteAction: {
    backgroundColor: DANGER_RED,
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    height: "100%",
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  skeletonWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  skeletonCard: {
    width: CARD_WIDTH,
    borderRadius: 22,
    padding: 16,
    minHeight: 160,
    marginBottom: 14,
  },
  skeletonDot: { width: 8, height: 8, borderRadius: 4 },
  skeletonLine: { borderRadius: 4 },
});

// ============ Settings Row Helpers ============
function SettingRow({
  icon,
  label,
  value,
  onPress,
  theme,
  styles,
  isLast,
  danger,
}) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, !isLast && styles.settingRowBorder]}
      onPress={onPress}
      activeOpacity={0.6}
      disabled={!onPress}
    >
      <View style={styles.settingRowLeft}>
        <View
          style={[
            styles.settingIcon,
            { backgroundColor: danger ? "rgba(255,59,48,0.1)" : theme.iconBg },
          ]}
        >
          <Ionicons
            name={icon}
            size={18}
            color={danger ? theme.danger : theme.iconColor}
          />
        </View>
        <Text style={[styles.settingLabel, danger && { color: theme.danger }]}>
          {label}
        </Text>
      </View>
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      {onPress && !danger && (
        <Ionicons name="chevron-forward" size={18} color={theme.hint} />
      )}
    </TouchableOpacity>
  );
}

// ============ Main App ============
export default function App() {
  const [screen, setScreen] = useState("home");
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [colorId, setColorId] = useState(0);
  const [loading, setLoading] = useState(true);

  // Settings state
  const [themeMode, setThemeMode] = useState("light"); // 'light'|'dark'|'system'
  const [fontSize, setFontSize] = useState("medium");
  const [sortBy, setSortBy] = useState("newest");
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [defaultColorId, setDefaultColorId] = useState(0);

  const systemScheme = useColorScheme();
  const isDark =
    themeMode === "dark" || (themeMode === "system" && systemScheme === "dark");

  const theme = isDark ? darkTheme : lightTheme;
  const s = getStyles(theme, isDark);
  const fontScale = (FONT_SIZES.find((f) => f.id === fontSize) || FONT_SIZES[1])
    .scale;

  // ============ Load & Save ============
  useEffect(() => {
    const init = async () => {
      await loadNotes();
      await loadSettings();
      setTimeout(() => setLoading(false), 550);
    };
    init();
  }, []);

  useEffect(() => {
    if (!loading) saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    if (!loading) {
      saveSettings({
        themeMode,
        fontSize,
        sortBy,
        confirmDelete,
        defaultColorId,
      });
    }
  }, [themeMode, fontSize, sortBy, confirmDelete, defaultColorId]);

  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem("@notes");
      if (stored !== null) setNotes(JSON.parse(stored));
    } catch (e) {}
  };
  const saveNotes = async (data) => {
    try {
      await AsyncStorage.setItem("@notes", JSON.stringify(data));
    } catch (e) {}
  };

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem("@settings");
      if (stored) {
        const obj = JSON.parse(stored);
        if (obj.themeMode) setThemeMode(obj.themeMode);
        if (obj.fontSize) setFontSize(obj.fontSize);
        if (obj.sortBy) setSortBy(obj.sortBy);
        if (typeof obj.confirmDelete === "boolean")
          setConfirmDelete(obj.confirmDelete);
        if (typeof obj.defaultColorId === "number")
          setDefaultColorId(obj.defaultColorId);
      }
    } catch (e) {}
  };
  const saveSettings = async (obj) => {
    try {
      await AsyncStorage.setItem("@settings", JSON.stringify(obj));
    } catch (e) {}
  };

  // ============ Actions ============
  const handleSave = () => {
    if (title.trim() === "") {
      triggerHaptic("warning");
      Alert.alert("Title required", "Please add a title to your note.");
      return;
    }
    triggerHaptic("success");
    const now = new Date().toISOString();

    if (editingId) {
      setNotes(
        notes.map((n) =>
          n.id === editingId
            ? { ...n, title, content, colorId, updatedAt: now }
            : n,
        ),
      );
    } else {
      const newNote = {
        id: Date.now().toString(),
        title,
        content,
        colorId,
        pinned: false,
        createdAt: now,
        updatedAt: now,
      };
      setNotes([newNote, ...notes]);
    }
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
    setColorId(defaultColorId);
    setScreen("home");
  };

  const openEdit = (note) => {
    triggerHaptic("light");
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
    setColorId(note.colorId ?? 0);
    setScreen("edit");
  };

  const doDelete = (id) => {
    triggerHaptic("warning");
    setNotes(notes.filter((n) => n.id !== id));
  };

  const requestDelete = (id) => {
    if (!confirmDelete) {
      doDelete(id);
      return;
    }
    Alert.alert("Delete note?", "This note will be permanently deleted.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => doDelete(id) },
    ]);
  };

  const togglePin = (id) => {
    triggerHaptic("light");
    setNotes(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const resetAllData = () => {
    Alert.alert(
      "Reset all notes?",
      "This will permanently delete all your notes. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            triggerHaptic("warning");
            setNotes([]);
            await AsyncStorage.removeItem("@notes");
          },
        },
      ],
    );
  };

  // ============ Helpers ============
  const formatRelative = (isoString) => {
    if (!isoString) return "";
    const now = new Date();
    const d = new Date(isoString);
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);
    if (diffMin < 1) return "Just now";
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    if (diffDay === 1) return "Yesterday";
    if (diffDay < 7) return `${diffDay} days ago`;
    const day = d.getDate();
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[d.getMonth()]} ${day}`;
  };

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 5) return "Good night";
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 20) return "Good evening";
    return "Good night";
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()),
  );

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sortBy === "oldest")
      return new Date(a.updatedAt) - new Date(b.updatedAt);
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return new Date(b.updatedAt) - new Date(a.updatedAt); // newest
  });

  const pinnedCount = sortedNotes.filter((n) => n.pinned).length;

  // ============ SETTINGS SCREEN ============
  if (screen === "settings") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={s.container}>
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
            backgroundColor={theme.bg}
          />
          <View style={s.settingsHeader}>
            <TouchableOpacity
              style={s.editorIconBtn}
              onPress={() => {
                triggerHaptic("light");
                setScreen("home");
              }}
              activeOpacity={0.6}
            >
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={s.settingsTitle}>Settings</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView
            contentContainerStyle={s.settingsScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* APPEARANCE */}
            <Text style={s.settingsSection}>APPEARANCE</Text>
            <View
              style={[
                s.settingsCard,
                { backgroundColor: theme.sectionBg, borderColor: theme.border },
              ]}
            >
              <Text style={s.settingsSubLabel}>Theme</Text>
              <View style={s.segmentRow}>
                {THEME_OPTIONS.map((opt) => {
                  const active = themeMode === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        s.segmentBtn,
                        active && { backgroundColor: IOS_BLUE_SOLID },
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setThemeMode(opt.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={16}
                        color={active ? "#FFFFFF" : theme.subText}
                      />
                      <Text
                        style={[
                          s.segmentText,
                          { color: active ? "#FFFFFF" : theme.subText },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[s.settingsSubLabel, { marginTop: 20 }]}>
                Font Size
              </Text>
              <View style={s.segmentRow}>
                {FONT_SIZES.map((opt) => {
                  const active = fontSize === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        s.segmentBtn,
                        active && { backgroundColor: IOS_BLUE_SOLID },
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setFontSize(opt.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          s.segmentText,
                          {
                            color: active ? "#FFFFFF" : theme.subText,
                            fontSize: 14 * opt.scale,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* NOTES */}
            <Text style={s.settingsSection}>NOTES</Text>
            <View
              style={[
                s.settingsCard,
                {
                  backgroundColor: theme.sectionBg,
                  borderColor: theme.border,
                  paddingVertical: 0,
                },
              ]}
            >
              <SettingRow
                icon="swap-vertical-outline"
                label="Sort by"
                value={(SORT_OPTIONS.find((o) => o.id === sortBy) || {}).label}
                onPress={() => {
                  triggerHaptic("light");
                  Alert.alert(
                    "Sort by",
                    "Choose how notes are ordered",
                    SORT_OPTIONS.map((opt) => ({
                      text: opt.label,
                      onPress: () => setSortBy(opt.id),
                    })).concat([{ text: "Cancel", style: "cancel" }]),
                  );
                }}
                theme={theme}
                styles={s}
              />
              <SettingRow
                icon="color-palette-outline"
                label="Default color"
                value={NOTE_COLORS.find((c) => c.id === defaultColorId)?.label}
                onPress={() => {
                  triggerHaptic("light");
                  Alert.alert(
                    "Default color",
                    "Color for new notes",
                    NOTE_COLORS.map((c) => ({
                      text: c.label,
                      onPress: () => setDefaultColorId(c.id),
                    })).concat([{ text: "Cancel", style: "cancel" }]),
                  );
                }}
                theme={theme}
                styles={s}
                isLast
              />
            </View>

            {/* SAFETY */}
            <Text style={s.settingsSection}>SAFETY</Text>
            <View
              style={[
                s.settingsCard,
                {
                  backgroundColor: theme.sectionBg,
                  borderColor: theme.border,
                  paddingVertical: 0,
                },
              ]}
            >
              <View style={[s.settingRow, s.settingRowBorder]}>
                <View style={s.settingRowLeft}>
                  <View
                    style={[s.settingIcon, { backgroundColor: theme.iconBg }]}
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={18}
                      color={theme.iconColor}
                    />
                  </View>
                  <Text style={s.settingLabel}>Confirm before delete</Text>
                </View>
                <Switch
                  value={confirmDelete}
                  onValueChange={(v) => {
                    triggerHaptic("light");
                    setConfirmDelete(v);
                  }}
                  trackColor={{ false: theme.border, true: IOS_BLUE_SOLID }}
                  thumbColor="#FFFFFF"
                />
              </View>
              <SettingRow
                icon="trash-outline"
                label="Reset all notes"
                onPress={resetAllData}
                theme={theme}
                styles={s}
                isLast
                danger
              />
            </View>

            {/* ABOUT */}
            <Text style={s.settingsSection}>ABOUT</Text>
            <View
              style={[
                s.settingsCard,
                {
                  backgroundColor: theme.sectionBg,
                  borderColor: theme.border,
                  paddingVertical: 0,
                },
              ]}
            >
              <SettingRow
                icon="information-circle-outline"
                label="Version"
                value="1.0.0"
                theme={theme}
                styles={s}
                isLast
              />
            </View>

            <Text style={s.madeWith}>Made with ❤️ in React Native</Text>
          </ScrollView>
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  // ============ HOME SCREEN ============
  if (screen === "home") {
    const today = new Date();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const dateStr = `${days[today.getDay()]}, ${months[today.getMonth()]} ${today.getDate()}`;

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={s.container}>
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
            backgroundColor={theme.bg}
          />

          {loading ? (
            <View style={{ flex: 1 }}>
              <View style={s.topBar}>
                <Text style={[s.dateText, { fontSize: 12 * fontScale }]}>
                  {dateStr.toUpperCase()}
                </Text>
                <View style={s.themeBtn} />
              </View>
              <View style={s.greetingWrap}>
                <Text style={[s.greetingSmall, { fontSize: 16 * fontScale }]}>
                  {getGreeting()},
                </Text>
                <Text style={[s.greetingBold, { fontSize: 30 * fontScale }]}>
                  Your thoughts,{"\n"}beautifully kept.
                </Text>
              </View>
              <SkeletonGrid theme={theme} />
            </View>
          ) : (
            <FlatList
              data={sortedNotes}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={s.row}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                <View>
                  <View style={s.topBar}>
                    <Text style={[s.dateText, { fontSize: 12 * fontScale }]}>
                      {dateStr.toUpperCase()}
                    </Text>
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        style={s.themeBtn}
                        onPress={() => {
                          triggerHaptic("light");
                          const order = ["light", "dark", "system"];
                          const next =
                            order[(order.indexOf(themeMode) + 1) % 3];
                          setThemeMode(next);
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={
                            themeMode === "system"
                              ? "phone-portrait-outline"
                              : isDark
                                ? "moon"
                                : "sunny"
                          }
                          size={17}
                          color={theme.iconColor}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={s.themeBtn}
                        onPress={() => {
                          triggerHaptic("light");
                          setScreen("settings");
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="settings-outline"
                          size={17}
                          color={theme.iconColor}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={s.greetingWrap}>
                    <Text
                      style={[s.greetingSmall, { fontSize: 16 * fontScale }]}
                    >
                      {getGreeting()},
                    </Text>
                    <Text
                      style={[s.greetingBold, { fontSize: 30 * fontScale }]}
                    >
                      Your thoughts,{"\n"}beautifully kept.
                    </Text>
                  </View>

                  <View style={s.searchWrap}>
                    <Ionicons name="search" size={17} color={theme.hint} />
                    <TextInput
                      style={[s.searchInput, { fontSize: 15 * fontScale }]}
                      value={search}
                      onChangeText={setSearch}
                      placeholder="Search notes"
                      placeholderTextColor={theme.hint}
                      autoCorrect={false}
                    />
                    {search.length > 0 && (
                      <TouchableOpacity onPress={() => setSearch("")}>
                        <Ionicons
                          name="close-circle"
                          size={17}
                          color={theme.hint}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {pinnedCount > 0 && (
                    <View style={s.sectionHeader}>
                      <Ionicons
                        name="bookmark"
                        size={12}
                        color={theme.subText}
                      />
                      <Text
                        style={[s.sectionTitle, { fontSize: 11 * fontScale }]}
                      >
                        Pinned
                      </Text>
                    </View>
                  )}
                </View>
              }
              renderItem={({ item, index }) => (
                <NoteCard
                  item={item}
                  index={index}
                  isDark={isDark}
                  theme={theme}
                  fontScale={fontScale}
                  onPress={() => openEdit(item)}
                  onDelete={() => requestDelete(item.id)}
                  onPin={() => togglePin(item.id)}
                  formatRelative={formatRelative}
                />
              )}
              ListEmptyComponent={
                <View style={s.emptyWrap}>
                  <View style={s.emptyIconWrap}>
                    <Ionicons
                      name={search ? "search-outline" : "sparkles-outline"}
                      size={38}
                      color={theme.hint}
                    />
                  </View>
                  <Text style={[s.emptyTitle, { fontSize: 19 * fontScale }]}>
                    {search ? "No results" : "Your canvas is empty"}
                  </Text>
                  <Text style={[s.emptyText, { fontSize: 14 * fontScale }]}>
                    {search
                      ? "Try a different search term"
                      : "Tap the + button to write your first note"}
                  </Text>
                </View>
              }
            />
          )}

          {!loading && (
            <TouchableOpacity
              style={s.fabWrap}
              onPress={() => {
                triggerHaptic("medium");
                resetForm();
                setScreen("add");
              }}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={IOS_BLUE_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.fab}
              >
                <Ionicons name="add" size={30} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

  // ============ ADD / EDIT SCREEN ============
  const isEditing = screen === "edit";
  const palette = NOTE_COLORS[colorId];
  const headerBg = isDark ? palette.darkBg : palette.bg;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[s.container, { backgroundColor: headerBg }]}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={headerBg}
        />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={s.editorHeader}>
            <TouchableOpacity
              style={s.editorIconBtn}
              onPress={() => {
                triggerHaptic("light");
                resetForm();
              }}
              activeOpacity={0.6}
            >
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[s.editorHeaderTitle, { fontSize: 15 * fontScale }]}>
              {isEditing ? "Edit Note" : "New Note"}
            </Text>
            <TouchableOpacity
              style={s.editorIconBtn}
              onPress={handleSave}
              activeOpacity={0.6}
            >
              <Ionicons name="checkmark" size={26} color={IOS_BLUE_SOLID} />
            </TouchableOpacity>
          </View>

          <View style={s.editorBody}>
            <TextInput
              style={[s.titleInput, { fontSize: 28 * fontScale }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Title"
              placeholderTextColor={theme.hint}
              autoFocus={!isEditing}
              autoCorrect={false}
            />
            <TextInput
              style={[s.contentInput, { fontSize: 16 * fontScale }]}
              value={content}
              onChangeText={setContent}
              placeholder="Start writing..."
              placeholderTextColor={theme.hint}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View
            style={[
              s.bottomBar,
              {
                backgroundColor: theme.bgElevated,
                borderTopColor: theme.divider,
              },
            ]}
          >
            <Text style={[s.pickerLabel, { fontSize: 11 * fontScale }]}>
              COLOR
            </Text>
            <View style={s.colorRow}>
              {NOTE_COLORS.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    s.colorDot,
                    { backgroundColor: c.bg },
                    colorId === c.id && {
                      borderWidth: 3,
                      borderColor: theme.text,
                    },
                  ]}
                  onPress={() => {
                    triggerHaptic("light");
                    setColorId(c.id);
                  }}
                  activeOpacity={0.7}
                >
                  {colorId === c.id && (
                    <Ionicons name="checkmark" size={16} color={theme.text} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={s.saveBtnWrap}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={IOS_BLUE_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.saveBtn}
              >
                <Ionicons
                  name={isEditing ? "checkmark-done" : "add-circle-outline"}
                  size={20}
                  color="#FFFFFF"
                />
                <Text style={[s.saveBtnText, { fontSize: 16 * fontScale }]}>
                  {isEditing ? "Update Note" : "Save Note"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ============ Dynamic Styles ============
const getStyles = (theme, isDark) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },

    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 4,
    },
    dateText: {
      fontWeight: "700",
      color: theme.subText,
      letterSpacing: 1.2,
    },
    themeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.iconBg,
      justifyContent: "center",
      alignItems: "center",
    },

    greetingWrap: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 22 },
    greetingSmall: { color: theme.subText, fontWeight: "500", marginBottom: 4 },
    greetingBold: {
      color: theme.text,
      fontWeight: "800",
      lineHeight: 38,
      letterSpacing: -0.7,
    },

    searchWrap: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.searchBg,
      marginHorizontal: 20,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 2,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: theme.searchBorder,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.04,
      shadowRadius: 10,
      elevation: 1,
    },
    searchInput: {
      flex: 1,
      color: theme.text,
      paddingVertical: 13,
      marginLeft: 10,
    },

    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 12,
      gap: 6,
    },
    sectionTitle: {
      fontWeight: "700",
      color: theme.subText,
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },

    list: { paddingBottom: 120 },
    row: {
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 14,
    },

    emptyWrap: { alignItems: "center", marginTop: 60, paddingHorizontal: 40 },
    emptyIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.emptyIconBg,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
    },
    emptyTitle: {
      fontWeight: "700",
      color: theme.text,
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    emptyText: { color: theme.hint, textAlign: "center", lineHeight: 20 },

    fabWrap: {
      position: "absolute",
      bottom: 28,
      right: 24,
      shadowColor: IOS_BLUE_SOLID,
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.45,
      shadowRadius: 20,
      elevation: 10,
    },
    fab: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
    },

    editorHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
    },
    editorIconBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
    },
    editorHeaderTitle: {
      fontWeight: "600",
      color: theme.text,
      letterSpacing: 0.2,
    },
    editorBody: { flex: 1, paddingHorizontal: 24, paddingTop: 16 },
    titleInput: {
      fontWeight: "800",
      color: theme.text,
      paddingVertical: 6,
      letterSpacing: -0.6,
    },
    contentInput: {
      color: theme.text,
      lineHeight: 24,
      minHeight: 180,
      paddingVertical: 12,
      opacity: 0.85,
    },

    bottomBar: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    pickerLabel: {
      fontWeight: "700",
      color: theme.hint,
      letterSpacing: 1.5,
      marginBottom: 12,
    },
    colorRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 20,
      gap: 10,
    },
    colorDot: {
      width: 38,
      height: 38,
      borderRadius: 19,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: "transparent",
    },
    saveBtnWrap: {
      shadowColor: IOS_BLUE_SOLID,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 4,
    },
    saveBtn: {
      borderRadius: 16,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    saveBtnText: { color: "#FFFFFF", fontWeight: "700", letterSpacing: 0.3 },

    // ---- Settings ----
    settingsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingTop: 8,
      paddingBottom: 8,
    },
    settingsTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: theme.text,
      letterSpacing: -0.3,
    },
    settingsScroll: { paddingBottom: 40 },
    settingsSection: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.subText,
      letterSpacing: 1.2,
      paddingHorizontal: 24,
      marginTop: 24,
      marginBottom: 8,
    },
    settingsCard: {
      marginHorizontal: 20,
      borderRadius: 16,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
    },
    settingsSubLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: theme.subText,
      marginBottom: 10,
    },
    segmentRow: {
      flexDirection: "row",
      backgroundColor: isDark ? "#0F0F10" : "#F0EFEC",
      borderRadius: 12,
      padding: 3,
      gap: 3,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 9,
      borderRadius: 10,
      gap: 5,
    },
    segmentText: { fontWeight: "600", fontSize: 13 },

    settingRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 13,
    },
    settingRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    settingRowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    settingIcon: {
      width: 32,
      height: 32,
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
    },
    settingLabel: { fontSize: 15, fontWeight: "500", color: theme.text },
    settingValue: { fontSize: 14, color: theme.hint, marginRight: 6 },
    madeWith: {
      textAlign: "center",
      color: theme.hint,
      fontSize: 12,
      marginTop: 32,
      marginBottom: 20,
    },
  });
