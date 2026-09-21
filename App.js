import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SectionList,
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
  Modal,
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
const TRASH_RETENTION_DAYS = 30;

// ============ Palette ============
const NOTE_COLORS = [
  { id: 0, bg: "#FBE4E4", darkBg: "#3A2525", bar: "#E89B9B", label: "Rose" },
  { id: 1, bg: "#FCF0D5", darkBg: "#3A3325", bar: "#E8C878", label: "Honey" },
  { id: 2, bg: "#DFF0E0", darkBg: "#253A25", bar: "#94C99B", label: "Mint" },
  { id: 3, bg: "#DCEAF6", darkBg: "#253030", bar: "#92BCD9", label: "Sky" },
  { id: 4, bg: "#E8E1F5", darkBg: "#2E253A", bar: "#B5A2DC", label: "Lilac" },
  { id: 5, bg: "#FAE5D8", darkBg: "#3A2E25", bar: "#E8B198", label: "Peach" },
];

// ============ Categories ============
const CATEGORIES = [
  { id: "all", label: "All Notes", icon: "apps-outline", color: "#0A84FF" },
  {
    id: "personal",
    label: "Personal",
    icon: "person-outline",
    color: "#E89B9B",
  },
  { id: "work", label: "Work", icon: "briefcase-outline", color: "#92BCD9" },
  { id: "ideas", label: "Ideas", icon: "bulb-outline", color: "#E8C878" },
  { id: "tasks", label: "Tasks", icon: "checkbox-outline", color: "#94C99B" },
  { id: "study", label: "Study", icon: "book-outline", color: "#B5A2DC" },
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
  pillBg: "#E9E9EB",
  segmentBg: "#E9E9EB",
  segmentActiveBg: "#FFFFFF",
  segmentActiveText: "#000000",
  segmentInactiveText: "#6B6B6B",
  rowCardBg: "#FFFFFF",
  dateBadgeBg: "rgba(0,0,0,0.06)",
  dateBadgeText: "#6B6B6B",
};

const darkTheme = {
  bg: "#000000",
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
  pillBg: "#1C1C1E",
  segmentBg: "#1C1C1E",
  segmentActiveBg: "#3A3A3C",
  segmentActiveText: "#FFFFFF",
  segmentInactiveText: "#A0A0A0",
  rowCardBg: "#1C1C1E",
  dateBadgeBg: "rgba(255,255,255,0.1)",
  dateBadgeText: "#A0A0A0",
};

// ============ Haptic ============
const triggerHaptic = (type = "light") => {
  try {
    if (type === "light")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    else if (type === "medium")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    else if (type === "heavy")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    else if (type === "success")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (type === "warning")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    else if (type === "error")
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    if (Platform.OS === "android") {
      if (type === "medium" || type === "heavy" || type === "warning")
        Vibration.vibrate(30);
      else if (type === "success") Vibration.vibrate([0, 20, 40, 20]);
      else Vibration.vibrate(15);
    }
  } catch (e) {}
};

// ============ Search Bar + Compose ============
function SearchBarWithCompose({
  value,
  onChangeText,
  onCompose,
  theme,
  styles,
  isDark,
  fontScale,
}) {
  return (
    <View style={styles.searchBarWrap}>
      <View style={[styles.searchPill, { backgroundColor: theme.pillBg }]}>
        <Ionicons name="search" size={18} color={theme.hint} />
        <TextInput
          style={[styles.searchPillInput, { fontSize: 16 * fontScale }]}
          value={value}
          onChangeText={onChangeText}
          placeholder="Search"
          placeholderTextColor={theme.hint}
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close-circle" size={18} color={theme.hint} />
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[styles.composeBtn, { backgroundColor: theme.pillBg }]}
        onPress={onCompose}
        activeOpacity={0.7}
      >
        <Ionicons name="create-outline" size={24} color={IOS_BLUE_SOLID} />
      </TouchableOpacity>
    </View>
  );
}

