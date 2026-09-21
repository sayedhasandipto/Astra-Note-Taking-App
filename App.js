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
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Swipeable,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = (width - 56) / 2;
const TRASH_RETENTION_DAYS = 30;
const ANDROID_STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;

// ============ Background Gradient ============
const BG_GRADIENT = ["#050816", "#0A1440", "#1E3A8A", "#0EA5E9", "#0C4A6E"];
const BG_GRADIENT_LOCATIONS = [0, 0.25, 0.55, 0.8, 1];

// ============ Note Colors (Frosted Tints) ============
const NOTE_COLORS = [
  {
    id: 0,
    tint: "rgba(244,114,182,0.28)",
    border: "rgba(244,114,182,0.45)",
    bar: "#F472B6",
    label: "Rose",
    glow: "#F472B6",
  },
  {
    id: 1,
    tint: "rgba(250,204,21,0.22)",
    border: "rgba(250,204,21,0.4)",
    bar: "#FACC15",
    label: "Honey",
    glow: "#FACC15",
  },
  {
    id: 2,
    tint: "rgba(52,211,153,0.24)",
    border: "rgba(52,211,153,0.42)",
    bar: "#34D399",
    label: "Mint",
    glow: "#34D399",
  },
  {
    id: 3,
    tint: "rgba(56,189,248,0.26)",
    border: "rgba(56,189,248,0.45)",
    bar: "#38BDF8",
    label: "Sky",
    glow: "#38BDF8",
  },
  {
    id: 4,
    tint: "rgba(168,85,247,0.24)",
    border: "rgba(168,85,247,0.42)",
    bar: "#A855F7",
    label: "Lilac",
    glow: "#A855F7",
  },
  {
    id: 5,
    tint: "rgba(251,146,60,0.24)",
    border: "rgba(251,146,60,0.42)",
    bar: "#FB923C",
    label: "Peach",
    glow: "#FB923C",
  },
];

// ============ Playlist Colors ============
const PLAYLIST_COLORS = [
  "#3B82F6",
  "#F43F5E",
  "#10B981",
  "#F59E0B",
  "#A855F7",
  "#06B6D4",
  "#EAB308",
  "#EC4899",
];

// ============ Categories ============
const CATEGORIES = [
  {
    id: "all",
    label: "All Notes",
    icon: "layers-outline",
    color: "#38BDF8",
    glow: "#38BDF8",
  },
  {
    id: "personal",
    label: "Personal",
    icon: "person-outline",
    color: "#F472B6",
    glow: "#F472B6",
  },
  {
    id: "work",
    label: "Work",
    icon: "briefcase-outline",
    color: "#22D3EE",
    glow: "#22D3EE",
  },
  {
    id: "ideas",
    label: "Ideas",
    icon: "bulb-outline",
    color: "#FACC15",
    glow: "#FACC15",
  },
  {
    id: "tasks",
    label: "Tasks",
    icon: "checkbox-outline",
    color: "#34D399",
    glow: "#34D399",
  },
  {
    id: "study",
    label: "Study",
    icon: "book-outline",
    color: "#A855F7",
    glow: "#A855F7",
  },
];

const CYBER_BLUE = "#38BDF8";
const ELECTRIC_BLUE = "#3B82F6";
const DANGER_RED = "#F43F5E";
const SUCCESS_GREEN = "#10B981";

// ============ Glass Tokens ============
const GLASS = {
  card: "rgba(255,255,255,0.08)",
  cardStrong: "rgba(255,255,255,0.12)",
  cardSubtle: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.18)",
  borderStrong: "rgba(255,255,255,0.28)",
  borderSubtle: "rgba(255,255,255,0.12)",
  textPrimary: "#FFFFFF",
  textSecondary: "rgba(255,255,255,0.72)",
  textTertiary: "rgba(255,255,255,0.5)",
  textQuaternary: "rgba(255,255,255,0.3)",
  divider: "rgba(255,255,255,0.08)",
};

// ============ Option Lists ============
const FONT_SIZES = [
  { id: "small", label: "Small", scale: 0.88 },
  { id: "medium", label: "Medium", scale: 1.0 },
  { id: "large", label: "Large", scale: 1.15 },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest First" },
  { id: "oldest", label: "Oldest First" },
  { id: "title", label: "Title (A–Z)" },
];

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

// ============ Glass Card ============
function GlassCard({
  children,
  style,
  intensity = 40,
  tint = "dark",
  bordered = true,
  strong = false,
}) {
  return (
    <View
      style={[
        {
          borderRadius: 20,
          overflow: "hidden",
          borderWidth: bordered ? 1 : 0,
          borderColor: strong ? GLASS.borderStrong : GLASS.border,
        },
        style,
      ]}
    >
      <BlurView
        intensity={intensity}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: strong ? GLASS.cardStrong : GLASS.card },
        ]}
      />
      {children}
    </View>
  );
}

