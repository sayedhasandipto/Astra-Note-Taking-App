import { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 52) / 2;

// ============ Premium Pastel Palette ============
const NOTE_COLORS = [
  {
    id: 0,
    bg: "#F5D5D5",
    darkBg: "#3A2525",
    bar: "#E8A5A5",
    label: "Rose",
  },
  {
    id: 1,
    bg: "#F5E6B8",
    darkBg: "#3A3325",
    bar: "#E8CC7A",
    label: "Honey",
  },
  {
    id: 2,
    bg: "#D4E8D4",
    darkBg: "#253A25",
    bar: "#9ECB9E",
    label: "Mint",
  },
  {
    id: 3,
    bg: "#D5E4F0",
    darkBg: "#25303A",
    bar: "#9EC2DC",
    label: "Sky",
  },
  {
    id: 4,
    bg: "#DDD5F0",
    darkBg: "#2E253A",
    bar: "#B5A5DB",
    label: "Lilac",
  },
  {
    id: 5,
    bg: "#F5DDD0",
    darkBg: "#3A2E25",
    bar: "#E8B79E",
    label: "Peach",
  },
];

// ============ iOS Blue Gradient ============
const IOS_BLUE = ["#0A84FF", "#0066CC"];
const IOS_BLUE_SOLID = "#0A84FF";

// ============ Themes ============
const lightTheme = {
  bg: "#F5F3EE",
  bgElevated: "#FFFFFF",
  card: "#FFFFFF",
  text: "#1A1A1A",
  subText: "#6B6B6B",
  hint: "#A0A0A0",
  border: "rgba(0,0,0,0.06)",
  searchBg: "#FFFFFF",
  searchBorder: "rgba(0,0,0,0.05)",
  iconBg: "rgba(0,0,0,0.05)",
  iconColor: "#1A1A1A",
  chipBg: "#EAE6DD",
  divider: "rgba(0,0,0,0.08)",
  emptyIconBg: "rgba(0,0,0,0.05)",
};

const darkTheme = {
  bg: "#0F0F0F",
  bgElevated: "#1C1C1E",
  card: "#1C1C1E",
  text: "#F5F5F5",
  subText: "#A0A0A0",
  hint: "#666666",
  border: "rgba(255,255,255,0.08)",
  searchBg: "#1C1C1E",
  searchBorder: "rgba(255,255,255,0.05)",
  iconBg: "rgba(255,255,255,0.08)",
  iconColor: "#F5F5F5",
  chipBg: "#252525",
  divider: "rgba(255,255,255,0.08)",
  emptyIconBg: "rgba(255,255,255,0.05)",
};