// ============ Note Row (List View) ============
function NoteRow({
  item,
  isDark,
  theme,
  styles,
  fontScale,
  onPress,
  onDelete,
  onPin,
  formatShortDate,
}) {
  const swipeRef = useRef(null);
  const palette = NOTE_COLORS[item.colorId ?? 0];

  const renderRightActions = (progress, dragX) => {
    const scale = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [1, 0.5],
      extrapolate: "clamp",
    });
    return (
      <TouchableOpacity
        style={[styles.deleteActionRow, { backgroundColor: DANGER_RED }]}
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
    <View style={styles.noteRowWrap}>
      <Swipeable
        ref={swipeRef}
        renderRightActions={renderRightActions}
        overshootRight={false}
        friction={2}
        rightThreshold={40}
      >
        <TouchableOpacity
          style={[styles.noteRow, { backgroundColor: theme.rowCardBg }]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <View style={styles.noteRowContent}>
            <Text
              style={[
                styles.noteRowTitle,
                { fontSize: 16 * fontScale, color: theme.text },
              ]}
              numberOfLines={1}
            >
              {item.title || "Untitled"}
            </Text>
            <View style={styles.noteRowSubRow}>
              <View
                style={[
                  styles.dateBadge,
                  { backgroundColor: theme.dateBadgeBg },
                ]}
              >
                <Text
                  style={[
                    styles.dateBadgeText,
                    { fontSize: 11 * fontScale, color: theme.dateBadgeText },
                  ]}
                >
                  {formatShortDate(item.updatedAt || item.createdAt)}
                </Text>
              </View>
              <Text
                style={[
                  styles.noteRowPreview,
                  { fontSize: 14 * fontScale, color: theme.subText },
                ]}
                numberOfLines={1}
              >
                {item.content || "No additional text"}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onPin}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <View
              style={[
                styles.noteRowThumb,
                { backgroundColor: isDark ? palette.darkBg : palette.bg },
              ]}
            >
              <Ionicons name="document-text" size={18} color={palette.bar} />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Swipeable>
    </View>
  );
}

