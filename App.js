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
  LayoutAnimation,
  UIManager,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  Swipeable,
  GestureHandlerRootView,
} from "react-native-gesture-handler";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = (width - 56) / 2;
const TRASH_RETENTION_DAYS = 30;
const ANDROID_STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? StatusBar.currentHeight || 24 : 0;

// ============ Background Gradient ============
const BG_GRADIENT = ["#050816", "#0A1440", "#1E3A8A", "#0EA5E9", "#0C4A6E"];
const BG_GRADIENT_LOCATIONS = [0, 0.25, 0.55, 0.8, 1];

// ============ Note Colors ============
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
const DANGER_RED = "#F43F5E";
const SUCCESS_GREEN = "#10B981";

// ============ Glass Tokens ============
const GLASS = {
  card: "rgba(255,255,255,0.08)",
  cardStrong: "rgba(255,255,255,0.12)",
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

// ============ LayoutAnimation Helper ============
const animateLayout = () => {
  LayoutAnimation.configureNext({
    duration: 260,
    create: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
    update: { type: LayoutAnimation.Types.easeInEaseOut },
    delete: {
      type: LayoutAnimation.Types.easeInEaseOut,
      property: LayoutAnimation.Properties.opacity,
    },
  });
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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
    }).start();

  return (
    <View style={styles.navHeader}>
      <View style={styles.navHeaderLeft}>
        {onBack ? (
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity
              onPress={onBack}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.7}
              style={styles.navBackBtn}
            >
              <Ionicons
                name="chevron-back"
                size={26}
                color={GLASS.textPrimary}
              />
            </TouchableOpacity>
          </Animated.View>
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
  const slideAnim = useRef(
    new Animated.Value(mode === "notes" ? 0 : 1),
  ).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: mode === "notes" ? 0 : 1,
      useNativeDriver: true,
      friction: 9,
      tension: 90,
    }).start();
  }, [mode]);

  return (
    <GlassCard style={styles.segmentWrapper} intensity={35} bordered>
      <View style={styles.segmentInner}>
        {/* Sliding gradient indicator */}
        <Animated.View
          style={[
            styles.segmentSlider,
            {
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 108],
                  }),
                },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(56,189,248,0.75)", "rgba(59,130,246,0.75)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <TouchableOpacity
          style={styles.segment}
          onPress={() => {
            triggerHaptic("light");
            onChange("notes");
          }}
          activeOpacity={0.7}
        >
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
          style={styles.segment}
          onPress={() => {
            triggerHaptic("light");
            onChange("tasks");
          }}
          activeOpacity={0.7}
        >
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

// ============ Note Row (FIXED + Animated) ============
function NoteRow({
  item,
  index,
  styles,
  fontScale,
  onPress,
  onDelete,
  onRestore,
  onPin,
  onToggleTask,
  formatShortDateTime,
  playlists,
  isTrash,
}) {
  const swipeRef = useRef(null);
  const palette = NOTE_COLORS[item.colorId ?? 0];
  const playlist = playlists.find((p) => p.id === item.playlistId);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        delay: (index || 0) * 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 350,
        delay: (index || 0) * 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Right swipe = Restore (only in trash) | Left swipe = Delete
  const renderLeftActions = () => {
    if (!isTrash) return null;
    return (
      <TouchableOpacity
        style={[styles.swipeRestore, { backgroundColor: SUCCESS_GREEN }]}
        onPress={() => {
          triggerHaptic("success");
          // Call restore FIRST, then close swipe
          onRestore?.();
          swipeRef.current?.close();
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
        onDelete?.();
        swipeRef.current?.close();
      }}
      activeOpacity={0.85}
    >
      <Ionicons name="trash" size={20} color="#FFFFFF" />
      <Text style={styles.swipeActionText}>{isTrash ? "Delete" : "Trash"}</Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View
      style={[
        styles.noteRowContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
        isTrash && { opacity: 0.75 },
      ]}
    >
      <Swipeable
        ref={swipeRef}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        overshootLeft={false}
        overshootRight={false}
        friction={2}
        leftThreshold={40}
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
                style={[
                  styles.noteRowTitle,
                  { fontSize: 16 * fontScale },
                  item.completed && styles.completedText,
                ]}
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
                      style={[styles.noteRowTime, { fontSize: 12 * fontScale }]}
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
            {!isTrash && item.categoryId === "tasks" ? (
              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onToggleTask?.();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginLeft: 4 }}
              >
                <Ionicons
                  name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                  size={18}
                  color={item.completed ? SUCCESS_GREEN : GLASS.textTertiary}
                />
              </TouchableOpacity>
            ) : null}
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
    </Animated.View>
  );
}