export default function App() {
  const [screen, setScreen] = useState("home");
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [colorId, setColorId] = useState(0);
  const [isDark, setIsDark] = useState(false);

  const theme = isDark ? darkTheme : lightTheme;
  const styles = getStyles(theme, isDark);

  // ============ Load & Save ============
  useEffect(() => {
    loadNotes();
    loadTheme();
  }, []);

  useEffect(() => {
    saveNotes(notes);
  }, [notes]);

  useEffect(() => {
    saveTheme(isDark);
  }, [isDark]);

  const loadNotes = async () => {
    try {
      const stored = await AsyncStorage.getItem("@notes");
      if (stored !== null) setNotes(JSON.parse(stored));
    } catch (e) {
      console.log("Load error:", e);
    }
  };

  const saveNotes = async (data) => {
    try {
      await AsyncStorage.setItem("@notes", JSON.stringify(data));
    } catch (e) {
      console.log("Save error:", e);
    }
  };

  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem("@dark");
      if (stored !== null) setIsDark(JSON.parse(stored));
    } catch (e) {
      console.log("Theme error:", e);
    }
  };

  const saveTheme = async (val) => {
    try {
      await AsyncStorage.setItem("@dark", JSON.stringify(val));
    } catch (e) {}
  };

  // ============ Actions ============
  const handleSave = () => {
    if (title.trim() === "") {
      Alert.alert("শিরোনাম দিন", "নোটের একটা শিরোনাম দিতে হবে।");
      return;
    }

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
    setColorId(0);
    setScreen("home");
  };

  const openEdit = (note) => {
    setTitle(note.title);
    setContent(note.content);
    setEditingId(note.id);
    setColorId(note.colorId ?? 0);
    setScreen("edit");
  };

  const confirmDelete = (id) => {
    Alert.alert("নোট মুছবেন?", "এই নোটটা পুরোপুরি মুছে যাবে।", [
      { text: "বাতিল", style: "cancel" },
      {
        text: "মুছুন",
        style: "destructive",
        onPress: () => setNotes(notes.filter((n) => n.id !== id)),
      },
    ]);
  };

  const togglePin = (id) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)));
  };

  // ============ Relative Time ============
  const formatRelative = (isoString) => {
    if (!isoString) return "";
    const now = new Date();
    const d = new Date(isoString);
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "এখনই";
    if (diffMin < 60) return `${diffMin} মিনিট আগে`;
    if (diffHr < 24) return `${diffHr} ঘণ্টা আগে`;
    if (diffDay === 1) return "গতকাল";
    if (diffDay < 7) return `${diffDay} দিন আগে`;

    const day = d.getDate();
    const monthNames = [
      "জানু",
      "ফেব",
      "মার্চ",
      "এপ্রি",
      "মে",
      "জুন",
      "জুল",
      "আগ",
      "সেপ",
      "অক্টো",
      "নভে",
      "ডিসে",
    ];
    return `${day} ${monthNames[d.getMonth()]}`;
  };

  // ============ Greeting ============
  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 5) return "শুভ রাত্রি";
    if (h < 12) return "শুভ সকাল";
    if (h < 17) return "শুভ দুপুর";
    if (h < 20) return "শুভ সন্ধ্যা";
    return "শুভ রাত্রি";
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase()),
  );

  // Sort: pinned first, then by updatedAt
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const pinnedNotes = sortedNotes.filter((n) => n.pinned);
  const regularNotes = sortedNotes.filter((n) => !n.pinned);

  // ============ HOME SCREEN ============
  if (screen === "home") {
    const today = new Date();
    const dayNames = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র", "শনি"];
    const monthNames = [
      "জানু",
      "ফেব",
      "মার্চ",
      "এপ্রি",
      "মে",
      "জুন",
      "জুল",
      "আগ",
      "সেপ",
      "অক্টো",
      "নভে",
      "ডিসে",
    ];
    const dateStr = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]}`;

    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={theme.bg}
        />

        <FlatList
          data={sortedNotes}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Top bar: date + theme toggle */}
              <View style={styles.topBar}>
                <Text style={styles.dateText}>{dateStr}</Text>
                <TouchableOpacity
                  style={styles.themeBtn}
                  onPress={() => setIsDark(!isDark)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={isDark ? "sunny" : "moon"}
                    size={18}
                    color={theme.iconColor}
                  />
                </TouchableOpacity>
              </View>

              {/* Greeting */}
              <View style={styles.greetingWrap}>
                <Text style={styles.greetingSmall}>{getGreeting()},</Text>
                <Text style={styles.greetingBold}>
                  আপনার নোটগুলো{"\n"}এখানে আছে ✨
                </Text>
              </View>

              {/* Search */}
              <View style={styles.searchWrap}>
                <Ionicons name="search" size={18} color={theme.hint} />
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="নোট খুঁজুন..."
                  placeholderTextColor={theme.hint}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={theme.hint}
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* Pinned Section Header */}
              {pinnedNotes.length > 0 && (
                <View style={styles.sectionHeader}>
                  <Ionicons name="bookmark" size={14} color={theme.subText} />
                  <Text style={styles.sectionTitle}>পিন করা</Text>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => {
            const palette = NOTE_COLORS[item.colorId ?? 0];
            const cardBg = isDark ? palette.darkBg : palette.bg;
            return (
              <TouchableOpacity
                style={[styles.noteCard, { backgroundColor: cardBg }]}
                onPress={() => openEdit(item)}
                onLongPress={() => confirmDelete(item.id)}
                activeOpacity={0.85}
              >
                <View style={styles.cardTop}>
                  <View
                    style={[
                      styles.colorDotSmall,
                      { backgroundColor: palette.bar },
                    ]}
                  />
                  <TouchableOpacity
                    onPress={() => togglePin(item.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons
                      name={item.pinned ? "bookmark" : "bookmark-outline"}
                      size={16}
                      color={item.pinned ? palette.bar : "rgba(0,0,0,0.2)"}
                    />
                  </TouchableOpacity>
                </View>

                <Text
                  style={[styles.cardTitle, isDark && { color: "#F5F5F5" }]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>

                {item.content ? (
                  <Text
                    style={[
                      styles.cardContent,
                      isDark && { color: "rgba(255,255,255,0.6)" },
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
                      isDark && { color: "rgba(255,255,255,0.4)" },
                    ]}
                  >
                    {formatRelative(item.updatedAt || item.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Ionicons
                  name={search ? "search-outline" : "sparkles-outline"}
                  size={40}
                  color={theme.hint}
                />
              </View>
              <Text style={styles.emptyTitle}>
                {search ? "কিছু পাওয়া যায়নি" : "এখনো কোনো নোট নেই"}
              </Text>
              <Text style={styles.emptyText}>
                {search
                  ? "অন্য কিছু লিখে খুঁজুন"
                  : "নিচের + চেপে প্রথম নোট তৈরি করুন"}
              </Text>
            </View>
          }
        />

        {/* Gradient FAB */}
        <TouchableOpacity
          style={styles.fabWrap}
          onPress={() => {
            resetForm();
            setScreen("add");
          }}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={IOS_BLUE}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fab}
          >
            <Ionicons name="add" size={32} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // ============ ADD / EDIT SCREEN ============
  const isEditing = screen === "edit";
  const palette = NOTE_COLORS[colorId];
  const headerBg = isDark ? palette.darkBg : palette.bg;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: headerBg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={headerBg}
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.editorHeader}>
          <TouchableOpacity
            style={styles.editorIconBtn}
            onPress={resetForm}
            activeOpacity={0.6}
          >
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.editorHeaderTitle}>
            {isEditing ? "এডিট করুন" : "নতুন নোট"}
          </Text>
          <TouchableOpacity
            style={styles.editorIconBtn}
            onPress={handleSave}
            activeOpacity={0.6}
          >
            <Ionicons name="checkmark" size={26} color={IOS_BLUE_SOLID} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <View style={styles.editorBody}>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="শিরোনাম"
            placeholderTextColor={theme.hint}
            autoFocus={!isEditing}
          />
          <TextInput
            style={styles.contentInput}
            value={content}
            onChangeText={setContent}
            placeholder="লেখা শুরু করুন..."
            placeholderTextColor={theme.hint}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Bottom Bar: Colors + Save */}
        <View
          style={[
            styles.bottomBar,
            {
              backgroundColor: theme.bgElevated,
              borderTopColor: theme.divider,
            },
          ]}
        >
          <Text style={styles.pickerLabel}>রঙ</Text>
          <View style={styles.colorRow}>
            {NOTE_COLORS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.colorDot,
                  { backgroundColor: c.bg },
                  colorId === c.id && {
                    borderWidth: 3,
                    borderColor: theme.text,
                  },
                ]}
                onPress={() => setColorId(c.id)}
                activeOpacity={0.7}
              >
                {colorId === c.id && (
                  <Ionicons name="checkmark" size={16} color={theme.text} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.saveBtnWrap}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={IOS_BLUE}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveBtn}
            >
              <Ionicons
                name={isEditing ? "checkmark-done" : "add-circle-outline"}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.saveBtnText}>
                {isEditing ? "আপডেট করুন" : "সেভ করুন"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============ STYLES ============
const getStyles = (theme, isDark) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },

    // ---- TOP BAR ----
    topBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 4,
    },
    dateText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.subText,
      letterSpacing: 0.3,
    },
    themeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.iconBg,
      justifyContent: "center",
      alignItems: "center",
    },

    // ---- GREETING ----
    greetingWrap: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 20,
    },
    greetingSmall: {
      fontSize: 18,
      color: theme.subText,
      fontWeight: "500",
      marginBottom: 2,
    },
    greetingBold: {
      fontSize: 28,
      color: theme.text,
      fontWeight: "800",
      lineHeight: 36,
      letterSpacing: -0.5,
    },

    // ---- SEARCH ----
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
      shadowRadius: 8,
      elevation: 1,
    },
    searchInput: {
      flex: 1,
      fontSize: 15,
      color: theme.text,
      paddingVertical: 12,
      marginLeft: 10,
    },

    // ---- SECTION ----
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 20,
      marginBottom: 12,
      gap: 6,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: theme.subText,
      letterSpacing: 0.5,
      textTransform: "uppercase",
    },

    // ---- LIST / GRID ----
    list: {
      paddingBottom: 120,
    },
    row: {
      justifyContent: "space-between",
      paddingHorizontal: 20,
      marginBottom: 14,
    },
    noteCard: {
      width: CARD_WIDTH,
      borderRadius: 22,
      padding: 16,
      minHeight: 160,
      justifyContent: "space-between",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.3 : 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    cardTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    colorDotSmall: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: "#1A1A1A",
      marginBottom: 6,
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    cardContent: {
      fontSize: 13,
      color: "rgba(0,0,0,0.55)",
      lineHeight: 18,
      flex: 1,
    },
    cardBottom: {
      marginTop: 10,
    },
    cardDate: {
      fontSize: 11,
      color: "rgba(0,0,0,0.4)",
      fontWeight: "600",
      letterSpacing: 0.2,
    },

    // ---- EMPTY ----
    emptyWrap: {
      alignItems: "center",
      marginTop: 60,
      paddingHorizontal: 40,
    },
    emptyIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: theme.emptyIconBg,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 18,
    },
    emptyTitle: {
      fontSize: 19,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 8,
      letterSpacing: -0.3,
    },
    emptyText: {
      fontSize: 14,
      color: theme.hint,
      textAlign: "center",
      lineHeight: 20,
    },

    // ---- FAB ----
    fabWrap: {
      position: "absolute",
      bottom: 28,
      right: 24,
      shadowColor: IOS_BLUE_SOLID,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 18,
      elevation: 8,
    },
    fab: {
      width: 60,
      height: 60,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
    },

    // ---- EDITOR ----
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
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      letterSpacing: 0.2,
    },
    editorBody: {
      flex: 1,
      paddingHorizontal: 24,
      paddingTop: 16,
    },
    titleInput: {
      fontSize: 28,
      fontWeight: "800",
      color: theme.text,
      paddingVertical: 6,
      letterSpacing: -0.5,
    },
    contentInput: {
      fontSize: 16,
      color: theme.text,
      lineHeight: 24,
      minHeight: 180,
      paddingVertical: 12,
      opacity: 0.85,
    },

    // ---- BOTTOM BAR ----
    bottomBar: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 24,
      borderTopWidth: 1,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    pickerLabel: {
      fontSize: 11,
      fontWeight: "700",
      color: theme.hint,
      letterSpacing: 1.5,
      marginBottom: 12,
      textTransform: "uppercase",
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
    saveBtnText: {
      color: "#FFFFFF",
      fontSize: 16,
      fontWeight: "700",
      letterSpacing: 0.3,
    },
  });