// ============ Note Card (Grid View) ============
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
  const category = CATEGORIES.find((c) => c.id === item.categoryId);

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
            {item.title || "Untitled"}
          </Text>

          {item.content ? (
            <Text
              style={[
                styles.cardContent,
                { fontSize: 13 * fontScale },
                isDark && { color: "rgba(255,255,255,0.55)" },
              ]}
              numberOfLines={2}
            >
              {item.content}
            </Text>
          ) : null}

          <View style={styles.cardBottom}>
            {category && category.id !== "all" ? (
              <View style={styles.cardCategoryRow}>
                <Ionicons
                  name={category.icon}
                  size={10}
                  color={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"}
                />
                <Text
                  style={[
                    styles.cardCategory,
                    { fontSize: 10 * fontScale },
                    isDark && { color: "rgba(255,255,255,0.4)" },
                  ]}
                >
                  {category.label}
                </Text>
              </View>
            ) : null}
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

// ============ Trash Card ============
function TrashCard({
  item,
  theme,
  styles,
  fontScale,
  onRestore,
  onDeletePermanent,
  formatRelative,
}) {
  const palette = NOTE_COLORS[item.colorId ?? 0];

  return (
    <View
      style={[
        styles.trashCard,
        { backgroundColor: theme.bgElevated, borderColor: theme.border },
      ]}
    >
      <View style={[styles.trashAccent, { backgroundColor: palette.bar }]} />
      <View style={styles.trashContent}>
        <View style={styles.trashHeader}>
          <View style={[styles.trashDot, { backgroundColor: palette.bar }]} />
          <Text
            style={[
              styles.trashTitle,
              { fontSize: 15 * fontScale, color: theme.text },
            ]}
            numberOfLines={1}
          >
            {item.title || "Untitled"}
          </Text>
        </View>
        {item.content ? (
          <Text
            style={[
              styles.trashPreview,
              { fontSize: 13 * fontScale, color: theme.subText },
            ]}
            numberOfLines={2}
          >
            {item.content}
          </Text>
        ) : (
          <Text
            style={[
              styles.trashPreview,
              {
                fontSize: 13 * fontScale,
                color: theme.hint,
                fontStyle: "italic",
              },
            ]}
          >
            No content
          </Text>
        )}
        <View style={styles.trashMetaRow}>
          <Ionicons name="time-outline" size={12} color={theme.hint} />
          <Text
            style={[
              styles.trashMeta,
              { fontSize: 11 * fontScale, color: theme.hint },
            ]}
          >
            Deleted {formatRelative(item.deletedAt)}
          </Text>
        </View>
        <View style={styles.trashActions}>
          <TouchableOpacity
            style={[
              styles.trashBtn,
              { backgroundColor: "rgba(10,132,255,0.12)" },
            ]}
            onPress={onRestore}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-undo-outline"
              size={15}
              color={IOS_BLUE_SOLID}
            />
            <Text
              style={[
                styles.trashBtnText,
                { color: IOS_BLUE_SOLID, fontSize: 13 * fontScale },
              ]}
            >
              Restore
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.trashBtn,
              { backgroundColor: "rgba(255,59,48,0.12)" },
            ]}
            onPress={onDeletePermanent}
            activeOpacity={0.7}
          >
            <Ionicons name="close-outline" size={16} color={theme.danger} />
            <Text
              style={[
                styles.trashBtnText,
                { color: theme.danger, fontSize: 13 * fontScale },
              ]}
            >
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ============ Setting Row ============
function SettingRow({
  icon,
  label,
  value,
  onPress,
  theme,
  styles,
  isLast,
  danger,
  badge,
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
        {badge ? (
          <View style={[styles.badge, { backgroundColor: IOS_BLUE_SOLID }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      {onPress && !danger && (
        <Ionicons name="chevron-forward" size={18} color={theme.hint} />
      )}
    </TouchableOpacity>
  );
}

// ============ Static Styles ============
const styles = StyleSheet.create({
  cardStatic: {
    borderRadius: 22,
    padding: 16,
    minHeight: 170,
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
  cardContent: { color: "rgba(0,0,0,0.55)", lineHeight: 18, flex: 1 },
  cardBottom: { marginTop: 10 },
  cardCategoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 4,
  },
  cardCategory: { fontWeight: "600", letterSpacing: 0.2 },
  cardDate: { color: "rgba(0,0,0,0.4)", fontWeight: "600", letterSpacing: 0.2 },

  deleteAction: {
    backgroundColor: DANGER_RED,
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    height: "100%",
    borderTopRightRadius: 22,
    borderBottomRightRadius: 22,
  },
  deleteActionRow: {
    justifyContent: "center",
    alignItems: "center",
    width: 72,
    height: "100%",
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
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
    minHeight: 170,
    marginBottom: 14,
  },
  skeletonDot: { width: 8, height: 8, borderRadius: 4 },
  skeletonLine: { borderRadius: 4 },

  trashCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  trashAccent: { width: 5, alignSelf: "stretch" },
  trashContent: { flex: 1, padding: 14 },
  trashHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  trashDot: { width: 8, height: 8, borderRadius: 4 },
  trashTitle: { flex: 1, fontWeight: "700", letterSpacing: -0.2 },
  trashPreview: { lineHeight: 18, marginBottom: 8, opacity: 0.9 },
  trashMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  trashMeta: { fontWeight: "500", letterSpacing: 0.2 },
  trashActions: { flexDirection: "row", gap: 8 },
  trashBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  trashBtnText: { fontWeight: "700", letterSpacing: 0.2 },
});

// ============ Main App ============
export default function App() {
  const [screen, setScreen] = useState("home");
  const [notes, setNotes] = useState([]);
  const [trash, setTrash] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [colorId, setColorId] = useState(0);
  const [categoryId, setCategoryId] = useState("personal");
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [filterMode, setFilterMode] = useState("notes");
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [themeMode, setThemeMode] = useState("dark");
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
      await loadTrash();
      await loadSettings();
      setTimeout(() => setLoading(false), 500);
    };
    init();
  }, []);

  useEffect(() => {
    if (!loading) saveNotes(notes);
  }, [notes]);
  useEffect(() => {
    if (!loading) saveTrash(trash);
  }, [trash]);
  useEffect(() => {
    if (!loading)
      saveSettings({
        themeMode,
        fontSize,
        sortBy,
        confirmDelete,
        defaultColorId,
        viewMode,
      });
  }, [themeMode, fontSize, sortBy, confirmDelete, defaultColorId, viewMode]);

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

  const loadTrash = async () => {
    try {
      const stored = await AsyncStorage.getItem("@trash");
      let items = stored ? JSON.parse(stored) : [];
      const now = Date.now();
      const cutoff = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
      items = items.filter(
        (i) => now - new Date(i.deletedAt).getTime() < cutoff,
      );
      setTrash(items);
    } catch (e) {}
  };
  const saveTrash = async (data) => {
    try {
      await AsyncStorage.setItem("@trash", JSON.stringify(data));
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
        if (obj.viewMode) setViewMode(obj.viewMode);
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
            ? { ...n, title, content, colorId, categoryId, updatedAt: now }
            : n,
        ),
      );
    } else {
      setNotes([
        {
          id: Date.now().toString(),
          title,
          content,
          colorId,
          categoryId,
          pinned: false,
          createdAt: now,
          updatedAt: now,
        },
        ...notes,
      ]);
    }
    resetForm();
  };

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingId(null);
    setColorId(defaultColorId);
    setCategoryId("personal");
    setScreen("home");
  };

  const openEdit = (note) => {
    triggerHaptic("light");
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
    setColorId(note.colorId ?? 0);
    setCategoryId(note.categoryId ?? "personal");
    setScreen("edit");
  };

  const moveToTrash = (id) => {
    triggerHaptic("warning");
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    setNotes(notes.filter((n) => n.id !== id));
    setTrash([{ ...note, deletedAt: new Date().toISOString() }, ...trash]);
  };

  const requestDelete = (id) => {
    if (!confirmDelete) {
      moveToTrash(id);
      return;
    }
    Alert.alert(
      "Move to Trash?",
      `The note will be kept in Trash for ${TRASH_RETENTION_DAYS} days.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Move to Trash",
          style: "destructive",
          onPress: () => moveToTrash(id),
        },
      ],
    );
  };

  const togglePin = (id) => {
    triggerHaptic("light");
    setNotes(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  const restoreFromTrash = (id) => {
    triggerHaptic("success");
    const item = trash.find((t) => t.id === id);
    if (!item) return;
    const { deletedAt, ...restored } = item;
    setTrash(trash.filter((t) => t.id !== id));
    setNotes([{ ...restored, updatedAt: new Date().toISOString() }, ...notes]);
  };

  const deletePermanent = (id) => {
    Alert.alert("Delete permanently?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          triggerHaptic("error");
          setTrash(trash.filter((t) => t.id !== id));
        },
      },
    ]);
  };

  const emptyTrash = () => {
    Alert.alert(
      "Empty Trash?",
      `All ${trash.length} notes will be permanently deleted.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Empty Trash",
          style: "destructive",
          onPress: () => {
            triggerHaptic("error");
            setTrash([]);
          },
        },
      ],
    );
  };

  const resetAllData = () => {
    Alert.alert(
      "Reset all data?",
      "All notes and trash will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete all",
          style: "destructive",
          onPress: async () => {
            triggerHaptic("error");
            setNotes([]);
            setTrash([]);
            await AsyncStorage.removeItem("@notes");
            await AsyncStorage.removeItem("@trash");
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

  const formatShortDate = (isoString) => {
    if (!isoString) return "";
    const d = new Date(isoString);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${mm}/${dd}`;
  };

  const countByCategory = (catId) => {
    if (catId === "all") return notes.length;
    return notes.filter((n) => n.categoryId === catId).length;
  };

  const filteredNotes = notes.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());

    let matchesCategory = true;
    if (filterMode === "tasks") {
      matchesCategory = n.categoryId === "tasks";
    } else {
      matchesCategory =
        activeCategory === "all" || n.categoryId === activeCategory;
    }
    return matchesSearch && matchesCategory;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sortBy === "oldest")
      return new Date(a.updatedAt) - new Date(b.updatedAt);
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const buildSections = (noteList) => {
    const now = new Date();
    const pinned = [];
    const last7 = [];
    const last30 = [];
    const earlier = [];

    noteList.forEach((note) => {
      if (note.pinned) {
        pinned.push(note);
        return;
      }
      const d = new Date(note.updatedAt || note.createdAt);
      const diffDays = (now - d) / (1000 * 60 * 60 * 24);
      if (diffDays <= 7) last7.push(note);
      else if (diffDays <= 30) last30.push(note);
      else earlier.push(note);
    });

    const result = [];
    if (pinned.length > 0) result.push({ title: "Pinned", data: pinned });
    if (last7.length > 0)
      result.push({ title: "Previous 7 Days", data: last7 });
    if (last30.length > 0)
      result.push({ title: "Previous 30 Days", data: last30 });
    if (earlier.length > 0) result.push({ title: "Earlier", data: earlier });
    return result;
  };

  const sections = buildSections(sortedNotes);

  const getCurrentTitle = () => {
    if (filterMode === "tasks") return "Tasks";
    const cat = CATEGORIES.find((c) => c.id === activeCategory);
    return cat ? cat.label : "All Notes";
  };

  // ============ TRASH SCREEN ============
  if (screen === "trash") {
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
                setScreen("settings");
              }}
              activeOpacity={0.6}
            >
              <Ionicons name="chevron-back" size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={s.settingsTitle}>Trash</Text>
            {trash.length > 0 ? (
              <TouchableOpacity
                style={s.editorIconBtn}
                onPress={emptyTrash}
                activeOpacity={0.6}
              >
                <Ionicons name="trash-outline" size={22} color={theme.danger} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 44 }} />
            )}
          </View>

          <View
            style={[
              s.trashBanner,
              { backgroundColor: theme.bgElevated, borderColor: theme.border },
            ]}
          >
            <View style={s.trashBannerIcon}>
              <Ionicons name="information-circle" size={16} color="#FFB300" />
            </View>
            <Text style={[s.trashBannerText, { color: theme.subText }]}>
              Notes in Trash are auto-deleted after {TRASH_RETENTION_DAYS} days
            </Text>
          </View>

          <FlatList
            data={trash}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TrashCard
                item={item}
                theme={theme}
                styles={s}
                fontScale={fontScale}
                onRestore={() => restoreFromTrash(item.id)}
                onDeletePermanent={() => deletePermanent(item.id)}
                formatRelative={formatRelative}
              />
            )}
            ListEmptyComponent={
              <View style={s.emptyWrap}>
                <View style={s.emptyIconWrap}>
                  <Ionicons name="trash-outline" size={38} color={theme.hint} />
                </View>
                <Text style={[s.emptyTitle, { fontSize: 19 * fontScale }]}>
                  Trash is empty
                </Text>
                <Text style={[s.emptyText, { fontSize: 14 * fontScale }]}>
                  Deleted notes will appear here
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    );
  }

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
                label="Trash"
                badge={trash.length > 0 ? String(trash.length) : null}
                onPress={() => {
                  triggerHaptic("light");
                  setScreen("trash");
                }}
                theme={theme}
                styles={s}
              />
              <SettingRow
                icon="refresh-outline"
                label="Reset all data"
                onPress={resetAllData}
                theme={theme}
                styles={s}
                isLast
                danger
              />
            </View>

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
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={s.container}>
          <StatusBar
            barStyle={isDark ? "light-content" : "dark-content"}
            backgroundColor={theme.bg}
          />

          {/* Top Bar */}
          <View style={s.topBarNew}>
            <TouchableOpacity
              style={[s.topCircleBtn, { backgroundColor: theme.iconBg }]}
              onPress={() => {
                triggerHaptic("light");
                setShowCategoryModal(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name="albums-outline"
                size={22}
                color={theme.iconColor}
              />
            </TouchableOpacity>

            <View style={[s.segmentWrap, { backgroundColor: theme.segmentBg }]}>
              <TouchableOpacity
                style={[
                  s.segmentItem,
                  filterMode === "notes" && {
                    backgroundColor: theme.segmentActiveBg,
                  },
                ]}
                onPress={() => {
                  triggerHaptic("light");
                  setFilterMode("notes");
                  setActiveCategory("all");
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.segmentItemText,
                    {
                      color:
                        filterMode === "notes"
                          ? theme.segmentActiveText
                          : theme.segmentInactiveText,
                      fontWeight: filterMode === "notes" ? "700" : "600",
                    },
                  ]}
                >
                  Notes
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  s.segmentItem,
                  filterMode === "tasks" && {
                    backgroundColor: theme.segmentActiveBg,
                  },
                ]}
                onPress={() => {
                  triggerHaptic("light");
                  setFilterMode("tasks");
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.segmentItemText,
                    {
                      color:
                        filterMode === "tasks"
                          ? theme.segmentActiveText
                          : theme.segmentInactiveText,
                      fontWeight: filterMode === "tasks" ? "700" : "600",
                    },
                  ]}
                >
                  Tasks
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[s.topCircleBtn, { backgroundColor: theme.iconBg }]}
              onPress={() => {
                triggerHaptic("light");
                setViewMode(viewMode === "list" ? "grid" : "list");
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={viewMode === "list" ? "list" : "grid-outline"}
                size={22}
                color={theme.iconColor}
              />
            </TouchableOpacity>
          </View>

          {/* Big Title */}
          <View style={s.bigTitleWrap}>
            <Text
              style={[
                s.bigTitle,
                { fontSize: 34 * fontScale, color: theme.text },
              ]}
              numberOfLines={1}
            >
              {getCurrentTitle()}
            </Text>
          </View>

          {/* List / Grid */}
          {viewMode === "list" ? (
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              contentContainerStyle={s.sectionList}
              showsVerticalScrollIndicator={false}
              stickySectionHeadersEnabled={false}
              renderSectionHeader={({ section: { title } }) => (
                <Text
                  style={[
                    s.sectionGroupTitle,
                    { fontSize: 20 * fontScale, color: theme.text },
                  ]}
                >
                  {title}
                </Text>
              )}
              renderItem={({ item }) => (
                <NoteRow
                  item={item}
                  isDark={isDark}
                  theme={theme}
                  styles={s}
                  fontScale={fontScale}
                  onPress={() => openEdit(item)}
                  onDelete={() => requestDelete(item.id)}
                  onPin={() => togglePin(item.id)}
                  formatShortDate={formatShortDate}
                />
              )}
              ListEmptyComponent={
                !loading ? (
                  <View style={s.emptyWrap}>
                    <View style={s.emptyIconWrap}>
                      <Ionicons
                        name={search ? "search-outline" : "sparkles-outline"}
                        size={38}
                        color={theme.hint}
                      />
                    </View>
                    <Text style={[s.emptyTitle, { fontSize: 19 * fontScale }]}>
                      {search
                        ? "No results"
                        : filterMode === "tasks"
                          ? "No tasks yet"
                          : "Your canvas is empty"}
                    </Text>
                    <Text style={[s.emptyText, { fontSize: 14 * fontScale }]}>
                      {search
                        ? "Try a different search term"
                        : "Tap the pencil button to write your first note"}
                    </Text>
                  </View>
                ) : null
              }
            />
          ) : (
            <FlatList
              data={sortedNotes}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={s.row}
              contentContainerStyle={s.list}
              showsVerticalScrollIndicator={false}
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
                      : "Tap the pencil button to write your first note"}
                  </Text>
                </View>
              }
            />
          )}

          {/* Search Bar + Compose Button */}
          <SearchBarWithCompose
            value={search}
            onChangeText={setSearch}
            onCompose={() => {
              triggerHaptic("medium");
              resetForm();
              setScreen("add");
            }}
            theme={theme}
            styles={s}
            isDark={isDark}
            fontScale={fontScale}
          />
        </SafeAreaView>

        {/* Category Modal */}
        <Modal
          visible={showCategoryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <TouchableOpacity
            style={s.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCategoryModal(false)}
          >
            <View
              style={[s.modalContent, { backgroundColor: theme.bgElevated }]}
            >
              <Text
                style={[
                  s.modalTitle,
                  { color: theme.text, fontSize: 20 * fontScale },
                ]}
              >
                Categories
              </Text>
              {CATEGORIES.map((cat) => {
                const active =
                  activeCategory === cat.id && filterMode === "notes";
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      s.modalCatRow,
                      active && { backgroundColor: cat.color + "20" },
                    ]}
                    onPress={() => {
                      triggerHaptic("light");
                      setFilterMode("notes");
                      setActiveCategory(cat.id);
                      setShowCategoryModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[s.modalCatIcon, { backgroundColor: cat.color }]}
                    >
                      <Ionicons name={cat.icon} size={18} color="#FFFFFF" />
                    </View>
                    <Text
                      style={[
                        s.modalCatLabel,
                        {
                          color: active ? cat.color : theme.text,
                          fontWeight: active ? "700" : "500",
                          fontSize: 16 * fontScale,
                        },
                      ]}
                    >
                      {cat.label}
                    </Text>
                    <Text
                      style={[
                        s.modalCatCount,
                        { color: theme.hint, fontSize: 14 * fontScale },
                      ]}
                    >
                      {countByCategory(cat.id)}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TouchableOpacity
                style={[s.modalSettingsBtn, { borderTopColor: theme.divider }]}
                onPress={() => {
                  triggerHaptic("light");
                  setShowCategoryModal(false);
                  setTimeout(() => setScreen("settings"), 200);
                }}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={theme.iconColor}
                />
                <Text
                  style={[
                    s.modalSettingsText,
                    { color: theme.text, fontSize: 16 * fontScale },
                  ]}
                >
                  Settings
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
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
          {/* Editor Header */}
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

          {/* Editor Body */}
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

          {/* Bottom Bar - Premium iOS Style */}
          <View
            style={[
              s.bottomBar,
              {
                backgroundColor: theme.bgElevated,
                borderTopColor: theme.divider,
              },
            ]}
          >
            {/* Category Row */}
            <View style={s.pickerBlock}>
              <View style={s.pickerLabelRow}>
                <Ionicons name="folder-outline" size={12} color={theme.hint} />
                <Text style={[s.pickerLabelText, { color: theme.hint }]}>
                  Category
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={s.catScrollContainer}
              >
                {CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
                  const active = categoryId === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        s.catPillNew,
                        {
                          backgroundColor: active ? cat.color : theme.pillBg,
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setCategoryId(cat.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={13}
                        color={active ? "#FFFFFF" : theme.subText}
                      />
                      <Text
                        style={[
                          s.catPillTextNew,
                          {
                            fontSize: 12.5 * fontScale,
                            color: active ? "#FFFFFF" : theme.subText,
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Color Row */}
            <View style={s.pickerBlock}>
              <View style={s.pickerLabelRow}>
                <Ionicons
                  name="color-palette-outline"
                  size={12}
                  color={theme.hint}
                />
                <Text style={[s.pickerLabelText, { color: theme.hint }]}>
                  Color
                </Text>
              </View>
              <View style={s.colorRowNew}>
                {NOTE_COLORS.map((c) => {
                  const active = colorId === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      style={[s.colorDotWrap, active && { borderColor: c.bar }]}
                      onPress={() => {
                        triggerHaptic("light");
                        setColorId(c.id);
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[s.colorDotInner, { backgroundColor: c.bg }]}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={s.saveBtnWrapNew}
              onPress={handleSave}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={IOS_BLUE_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.saveBtnNew}
              >
                <Ionicons
                  name={isEditing ? "checkmark-done" : "add-circle-outline"}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={[s.saveBtnTextNew, { fontSize: 15 * fontScale }]}>
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

    // Top Bar
    topBarNew: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 8,
    },
    topCircleBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
    },
    segmentWrap: {
      flexDirection: "row",
      borderRadius: 22,
      padding: 4,
      minWidth: 180,
    },
    segmentItem: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 18,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentItemText: {
      fontSize: 15,
      letterSpacing: -0.2,
    },

    bigTitleWrap: {
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 14,
    },
    bigTitle: {
      fontWeight: "800",
      letterSpacing: -1,
    },

    sectionList: {
      paddingBottom: 110,
    },
    sectionGroupTitle: {
      fontWeight: "800",
      letterSpacing: -0.5,
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 10,
    },

    // Note Row (List)
    noteRowWrap: {
      marginHorizontal: 16,
      marginBottom: 8,
      borderRadius: 14,
      overflow: "hidden",
    },
    noteRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 16,
      minHeight: 72,
    },
    noteRowContent: { flex: 1, marginRight: 12 },
    noteRowTitle: {
      fontWeight: "700",
      letterSpacing: -0.2,
      marginBottom: 6,
    },
    noteRowSubRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    dateBadge: {
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderRadius: 6,
    },
    dateBadgeText: {
      fontWeight: "600",
      letterSpacing: 0.2,
    },
    noteRowPreview: {
      flex: 1,
      fontWeight: "400",
    },
    noteRowThumb: {
      width: 42,
      height: 42,
      borderRadius: 10,
      justifyContent: "center",
      alignItems: "center",
    },

    list: { paddingBottom: 110 },
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

    // Search Bar
    searchBarWrap: {
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    searchPill: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 24,
      paddingHorizontal: 16,
      paddingVertical: 12,
      gap: 8,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.08,
      shadowRadius: 14,
      elevation: 4,
    },
    searchPillInput: {
      flex: 1,
      color: theme.text,
      paddingVertical: 0,
      marginLeft: 2,
    },
    composeBtn: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: "center",
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.5 : 0.08,
      shadowRadius: 14,
      elevation: 4,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 20,
      paddingBottom: 32,
    },
    modalTitle: {
      fontWeight: "800",
      letterSpacing: -0.5,
      paddingHorizontal: 24,
      marginBottom: 16,
    },
    modalCatRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 24,
      paddingVertical: 12,
      gap: 14,
    },
    modalCatIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
    },
    modalCatLabel: { flex: 1 },
    modalCatCount: { fontWeight: "600" },
    modalSettingsBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginTop: 12,
      paddingTop: 16,
      paddingHorizontal: 24,
      borderTopWidth: 1,
    },
    modalSettingsText: { fontWeight: "600" },

    // Editor
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
      minHeight: 160,
      paddingVertical: 12,
      opacity: 0.85,
    },

    // ===== PREMIUM BOTTOM BAR =====
    bottomBar: {
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 20,
      borderTopWidth: 1,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
    },
    pickerBlock: {
      marginBottom: 18,
    },
    pickerLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginBottom: 10,
    },
    pickerLabelText: {
      fontSize: 11.5,
      fontWeight: "600",
      letterSpacing: 0.3,
    },
    catScrollContainer: {
      gap: 8,
      paddingRight: 8,
    },
    catPillNew: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
    },
    catPillTextNew: {
      fontWeight: "600",
      letterSpacing: 0.1,
    },
    colorRowNew: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    colorDotWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 2,
      borderColor: "transparent",
      justifyContent: "center",
      alignItems: "center",
    },
    colorDotInner: {
      width: 30,
      height: 30,
      borderRadius: 15,
    },
    saveBtnWrapNew: {
      borderRadius: 16,
      overflow: "hidden",
      shadowColor: IOS_BLUE_SOLID,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 3,
      marginTop: 4,
    },
    saveBtnNew: {
      paddingVertical: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    saveBtnTextNew: {
      color: "#FFFFFF",
      fontWeight: "700",
      letterSpacing: 0.2,
    },

    // Settings
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
    badge: {
      minWidth: 22,
      height: 22,
      borderRadius: 11,
      paddingHorizontal: 6,
      justifyContent: "center",
      alignItems: "center",
      marginLeft: 4,
    },
    badgeText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },

    // Trash
    trashBanner: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 20,
      marginTop: 8,
      marginBottom: 4,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      gap: 10,
    },
    trashBannerIcon: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "rgba(255,179,0,0.15)",
      justifyContent: "center",
      alignItems: "center",
    },
    trashBannerText: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: "500",
      lineHeight: 17,
    },
  });