// ============ Note Card (Grid + Animated) ============
function NoteCard({
  item,
  index,
  styles,
  fontScale,
  onPress,
  onPin,
  onToggleTask,
  formatRelative,
  playlists,
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.94)).current;
  const palette = NOTE_COLORS[item.colorId ?? 0];
  const playlist = playlists.find((p) => p.id === item.playlistId);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 80,
        delay: index * 60,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        width: CARD_WIDTH,
      }}
    >
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
            {item.categoryId === "tasks" && (
              <TouchableOpacity
                onPress={(e) => {
                  e?.stopPropagation?.();
                  onToggleTask?.();
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={item.completed ? "checkmark-circle" : "ellipse-outline"}
                  size={17}
                  color={item.completed ? SUCCESS_GREEN : GLASS.textSecondary}
                />
              </TouchableOpacity>
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

// ============ FAB (with press animation) ============
function FAB({ onPress, styles }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () =>
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 40,
    }).start();
  const handlePressOut = () =>
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
    }).start();

  return (
    <Animated.View style={[styles.fab, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#38BDF8", "#3B82F6", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabInner}
        >
          <Ionicons name="add" size={30} color="#FFFFFF" />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ============ Confirm Dialog (Animated) ============
function ConfirmDialog({ dialog, onCancel, onConfirm, styles }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (dialog.visible) {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [dialog.visible]);

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
          <Animated.View
            style={[
              styles.confirmCard,
              { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
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
          </Animated.View>
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

// ============ Empty State (Minimal + Animated) ============
function EmptyState({ search, filterMode, activePlaylist, styles }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, [search, filterMode, activePlaylist]);

  let iconName = "documents-outline";
  if (search) iconName = "search-outline";
  else if (filterMode === "tasks") iconName = "checkbox-outline";
  else if (activePlaylist !== "all") iconName = "albums-outline";

  let message = "No notes here yet";
  if (search) message = "No results found";
  else if (filterMode === "tasks") message = "No tasks here yet";
  else if (activePlaylist !== "all") message = "This playlist is empty";

  return (
    <Animated.View
      style={[
        styles.emptyContainer,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Ionicons name={iconName} size={84} color="rgba(96,165,250,0.16)" />
      <Text style={styles.emptyText}>{message}</Text>
    </Animated.View>
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
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [undoState, setUndoState] = useState(null);

  const s = styles;
  const haptic = (type = "light") => {
    if (hapticsEnabled) triggerHaptic(type);
  };
  const animate = () => {
    if (animationsEnabled) animateLayout();
  };
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
        hapticsEnabled,
        animationsEnabled,
      });
  }, [
    fontSize,
    sortBy,
    confirmDelete,
    defaultColorId,
    viewMode,
    hapticsEnabled,
    animationsEnabled,
  ]);

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
        if (typeof o.hapticsEnabled === "boolean")
          setHapticsEnabled(o.hapticsEnabled);
        if (typeof o.animationsEnabled === "boolean")
          setAnimationsEnabled(o.animationsEnabled);
      }
    } catch (e) {}
  };
  const saveSettings = async (o) => {
    try {
      await AsyncStorage.setItem("@settings", JSON.stringify(o));
    } catch (e) {}
  };

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
  const closeConfirm = () =>
    setConfirmDialog((prev) => ({ ...prev, visible: false }));
  const handleConfirm = () => {
    haptic("warning");
    const cb = confirmDialog.onConfirm;
    closeConfirm();
    setTimeout(() => {
      if (cb) cb();
    }, 200);
  };

  const openPicker = (type) => {
    haptic("light");
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
      haptic("warning");
      return;
    }
    const target =
      filterMode === "tasks"
        ? "tasks"
        : activeCategory !== "all"
          ? activeCategory
          : categoryId;
    animate();
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
    haptic("success");
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
        haptic("error");
        animate();
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
    haptic("medium");
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

  const commitTags = () => {
    const incoming = tagInput
      .split(",")
      .map((t) => t.trim().replace(/^#/, "").toLowerCase())
      .filter(Boolean);
    if (incoming.length) {
      setTags((prev) =>
        Array.from(new Set([...prev, ...incoming])).slice(0, 10),
      );
      setTagInput("");
    }
  };

  const removeTag = (tag) => setTags((prev) => prev.filter((t) => t !== tag));

  const handleSave = () => {
    if (title.trim() === "" && content.trim() === "") {
      haptic("warning");
      openConfirm(
        "Empty Note",
        "Please write something before saving.",
        "OK",
        () => {},
        false,
      );
      return;
    }
    haptic("success");
    animate();
    const now = new Date().toISOString();
    if (editingId) {
      setNotes(
        notes.map((n) =>
          n.id === editingId
            ? {
                ...n,
                title: title || "Untitled",
                content,
                colorId,
                categoryId,
                playlistId,
                tags,
                completed: categoryId === "tasks" ? completed : false,
                updatedAt: now,
              }
            : n,
        ),
      );
    } else {
      setNotes([
        {
          id: Date.now().toString(),
          title: title || "Untitled",
          content,
          colorId,
          categoryId,
          playlistId,
          tags,
          completed: categoryId === "tasks" ? completed : false,
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
    setTags([]);
    setTagInput("");
    setCompleted(false);
    setScreen("home");
  };
  const openEdit = (note) => {
    haptic("light");
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
    setColorId(note.colorId ?? 0);
    setCategoryId(note.categoryId ?? "personal");
    setPlaylistId(note.playlistId ?? null);
    setTags(Array.isArray(note.tags) ? note.tags : []);
    setTagInput("");
    setCompleted(!!note.completed);
    setScreen("edit");
  };
  const moveToTrash = (id) => {
    haptic("warning");
    animate();
    const n = notes.find((x) => x.id === id);
    if (!n) return;
    const deleted = { ...n, deletedAt: new Date().toISOString() };
    setNotes(notes.filter((x) => x.id !== id));
    setTrash([deleted, ...trash]);
    setUndoState({ item: n });
    setTimeout(() => {
      setUndoState((prev) => (prev?.item?.id === id ? null : prev));
    }, 3500);
  };

  const undoLastTrash = () => {
    if (!undoState?.item) return;
    const item = undoState.item;
    setTrash((prev) => prev.filter((x) => x.id !== item.id));
    setNotes((prev) => [item, ...prev]);
    setUndoState(null);
    haptic("success");
  };

  const toggleTask = (id) => {
    haptic("light");
    animate();
    setNotes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              completed: !n.completed,
              updatedAt: new Date().toISOString(),
            }
          : n,
      ),
    );
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
    haptic("light");
    animate();
    setNotes(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };
  const restoreFromTrash = (id) => {
    haptic("success");
    animate();
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
        haptic("error");
        animate();
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
        haptic("error");
        animate();
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
        haptic("error");
        animate();
        setNotes([]);
        setTrash([]);
        setPlaylists([]);
        await AsyncStorage.multiRemove(["@notes", "@trash", "@playlists"]);
      },
    );
  };

  const buildBackup = () => ({
    app: "Astra Glass Notes",
    version: "2.2.0",
    schemaVersion: 2,
    exportedAt: new Date().toISOString(),
    notes,
    trash,
    playlists,
    settings: {
      fontSize,
      sortBy,
      confirmDelete,
      defaultColorId,
      viewMode,
      hapticsEnabled,
      animationsEnabled,
    },
  });

  const exportBackup = async () => {
    try {
      haptic("success");
      const json = JSON.stringify(buildBackup(), null, 2);
      const safeDate = new Date().toISOString().replace(/[:.]/g, "-");
      const uri = `${FileSystem.cacheDirectory}Astra-Backup-${safeDate}.json`;
      await FileSystem.writeAsStringAsync(uri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/json",
          dialogTitle: "Export Astra Backup",
        });
      } else {
        await Share.share({ title: "Astra Backup", message: json });
      }
    } catch (e) {
      openConfirm(
        "Backup Failed",
        "Astra could not create the backup file. Your current data is unchanged.",
        "OK",
        () => {},
        false,
      );
    }
  };

  const importBackupFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;
      const json = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      await restoreBackupFromText(json);
    } catch (e) {
      openConfirm(
        "Import Failed",
        "The selected backup could not be read.",
        "OK",
        () => {},
        false,
      );
    }
  };

  const restoreBackupFromText = async (json) => {
    try {
      const data = JSON.parse(json);
      if (
        !data ||
        !Array.isArray(data.notes) ||
        !Array.isArray(data.trash) ||
        !Array.isArray(data.playlists)
      )
        throw new Error("Invalid backup");
      openConfirm(
        "Restore Backup?",
        `This will replace your current notes, trash and playlists with the backup from ${data.exportedAt ? new Date(data.exportedAt).toLocaleString() : "an unknown date"}.`,
        "Restore",
        async () => {
          const nextSettings = data.settings || {};
          setNotes(data.notes);
          setTrash(data.trash);
          setPlaylists(data.playlists);
          if (nextSettings.fontSize) setFontSize(nextSettings.fontSize);
          if (nextSettings.sortBy) setSortBy(nextSettings.sortBy);
          if (typeof nextSettings.confirmDelete === "boolean")
            setConfirmDelete(nextSettings.confirmDelete);
          if (typeof nextSettings.defaultColorId === "number")
            setDefaultColorId(nextSettings.defaultColorId);
          if (nextSettings.viewMode) setViewMode(nextSettings.viewMode);
          if (typeof nextSettings.hapticsEnabled === "boolean")
            setHapticsEnabled(nextSettings.hapticsEnabled);
          if (typeof nextSettings.animationsEnabled === "boolean")
            setAnimationsEnabled(nextSettings.animationsEnabled);
          await AsyncStorage.multiSet([
            ["@notes", JSON.stringify(data.notes)],
            ["@trash", JSON.stringify(data.trash)],
            ["@playlists", JSON.stringify(data.playlists)],
          ]);
          haptic("success");
        },
        false,
      );
    } catch (e) {
      openConfirm(
        "Invalid Backup",
        "This file is not a valid Astra backup.",
        "OK",
        () => {},
        false,
      );
    }
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
      n.content.toLowerCase().includes(search.toLowerCase()) ||
      (Array.isArray(n.tags) &&
        n.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase())));
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
                haptic("light");
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
              renderItem={({ item, index }) => (
                <NoteRow
                  item={item}
                  index={index}
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
                  <Ionicons
                    name="trash-outline"
                    size={84}
                    color="rgba(96,165,250,0.16)"
                  />
                  <Text style={s.emptyText}>Trash is empty</Text>
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
                haptic("light");
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
                            haptic("light");
                            animate();
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
                      haptic("light");
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
                    haptic("light");
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

              <Text style={s.groupedHeader}>DATA & EXPERIENCE</Text>
              <GlassCard
                style={[s.groupedCard, { paddingVertical: 0 }]}
                intensity={45}
                bordered
                strong
              >
                <SettingRow
                  icon="download-outline"
                  iconColor="#38BDF8"
                  label="Export Backup"
                  value="JSON"
                  onPress={exportBackup}
                  styles={s}
                />
                <SettingRow
                  icon="cloud-upload-outline"
                  iconColor="#10B981"
                  label="Import Backup"
                  value="JSON file"
                  onPress={importBackupFile}
                  styles={s}
                />
                <View style={[s.settingRow, s.settingRowBorder]}>
                  <View
                    style={[
                      s.settingIconContainer,
                      { backgroundColor: "#06B6D4", shadowColor: "#06B6D4" },
                    ]}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
                      size={15}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={s.settingLabel}>Haptic Feedback</Text>
                  <Switch
                    value={hapticsEnabled}
                    onValueChange={setHapticsEnabled}
                    trackColor={{
                      false: "rgba(255,255,255,0.15)",
                      true: SUCCESS_GREEN,
                    }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="rgba(255,255,255,0.15)"
                  />
                </View>
                <View style={s.settingRow}>
                  <View
                    style={[
                      s.settingIconContainer,
                      { backgroundColor: "#A855F7", shadowColor: "#A855F7" },
                    ]}
                  >
                    <Ionicons
                      name="sparkles-outline"
                      size={15}
                      color="#FFFFFF"
                    />
                  </View>
                  <Text style={s.settingLabel}>Animations</Text>
                  <Switch
                    value={animationsEnabled}
                    onValueChange={setAnimationsEnabled}
                    trackColor={{
                      false: "rgba(255,255,255,0.15)",
                      true: SUCCESS_GREEN,
                    }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="rgba(255,255,255,0.15)"
                  />
                </View>
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
                  value="2.1.0"
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
                  haptic("light");
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
                  animate();
                  setFilterMode(m);
                  setActivePlaylist("all");
                  if (m === "notes") setActiveCategory("all");
                }}
                styles={s}
              />
              <TouchableOpacity
                style={s.topBarBtn}
                onPress={() => {
                  haptic("light");
                  animate();
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
                      haptic("light");
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
                          haptic("light");
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
                      haptic("light");
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
                renderItem={({ item, index }) => (
                  <NoteRow
                    item={item}
                    index={index}
                    styles={s}
                    fontScale={fontScale}
                    onPress={() => openEdit(item)}
                    onDelete={() => requestDelete(item.id)}
                    onPin={() => togglePin(item.id)}
                    onToggleTask={() => toggleTask(item.id)}
                    formatShortDateTime={formatShortDateTime}
                    playlists={playlists}
                  />
                )}
                ListEmptyComponent={
                  !loading ? (
                    <EmptyState
                      search={search}
                      filterMode={filterMode}
                      activePlaylist={activePlaylist}
                      styles={s}
                    />
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
                    onToggleTask={() => toggleTask(item.id)}
                    formatRelative={formatRelative}
                    playlists={playlists}
                  />
                )}
                ListEmptyComponent={
                  <EmptyState
                    search={search}
                    filterMode={filterMode}
                    activePlaylist={activePlaylist}
                    styles={s}
                  />
                }
              />
            )}

            {undoState && (
              <GlassCard style={s.undoBar} intensity={85} bordered strong>
                <Ionicons name="arrow-undo" size={18} color={CYBER_BLUE} />
                <Text style={s.undoText}>Moved to Trash</Text>
                <TouchableOpacity onPress={undoLastTrash} activeOpacity={0.7}>
                  <Text style={s.undoAction}>UNDO</Text>
                </TouchableOpacity>
              </GlassCard>
            )}

            {!loading && (
              <FAB
                onPress={() => {
                  haptic("medium");
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
          animationType="slide"
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
                            haptic("light");
                            animate();
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
                      haptic("light");
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
          animationType="slide"
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
                          haptic("light");
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
                        haptic("light");
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
                    haptic("light");
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
                  <View style={{ marginTop: 18 }}>
                    <Text style={s.toolbarLabel}>TAGS</Text>
                    <View style={s.tagInputRow}>
                      <TextInput
                        style={s.tagInput}
                        value={tagInput}
                        onChangeText={setTagInput}
                        onSubmitEditing={commitTags}
                        placeholder="Add tags, comma separated"
                        placeholderTextColor={GLASS.textTertiary}
                        autoCapitalize="none"
                        returnKeyType="done"
                      />
                      <TouchableOpacity
                        style={s.tagAddBtn}
                        onPress={commitTags}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                    {tags.length > 0 && (
                      <View style={s.tagWrap}>
                        {tags.map((tag) => (
                          <TouchableOpacity
                            key={tag}
                            style={s.tagChip}
                            onPress={() => removeTag(tag)}
                            activeOpacity={0.7}
                          >
                            <Text style={s.tagChipText}>#{tag}</Text>
                            <Ionicons
                              name="close"
                              size={12}
                              color={GLASS.textSecondary}
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </ScrollView>
              </GlassCard>
            </View>

            <View style={s.editorToolbarWrap}>
              <GlassCard style={s.editorToolbar} intensity={70} bordered strong>
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 4 }}
                >
                  {categoryId === "tasks" && (
                    <View style={s.toolbarSection}>
                      <Text style={s.toolbarLabel}>TASK STATUS</Text>
                      <TouchableOpacity
                        style={[
                          s.taskStatusPill,
                          completed && s.taskStatusPillDone,
                        ]}
                        onPress={() => setCompleted((v) => !v)}
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={
                            completed ? "checkmark-circle" : "ellipse-outline"
                          }
                          size={16}
                          color={
                            completed ? SUCCESS_GREEN : GLASS.textSecondary
                          }
                        />
                        <Text style={s.toolbarPillText}>
                          {completed ? "Completed" : "Pending"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
                              haptic("light");
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
                          haptic("light");
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
                              haptic("light");
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
                          haptic("light");
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
                              haptic("light");
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
        animationType="slide"
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
                        haptic("light");
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
                      haptic("light");
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
  segmentInner: {
    flexDirection: "row",
    padding: 3,
    gap: 0,
    position: "relative",
    overflow: "hidden",
    borderRadius: 11,
  },
  segmentSlider: {
    position: "absolute",
    top: 3,
    bottom: 3,
    left: 3,
    width: 108,
    borderRadius: 9,
    overflow: "hidden",
  },
  segment: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 2,
  },
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
  noteRowAccent: { width: 3.5, height: 32, borderRadius: 2, marginRight: 12 },
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
    justifyContent: "center",
    paddingHorizontal: 40,
    marginTop: 120,
  },
  emptyText: {
    marginTop: 18,
    fontSize: 15,
    color: GLASS.textTertiary,
    fontWeight: "400",
    letterSpacing: -0.1,
    textAlign: "center",
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
    width: 60,
    height: 60,
    borderRadius: 30,
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
  completedText: {
    textDecorationLine: "line-through",
    opacity: 0.55,
  },
  undoBar: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 92,
    minHeight: 52,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
    zIndex: 20,
  },
  undoText: {
    flex: 1,
    color: GLASS.textPrimary,
    fontSize: 13,
    fontWeight: "600",
  },
  undoAction: {
    color: CYBER_BLUE,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  tagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  tagInput: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: "rgba(255,255,255,0.05)",
    paddingHorizontal: 12,
    color: GLASS.textPrimary,
    fontSize: 13,
  },
  tagAddBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: CYBER_BLUE,
  },
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 9,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(56,189,248,0.35)",
    backgroundColor: "rgba(56,189,248,0.12)",
  },
  tagChipText: {
    color: GLASS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
  },
  taskStatusPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GLASS.border,
    backgroundColor: GLASS.card,
  },
  taskStatusPillDone: {
    borderColor: SUCCESS_GREEN,
    backgroundColor: "rgba(16,185,129,0.12)",
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
  confirmContent: { padding: 22, alignItems: "center" },
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
  confirmActions: { flexDirection: "row", gap: 10, width: "100%" },
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