// ============ Nav Header ============
function NavHeader({ title, onBack, rightIcon, onRightPress, styles }) {
  return (
    <View style={styles.navHeader}>
      <View style={styles.navHeaderLeft}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.6}
            style={styles.navBackBtn}
          >
            <Ionicons name="chevron-back" size={26} color={GLASS.textPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={styles.navTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.navHeaderRight}>
        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightPress}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name={rightIcon} size={22} color={GLASS.textPrimary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

// ============ Search Bar ============
function SearchBar({ value, onChangeText, styles }) {
  return (
    <GlassCard style={styles.searchContainer} intensity={30} bordered>
      <View style={styles.searchInner}>
        <Ionicons name="search" size={17} color={GLASS.textTertiary} />
        <TextInput
          style={styles.searchInput}
          value={value}
          onChangeText={onChangeText}
          placeholder="Search notes..."
          placeholderTextColor={GLASS.textTertiary}
          autoCorrect={false}
          returnKeyType="search"
        />
        {value.length > 0 && (
          <TouchableOpacity
            onPress={() => onChangeText("")}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close-circle"
              size={17}
              color={GLASS.textTertiary}
            />
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
}

// ============ Segmented Control ============
function SegmentedControl({ mode, onChange, styles }) {
  return (
    <GlassCard style={styles.segmentWrapper} intensity={35} bordered>
      <View style={styles.segmentInner}>
        <TouchableOpacity
          style={[styles.segment, mode === "notes" && styles.segmentActive]}
          onPress={() => {
            triggerHaptic("light");
            onChange("notes");
          }}
          activeOpacity={0.7}
        >
          {mode === "notes" && (
            <LinearGradient
              colors={["rgba(56,189,248,0.55)", "rgba(59,130,246,0.55)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <Text
            style={[
              styles.segmentText,
              mode === "notes" && styles.segmentTextActive,
            ]}
          >
            Notes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, mode === "tasks" && styles.segmentActive]}
          onPress={() => {
            triggerHaptic("light");
            onChange("tasks");
          }}
          activeOpacity={0.7}
        >
          {mode === "tasks" && (
            <LinearGradient
              colors={["rgba(56,189,248,0.55)", "rgba(59,130,246,0.55)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <Text
            style={[
              styles.segmentText,
              mode === "tasks" && styles.segmentTextActive,
            ]}
          >
            Tasks
          </Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

// ============ Note Row ============
function NoteRow({
  item,
  styles,
  fontScale,
  onPress,
  onDelete,
  onRestore,
  onPin,
  formatShortDateTime,
  playlists,
  isTrash,
}) {
  const swipeRightRef = useRef(null);
  const swipeLeftRef = useRef(null);
  const palette = NOTE_COLORS[item.colorId ?? 0];
  const playlist = playlists.find((p) => p.id === item.playlistId);

  const renderLeftActions = () => {
    if (!isTrash) return null;
    return (
      <TouchableOpacity
        style={[styles.swipeRestore, { backgroundColor: SUCCESS_GREEN }]}
        onPress={() => {
          triggerHaptic("success");
          swipeRightRef.current?.close();
          onRestore?.();
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="arrow-undo" size={20} color="#FFFFFF" />
        <Text style={styles.swipeActionText}>Restore</Text>
      </TouchableOpacity>
    );
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.swipeDelete, { backgroundColor: DANGER_RED }]}
      onPress={() => {
        triggerHaptic("warning");
        swipeLeftRef.current?.close();
        onDelete?.();
      }}
      activeOpacity={0.85}
    >
      <Ionicons name="trash" size={20} color="#FFFFFF" />
      <Text style={styles.swipeActionText}>{isTrash ? "Delete" : "Trash"}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.noteRowContainer}>
      <Swipeable
        ref={swipeRightRef}
        renderLeftActions={renderLeftActions}
        overshootLeft={false}
        friction={2}
        leftThreshold={40}
      >
        <Swipeable
          ref={swipeLeftRef}
          renderRightActions={renderRightActions}
          overshootRight={false}
          friction={2}
          rightThreshold={40}
        >
          <GlassCard style={styles.noteRowCard} intensity={50} bordered>
            <TouchableOpacity
              style={styles.noteRowInner}
              onPress={onPress}
              onLongPress={onPin}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.noteRowAccent,
                  {
                    backgroundColor: palette.bar,
                    shadowColor: palette.glow,
                    shadowOpacity: 0.8,
                    shadowRadius: 8,
                  },
                ]}
              />

              <View style={styles.noteRowLeft}>
                <Text
                  style={[styles.noteRowTitle, { fontSize: 16 * fontScale }]}
                  numberOfLines={1}
                >
                  {item.title || "Untitled"}
                </Text>
                <View style={styles.noteRowMeta}>
                  <Text
                    style={[styles.noteRowTime, { fontSize: 12 * fontScale }]}
                  >
                    {isTrash ? "Deleted " : ""}
                    {formatShortDateTime(item.updatedAt || item.createdAt)}
                  </Text>
                  {playlist && !isTrash ? (
                    <>
                      <View style={styles.dotSeparator} />
                      <View
                        style={[
                          styles.playlistMiniDot,
                          {
                            backgroundColor: playlist.color,
                            shadowColor: playlist.color,
                            shadowOpacity: 0.9,
                            shadowRadius: 5,
                          },
                        ]}
                      />
                      <Text
                        style={[
                          styles.noteRowTime,
                          { fontSize: 12 * fontScale },
                        ]}
                        numberOfLines={1}
                      >
                        {playlist.name}
                      </Text>
                    </>
                  ) : null}
                  {!playlist && !isTrash && item.content ? (
                    <>
                      <View style={styles.dotSeparator} />
                      <Text
                        style={[
                          styles.noteRowPreview,
                          { fontSize: 12 * fontScale },
                        ]}
                        numberOfLines={1}
                      >
                        {item.content}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>

              {item.pinned && !isTrash ? (
                <Ionicons name="bookmark" size={13} color={palette.bar} />
              ) : null}
              {!isTrash ? (
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={GLASS.textQuaternary}
                  style={{ marginLeft: 6 }}
                />
              ) : null}
            </TouchableOpacity>
          </GlassCard>
        </Swipeable>
      </Swipeable>
    </View>
  );
}

// ============ Note Card (Grid) ============
function NoteCard({
  item,
  index,
  styles,
  fontScale,
  onPress,
  onPin,
  formatRelative,
  playlists,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const palette = NOTE_COLORS[item.colorId ?? 0];
  const playlist = playlists.find((p) => p.id === item.playlistId);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 50,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={{ opacity: fadeAnim, width: CARD_WIDTH }}>
      <GlassCard
        style={[styles.noteCard, { borderColor: palette.border }]}
        intensity={55}
        bordered
        strong
      >
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: palette.tint }]}
        />
        <TouchableOpacity
          style={styles.noteCardInner}
          onPress={onPress}
          onLongPress={onPin}
          activeOpacity={0.85}
        >
          <View style={styles.noteCardTop}>
            <View
              style={[
                styles.colorDotSmall,
                {
                  backgroundColor: palette.bar,
                  shadowColor: palette.glow,
                  shadowOpacity: 0.9,
                  shadowRadius: 6,
                },
              ]}
            />
            {item.pinned && (
              <Ionicons name="bookmark" size={13} color="#FFFFFF" />
            )}
          </View>
          <Text
            style={[styles.noteCardTitle, { fontSize: 15 * fontScale }]}
            numberOfLines={3}
          >
            {item.title || "Untitled"}
          </Text>
          {item.content ? (
            <Text
              style={[styles.noteCardContent, { fontSize: 12 * fontScale }]}
              numberOfLines={2}
            >
              {item.content}
            </Text>
          ) : null}
          <View style={styles.noteCardBottom}>
            {playlist && (
              <View
                style={[
                  styles.playlistMiniDot,
                  { backgroundColor: playlist.color },
                ]}
              />
            )}
            <Text style={[styles.noteCardDate, { fontSize: 10.5 * fontScale }]}>
              {formatRelative(item.updatedAt || item.createdAt)}
            </Text>
          </View>
        </TouchableOpacity>
      </GlassCard>
    </Animated.View>
  );
}

// ============ Setting Row ============
function SettingRow({
  icon,
  iconColor,
  label,
  value,
  onPress,
  styles,
  isLast,
  danger,
  badge,
}) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, !isLast && styles.settingRowBorder]}
      onPress={onPress}
      activeOpacity={onPress ? 0.5 : 1}
      disabled={!onPress}
    >
      {icon && (
        <View
          style={[
            styles.settingIconContainer,
            {
              backgroundColor: danger ? DANGER_RED : iconColor || CYBER_BLUE,
              shadowColor: danger ? DANGER_RED : iconColor || CYBER_BLUE,
              shadowOpacity: 0.6,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
            },
          ]}
        >
          <Ionicons name={icon} size={15} color="#FFFFFF" />
        </View>
      )}
      <Text
        style={[styles.settingLabel, danger && { color: DANGER_RED }]}
        numberOfLines={1}
      >
        {label}
      </Text>
      <View style={styles.settingRight}>
        {badge ? (
          <View style={styles.settingBadge}>
            <Text style={styles.settingBadgeText}>{badge}</Text>
          </View>
        ) : null}
        {value ? (
          <Text style={styles.settingValue} numberOfLines={1}>
            {value}
          </Text>
        ) : null}
        {onPress && (
          <Ionicons
            name="chevron-forward"
            size={16}
            color={GLASS.textQuaternary}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

// ============ FAB ============
function FAB({ onPress, styles }) {
  return (
    <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={["#38BDF8", "#3B82F6", "#6366F1"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabInner}
      >
        <Ionicons name="create-outline" size={26} color="#FFFFFF" />
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ============ Confirm Dialog ============
function ConfirmDialog({ dialog, onCancel, onConfirm, styles }) {
  return (
    <Modal
      visible={dialog.visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.confirmOverlay} onPress={onCancel}>
        <Pressable
          style={styles.confirmWrap}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.confirmCard}>
            <BlurView
              intensity={90}
              tint="dark"
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(20,20,26,0.55)" },
              ]}
            />
            <View style={styles.confirmContent}>
              <View style={styles.confirmIconWrap}>
                <Ionicons
                  name={
                    dialog.destructive ? "alert-circle" : "information-circle"
                  }
                  size={28}
                  color={dialog.destructive ? DANGER_RED : CYBER_BLUE}
                />
              </View>
              <Text style={styles.confirmTitle}>{dialog.title}</Text>
              <Text style={styles.confirmMessage}>{dialog.message}</Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  style={[styles.confirmBtn, styles.confirmBtnCancel]}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text style={styles.confirmBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, styles.confirmBtnPrimaryWrap]}
                  onPress={onConfirm}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={
                      dialog.destructive
                        ? ["#F43F5E", "#DC2626"]
                        : ["#38BDF8", "#3B82F6"]
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.confirmBtnPrimaryText}>
                    {dialog.confirmLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============ Option Picker Modal ============
function OptionPickerModal({
  visible,
  title,
  message,
  options,
  selectedId,
  onSelect,
  onClose,
  styles,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalSheetWrap}
          onPress={(e) => e.stopPropagation()}
        >
          <GlassCard
            style={styles.pickerContent}
            intensity={80}
            bordered
            strong
          >
            <View style={styles.modalGrabber} />
            <Text style={styles.pickerTitle}>{title}</Text>
            {message ? (
              <Text style={styles.pickerMessage}>{message}</Text>
            ) : null}
            <View style={styles.pickerList}>
              {options.map((opt, idx) => {
                const active = selectedId === opt.id;
                const isLast = idx === options.length - 1;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.pickerRow,
                      !isLast && styles.pickerRowBorder,
                    ]}
                    onPress={() => {
                      triggerHaptic("light");
                      onSelect(opt.id);
                      onClose();
                    }}
                    activeOpacity={0.5}
                  >
                    <Text style={styles.pickerRowText}>{opt.label}</Text>
                    {active && (
                      <Ionicons name="checkmark" size={22} color={CYBER_BLUE} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </GlassCard>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ============ Main App ============
export default function App() {
  const [screen, setScreen] = useState("home");
  const [notes, setNotes] = useState([]);
  const [trash, setTrash] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [colorId, setColorId] = useState(0);
  const [categoryId, setCategoryId] = useState("personal");
  const [playlistId, setPlaylistId] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activePlaylist, setActivePlaylist] = useState("all");
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState("list");
  const [filterMode, setFilterMode] = useState("notes");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistColor, setNewPlaylistColor] = useState(PLAYLIST_COLORS[0]);
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerType, setPickerType] = useState(null);

  // Custom Confirm Dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    visible: false,
    title: "",
    message: "",
    confirmLabel: "Delete",
    destructive: true,
    onConfirm: null,
  });

  const [fontSize, setFontSize] = useState("medium");
  const [sortBy, setSortBy] = useState("newest");
  const [confirmDelete, setConfirmDelete] = useState(true);
  const [defaultColorId, setDefaultColorId] = useState(0);

  const s = styles;
  const fontScale = (FONT_SIZES.find((f) => f.id === fontSize) || FONT_SIZES[1])
    .scale;

  useEffect(() => {
    const init = async () => {
      await loadNotes();
      await loadTrash();
      await loadPlaylists();
      await loadSettings();
      setTimeout(() => setLoading(false), 400);
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
    if (!loading) savePlaylists(playlists);
  }, [playlists]);
  useEffect(() => {
    if (!loading)
      saveSettings({
        fontSize,
        sortBy,
        confirmDelete,
        defaultColorId,
        viewMode,
      });
  }, [fontSize, sortBy, confirmDelete, defaultColorId, viewMode]);

  const loadNotes = async () => {
    try {
      const st = await AsyncStorage.getItem("@notes");
      if (st) setNotes(JSON.parse(st));
    } catch (e) {}
  };
  const saveNotes = async (d) => {
    try {
      await AsyncStorage.setItem("@notes", JSON.stringify(d));
    } catch (e) {}
  };
  const loadTrash = async () => {
    try {
      const st = await AsyncStorage.getItem("@trash");
      let items = st ? JSON.parse(st) : [];
      const cutoff = TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
      const now = Date.now();
      items = items.filter(
        (i) => now - new Date(i.deletedAt).getTime() < cutoff,
      );
      setTrash(items);
    } catch (e) {}
  };
  const saveTrash = async (d) => {
    try {
      await AsyncStorage.setItem("@trash", JSON.stringify(d));
    } catch (e) {}
  };
  const loadPlaylists = async () => {
    try {
      const st = await AsyncStorage.getItem("@playlists");
      if (st) setPlaylists(JSON.parse(st));
    } catch (e) {}
  };
  const savePlaylists = async (d) => {
    try {
      await AsyncStorage.setItem("@playlists", JSON.stringify(d));
    } catch (e) {}
  };
  const loadSettings = async () => {
    try {
      const st = await AsyncStorage.getItem("@settings");
      if (st) {
        const o = JSON.parse(st);
        if (o.fontSize) setFontSize(o.fontSize);
        if (o.sortBy) setSortBy(o.sortBy);
        if (typeof o.confirmDelete === "boolean")
          setConfirmDelete(o.confirmDelete);
        if (typeof o.defaultColorId === "number")
          setDefaultColorId(o.defaultColorId);
        if (o.viewMode) setViewMode(o.viewMode);
      }
    } catch (e) {}
  };
  const saveSettings = async (o) => {
    try {
      await AsyncStorage.setItem("@settings", JSON.stringify(o));
    } catch (e) {}
  };

  // ============ Confirm Dialog Helpers ============
  const openConfirm = (
    title,
    message,
    confirmLabel,
    onConfirm,
    destructive = true,
  ) => {
    setConfirmDialog({
      visible: true,
      title,
      message,
      confirmLabel,
      destructive,
      onConfirm,
    });
  };

  const closeConfirm = () => {
    setConfirmDialog((prev) => ({ ...prev, visible: false }));
  };

  const handleConfirm = () => {
    triggerHaptic("warning");
    const cb = confirmDialog.onConfirm;
    closeConfirm();
    setTimeout(() => {
      if (cb) cb();
    }, 150);
  };

  const openPicker = (type) => {
    triggerHaptic("light");
    setPickerType(type);
    setPickerVisible(true);
  };
  const handlePickerSelect = (id) => {
    if (pickerType === "sort") setSortBy(id);
    else if (pickerType === "color") setDefaultColorId(id);
  };
  const getPickerConfig = () => {
    if (pickerType === "sort")
      return { title: "Sort By", options: SORT_OPTIONS, selectedId: sortBy };
    if (pickerType === "color")
      return {
        title: "Default Color",
        options: NOTE_COLORS.map((c) => ({ id: c.id, label: c.label })),
        selectedId: defaultColorId,
      };
    return { title: "", options: [], selectedId: null };
  };

  // Playlist
  const openNewPlaylistModal = () => {
    setEditingPlaylistId(null);
    setNewPlaylistName("");
    setNewPlaylistColor(
      PLAYLIST_COLORS[playlists.length % PLAYLIST_COLORS.length],
    );
    setShowPlaylistModal(true);
  };
  const openEditPlaylistModal = (p) => {
    setEditingPlaylistId(p.id);
    setNewPlaylistName(p.name);
    setNewPlaylistColor(p.color);
    setShowPlaylistModal(true);
  };
  const savePlaylistFromModal = () => {
    if (newPlaylistName.trim() === "") {
      triggerHaptic("warning");
      return;
    }
    const target =
      filterMode === "tasks"
        ? "tasks"
        : activeCategory !== "all"
          ? activeCategory
          : categoryId;
    if (editingPlaylistId) {
      setPlaylists(
        playlists.map((p) =>
          p.id === editingPlaylistId
            ? { ...p, name: newPlaylistName.trim(), color: newPlaylistColor }
            : p,
        ),
      );
    } else {
      const np = {
        id: Date.now().toString(),
        name: newPlaylistName.trim(),
        color: newPlaylistColor,
        categoryId: target,
        createdAt: new Date().toISOString(),
      };
      setPlaylists([...playlists, np]);
      if (screen === "add" || screen === "edit") setPlaylistId(np.id);
    }
    triggerHaptic("success");
    setShowPlaylistModal(false);
    setNewPlaylistName("");
    setEditingPlaylistId(null);
  };
  const deletePlaylist = (p) => {
    openConfirm(
      "Delete Playlist?",
      `"${p.name}" will be deleted. Notes inside will remain but lose their tag.`,
      "Delete",
      () => {
        triggerHaptic("error");
        setPlaylists(playlists.filter((x) => x.id !== p.id));
        setNotes(
          notes.map((n) =>
            n.playlistId === p.id ? { ...n, playlistId: null } : n,
          ),
        );
        if (activePlaylist === p.id) setActivePlaylist("all");
        setShowPlaylistModal(false);
      },
    );
  };
  const handlePlaylistLongPress = (p) => {
    triggerHaptic("medium");
    Alert.alert(p.name, "", [
      { text: "Cancel", style: "cancel" },
      { text: "Rename", onPress: () => openEditPlaylistModal(p) },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePlaylist(p),
      },
    ]);
  };

  // Notes
  const handleSave = () => {
    if (title.trim() === "") {
      triggerHaptic("warning");
      Alert.alert("Title Required", "Please add a title to your note.");
      return;
    }
    triggerHaptic("success");
    const now = new Date().toISOString();
    if (editingId) {
      setNotes(
        notes.map((n) =>
          n.id === editingId
            ? {
                ...n,
                title,
                content,
                colorId,
                categoryId,
                playlistId,
                updatedAt: now,
              }
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
          playlistId,
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
    setPlaylistId(null);
    setScreen("home");
  };
  const openEdit = (note) => {
    triggerHaptic("light");
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
    setColorId(note.colorId ?? 0);
    setCategoryId(note.categoryId ?? "personal");
    setPlaylistId(note.playlistId ?? null);
    setScreen("edit");
  };
  const moveToTrash = (id) => {
    triggerHaptic("warning");
    const n = notes.find((x) => x.id === id);
    if (!n) return;
    setNotes(notes.filter((x) => x.id !== id));
    setTrash([{ ...n, deletedAt: new Date().toISOString() }, ...trash]);
  };
  const requestDelete = (id) => {
    if (!confirmDelete) {
      moveToTrash(id);
      return;
    }
    openConfirm(
      "Move to Trash?",
      `This note will be kept in Trash for ${TRASH_RETENTION_DAYS} days.`,
      "Move to Trash",
      () => moveToTrash(id),
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
    openConfirm(
      "Delete Permanently?",
      "This note will be permanently deleted. This cannot be undone.",
      "Delete",
      () => {
        triggerHaptic("error");
        setTrash(trash.filter((t) => t.id !== id));
      },
    );
  };
  const emptyTrash = () => {
    openConfirm(
      "Empty Trash?",
      `All ${trash.length} notes will be permanently deleted. This cannot be undone.`,
      "Empty Trash",
      () => {
        triggerHaptic("error");
        setTrash([]);
      },
    );
  };
  const resetAllData = () => {
    openConfirm(
      "Reset All Data?",
      "All notes, playlists and trash will be permanently deleted. This cannot be undone.",
      "Delete All",
      async () => {
        triggerHaptic("error");
        setNotes([]);
        setTrash([]);
        setPlaylists([]);
        await AsyncStorage.multiRemove(["@notes", "@trash", "@playlists"]);
      },
    );
  };

  const formatRelative = (iso) => {
    if (!iso) return "";
    const now = new Date();
    const d = new Date(iso);
    const dm = now - d;
    const min = Math.floor(dm / 60000);
    const hr = Math.floor(dm / 3600000);
    const day = Math.floor(dm / 86400000);
    if (min < 1) return "Just now";
    if (min < 60) return `${min}m ago`;
    if (hr < 24) return `${hr}h ago`;
    if (day === 1) return "Yesterday";
    if (day < 7) return `${day}d ago`;
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
    return `${months[d.getMonth()]} ${d.getDate()}`;
  };

  const formatShortDateTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const now = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    if (d.toDateString() === now.toDateString()) return `${h}:${m} ${ap}`;
    return `${mm}/${dd}/${d.getFullYear().toString().slice(-2)}`;
  };

  const countByCategory = (catId) => {
    if (catId === "all") return notes.length;
    return notes.filter((n) => n.categoryId === catId).length;
  };

  const currentCategory = filterMode === "tasks" ? "tasks" : activeCategory;
  const visiblePlaylists = playlists.filter(
    (p) => p.categoryId === currentCategory,
  );

  const filteredNotes = notes.filter((n) => {
    const ms =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    let mc = true;
    if (filterMode === "tasks") mc = n.categoryId === "tasks";
    else mc = activeCategory === "all" || n.categoryId === activeCategory;
    let mp = true;
    if (activePlaylist !== "all") mp = n.playlistId === activePlaylist;
    return ms && mc && mp;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    if (sortBy === "oldest")
      return new Date(a.updatedAt) - new Date(b.updatedAt);
    if (sortBy === "title") return a.title.localeCompare(b.title);
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const buildSections = (list) => {
    const now = new Date();
    const pinned = [],
      today = [],
      week = [],
      month = [],
      earlier = [];
    list.forEach((n) => {
      if (n.pinned) {
        pinned.push(n);
        return;
      }
      const d = new Date(n.updatedAt || n.createdAt);
      const days = (now - d) / (1000 * 60 * 60 * 24);
      if (d.toDateString() === now.toDateString()) today.push(n);
      else if (days <= 7) week.push(n);
      else if (days <= 30) month.push(n);
      else earlier.push(n);
    });
    const out = [];
    if (pinned.length) out.push({ title: "Pinned", data: pinned });
    if (today.length) out.push({ title: "Today", data: today });
    if (week.length) out.push({ title: "Previous 7 Days", data: week });
    if (month.length) out.push({ title: "Previous 30 Days", data: month });
    if (earlier.length) out.push({ title: "Earlier", data: earlier });
    return out;
  };

  const sections = buildSections(sortedNotes);
  const getCurrentTitle = () => {
    if (filterMode === "tasks") return "Tasks";
    const c = CATEGORIES.find((x) => x.id === activeCategory);
    return c ? c.label : "All Notes";
  };
  const pickerConfig = getPickerConfig();

  // ============ TRASH SCREEN ============
  if (screen === "trash") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={s.rootContainer}>
          <LinearGradient
            colors={BG_GRADIENT}
            locations={BG_GRADIENT_LOCATIONS}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.glowOrb1} />
          <View style={s.glowOrb2} />
          <SafeAreaView style={s.safeArea}>
            <StatusBar
              barStyle="light-content"
              translucent
              backgroundColor="transparent"
            />
            <NavHeader
              title="Trash"
              onBack={() => {
                triggerHaptic("light");
                setScreen("settings");
              }}
              rightIcon={trash.length > 0 ? "trash-outline" : undefined}
              onRightPress={emptyTrash}
              styles={s}
            />

            <FlatList
              data={trash}
              keyExtractor={(i) => i.id}
              contentContainerStyle={{ paddingTop: 16, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                trash.length > 0 ? (
                  <Text style={s.trashFooterText}>
                    Notes are automatically deleted after {TRASH_RETENTION_DAYS}{" "}
                    days
                  </Text>
                ) : null
              }
              renderItem={({ item }) => (
                <NoteRow
                  item={item}
                  styles={s}
                  fontScale={fontScale}
                  onPress={() => {}}
                  onDelete={() => deletePermanent(item.id)}
                  onRestore={() => restoreFromTrash(item.id)}
                  formatShortDateTime={formatRelative}
                  playlists={playlists}
                  isTrash
                />
              )}
              ListEmptyComponent={
                <View style={s.emptyContainer}>
                  <GlassCard style={s.emptyIconCircle} intensity={60} bordered>
                    <Ionicons
                      name="trash-outline"
                      size={40}
                      color={GLASS.textTertiary}
                    />
                  </GlassCard>
                  <Text style={s.emptyTitle}>Trash is Empty</Text>
                  <Text style={s.emptySubtitle}>
                    Deleted notes will appear here
                  </Text>
                </View>
              }
            />
          </SafeAreaView>
        </View>

        <ConfirmDialog
          dialog={confirmDialog}
          onCancel={closeConfirm}
          onConfirm={handleConfirm}
          styles={s}
        />
      </GestureHandlerRootView>
    );
  }

  // ============ SETTINGS ============
  if (screen === "settings") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={s.rootContainer}>
          <LinearGradient
            colors={BG_GRADIENT}
            locations={BG_GRADIENT_LOCATIONS}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.glowOrb1} />
          <View style={s.glowOrb2} />
          <SafeAreaView style={s.safeArea}>
            <StatusBar
              barStyle="light-content"
              translucent
              backgroundColor="transparent"
            />
            <NavHeader
              title="Settings"
              onBack={() => {
                triggerHaptic("light");
                setScreen("home");
              }}
              styles={s}
            />

            <ScrollView
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              <Text style={s.groupedHeader}>APPEARANCE</Text>
              <GlassCard style={s.groupedCard} intensity={45} bordered strong>
                <View style={s.settingBlockRow}>
                  <Text style={s.settingBlockLabel}>Theme</Text>
                  <View style={s.themeInfoRow}>
                    <Ionicons
                      name="moon-outline"
                      size={14}
                      color={GLASS.textTertiary}
                    />
                    <Text style={s.themeInfoText}>
                      Dark mode (locked for glass UI)
                    </Text>
                  </View>
                </View>
                <View
                  style={[
                    s.settingBlockRow,
                    {
                      borderTopWidth: 1,
                      borderTopColor: GLASS.divider,
                      paddingTop: 14,
                    },
                  ]}
                >
                  <Text style={s.settingBlockLabel}>Font Size</Text>
                  <View style={s.segmentRow}>
                    {FONT_SIZES.map((opt) => {
                      const active = fontSize === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[s.segmentBtn, active && s.segmentBtnActive]}
                          onPress={() => {
                            triggerHaptic("light");
                            setFontSize(opt.id);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              s.segmentBtnText,
                              active && {
                                fontWeight: "700",
                                fontSize: 13 * opt.scale,
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
              </GlassCard>

              <Text style={s.groupedHeader}>NOTES</Text>
              <GlassCard
                style={[s.groupedCard, { paddingVertical: 0 }]}
                intensity={45}
                bordered
                strong
              >
                <SettingRow
                  icon="swap-vertical"
                  iconColor="#3B82F6"
                  label="Sort By"
                  value={
                    (SORT_OPTIONS.find((o) => o.id === sortBy) || {}).label
                  }
                  onPress={() => openPicker("sort")}
                  styles={s}
                />
                <SettingRow
                  icon="color-palette"
                  iconColor="#A855F7"
                  label="Default Color"
                  value={
                    NOTE_COLORS.find((c) => c.id === defaultColorId)?.label
                  }
                  onPress={() => openPicker("color")}
                  styles={s}
                  isLast
                />
              </GlassCard>

              <Text style={s.groupedHeader}>SAFETY</Text>
              <GlassCard
                style={[s.groupedCard, { paddingVertical: 0 }]}
                intensity={45}
                bordered
                strong
              >
                <View style={[s.settingRow, s.settingRowBorder]}>
                  <View
                    style={[
                      s.settingIconContainer,
                      {
                        backgroundColor: "#F59E0B",
                        shadowColor: "#F59E0B",
                        shadowOpacity: 0.6,
                        shadowRadius: 8,
                      },
                    ]}
                  >
                    <Ionicons
                      name="shield-checkmark"
                      size={15}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={s.settingLabel}>Confirm Before Delete</Text>
                  <Switch
                    value={confirmDelete}
                    onValueChange={(v) => {
                      triggerHaptic("light");
                      setConfirmDelete(v);
                    }}
                    trackColor={{
                      false: "rgba(255,255,255,0.15)",
                      true: SUCCESS_GREEN,
                    }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="rgba(255,255,255,0.15)"
                  />
                </View>
                <SettingRow
                  icon="trash"
                  iconColor={DANGER_RED}
                  label="Trash"
                  badge={trash.length > 0 ? String(trash.length) : null}
                  onPress={() => {
                    triggerHaptic("light");
                    setScreen("trash");
                  }}
                  styles={s}
                />
                <SettingRow
                  icon="refresh"
                  iconColor={DANGER_RED}
                  label="Reset All Data"
                  onPress={resetAllData}
                  styles={s}
                  isLast
                  danger
                />
              </GlassCard>

              <Text style={s.groupedHeader}>ABOUT</Text>
              <GlassCard
                style={[s.groupedCard, { paddingVertical: 0 }]}
                intensity={45}
                bordered
                strong
              >
                <SettingRow
                  icon="information-circle"
                  iconColor="#38BDF8"
                  label="Version"
                  value="2.0.0"
                  styles={s}
                  isLast
                />
              </GlassCard>

              <Text style={s.madeWith}>Crafted with 💙 · Astra Glass</Text>
            </ScrollView>
          </SafeAreaView>
        </View>

        <OptionPickerModal
          visible={pickerVisible}
          title={pickerConfig.title}
          options={pickerConfig.options}
          selectedId={pickerConfig.selectedId}
          onSelect={handlePickerSelect}
          onClose={() => setPickerVisible(false)}
          styles={s}
        />

        <ConfirmDialog
          dialog={confirmDialog}
          onCancel={closeConfirm}
          onConfirm={handleConfirm}
          styles={s}
        />
      </GestureHandlerRootView>
    );
  }

  // ============ HOME ============
  if (screen === "home") {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={s.rootContainer}>
          <LinearGradient
            colors={BG_GRADIENT}
            locations={BG_GRADIENT_LOCATIONS}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.glowOrb1} />
          <View style={s.glowOrb2} />
          <View style={s.glowOrb3} />

          <SafeAreaView style={s.safeArea}>
            <StatusBar
              barStyle="light-content"
              translucent
              backgroundColor="transparent"
            />

            <View style={s.homeTopBar}>
              <TouchableOpacity
                style={s.topBarBtn}
                onPress={() => {
                  triggerHaptic("light");
                  setShowCategoryModal(true);
                }}
                activeOpacity={0.7}
              >
                <GlassCard style={s.topBarBtnInner} intensity={50} bordered>
                  <Ionicons name="grid-outline" size={19} color="#FFFFFF" />
                </GlassCard>
              </TouchableOpacity>

              <SegmentedControl
                mode={filterMode}
                onChange={(m) => {
                  setFilterMode(m);
                  setActivePlaylist("all");
                  if (m === "notes") setActiveCategory("all");
                }}
                styles={s}
              />

              <TouchableOpacity
                style={s.topBarBtn}
                onPress={() => {
                  triggerHaptic("light");
                  setViewMode(viewMode === "list" ? "grid" : "list");
                }}
                activeOpacity={0.7}
              >
                <GlassCard style={s.topBarBtnInner} intensity={50} bordered>
                  <Ionicons
                    name={viewMode === "list" ? "list-outline" : "grid-outline"}
                    size={19}
                    color="#FFFFFF"
                  />
                </GlassCard>
              </TouchableOpacity>
            </View>

            <View style={s.largeTitleWrap}>
              <Text
                style={[s.largeTitle, { fontSize: 36 * fontScale }]}
                numberOfLines={1}
              >
                {getCurrentTitle()}
              </Text>
              <Text style={s.largeTitleSub}>
                {filteredNotes.length}{" "}
                {filteredNotes.length === 1 ? "note" : "notes"}
              </Text>
            </View>

            <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
              <SearchBar value={search} onChangeText={setSearch} styles={s} />
            </View>

            {currentCategory !== "all" && (
              <View style={{ paddingBottom: 10 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
                >
                  <TouchableOpacity
                    style={[
                      s.playlistChip,
                      activePlaylist === "all" && s.playlistChipActive,
                    ]}
                    onPress={() => {
                      triggerHaptic("light");
                      setActivePlaylist("all");
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        s.playlistChipText,
                        activePlaylist === "all" && s.playlistChipTextActive,
                      ]}
                    >
                      All
                    </Text>
                  </TouchableOpacity>
                  {visiblePlaylists.map((p) => {
                    const active = activePlaylist === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        style={[
                          s.playlistChip,
                          active && {
                            backgroundColor: p.color + "30",
                            borderColor: p.color,
                            borderWidth: 1,
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic("light");
                          setActivePlaylist(p.id);
                        }}
                        onLongPress={() => handlePlaylistLongPress(p)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            s.playlistDot,
                            {
                              backgroundColor: active
                                ? p.color
                                : GLASS.textTertiary,
                              shadowColor: p.color,
                              shadowOpacity: active ? 0.9 : 0,
                              shadowRadius: 5,
                            },
                          ]}
                        />
                        <Text
                          style={[
                            s.playlistChipText,
                            active && { color: "#FFFFFF", fontWeight: "700" },
                          ]}
                        >
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    style={[
                      s.playlistChip,
                      { borderStyle: "dashed", borderColor: GLASS.border },
                    ]}
                    onPress={() => {
                      triggerHaptic("light");
                      openNewPlaylistModal();
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="add"
                      size={13}
                      color={GLASS.textSecondary}
                    />
                    <Text style={s.playlistChipText}>New</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            )}

            {viewMode === "list" ? (
              <SectionList
                sections={sections}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 4, paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={false}
                renderSectionHeader={({ section: { title } }) => (
                  <Text style={s.sectionTitle}>{title.toUpperCase()}</Text>
                )}
                renderItem={({ item }) => (
                  <NoteRow
                    item={item}
                    styles={s}
                    fontScale={fontScale}
                    onPress={() => openEdit(item)}
                    onDelete={() => requestDelete(item.id)}
                    onPin={() => togglePin(item.id)}
                    formatShortDateTime={formatShortDateTime}
                    playlists={playlists}
                  />
                )}
                ListEmptyComponent={
                  !loading ? (
                    <View style={s.emptyContainer}>
                      <GlassCard
                        style={s.emptyIconCircle}
                        intensity={60}
                        bordered
                      >
                        <Ionicons
                          name={search ? "search-outline" : "sparkles-outline"}
                          size={40}
                          color={GLASS.textTertiary}
                        />
                      </GlassCard>
                      <Text style={s.emptyTitle}>
                        {search
                          ? "No Results"
                          : filterMode === "tasks"
                            ? "No Tasks Yet"
                            : activePlaylist !== "all"
                              ? "No Notes Here"
                              : "Your Canvas is Empty"}
                      </Text>
                      <Text style={s.emptySubtitle}>
                        {search
                          ? "Try a different search term"
                          : activePlaylist !== "all"
                            ? "Add notes or switch playlist"
                            : "Tap the pencil button to get started"}
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
                columnWrapperStyle={{
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  marginBottom: 12,
                }}
                contentContainerStyle={{ paddingTop: 4, paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <NoteCard
                    item={item}
                    index={index}
                    styles={s}
                    fontScale={fontScale}
                    onPress={() => openEdit(item)}
                    onPin={() => togglePin(item.id)}
                    formatRelative={formatRelative}
                    playlists={playlists}
                  />
                )}
                ListEmptyComponent={
                  <View style={s.emptyContainer}>
                    <GlassCard
                      style={s.emptyIconCircle}
                      intensity={60}
                      bordered
                    >
                      <Ionicons
                        name={search ? "search-outline" : "sparkles-outline"}
                        size={40}
                        color={GLASS.textTertiary}
                      />
                    </GlassCard>
                    <Text style={s.emptyTitle}>
                      {search ? "No Results" : "Your Canvas is Empty"}
                    </Text>
                    <Text style={s.emptySubtitle}>
                      {search
                        ? "Try a different search term"
                        : "Tap the pencil button to get started"}
                    </Text>
                  </View>
                }
              />
            )}

            {!loading && (
              <FAB
                onPress={() => {
                  triggerHaptic("medium");
                  resetForm();
                  setScreen("add");
                }}
                styles={s}
              />
            )}
          </SafeAreaView>
        </View>

        {/* Category Modal */}
        <Modal
          visible={showCategoryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCategoryModal(false)}
        >
          <Pressable
            style={s.modalOverlay}
            onPress={() => setShowCategoryModal(false)}
          >
            <Pressable
              style={s.modalSheetWrap}
              onPress={(e) => e.stopPropagation()}
            >
              <GlassCard style={s.modalSheet} intensity={85} bordered strong>
                <View style={s.modalGrabber} />
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 12 }}
                  bounces={false}
                >
                  <Text style={s.modalSheetTitle}>Categories</Text>
                  <Text style={s.modalSheetSubtitle}>Organize your notes</Text>

                  <View style={s.modalGroupCard}>
                    {CATEGORIES.map((cat, idx) => {
                      const active =
                        activeCategory === cat.id && filterMode === "notes";
                      const isLast = idx === CATEGORIES.length - 1;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[s.modalRow, !isLast && s.modalRowBorder]}
                          onPress={() => {
                            triggerHaptic("light");
                            setFilterMode("notes");
                            setActiveCategory(cat.id);
                            setActivePlaylist("all");
                            setShowCategoryModal(false);
                          }}
                          activeOpacity={0.5}
                        >
                          <View
                            style={[
                              s.modalCatIcon,
                              {
                                backgroundColor: cat.color,
                                shadowColor: cat.glow,
                                shadowOpacity: 0.7,
                                shadowRadius: 10,
                                shadowOffset: { width: 0, height: 2 },
                              },
                            ]}
                          >
                            <Ionicons
                              name={cat.icon}
                              size={15}
                              color="#FFFFFF"
                            />
                          </View>
                          <Text style={s.modalRowText}>{cat.label}</Text>
                          <Text style={s.modalRowValue}>
                            {countByCategory(cat.id)}
                          </Text>
                          {active && (
                            <Ionicons
                              name="checkmark"
                              size={20}
                              color={CYBER_BLUE}
                              style={{ marginLeft: 4 }}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[
                      s.modalRow,
                      {
                        marginTop: 14,
                        borderRadius: 14,
                        backgroundColor: "rgba(255,255,255,0.05)",
                      },
                    ]}
                    onPress={() => {
                      triggerHaptic("light");
                      setShowCategoryModal(false);
                      setTimeout(() => setScreen("settings"), 200);
                    }}
                    activeOpacity={0.6}
                  >
                    <View
                      style={[
                        s.modalCatIcon,
                        { backgroundColor: GLASS.cardStrong },
                      ]}
                    >
                      <Ionicons
                        name="settings-outline"
                        size={15}
                        color="#FFFFFF"
                      />
                    </View>
                    <Text style={s.modalRowText}>Settings</Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={GLASS.textQuaternary}
                    />
                  </TouchableOpacity>
                </ScrollView>
              </GlassCard>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Playlist Modal */}
        <Modal
          visible={showPlaylistModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPlaylistModal(false)}
        >
          <Pressable
            style={s.modalOverlay}
            onPress={() => setShowPlaylistModal(false)}
          >
            <Pressable
              style={s.modalSheetWrap}
              onPress={(e) => e.stopPropagation()}
            >
              <GlassCard style={s.modalSheet} intensity={85} bordered strong>
                <View style={s.modalGrabber} />
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 12 }}
                >
                  <Text style={s.modalSheetTitle}>
                    {editingPlaylistId ? "Edit Playlist" : "New Playlist"}
                  </Text>
                  <Text style={s.modalSheetSubtitle}>
                    Organize your notes into playlists
                  </Text>

                  <View style={s.inputGlassWrap}>
                    <TextInput
                      style={s.playlistInput}
                      value={newPlaylistName}
                      onChangeText={setNewPlaylistName}
                      placeholder="Playlist Name"
                      placeholderTextColor={GLASS.textTertiary}
                      autoFocus
                      autoCorrect={false}
                      maxLength={30}
                    />
                  </View>

                  <Text
                    style={[
                      s.groupedHeader,
                      { paddingHorizontal: 0, marginTop: 20 },
                    ]}
                  >
                    COLOR
                  </Text>
                  <View style={s.playlistColorGrid}>
                    {PLAYLIST_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        style={[
                          s.playlistColorDot,
                          {
                            backgroundColor: c,
                            shadowColor: c,
                            shadowOpacity: newPlaylistColor === c ? 0.9 : 0.4,
                            shadowRadius: newPlaylistColor === c ? 12 : 6,
                            shadowOffset: { width: 0, height: 0 },
                          },
                          newPlaylistColor === c && {
                            borderColor: "#FFFFFF",
                            borderWidth: 2.5,
                            transform: [{ scale: 1.08 }],
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic("light");
                          setNewPlaylistColor(c);
                        }}
                        activeOpacity={0.7}
                      >
                        {newPlaylistColor === c && (
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#FFFFFF"
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={s.playlistModalActions}>
                    <TouchableOpacity
                      style={s.modalCancelBtn}
                      onPress={() => {
                        triggerHaptic("light");
                        setShowPlaylistModal(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={s.modalCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.modalPrimaryBtnWrap}
                      onPress={savePlaylistFromModal}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={["#38BDF8", "#3B82F6", "#6366F1"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={s.modalPrimaryBtn}
                      >
                        <Text style={s.modalPrimaryBtnText}>
                          {editingPlaylistId ? "Save" : "Create"}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </GlassCard>
            </Pressable>
          </Pressable>
        </Modal>

        <ConfirmDialog
          dialog={confirmDialog}
          onCancel={closeConfirm}
          onConfirm={handleConfirm}
          styles={s}
        />
      </GestureHandlerRootView>
    );
  }

  // ============ EDITOR ============
  const isEditing = screen === "edit";
  const palette = NOTE_COLORS[colorId];
  const editorPlaylists = playlists.filter((p) => p.categoryId === categoryId);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={s.rootContainer}>
        <LinearGradient
          colors={BG_GRADIENT}
          locations={BG_GRADIENT_LOCATIONS}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.glowOrb1} />
        <View style={s.glowOrb2} />

        <SafeAreaView style={s.safeArea}>
          <StatusBar
            barStyle="light-content"
            translucent
            backgroundColor="transparent"
          />
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={s.navHeader}>
              <View style={s.navHeaderLeft}>
                <TouchableOpacity
                  onPress={() => {
                    triggerHaptic("light");
                    resetForm();
                  }}
                  activeOpacity={0.6}
                  style={s.navBackBtn}
                >
                  <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
              <Text style={s.navTitle}>
                {isEditing ? "Edit Note" : "New Note"}
              </Text>
              <View style={s.navHeaderRight}>
                <TouchableOpacity onPress={handleSave} activeOpacity={0.6}>
                  <LinearGradient
                    colors={["#38BDF8", "#3B82F6"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={s.saveCheckBtn}
                  >
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.editorBodyWrap}>
              <GlassCard style={s.editorGlass} intensity={55} bordered strong>
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: palette.tint, opacity: 0.4 },
                  ]}
                />
                <ScrollView
                  contentContainerStyle={s.editorScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <TextInput
                    style={[s.editorTitle, { fontSize: 26 * fontScale }]}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Title"
                    placeholderTextColor={GLASS.textTertiary}
                    autoFocus={!isEditing}
                    autoCorrect={false}
                  />
                  <View style={s.editorDivider} />
                  <TextInput
                    style={[s.editorContent, { fontSize: 16 * fontScale }]}
                    value={content}
                    onChangeText={setContent}
                    placeholder="Start writing..."
                    placeholderTextColor={GLASS.textTertiary}
                    multiline
                    textAlignVertical="top"
                  />
                </ScrollView>
              </GlassCard>
            </View>

            <View style={s.editorToolbarWrap}>
              <GlassCard style={s.editorToolbar} intensity={70} bordered strong>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 4 }}
                >
                  <View style={s.toolbarSection}>
                    <Text style={s.toolbarLabel}>CATEGORY</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                    >
                      {CATEGORIES.filter((c) => c.id !== "all").map((cat) => {
                        const active = categoryId === cat.id;
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            style={[
                              s.toolbarPill,
                              active && {
                                backgroundColor: cat.color + "35",
                                borderColor: cat.color,
                                shadowColor: cat.glow,
                                shadowOpacity: 0.7,
                                shadowRadius: 10,
                                shadowOffset: { width: 0, height: 0 },
                              },
                            ]}
                            onPress={() => {
                              triggerHaptic("light");
                              setCategoryId(cat.id);
                              setPlaylistId(null);
                            }}
                            activeOpacity={0.7}
                          >
                            <Ionicons
                              name={cat.icon}
                              size={12}
                              color={active ? "#FFFFFF" : GLASS.textSecondary}
                            />
                            <Text
                              style={[
                                s.toolbarPillText,
                                active && {
                                  color: "#FFFFFF",
                                  fontWeight: "700",
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

                  <View style={s.toolbarSection}>
                    <Text style={s.toolbarLabel}>PLAYLIST</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 8, paddingRight: 8 }}
                    >
                      <TouchableOpacity
                        style={[
                          s.toolbarPill,
                          playlistId === null && {
                            backgroundColor: CYBER_BLUE + "35",
                            borderColor: CYBER_BLUE,
                            shadowColor: CYBER_BLUE,
                            shadowOpacity: 0.7,
                            shadowRadius: 10,
                          },
                        ]}
                        onPress={() => {
                          triggerHaptic("light");
                          setPlaylistId(null);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            s.toolbarPillText,
                            playlistId === null && {
                              color: "#FFFFFF",
                              fontWeight: "700",
                            },
                          ]}
                        >
                          None
                        </Text>
                      </TouchableOpacity>
                      {editorPlaylists.map((p) => {
                        const active = playlistId === p.id;
                        return (
                          <TouchableOpacity
                            key={p.id}
                            style={[
                              s.toolbarPill,
                              active && {
                                backgroundColor: p.color + "35",
                                borderColor: p.color,
                                shadowColor: p.color,
                                shadowOpacity: 0.7,
                                shadowRadius: 10,
                              },
                            ]}
                            onPress={() => {
                              triggerHaptic("light");
                              setPlaylistId(p.id);
                            }}
                            onLongPress={() => handlePlaylistLongPress(p)}
                            activeOpacity={0.7}
                          >
                            <View
                              style={[
                                s.playlistDot,
                                {
                                  backgroundColor: active
                                    ? p.color
                                    : GLASS.textTertiary,
                                },
                              ]}
                            />
                            <Text
                              style={[
                                s.toolbarPillText,
                                active && {
                                  color: "#FFFFFF",
                                  fontWeight: "700",
                                },
                              ]}
                            >
                              {p.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      <TouchableOpacity
                        style={[
                          s.toolbarPill,
                          { borderStyle: "dashed", borderColor: GLASS.border },
                        ]}
                        onPress={() => {
                          triggerHaptic("light");
                          openNewPlaylistModal();
                        }}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name="add"
                          size={12}
                          color={GLASS.textSecondary}
                        />
                        <Text style={s.toolbarPillText}>New</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>

                  <View style={s.toolbarSection}>
                    <Text style={s.toolbarLabel}>COLOR</Text>
                    <View style={s.editorColorRow}>
                      {NOTE_COLORS.map((c) => {
                        const active = colorId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[
                              s.editorColorDot,
                              { backgroundColor: c.tint },
                              active && {
                                borderColor: c.bar,
                                borderWidth: 2,
                                shadowColor: c.glow,
                                shadowOpacity: 0.8,
                                shadowRadius: 10,
                                shadowOffset: { width: 0, height: 0 },
                                transform: [{ scale: 1.08 }],
                              },
                            ]}
                            onPress={() => {
                              triggerHaptic("light");
                              setColorId(c.id);
                            }}
                            activeOpacity={0.7}
                          >
                            {active && (
                              <Ionicons
                                name="checkmark"
                                size={14}
                                color="#FFFFFF"
                              />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>
              </GlassCard>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>

      <Modal
        visible={showPlaylistModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPlaylistModal(false)}
      >
        <Pressable
          style={s.modalOverlay}
          onPress={() => setShowPlaylistModal(false)}
        >
          <Pressable
            style={s.modalSheetWrap}
            onPress={(e) => e.stopPropagation()}
          >
            <GlassCard style={s.modalSheet} intensity={85} bordered strong>
              <View style={s.modalGrabber} />
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 12 }}
              >
                <Text style={s.modalSheetTitle}>
                  {editingPlaylistId ? "Edit Playlist" : "New Playlist"}
                </Text>
                <Text style={s.modalSheetSubtitle}>
                  Organize your notes into playlists
                </Text>

                <View style={s.inputGlassWrap}>
                  <TextInput
                    style={s.playlistInput}
                    value={newPlaylistName}
                    onChangeText={setNewPlaylistName}
                    placeholder="Playlist Name"
                    placeholderTextColor={GLASS.textTertiary}
                    autoFocus
                    autoCorrect={false}
                    maxLength={30}
                  />
                </View>

                <Text
                  style={[
                    s.groupedHeader,
                    { paddingHorizontal: 0, marginTop: 20 },
                  ]}
                >
                  COLOR
                </Text>
                <View style={s.playlistColorGrid}>
                  {PLAYLIST_COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        s.playlistColorDot,
                        {
                          backgroundColor: c,
                          shadowColor: c,
                          shadowOpacity: newPlaylistColor === c ? 0.9 : 0.4,
                          shadowRadius: newPlaylistColor === c ? 12 : 6,
                          shadowOffset: { width: 0, height: 0 },
                        },
                        newPlaylistColor === c && {
                          borderColor: "#FFFFFF",
                          borderWidth: 2.5,
                          transform: [{ scale: 1.08 }],
                        },
                      ]}
                      onPress={() => {
                        triggerHaptic("light");
                        setNewPlaylistColor(c);
                      }}
                      activeOpacity={0.7}
                    >
                      {newPlaylistColor === c && (
                        <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={s.playlistModalActions}>
                  <TouchableOpacity
                    style={s.modalCancelBtn}
                    onPress={() => {
                      triggerHaptic("light");
                      setShowPlaylistModal(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={s.modalCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={s.modalPrimaryBtnWrap}
                    onPress={savePlaylistFromModal}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={["#38BDF8", "#3B82F6", "#6366F1"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={s.modalPrimaryBtn}
                    >
                      <Text style={s.modalPrimaryBtnText}>
                        {editingPlaylistId ? "Save" : "Create"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </GlassCard>
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmDialog
        dialog={confirmDialog}
        onCancel={closeConfirm}
        onConfirm={handleConfirm}
        styles={s}
      />
    </GestureHandlerRootView>
  );
}

// ============ Styles ============
const styles = StyleSheet.create({
  rootContainer: { flex: 1, backgroundColor: "#050816" },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? ANDROID_STATUS_BAR_HEIGHT : 0,
  },

  glowOrb1: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#0EA5E9",
    opacity: 0.28,
  },
  glowOrb2: {
    position: "absolute",
    bottom: 100,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "#3B82F6",
    opacity: 0.22,
  },
  glowOrb3: {
    position: "absolute",
    top: height * 0.4,
    right: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#6366F1",
    opacity: 0.18,
  },

  navHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 48,
    paddingHorizontal: 12,
  },
  navHeaderLeft: { width: 80, alignItems: "flex-start" },
  navHeaderRight: { width: 80, alignItems: "flex-end" },
  navBackBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  navTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  homeTopBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 6,
    gap: 12,
  },
  topBarBtn: { width: 42, height: 42 },
  topBarBtnInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },

  segmentWrapper: {
    flex: 1,
    maxWidth: 220,
    borderRadius: 14,
    alignSelf: "center",
  },
  segmentInner: { flexDirection: "row", padding: 3, gap: 2 },
  segment: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  segmentActive: {},
  segmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: GLASS.textSecondary,
    letterSpacing: -0.1,
  },
  segmentTextActive: { color: "#FFFFFF", fontWeight: "700" },

  largeTitleWrap: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 12 },
  largeTitle: { fontWeight: "800", color: "#FFFFFF", letterSpacing: -1.2 },
  largeTitleSub: {
    fontSize: 13,
    color: GLASS.textTertiary,
    marginTop: 2,
    fontWeight: "500",
    letterSpacing: -0.1,
  },

  searchContainer: { borderRadius: 14 },
  searchInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#FFFFFF",
    paddingVertical: 0,
    letterSpacing: -0.2,
  },

  playlistChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: GLASS.card,
    borderWidth: 1,
    borderColor: GLASS.borderSubtle,
  },
  playlistChipActive: {
    backgroundColor: CYBER_BLUE + "35",
    borderColor: CYBER_BLUE,
  },
  playlistChipText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: GLASS.textSecondary,
  },
  playlistChipTextActive: { color: "#FFFFFF", fontWeight: "700" },
  playlistDot: { width: 7, height: 7, borderRadius: 3.5 },
  playlistMiniDot: { width: 5, height: 5, borderRadius: 2.5 },

  sectionTitle: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 1,
    color: GLASS.textTertiary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },

  noteRowContainer: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 18,
    overflow: "hidden",
  },
  noteRowCard: { borderRadius: 18 },
  noteRowInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 68,
  },
  noteRowAccent: {
    width: 3.5,
    height: 32,
    borderRadius: 2,
    marginRight: 12,
  },
  noteRowLeft: { flex: 1 },
  noteRowTitle: {
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  noteRowMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  noteRowTime: {
    fontWeight: "500",
    color: GLASS.textTertiary,
    letterSpacing: -0.1,
  },
  noteRowPreview: {
    flex: 1,
    fontWeight: "400",
    color: GLASS.textTertiary,
    letterSpacing: -0.1,
  },
  dotSeparator: {
    width: 2.5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: GLASS.textQuaternary,
  },

  swipeDelete: {
    justifyContent: "center",
    alignItems: "center",
    width: 88,
    height: "100%",
    gap: 4,
  },
  swipeRestore: {
    justifyContent: "center",
    alignItems: "center",
    width: 88,
    height: "100%",
    gap: 4,
  },
  swipeActionText: {
    color: "#FFFFFF",
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: -0.1,
  },

  noteCard: { borderRadius: 20, overflow: "hidden" },
  noteCardInner: { padding: 14, minHeight: 148 },
  noteCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  colorDotSmall: { width: 7, height: 7, borderRadius: 3.5 },
  noteCardTitle: {
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 6,
    lineHeight: 20,
  },
  noteCardContent: { color: "rgba(255,255,255,0.7)", lineHeight: 17, flex: 1 },
  noteCardBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
  },
  noteCardDate: {
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    letterSpacing: -0.1,
  },

  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: 40,
    marginTop: 80,
  },
  emptyIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 22,
    overflow: "hidden",
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    color: GLASS.textTertiary,
    textAlign: "center",
    lineHeight: 20,
    letterSpacing: -0.1,
  },

  fab: {
    position: "absolute",
    bottom: 28,
    right: 20,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.7,
    shadowRadius: 20,
    elevation: 10,
  },
  fabInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },

  groupedHeader: {
    fontSize: 11.5,
    fontWeight: "700",
    letterSpacing: 1,
    color: GLASS.textTertiary,
    paddingHorizontal: 32,
    paddingTop: 24,
    paddingBottom: 8,
  },
  groupedCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    paddingVertical: 4,
    overflow: "hidden",
  },
  madeWith: {
    fontSize: 12,
    textAlign: "center",
    color: GLASS.textTertiary,
    marginTop: 32,
    letterSpacing: -0.1,
  },
  trashFooterText: {
    fontSize: 13,
    color: GLASS.textTertiary,
    textAlign: "center",
    paddingHorizontal: 32,
    paddingBottom: 16,
    lineHeight: 18,
    letterSpacing: -0.1,
  },

  settingBlockRow: { paddingHorizontal: 16, paddingVertical: 14 },
  settingBlockLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  themeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  themeInfoText: {
    fontSize: 12.5,
    color: GLASS.textTertiary,
    fontWeight: "500",
  },

  segmentRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 12,
    padding: 3,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentBtnActive: { backgroundColor: "rgba(56,189,248,0.35)" },
  segmentBtnText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: GLASS.textSecondary,
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    minHeight: 52,
  },
  settingRowBorder: { borderBottomWidth: 1, borderBottomColor: GLASS.divider },
  settingIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 15.5,
    fontWeight: "500",
    color: "#FFFFFF",
    flex: 1,
    letterSpacing: -0.3,
  },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingValue: {
    fontSize: 14.5,
    color: GLASS.textTertiary,
    letterSpacing: -0.2,
  },
  settingBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: GLASS.borderSubtle,
  },
  settingBadgeText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheetWrap: { paddingHorizontal: 8, paddingBottom: 8 },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 16,
    maxHeight: "85%",
    overflow: "hidden",
  },
  modalGrabber: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.35)",
    alignSelf: "center",
    marginBottom: 14,
  },
  modalSheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 4,
  },
  modalSheetSubtitle: {
    fontSize: 13,
    color: GLASS.textTertiary,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.1,
  },
  modalGroupCard: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    minHeight: 54,
  },
  modalRowBorder: { borderBottomWidth: 1, borderBottomColor: GLASS.divider },
  modalCatIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  modalRowText: {
    fontSize: 15.5,
    fontWeight: "500",
    color: "#FFFFFF",
    flex: 1,
    letterSpacing: -0.3,
  },
  modalRowValue: { fontSize: 14, color: GLASS.textTertiary, marginRight: 4 },

  pickerContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  pickerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.5,
    textAlign: "center",
    marginBottom: 4,
  },
  pickerMessage: {
    fontSize: 13,
    color: GLASS.textTertiary,
    textAlign: "center",
    marginBottom: 8,
  },
  pickerList: {
    marginTop: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  pickerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 52,
  },
  pickerRowBorder: { borderBottomWidth: 1, borderBottomColor: GLASS.divider },
  pickerRowText: {
    fontSize: 15.5,
    fontWeight: "500",
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },

  inputGlassWrap: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: GLASS.borderSubtle,
    overflow: "hidden",
  },
  playlistInput: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#FFFFFF",
    letterSpacing: -0.3,
  },
  playlistColorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    paddingVertical: 8,
  },
  playlistColorDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2.5,
    borderColor: "transparent",
  },
  playlistModalActions: { flexDirection: "row", gap: 10, marginTop: 24 },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: GLASS.borderSubtle,
  },
  modalCancelBtnText: {
    fontSize: 15.5,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  modalPrimaryBtnWrap: { flex: 1, borderRadius: 14, overflow: "hidden" },
  modalPrimaryBtn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  modalPrimaryBtnText: {
    fontSize: 15.5,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },

  saveCheckBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  editorBodyWrap: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  editorGlass: { flex: 1, borderRadius: 24, overflow: "hidden" },
  editorScroll: { padding: 22, paddingBottom: 40 },
  editorTitle: {
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.6,
    paddingVertical: 6,
  },
  editorDivider: {
    height: 1,
    backgroundColor: GLASS.divider,
    marginVertical: 12,
  },
  editorContent: {
    color: "rgba(255,255,255,0.85)",
    lineHeight: 24,
    paddingVertical: 6,
    letterSpacing: -0.2,
    minHeight: 200,
  },

  editorToolbarWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  editorToolbar: {
    borderRadius: 22,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  toolbarSection: { marginBottom: 12 },
  toolbarLabel: {
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 1,
    color: GLASS.textTertiary,
    marginBottom: 8,
  },
  toolbarPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: GLASS.borderSubtle,
  },
  toolbarPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: GLASS.textSecondary,
    letterSpacing: -0.1,
  },
  editorColorRow: { flexDirection: "row", gap: 10, paddingVertical: 4 },
  editorColorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },

  // ===== Confirm Dialog =====
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  confirmWrap: { width: "100%", maxWidth: 340 },
  confirmCard: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: GLASS.borderStrong,
  },
  confirmContent: {
    padding: 22,
    alignItems: "center",
  },
  confirmIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    textAlign: "center",
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 13.5,
    color: GLASS.textSecondary,
    textAlign: "center",
    lineHeight: 19,
    letterSpacing: -0.1,
    marginBottom: 22,
  },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  confirmBtnCancel: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: GLASS.borderSubtle,
  },
  confirmBtnCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
  confirmBtnPrimaryWrap: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  confirmBtnPrimaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});
